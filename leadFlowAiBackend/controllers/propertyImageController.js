/**
 * ==========================================================
 *
 * File:
 *
 * leadFlowAiBackend/controllers/propertyImageController.js
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
 * PROJECT STRUCTURE
 *
 * leadFlowAiBackend/
 *
 * ├── controllers/
 * │   └── propertyImageController.js   <-- THIS FILE
 * │
 * ├── middleware/
 * │   ├── authMiddleware.js
 * │   └── uploadPropertyImages.js
 * │
 * ├── models/
 * │   ├── property.js
 * │   └── propertyImage.js
 * │
 * ├── routes/
 * │   └── propertyImageRoutes.js
 * │
 * ├── uploads/
 * │   └── properties/
 * │
 * └── server.js
 *
 * ==========================================================
 *
 * IMPORTANT UPLOAD RULE
 *
 * Every successful upload creates a NEW PropertyImage
 * document.
 *
 * Example:
 *
 * Upload 1:
 * 1787928505786-111111111.jpg
 *
 * Upload 2:
 * 1787928509000-222222222.jpg
 *
 * Upload 3:
 * 1787928512000-333333333.jpg
 *
 * These are three separate PropertyImage documents.
 *
 * ==========================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Property from "../models/property.js";
import PropertyImage from "../models/propertyImage.js";


/* ==========================================================
   CURRENT FILE LOCATION
========================================================== */

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


/* ==========================================================
   PROPERTY IMAGE UPLOAD DIRECTORY
========================================================== */

/**
 * THIS FILE:
 *
 * leadFlowAiBackend/controllers/propertyImageController.js
 *
 * __dirname:
 *
 * leadFlowAiBackend/controllers
 *
 * ../uploads/properties:
 *
 * leadFlowAiBackend/uploads/properties
 *
 * IMPORTANT:
 *
 * There is NO src folder in this backend.
 *
 * Therefore:
 *
 * ../uploads/properties
 *
 * is the correct path.
 */

const propertyUploadsDirectory = path.resolve(
  __dirname,
  "../uploads/properties"
);


/* ==========================================================
   CREATE UPLOAD DIRECTORY IF NEEDED
========================================================== */

if (!fs.existsSync(propertyUploadsDirectory)) {
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
  fs.existsSync(propertyUploadsDirectory)
);

console.log(
  "=================================================="
);


/* ==========================================================
   HELPERS
========================================================== */


/**
 * Get organization ID from authenticated user.
 */
const getOrganizationId = (req) => {
  return (
    req.user?.organizationId ||
    req.user?.organization?._id ||
    null
  );
};


/**
 * Get authenticated user ID.
 */
const getUserId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};


/**
 * Require organization.
 */
const requireOrganization = (
  req,
  res
) => {
  const organizationId =
    getOrganizationId(req);

  if (!organizationId) {
    res.status(401).json({
      success: false,

      message:
        "Authenticated user does not have an organizationId.",
    });

    return null;
  }

  return organizationId;
};


/* ==========================================================
   IMAGE URL
========================================================== */


/**
 * Build browser-accessible image URL.
 *
 * NEVER expose the physical filesystem path
 * to the browser.
 *
 * Physical:
 *
 * C:\MERN\leadFlow AI\leadFlowAiBackend\
 * uploads\properties\image.jpg
 *
 * Browser:
 *
 * http://localhost:5000/uploads/properties/image.jpg
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

  /**
   * Multer diskStorage normally provides:
   *
   * file.path
   *
   * and:
   *
   * file.filename
   */

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
    typeof image.toObject === "function"
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
      Boolean(data.isCover),

    displayOrder:
      Number(data.displayOrder || 0),

    width:
      Number(data.width || 0),

    height:
      Number(data.height || 0),

    size:
      Number(data.size || 0),

    mimeType:
      data.mimeType || "",

    aiTags:
      Array.isArray(data.aiTags)
        ? data.aiTags
        : [],

    aiScore:
      Number(data.aiScore || 0),

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
const findReplacementCover = async (
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

/**
 * GET
 *
 * /api/properties/:propertyId/images
 */
export const getPropertyImages =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        requireOrganization(
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

/**
 * GET
 *
 * /api/properties/:propertyId/images/:imageId
 */
export const getPropertyImageById =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        requireOrganization(
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

/**
 * GET
 *
 * /api/properties/:propertyId/images/cover
 */
export const getCoverImage =
  async (
    req,
    res
  ) => {
    try {
      const organizationId =
        requireOrganization(
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

      if (!property.coverImage) {
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

/**
 * POST
 *
 * /api/properties/:propertyId/images
 *
 * Current route uses:
 *
 * uploadCoverImage = upload.single("coverImage")
 *
 * Therefore:
 *
 * req.file
 *
 * contains the uploaded image.
 *
 * Every successful upload creates a NEW
 * PropertyImage document.
 */
export const createPropertyImage =
  async (
    req,
    res
  ) => {
    try {

      /* ======================================================
         ORGANIZATION
      ====================================================== */

      const organizationId =
        requireOrganization(
          req,
          res
        );

      if (!organizationId) {
        return;
      }


      /* ======================================================
         USER
      ====================================================== */

      const userId =
        getUserId(req);


      /* ======================================================
         DEBUG
      ====================================================== */

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


      /* ======================================================
         PROPERTY
      ====================================================== */

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


      /* ======================================================
         COLLECT UPLOADED FILES
      ====================================================== */

      let uploadedFiles = [];


      /**
       * upload.single()
       */
      if (req.file) {
        uploadedFiles.push(
          req.file
        );
      }


      /**
       * upload.array()
       *
       * Kept for compatibility if the middleware
       * is changed later.
       */
      if (
        Array.isArray(
          req.files
        )
      ) {
        uploadedFiles.push(
          ...req.files
        );
      }


      /**
       * upload.fields()
       *
       * Kept for compatibility with the
       * uploadPropertyMedia middleware.
       */
      if (
        req.files &&
        !Array.isArray(req.files) &&
        typeof req.files === "object"
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


      /* ======================================================
         REMOVE INVALID FILE REFERENCES
      ====================================================== */

      uploadedFiles =
        uploadedFiles.filter(
          (file) =>
            file &&
            file.filename
        );


      /* ======================================================
         REMOVE DUPLICATES
      ====================================================== */

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


      /* ======================================================
         NO FILE
      ====================================================== */

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


      /* ======================================================
         VERIFY PHYSICAL FILES
      ====================================================== */

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


      /* ======================================================
         EXISTING COVER
      ====================================================== */

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


      /* ======================================================
         COVER REQUEST
      ====================================================== */

      const requestedCover =
        String(
          req.body?.isCover ||
          ""
        ).toLowerCase() ===
        "true";


      /* ======================================================
         CREATE NEW IMAGE DOCUMENTS
      ====================================================== */

      const createdImages = [];


      for (
        let index = 0;
        index <
        uploadedFiles.length;
        index++
      ) {

        const file =
          uploadedFiles[index];


        /* ====================================================
           IMAGE URL
        ==================================================== */

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


        /* ====================================================
           DETERMINE COVER
        ==================================================== */

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


        /* ====================================================
           DEMOTE CURRENT COVER
        ==================================================== */

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


        /* ====================================================
           GET NEXT DISPLAY ORDER
        ==================================================== */

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


        /**
         * Cover image is displayed first.
         */
        if (shouldBeCover) {
          nextDisplayOrder =
            1;
        }


        /* ====================================================
           CREATE PROPERTY IMAGE
        ==================================================== */

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


        /**
         * IMPORTANT:
         *
         * Use file.filename.
         *
         * DO NOT use:
         *
         * req.file.filename
         *
         * because the loop may be processing
         * a different file.
         */

        const image =
          await PropertyImage.create({

            property:
              property._id,

            organizationId,

            url:
              imageUrl,

            /**
             * Actual uploaded filename.
             */
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


        /* ====================================================
           VERIFY MONGODB DOCUMENT
        ==================================================== */

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


        /* ====================================================
           UPDATE PROPERTY COVER
        ==================================================== */

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


        /* ====================================================
           STORE CREATED IMAGE
        ==================================================== */

        createdImages.push(
          image
        );
      }


      /* ======================================================
         SAFETY CHECK
      ====================================================== */

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


      /* ======================================================
         FINAL PROPERTY
      ====================================================== */

      const updatedProperty =
        await Property.findOne({
          _id:
            property._id,

          organizationId,
        }).lean();


      /* ======================================================
         RESPONSE
      ====================================================== */

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

/**
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/cover
 */
export const setCoverImage =
  async (
    req,
    res
  ) => {
    try {

      const organizationId =
        requireOrganization(
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


      /* ====================================================
         DEMOTE OTHER COVERS
      ==================================================== */

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


      /* ====================================================
         PROMOTE IMAGE
      ==================================================== */

      image.isCover =
        true;

      image.displayOrder =
        1;

      await image.save();


      /* ====================================================
         UPDATE PROPERTY
      ==================================================== */

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

/**
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/order
 */
export const updateImageOrder =
  async (
    req,
    res
  ) => {
    try {

      const organizationId =
        requireOrganization(
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

/**
 * PATCH
 *
 * /api/properties/:propertyId/images/reorder
 *
 * Body:
 *
 * {
 *   "imageIds": [
 *     "imageId1",
 *     "imageId2",
 *     "imageId3"
 *   ]
 * }
 */
export const reorderImages =
  async (
    req,
    res
  ) => {
    try {

      const organizationId =
        requireOrganization(
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


      /* ====================================================
         CHECK DUPLICATES
      ==================================================== */

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


      /* ====================================================
         GET IMAGES
      ==================================================== */

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


      /* ====================================================
         BULK UPDATE
      ==================================================== */

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


      /* ====================================================
         RETURN UPDATED IMAGES
      ==================================================== */

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

/**
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/activate
 */
export const activateImage =
  async (
    req,
    res
  ) => {
    try {

      const organizationId =
        requireOrganization(
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

/**
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/deactivate
 */
export const deactivateImage =
  async (
    req,
    res
  ) => {
    try {

      const organizationId =
        requireOrganization(
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


      /* ====================================================
         DEACTIVATE
      ==================================================== */

      image.active =
        false;

      image.isCover =
        false;

      await image.save();


      /* ====================================================
         NORMAL IMAGE
      ==================================================== */

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


      /* ====================================================
         CLEAR COVER
      ==================================================== */

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


      /* ====================================================
         FIND REPLACEMENT
      ==================================================== */

      const replacement =
        await findReplacementCover(
          property._id,
          organizationId,
          image._id
        );


      /* ====================================================
         SET REPLACEMENT
      ==================================================== */

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

/**
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId
 */
export const updatePropertyImage =
  async (
    req,
    res
  ) => {
    try {

      const organizationId =
        requireOrganization(
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


      /* ====================================================
         CAPTION
      ==================================================== */

      if (
        req.body?.caption !==
        undefined
      ) {

        image.caption =
          req.body.caption;
      }


      /* ====================================================
         ALT TEXT
      ==================================================== */

      if (
        req.body?.altText !==
        undefined
      ) {

        image.altText =
          req.body.altText;
      }


      /* ====================================================
         DISPLAY ORDER
      ==================================================== */

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


      /* ====================================================
         AI TAGS
      ==================================================== */

      if (
        req.body?.aiTags !==
        undefined
      ) {

        let aiTags =
          req.body.aiTags;


        /**
         * Accept JSON string from multipart/form-data.
         *
         * Example:
         *
         * '["living-room","modern"]'
         */
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


      /* ====================================================
         AI SCORE
      ==================================================== */

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


      /* ====================================================
         SAVE
      ==================================================== */

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

/**
 * DELETE
 *
 * /api/properties/:propertyId/images/:imageId
 *
 * Database:
 *
 * Soft delete:
 *
 * active = false
 *
 * Physical file:
 *
 * Removed from:
 *
 * leadFlowAiBackend/uploads/properties/
 *
 * If the deleted image is the cover:
 *
 * • clear Property.coverImage
 * • find replacement
 * • promote replacement
 */
export const deletePropertyImage =
  async (
    req,
    res
  ) => {
    try {

      const organizationId =
        requireOrganization(
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


      /* ====================================================
         PHYSICAL FILE
      ==================================================== */

      const physicalImagePath =
        getPhysicalImagePath(
          image.publicId
        );


      /* ====================================================
         SOFT DELETE
      ==================================================== */

      image.active =
        false;

      image.isCover =
        false;

      await image.save();


      /* ====================================================
         DELETE PHYSICAL FILE
      ==================================================== */

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


      /* ====================================================
         NORMAL IMAGE
      ==================================================== */

      if (!wasCover) {

        return res.status(200).json({

          success:
            true,

          message:
            "Property image removed successfully.",
        });
      }


      /* ====================================================
         CLEAR COVER REFERENCE
      ==================================================== */

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


      /* ====================================================
         FIND REPLACEMENT
      ==================================================== */

      const replacement =
        await findReplacementCover(
          property._id,
          organizationId,
          image._id
        );


      /* ====================================================
         SET REPLACEMENT
      ==================================================== */

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


      /* ====================================================
         RESPONSE
      ==================================================== */

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

