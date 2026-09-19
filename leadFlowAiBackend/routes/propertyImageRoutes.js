/**
 * ==========================================================
 *
 * File:
 *
 * leadFlowAiBackend/routes/propertyImageRoutes.js
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
 * • Get cover image
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
 * IMPORTANT PROJECT STRUCTURE
 * ----------------------------------------------------------
 *
 * leadFlowAiBackend/
 *
 * ├── controllers/
 * │   └── propertyImageController.js
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
 */

import express from "express";

import propertyImageController from "../controllers/propertyImageController.js";

import {
  uploadCoverImage,
} from "../middleware/uploadPropertyImages.js";

import {
  protect,
} from "../middleware/authMiddleware.js";


/* ==========================================================
   ROUTER
========================================================== */

const router = express.Router();


/* ==========================================================
   AUTHENTICATION
========================================================== */

/**
 * Every property-image endpoint requires authentication.
 *
 * IMPORTANT:
 *
 * Do NOT add protect again to individual routes.
 *
 * router.use(protect) already protects all routes below.
 */

router.use(protect);


/* ==========================================================
   PROPERTY IMAGE COLLECTION
========================================================== */

/**
 * GET
 *
 * /api/properties/:propertyId/images
 *
 * Returns all ACTIVE images belonging to the property.
 *
 * Controller:
 *
 * propertyImageController.getPropertyImages
 */

router.get(
  "/:propertyId/images",
  propertyImageController.getPropertyImages
);


/**
 * POST
 *
 * /api/properties/:propertyId/images
 *
 * Multipart/form-data
 *
 * Expected field:
 *
 * coverImage
 *
 * Multer result:
 *
 * req.file
 *
 * Every successful upload creates a NEW
 * PropertyImage document.
 */

router.post(
  "/:propertyId/images",
  uploadCoverImage,
  propertyImageController.createPropertyImage
);


/* ==========================================================
   COVER IMAGE
========================================================== */

/**
 * GET CURRENT COVER IMAGE
 *
 * IMPORTANT:
 *
 * This route MUST appear before:
 *
 * /:propertyId/images/:imageId
 *
 * because "cover" would otherwise be interpreted
 * as an imageId.
 *
 * GET
 *
 * /api/properties/:propertyId/images/cover
 */

router.get(
  "/:propertyId/images/cover",
  propertyImageController.getCoverImage
);


/**
 * SET COVER IMAGE
 *
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/cover
 */

router.patch(
  "/:propertyId/images/:imageId/cover",
  propertyImageController.setCoverImage
);


/* ==========================================================
   IMAGE ORDER
========================================================== */

/**
 * REORDER ALL IMAGES
 *
 * IMPORTANT:
 *
 * This MUST appear before:
 *
 * /:propertyId/images/:imageId
 *
 * because "reorder" is a static route segment.
 *
 * PATCH
 *
 * /api/properties/:propertyId/images/reorder
 *
 * Expected body:
 *
 * {
 *   "imageIds": [
 *     "imageId1",
 *     "imageId2",
 *     "imageId3"
 *   ]
 * }
 */

router.patch(
  "/:propertyId/images/reorder",
  propertyImageController.reorderImages
);


/**
 * UPDATE SINGLE IMAGE ORDER
 *
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/order
 *
 * Expected body:
 *
 * {
 *   "displayOrder": 2
 * }
 */

router.patch(
  "/:propertyId/images/:imageId/order",
  propertyImageController.updateImageOrder
);


/* ==========================================================
   IMAGE STATUS
========================================================== */

/**
 * ACTIVATE IMAGE
 *
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/activate
 */

router.patch(
  "/:propertyId/images/:imageId/activate",
  propertyImageController.activateImage
);


/**
 * DEACTIVATE IMAGE
 *
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId/deactivate
 */

router.patch(
  "/:propertyId/images/:imageId/deactivate",
  propertyImageController.deactivateImage
);


/* ==========================================================
   IMAGE METADATA
========================================================== */

/**
 * UPDATE IMAGE METADATA
 *
 * PATCH
 *
 * /api/properties/:propertyId/images/:imageId
 *
 * Supported fields include:
 *
 * • caption
 * • altText
 * • displayOrder
 * • aiTags
 * • aiScore
 */

router.patch(
  "/:propertyId/images/:imageId",
  propertyImageController.updatePropertyImage
);


/* ==========================================================
   DELETE IMAGE
========================================================== */

/**
 * DELETE
 *
 * /api/properties/:propertyId/images/:imageId
 *
 * The controller performs:
 *
 * • ownership validation
 * • soft deletion of PropertyImage
 * • physical file deletion
 * • cover reference cleanup
 * • replacement cover selection when required
 */

router.delete(
  "/:propertyId/images/:imageId",
  propertyImageController.deletePropertyImage
);


/* ==========================================================
   SINGLE IMAGE
========================================================== */

/**
 * GET
 *
 * /api/properties/:propertyId/images/:imageId
 *
 * IMPORTANT:
 *
 * This MUST remain LAST because :imageId is dynamic.
 *
 * Static routes such as:
 *
 * /cover
 * /reorder
 *
 * must be registered before this route.
 */

router.get(
  "/:propertyId/images/:imageId",
  propertyImageController.getPropertyImageById
);


/* ==========================================================
   EXPORT
========================================================== */

export default router;

