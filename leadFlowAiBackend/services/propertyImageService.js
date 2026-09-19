/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles business logic for Property Images.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Create image records
 * • Retrieve gallery
 * • Retrieve cover image
 * • Update image metadata
 * • Reorder gallery
 * • Soft delete
 * • Restore
 *
 * ==========================================================
 */

import Property from "../models/property.js";
import PropertyImage from "../models/propertyImage.js";

class PropertyImageService {

  /*
  ==========================================================
  CREATE IMAGE RECORD
  ==========================================================
  */

  async createImage(imageData) {

    return await PropertyImage.create(imageData);

  }

  /*
  ==========================================================
  GET IMAGE BY ID
  ==========================================================
  */

  async getImageById(imageId) {

    return await PropertyImage.findById(imageId);

  }

  /*
  ==========================================================
  GET PROPERTY GALLERY
  ==========================================================
  */

  async getPropertyGallery(propertyId) {

    return await PropertyImage.find({

      property: propertyId,

      isDeleted: false,

    })

      .sort({

        displayOrder: 1,

      })

      .lean();

  }

  /*
  ==========================================================
  GET COVER IMAGE
  ==========================================================
  */

  async getCoverImage(propertyId) {

    return await PropertyImage.findOne({

      property: propertyId,

      imageType: "cover",

      isDeleted: false,

    }).lean();

  }

  /*
  ==========================================================
  UPDATE IMAGE
  ==========================================================
  */

  async updateImage(image, updates) {

    Object.assign(image, updates);

    await image.save();

    return image;

  }

  /*
  ==========================================================
  SET COVER IMAGE
  ==========================================================
  */

  async setCoverImage(propertyId, imageId) {

    await PropertyImage.updateMany(

      {

        property: propertyId,

        imageType: "cover",

      },

      {

        imageType: "gallery",

      }

    );

    const image = await PropertyImage.findById(imageId);

    if (!image) {

      throw new Error("Image not found.");

    }

    image.imageType = "cover";

    await image.save();

    return image;

  }

  /*
  ==========================================================
  REORDER GALLERY
  ==========================================================
  */

  async reorderGallery(propertyId, imageOrder) {

    const updates = imageOrder.map(
      ({ imageId, displayOrder }) =>

        PropertyImage.findOneAndUpdate(

          {
            _id: imageId,
            property: propertyId,
          },

          {
            displayOrder,
          },

          { returnDocument: 'after' }

        )
    );

    await Promise.all(updates);

    return true;

  }

  /*
  ==========================================================
  SOFT DELETE IMAGE
  ==========================================================
  */

  async softDeleteImage(image, userId) {

    image.isDeleted = true;

    image.deletedAt = new Date();

    image.deletedBy = userId;

    await image.save();

    return image;

  }

  /*
  ==========================================================
  RESTORE IMAGE
  ==========================================================
  */

  async restoreImage(image) {

    image.isDeleted = false;

    image.deletedAt = null;

    image.deletedBy = null;

    await image.save();

    return image;

  }

  /*
  ==========================================================
  PERMANENT DELETE
  ==========================================================
  */

  async permanentlyDeleteImage(image) {

    await image.deleteOne();

    return true;

  }

  /*
  ==========================================================
  GET PROPERTY IMAGE COUNT
  ==========================================================
  */

  async getImageCount(propertyId) {

    return await PropertyImage.countDocuments({

      property: propertyId,

      isDeleted: false,

    });

  }

  /*
  ==========================================================
  UPDATE PROPERTY COVER IMAGE
  ==========================================================
  */

  async updatePropertyCover(propertyId, imagePath) {

    return await Property.findByIdAndUpdate(

      propertyId,

      {

        coverImage: imagePath,

      },

      { returnDocument: 'after' }

    );

  }

  /*
  ==========================================================
  REMOVE PROPERTY COVER IMAGE
  ==========================================================
  */

  async removePropertyCover(propertyId) {

    return await Property.findByIdAndUpdate(

      propertyId,

      {

        coverImage: "/placeholder-property.jpg",

      },

      { returnDocument: 'after' }

    );

  }

  /*
  ==========================================================
  GALLERY STATISTICS
  ==========================================================
  */

  async getGalleryStatistics(propertyId) {

    const totalImages =
      await PropertyImage.countDocuments({

        property: propertyId,

        isDeleted: false,

      });

    const coverImages =
      await PropertyImage.countDocuments({

        property: propertyId,

        imageType: "cover",

        isDeleted: false,

      });

    const galleryImages =
      await PropertyImage.countDocuments({

        property: propertyId,

        imageType: "gallery",

        isDeleted: false,

      });

    return {

      totalImages,

      coverImages,

      galleryImages,

    };

  }

  /*
  ==========================================================
  LATEST PROPERTY IMAGES
  ==========================================================
  */

  async getLatestImages(
    organizationId,
    limit = 10
  ) {

    return await PropertyImage.find({

      organizationId,

      isDeleted: false,

    })

      .sort({

        createdAt: -1,

      })

      .limit(limit)

      .lean();

  }

  /*
  ==========================================================
  VALIDATE IMAGE OWNERSHIP
  ==========================================================
  */

  async validateOwnership(
    imageId,
    propertyId
  ) {

    return await PropertyImage.findOne({

      _id: imageId,

      property: propertyId,

      isDeleted: false,

    });

  }

  /*
  ==========================================================
  FIND ORPHAN IMAGES

  Images whose property no longer exists.
  ==========================================================
  */

  async findOrphanImages() {

    const images =
      await PropertyImage.find({

        isDeleted: false,

      });

    const orphanImages = [];

    for (const image of images) {

      const property =
        await Property.findById(
          image.property
        );

      if (!property) {

        orphanImages.push(image);

      }

    }

    return orphanImages;

  }

  /*
  ==========================================================
  CLEAN UP ORPHAN IMAGES
  ==========================================================
  */

  async cleanupOrphanImages() {

    const orphanImages =
      await this.findOrphanImages();

    for (const image of orphanImages) {

      await image.deleteOne();

    }

    return {

      removed: orphanImages.length,

    };

  }

}

/*
==========================================================
EXPORT SERVICE
==========================================================
*/

export default new PropertyImageService();