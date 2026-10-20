/**
 * ==========================================================
 * PROPERTY IMAGE CONTROLLER
 * ==========================================================
 *
 * Base URL:
 *
 * /api/properties/:propertyId/images
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Upload property images
 * • Create PropertyImage documents
 * • Support DIFFERENT images for the same property
 * • Get property images
 * • Get one image
 * • Get current cover image
 * • Set cover image
 * • Update image metadata
 * • Update display order
 * • Reorder images
 * • Activate image
 * • Deactivate image
 * • Delete image
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 *
 * Property
 *     |
 *     └── coverImage -> PropertyImage._id
 *
 * PropertyImage
 *     |
 *     └── property -> Property._id
 *
 * ==========================================================
 *
 * IMPORTANT TENANT SECURITY
 * ----------------------------------------------------------
 *
 * This controller does NOT access Conversation documents.
 *
 * Organization resolution is delegated to the centralized
 * organizationResolverService.js boundary.
 *
 * Property and PropertyImage access is isolated by:
 *
 * organizationId
 *
 * Every property lookup is scoped to the resolved
 * organizationId.
 *
 * Every PropertyImage lookup is scoped to:
 *
 * • organizationId
 * • property
 * • image _id where applicable
 *
 * Client-supplied organization IDs are never used.
 *
 * ==========================================================
 *
 * IMPORTANT UPLOAD RULE
 * ----------------------------------------------------------
 *
 * Every successful upload creates a NEW PropertyImage
 * document.
 *
 * ==========================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Property from "../models/property.js";
import PropertyImage from "../models/propertyImage.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

/* ==========================================================
   CURRENT FILE LOCATION
========================================================== */

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

/* ==========================================================
   PROPERTY IMAGE UPLOAD DIRECTORY
========================================================== */

const propertyUploadsDirectory =
  path.resolve(
    __dirname,
    "../uploads/properties"
  );

/* ==========================================================
   CREATE UPLOAD DIRECTORY IF NEEDED
========================================================== */

if (
  !fs.existsSync(
    propertyUploadsDirectory
  )
) {
  fs.mkdirSync(
    propertyUploadsDirectory,
    {
      recursive: true,
    }
  );
}

/* ==========================================================
   DEBUG UPLOAD DIRECTORY
========================================================== */

console.log(
  "=================================================="
);

console.log(
  "📁 PROPERTY IMAGE UPLOAD DIRECTORY:"
);

console.log(
  propertyUploadsDirectory
);

console.log(
  "📂 DIRECTORY EXISTS:",
  fs.existsSync(
    propertyUploadsDirectory
  )
);

console.log(
  "=================================================="
);

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Resolve the authenticated organization through the
 * centralized organization-resolution boundary.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Organization identity is NOT resolved directly from:
 *
 * • req.body
 * • req.query
 * • req.params
 *
 * The centralized organizationResolverService.js is the
 * single resolution boundary.
 *
 * The resolved organization's _id is then used for all
 * tenant-scoped Property and PropertyImage operations.
 */
const getOrganizationId = async (
  req
) => {
  const organization =
    await resolveFromRequest(
      req
    );

  if (!organization) {
    return null;
  }

  return (
    organization._id ||
    null
  );
};

/**
 * Get authenticated organization.
 *
 * This is the HTTP-facing helper used by controller
 * endpoints.
 */
const requireOrganization = async (
  req,
  res
) => {
  try {
    const organizationId =
      await getOrganizationId(
        req
      );

    if (!organizationId) {
      res.status(401).json({
        success: false,

        message:
          "Authenticated user does not belong to a valid active organization.",
      });

      return null;
    }

    return organizationId;
  } catch (error) {
    console.error(
      "ORGANIZATION RESOLUTION ERROR:",
      error
    );

    res.status(401).json({
      success: false,

      message:
        "Unable to resolve authenticated organization.",
    });

    return null;
  }
};

/**
 * Get authenticated user ID.
 */
const getUserId = (
  req
) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};

/* ==========================================================
   IMAGE URL
========================================================== */

/**
 * Build browser-accessible image URL.
 *
 * NEVER expose the physical filesystem path
 * to the browser.
 */
const buildImageUrl = (
  req,
  file
) => {
  if (!file) {
    return null;
  }

  const filename =
    file.filename || null;

  if (!filename) {
    return null;
  }

  const backendUrl =
    process.env.BACKEND_URL ||
    `${req.protocol}://${req.get("host")}`;

  return (
    `${backendUrl.replace(/\/$/, "")}` +
    `/uploads/properties/` +
    `${encodeURIComponent(filename)}`
  );
};

/* ==========================================================
   PHYSICAL FILE PATH
========================================================== */

/**
 * Resolve physical image path.
 *
 * Only the filename is accepted.
 *
 * path.basename() prevents accidental
 * path traversal.
 */
const getPhysicalImagePath = (
  filename
) => {
  if (!filename) {
    return null;
  }

  const safeFilename =
    path.basename(filename);

  return path.join(
    propertyUploadsDirectory,
    safeFilename
  );
};

/**
 * Verify uploaded file exists physically.
 */
const verifyUploadedFile = (
  file
) => {
  if (!file) {
    return false;
  }

  if (
    file.path &&
    fs.existsSync(file.path)
  ) {
    return true;
  }

  if (!file.filename) {
    return false;
  }

  const filePath =
    getPhysicalImagePath(
      file.filename
    );

  return Boolean(
    filePath &&
    fs.existsSync(filePath)
  );
};

/* ==========================================================
   SERIALIZATION
========================================================== */

/**
 * Return consistent PropertyImage shape.
 */
const serializeImage = (
  image
) => {
  if (!image) {
    return null;
  }

  const data =
    typeof image.toObject ===
    "function"
      ? image.toObject()
      : image;

  return {
    _id:
      data._id,

    property:
      data.property,

    organizationId:
      data.organizationId,

    url:
      data.url || null,

    publicId:
      data.publicId || null,

    caption:
      data.caption || "",

    altText:
      data.altText || "",

    isCover:
      Boolean(
        data.isCover
      ),

    displayOrder:
      Number(
        data.displayOrder || 0
      ),

    width:
      Number(
        data.width || 0
      ),

    height:
      Number(
        data.height || 0
      ),

    size:
      Number(
        data.size || 0
      ),

    mimeType:
      data.mimeType || "",

    aiTags:
      Array.isArray(
        data.aiTags
      )
        ? data.aiTags
        : [],

    aiScore:
      Number(
        data.aiScore || 0
      ),

    active:
      data.active !== false,

    uploadedBy:
      data.uploadedBy || null,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
};

/* ==========================================================
   PROPERTY OWNERSHIP
========================================================== */

/**
 * Find property belonging to organization.
 *
 * TENANT SECURITY:
 * ----------------------------------------------------------
 * propertyId alone is NEVER sufficient.
 *
 * Both property ID and resolved organization ID
 * are required.
 */
const getOwnedProperty = async (
  propertyId,
  organizationId
) => {
  return Property.findOne({
    _id:
      propertyId,

    organizationId,
  });
};

/* ==========================================================
   FIND REPLACEMENT COVER
========================================================== */

/**
 * Find the next active image that can become
 * the cover image.
 */
const findReplacementCover =
  async (
    propertyId,
    organizationId,
    excludedImageId = null
  ) => {
    const query = {
      property:
        propertyId,

      organizationId,

      active:
        true,
    };

    if (excludedImageId) {
      query._id = {
        $ne:
          excludedImageId,
      };
    }

    return PropertyImage.findOne(
      query
    ).sort({
      displayOrder:
        1,

      createdAt:
        1,
    });
  };

/* ==========================================================
   GET PROPERTY IMAGES
========================================================== */

export const getPropertyImages =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",

          data:
            [],
        });
      }

      const images =
        await PropertyImage.find({
          property:
            property._id,

          organizationId,

          active:
            true,
        })
          .sort({
            isCover:
              -1,

            displayOrder:
              1,

            createdAt:
              1,
          })
          .lean();

      return res.status(200).json({
        success:
          true,

        count:
          images.length,

        data:
          images.map(
            serializeImage
          ),
      });

    } catch (error) {
      console.error(
        "GET PROPERTY IMAGES ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to fetch property images.",

        data:
          [],
      });
    }
  };

/* ==========================================================
   GET SINGLE IMAGE
========================================================== */

export const getPropertyImageById =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const image =
        await PropertyImage.findOne({
          _id:
            req.params.imageId,

          property:
            req.params.propertyId,

          organizationId,

          active:
            true,
        }).lean();

      if (!image) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property image not found.",

          data:
            null,
        });
      }

      return res.status(200).json({
        success:
          true,

        data:
          serializeImage(
            image
          ),
      });

    } catch (error) {
      console.error(
        "GET PROPERTY IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to fetch property image.",

        data:
          null,
      });
    }
  };

/* ==========================================================
   GET CURRENT COVER IMAGE
========================================================== */

export const getCoverImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",

          data:
            null,
        });
      }

      if (
        !property.coverImage
      ) {
        return res.status(200).json({
          success:
            true,

          message:
            "Property does not have a cover image.",

          data:
            null,
        });
      }

      const image =
        await PropertyImage.findOne({
          _id:
            property.coverImage,

          property:
            property._id,

          organizationId,

          active:
            true,
        });

      if (!image) {
        await Property.findOneAndUpdate(
          {
            _id:
              property._id,

            organizationId,
          },
          {
            $set: {
              coverImage:
                null,
            },
          }
        );

        return res.status(200).json({
          success:
            true,

          message:
            "Property does not have a valid cover image.",

          data:
            null,
        });
      }

      if (!image.isCover) {
        await PropertyImage.updateOne(
          {
            _id:
              image._id,

            property:
              property._id,

            organizationId,

            active:
              true,
          },
          {
            $set: {
              isCover:
                true,
            },
          }
        );

        image.isCover =
          true;
      }

      return res.status(200).json({
        success:
          true,

        data:
          serializeImage(
            image
          ),
      });

    } catch (error) {
      console.error(
        "GET COVER IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to fetch property cover image.",

        data:
          null,
      });
    }
  };

/* ==========================================================
   CREATE PROPERTY IMAGE
========================================================== */

export const createPropertyImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const userId =
        getUserId(req);

      console.log(
        "=================================================="
      );

      console.log(
        "🖼️ PROPERTY IMAGE CREATE"
      );

      console.log(
        "Property ID:",
        req.params.propertyId
      );

      console.log(
        "Organization ID:",
        organizationId
      );

      console.log(
        "Authenticated User ID:",
        userId
      );

      console.log(
        "req.file:",
        req.file
      );

      if (req.file) {
        console.log(
          "Original name:",
          req.file.originalname
        );

        console.log(
          "Generated name:",
          req.file.filename
        );

        console.log(
          "Multer path:",
          req.file.path
        );

        console.log(
          "Multer destination:",
          req.file.destination
        );

        console.log(
          "File exists:",
          verifyUploadedFile(
            req.file
          )
        );
      }

      console.log(
        "=================================================="
      );

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",
        });
      }

      let uploadedFiles = [];

      if (req.file) {
        uploadedFiles.push(
          req.file
        );
      }

      if (
        Array.isArray(
          req.files
        )
      ) {
        uploadedFiles.push(
          ...req.files
        );
      }

      if (
        req.files &&
        !Array.isArray(req.files) &&
        typeof req.files ===
          "object"
      ) {
        if (
          Array.isArray(
            req.files.coverImage
          )
        ) {
          uploadedFiles.push(
            ...req.files.coverImage
          );
        }

        if (
          Array.isArray(
            req.files.images
          )
        ) {
          uploadedFiles.push(
            ...req.files.images
          );
        }
      }

      uploadedFiles =
        uploadedFiles.filter(
          (file) =>
            file &&
            file.filename
        );

      uploadedFiles =
        uploadedFiles.filter(
          (
            file,
            index,
            array
          ) =>
            array.findIndex(
              (item) =>
                item.filename ===
                file.filename
            ) === index
        );

      if (
        uploadedFiles.length ===
        0
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "No property image was uploaded.",
        });
      }

      for (
        const file of uploadedFiles
      ) {
        const expectedPath =
          getPhysicalImagePath(
            file.filename
          );

        const exists =
          verifyUploadedFile(
            file
          );

        console.log(
          "=================================================="
        );

        console.log(
          "PROPERTY IMAGE FILE CHECK"
        );

        console.log(
          "Original name:",
          file.originalname
        );

        console.log(
          "Filename:",
          file.filename
        );

        console.log(
          "Mimetype:",
          file.mimetype
        );

        console.log(
          "Size:",
          file.size
        );

        console.log(
          "Multer path:",
          file.path
        );

        console.log(
          "Expected path:",
          expectedPath
        );

        console.log(
          "Exists:",
          exists
        );

        console.log(
          "=================================================="
        );

        if (!exists) {
          return res.status(500).json({
            success:
              false,

            message:
              "Uploaded property image was not found on disk.",

            filename:
              file.filename,

            expectedPath:
              expectedPath,

            propertyUploadsDirectory:
              propertyUploadsDirectory,
          });
        }
      }

      const existingCover =
        await PropertyImage.findOne({
          property:
            property._id,

          organizationId,

          isCover:
            true,

          active:
            true,
        });

      const requestedCover =
        String(
          req.body?.isCover ||
          ""
        ).toLowerCase() ===
        "true";

      const createdImages = [];

      for (
        let index = 0;
        index <
        uploadedFiles.length;
        index++
      ) {
        const file =
          uploadedFiles[index];

        const imageUrl =
          buildImageUrl(
            req,
            file
          );

        if (!imageUrl) {
          console.error(
            "Unable to create image URL for file:",
            file.filename
          );

          continue;
        }

        const shouldBeCover =
          (
            !existingCover &&
            createdImages.length ===
              0
          ) ||
          (
            requestedCover &&
            index ===
              uploadedFiles.length - 1
          );

        if (shouldBeCover) {
          await PropertyImage.updateMany(
            {
              property:
                property._id,

              organizationId,

              isCover:
                true,

              active:
                true,
            },
            {
              $set: {
                isCover:
                  false,
              },
            }
          );
        }

        const latestImage =
          await PropertyImage.findOne({
            property:
              property._id,

            organizationId,
          })
            .sort({
              displayOrder:
                -1,
            })
            .select(
              "displayOrder"
            )
            .lean();

        let nextDisplayOrder =
          Number(
            latestImage?.displayOrder ||
            0
          ) + 1;

        if (shouldBeCover) {
          nextDisplayOrder =
            1;
        }

        console.log(
          "Creating PropertyImage:"
        );

        console.log({
          property:
            property._id,

          organizationId,

          filename:
            file.filename,

          url:
            imageUrl,

          isCover:
            shouldBeCover,

          displayOrder:
            nextDisplayOrder,
        });

        const image =
          await PropertyImage.create({
            property:
              property._id,

            organizationId,

            url:
              imageUrl,

            publicId:
              file.filename,

            caption:
              req.body?.caption ||
              "",

            altText:
              req.body?.altText ||
              "",

            isCover:
              shouldBeCover,

            displayOrder:
              nextDisplayOrder,

            width:
              Number(
                req.body?.width ||
                0
              ),

            height:
              Number(
                req.body?.height ||
                0
              ),

            size:
              Number(
                file.size ||
                0
              ),

            mimeType:
              file.mimetype ||
              "",

            aiTags:
              [],

            aiScore:
              0,

            active:
              true,

            uploadedBy:
              userId,
          });

        if (
          !image ||
          !image._id
        ) {
          console.error(
            "PropertyImage.create() did not return a valid document."
          );

          continue;
        }

        console.log(
          "PropertyImage created successfully:"
        );

        console.log({
          imageId:
            image._id,

          propertyId:
            image.property,

          publicId:
            image.publicId,

          url:
            image.url,

          isCover:
            image.isCover,
        });

        if (shouldBeCover) {
          await Property.findOneAndUpdate(
            {
              _id:
                property._id,

              organizationId,
            },
            {
              $set: {
                coverImage:
                  image._id,
              },
            }
          );

          console.log(
            "Property.coverImage updated:",
            image._id
          );
        }

        createdImages.push(
          image
        );
      }

      if (
        createdImages.length ===
        0
      ) {
        return res.status(500).json({
          success:
            false,

          message:
            "The uploaded files could not be converted into property images.",
        });
      }

      const updatedProperty =
        await Property.findOne({
          _id:
            property._id,

          organizationId,
        }).lean();

      return res.status(201).json({
        success:
          true,

        message:
          createdImages.length === 1
            ? (
                createdImages[0].isCover
                  ? "Property cover image created successfully."
                  : "Property image created successfully."
              )
            : `${createdImages.length} property images created successfully.`,

        count:
          createdImages.length,

        data:
          createdImages.map(
            serializeImage
          ),

        coverImage:
          updatedProperty?.coverImage ||
          null,
      });

    } catch (error) {
      console.error(
        "=================================================="
      );

      console.error(
        "CREATE PROPERTY IMAGE ERROR:"
      );

      console.error(
        error
      );

      console.error(
        "MESSAGE:",
        error.message
      );

      console.error(
        "STACK:",
        error.stack
      );

      console.error(
        "=================================================="
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to create property image.",
      });
    }
  };

/* ==========================================================
   SET COVER IMAGE
========================================================== */

export const setCoverImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",
        });
      }

      const image =
        await PropertyImage.findOne({
          _id:
            req.params.imageId,

          property:
            property._id,

          organizationId,

          active:
            true,
        });

      if (!image) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property image not found.",
        });
      }

      await PropertyImage.updateMany(
        {
          property:
            property._id,

          organizationId,

          active:
            true,

          isCover:
            true,

          _id: {
            $ne:
              image._id,
          },
        },
        {
          $set: {
            isCover:
              false,
          },
        }
      );

      image.isCover =
        true;

      image.displayOrder =
        1;

      await image.save();

      await Property.findOneAndUpdate(
        {
          _id:
            property._id,

          organizationId,
        },
        {
          $set: {
            coverImage:
              image._id,
          },
        }
      );

      return res.status(200).json({
        success:
          true,

        message:
          "Property cover image updated successfully.",

        data:
          serializeImage(
            image
          ),
      });

    } catch (error) {
      console.error(
        "SET COVER IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to set property cover image.",
      });
    }
  };

/* ==========================================================
   UPDATE IMAGE ORDER
========================================================== */

export const updateImageOrder =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",
        });
      }

      const displayOrder =
        Number(
          req.body?.displayOrder
        );

      if (
        !Number.isInteger(
          displayOrder
        ) ||
        displayOrder < 1
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "displayOrder must be a positive integer.",
        });
      }

      const image =
        await PropertyImage.findOne({
          _id:
            req.params.imageId,

          property:
            property._id,

          organizationId,

          active:
            true,
        });

      if (!image) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property image not found.",
        });
      }

      image.displayOrder =
        displayOrder;

      await image.save();

      return res.status(200).json({
        success:
          true,

        message:
          "Property image display order updated successfully.",

        data:
          serializeImage(
            image
          ),
      });

    } catch (error) {
      console.error(
        "UPDATE IMAGE ORDER ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to update image order.",
      });
    }
  };

/* ==========================================================
   REORDER ALL IMAGES
========================================================== */

export const reorderImages =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",
        });
      }

      const imageIds =
        req.body?.imageIds;

      if (
        !Array.isArray(
          imageIds
        ) ||
        imageIds.length ===
          0
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "imageIds must be a non-empty array.",
        });
      }

      const uniqueIds =
        new Set(
          imageIds.map(
            (id) =>
              String(id)
          )
        );

      if (
        uniqueIds.size !==
        imageIds.length
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "imageIds must not contain duplicates.",
        });
      }

      const images =
        await PropertyImage.find({
          _id: {
            $in:
              imageIds,
          },

          property:
            property._id,

          organizationId,

          active:
            true,
        });

      if (
        images.length !==
        imageIds.length
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "One or more image IDs do not belong to this property.",
        });
      }

      const bulkOperations =
        imageIds.map(
          (
            imageId,
            index
          ) => ({
            updateOne: {
              filter: {
                _id:
                  imageId,

                property:
                  property._id,

                organizationId,

                active:
                  true,
              },

              update: {
                $set: {
                  displayOrder:
                    index + 1,
                },
              },
            },
          })
        );

      await PropertyImage.bulkWrite(
        bulkOperations
      );

      const updatedImages =
        await PropertyImage.find({
          property:
            property._id,

          organizationId,

          active:
            true,
        })
          .sort({
            isCover:
              -1,

            displayOrder:
              1,

            createdAt:
              1,
          })
          .lean();

      return res.status(200).json({
        success:
          true,

        message:
          "Property images reordered successfully.",

        count:
          updatedImages.length,

        data:
          updatedImages.map(
            serializeImage
          ),
      });

    } catch (error) {
      console.error(
        "REORDER IMAGES ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to reorder property images.",
      });
    }
  };

/* ==========================================================
   ACTIVATE IMAGE
========================================================== */

export const activateImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",
        });
      }

      const image =
        await PropertyImage.findOne({
          _id:
            req.params.imageId,

          property:
            property._id,

          organizationId,
        });

      if (!image) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property image not found.",
        });
      }

      image.active =
        true;

      await image.save();

      return res.status(200).json({
        success:
          true,

        message:
          "Property image activated successfully.",

        data:
          serializeImage(
            image
          ),
      });

    } catch (error) {
      console.error(
        "ACTIVATE IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to activate property image.",
      });
    }
  };

/* ==========================================================
   DEACTIVATE IMAGE
========================================================== */

export const deactivateImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",
        });
      }

      const image =
        await PropertyImage.findOne({
          _id:
            req.params.imageId,

          property:
            property._id,

          organizationId,

          active:
            true,
        });

      if (!image) {
        return res.status(404).json({
          success:
            false,

          message:
            "Active property image not found.",
        });
      }

      const wasCover =
        Boolean(
          image.isCover
        ) ||
        String(
          property.coverImage ||
          ""
        ) ===
          String(
            image._id
          );

      image.active =
        false;

      image.isCover =
        false;

      await image.save();

      if (!wasCover) {
        return res.status(200).json({
          success:
            true,

          message:
            "Property image deactivated successfully.",

          data:
            serializeImage(
              image
            ),
        });
      }

      await Property.findOneAndUpdate(
        {
          _id:
            property._id,

          organizationId,

          coverImage:
            image._id,
        },
        {
          $set: {
            coverImage:
              null,
          },
        }
      );

      const replacement =
        await findReplacementCover(
          property._id,
          organizationId,
          image._id
        );

      if (replacement) {
        await PropertyImage.updateMany(
          {
            property:
              property._id,

            organizationId,

            active:
              true,

            isCover:
              true,
          },
          {
            $set: {
              isCover:
                false,
            },
          }
        );

        replacement.isCover =
          true;

        replacement.displayOrder =
          1;

        await replacement.save();

        await Property.findOneAndUpdate(
          {
            _id:
              property._id,

            organizationId,
          },
          {
            $set: {
              coverImage:
                replacement._id,
            },
          }
        );
      }

      return res.status(200).json({
        success:
          true,

        message:
          replacement
            ? "Cover image deactivated and replacement selected."
            : "Cover image deactivated. Property has no cover image.",

        data:
          serializeImage(
            image
          ),

        replacement:
          replacement
            ? serializeImage(
                replacement
              )
            : null,
      });

    } catch (error) {
      console.error(
        "DEACTIVATE IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to deactivate property image.",
      });
    }
  };

/* ==========================================================
   UPDATE IMAGE METADATA
========================================================== */

export const updatePropertyImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const image =
        await PropertyImage.findOne({
          _id:
            req.params.imageId,

          property:
            req.params.propertyId,

          organizationId,

          active:
            true,
        });

      if (!image) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property image not found.",
        });
      }

      if (
        req.body?.caption !==
        undefined
      ) {
        image.caption =
          req.body.caption;
      }

      if (
        req.body?.altText !==
        undefined
      ) {
        image.altText =
          req.body.altText;
      }

      if (
        req.body?.displayOrder !==
        undefined
      ) {
        const displayOrder =
          Number(
            req.body.displayOrder
          );

        if (
          !Number.isInteger(
            displayOrder
          ) ||
          displayOrder < 1
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "displayOrder must be a positive integer.",
          });
        }

        image.displayOrder =
          displayOrder;
      }

      if (
        req.body?.aiTags !==
        undefined
      ) {
        let aiTags =
          req.body.aiTags;

        if (
          typeof aiTags ===
          "string"
        ) {
          try {
            aiTags =
              JSON.parse(
                aiTags
              );
          } catch {
            return res.status(400).json({
              success:
                false,

              message:
                "aiTags must be an array or a valid JSON array.",
            });
          }
        }

        if (
          !Array.isArray(
            aiTags
          )
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "aiTags must be an array.",
          });
        }

        image.aiTags =
          aiTags;
      }

      if (
        req.body?.aiScore !==
        undefined
      ) {
        const aiScore =
          Number(
            req.body.aiScore
          );

        if (
          Number.isNaN(
            aiScore
          )
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "aiScore must be a valid number.",
          });
        }

        image.aiScore =
          aiScore;
      }

      await image.save();

      return res.status(200).json({
        success:
          true,

        message:
          "Property image updated successfully.",

        data:
          serializeImage(
            image
          ),
      });

    } catch (error) {
      console.error(
        "UPDATE PROPERTY IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to update property image.",
      });
    }
  };

/* ==========================================================
   DELETE PROPERTY IMAGE
========================================================== */

export const deletePropertyImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        await requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }

      const property =
        await getOwnedProperty(
          req.params.propertyId,
          organizationId
        );

      if (!property) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property not found.",
        });
      }

      const image =
        await PropertyImage.findOne({
          _id:
            req.params.imageId,

          property:
            property._id,

          organizationId,

          active:
            true,
        });

      if (!image) {
        return res.status(404).json({
          success:
            false,

          message:
            "Property image not found.",
        });
      }

      const wasCover =
        Boolean(
          image.isCover
        ) ||
        String(
          property.coverImage ||
          ""
        ) ===
          String(
            image._id
          );

      const physicalImagePath =
        getPhysicalImagePath(
          image.publicId
        );

      image.active =
        false;

      image.isCover =
        false;

      await image.save();

      if (
        physicalImagePath &&
        fs.existsSync(
          physicalImagePath
        )
      ) {
        try {
          fs.unlinkSync(
            physicalImagePath
          );

          console.log(
            "Deleted physical property image:",
            physicalImagePath
          );
        } catch (fileError) {
          console.error(
            "Unable to delete physical image file:",
            fileError
          );
        }
      }

      if (!wasCover) {
        return res.status(200).json({
          success:
            true,

          message:
            "Property image removed successfully.",
        });
      }

      await Property.findOneAndUpdate(
        {
          _id:
            property._id,

          organizationId,

          coverImage:
            image._id,
        },
        {
          $set: {
            coverImage:
              null,
          },
        }
      );

      const replacement =
        await findReplacementCover(
          property._id,
          organizationId,
          image._id
        );

      if (replacement) {
        await PropertyImage.updateMany(
          {
            property:
              property._id,

            organizationId,

            active:
              true,

            isCover:
              true,
          },
          {
            $set: {
              isCover:
                false,
            },
          }
        );

        replacement.isCover =
          true;

        replacement.displayOrder =
          1;

        await replacement.save();

        await Property.findOneAndUpdate(
          {
            _id:
              property._id,

            organizationId,
          },
          {
            $set: {
              coverImage:
                replacement._id,
            },
          }
        );
      }

      return res.status(200).json({
        success:
          true,

        message:
          replacement
            ? "Cover image removed and replacement selected."
            : "Cover image removed. Property has no cover image.",

        replacement:
          replacement
            ? serializeImage(
                replacement
              )
            : null,
      });

    } catch (error) {
      console.error(
        "DELETE PROPERTY IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          error.message ||
          "Unable to delete property image.",
      });
    }
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  getPropertyImages,

  getPropertyImageById,

  getCoverImage,

  createPropertyImage,

  setCoverImage,

  updateImageOrder,

  reorderImages,

  activateImage,

  deactivateImage,

  updatePropertyImage,

  deletePropertyImage,
};