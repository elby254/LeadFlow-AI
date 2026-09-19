/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Amenity Management.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Get property amenities
 * • Create amenity
 * • Update amenity
 * • Delete amenity
 * • Restore amenity
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Property Management
 * • Agent Property Management
 * • Viewer Property Details
 *
 * ==========================================================
 */

import Property from "../models/Property.js";
import PropertyAmenity from "../models/PropertyAmenity.js";

/**
 * ==========================================================
 * Helper
 * ==========================================================
 */

const buildOrganizationQuery = (req) => ({
  organizationId: req.user.organizationId,
});

/**
 * ==========================================================
 * GET PROPERTY AMENITIES
 *
 * GET /api/properties/:propertyId/amenities
 * ==========================================================
 */

export const getPropertyAmenities = async (req, res) => {

  try {

    /*
    ==========================================================
    VERIFY PROPERTY
    ==========================================================
    */

    const property = await Property.findOne({

      _id: req.params.propertyId,

      ...buildOrganizationQuery(req),

      isArchived: false,

    });

    if (!property) {

      return res.status(404).json({

        success: false,

        message: "Property not found.",

      });

    }

    /*
    ==========================================================
    FETCH AMENITIES
    ==========================================================
    */

    const amenities = await PropertyAmenity.find({

      property: property._id,

      active: true,

    })

      .sort({

        category: 1,

        displayOrder: 1,

        createdAt: 1,

      })

      .lean();

    return res.status(200).json({

      success: true,

      count: amenities.length,

      data: amenities,

    });

  }

  catch (error) {

    console.error("GET PROPERTY AMENITIES ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * CREATE PROPERTY AMENITY
 *
 * POST /api/properties/:propertyId/amenities
 * ==========================================================
 */

export const createPropertyAmenity = async (req, res) => {

  try {

    /*
    ==========================================================
    VERIFY PROPERTY
    ==========================================================
    */

    const property = await Property.findOne({

      _id: req.params.propertyId,

      ...buildOrganizationQuery(req),

      isArchived: false,

    });

    if (!property) {

      return res.status(404).json({

        success: false,

        message: "Property not found.",

      });

    }

    const {

      name,

      value,

      category,

      icon,

      displayOrder,

    } = req.body;

    /*
    ==========================================================
    VALIDATION
    ==========================================================
    */

    if (!name) {

      return res.status(400).json({

        success: false,

        message: "Amenity name is required.",

      });

    }

    /*
    ==========================================================
    CREATE AMENITY
    ==========================================================
    */

    const amenity = await PropertyAmenity.create({

      property: property._id,

      organizationId: property.organizationId,

      name,

      value,

      category,

      icon,

      displayOrder,

      createdBy: req.user._id,

    });

    return res.status(201).json({

      success: true,

      message: "Property amenity created successfully.",

      data: amenity,

    });

  }

  catch (error) {

    console.error("CREATE PROPERTY AMENITY ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * UPDATE PROPERTY AMENITY
 *
 * PATCH /api/property-amenities/:amenityId
 * ==========================================================
 */

export const updatePropertyAmenity = async (req, res) => {

  try {

    const amenity = await PropertyAmenity.findOne({

      _id: req.params.amenityId,

      ...buildOrganizationQuery(req),

      active: true,

    });

    if (!amenity) {

      return res.status(404).json({

        success: false,

        message: "Property amenity not found.",

      });

    }

    /*
    ==========================================================
    UPDATE VALUES
    ==========================================================
    */

    const {

      name,

      value,

      category,

      icon,

      displayOrder,

    } = req.body;

    if (name !== undefined) {
      amenity.name = name;
    }

    if (value !== undefined) {
      amenity.value = value;
    }

    if (category !== undefined) {
      amenity.category = category;
    }

    if (icon !== undefined) {
      amenity.icon = icon;
    }

    if (displayOrder !== undefined) {
      amenity.displayOrder = displayOrder;
    }

    amenity.updatedBy = req.user._id;

    await amenity.save();

    return res.status(200).json({

      success: true,

      message: "Property amenity updated successfully.",

      data: amenity,

    });

  }

  catch (error) {

    console.error("UPDATE PROPERTY AMENITY ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * DELETE PROPERTY AMENITY
 *
 * DELETE /api/property-amenities/:amenityId
 *
 * Soft Delete
 * ==========================================================
 */

export const deletePropertyAmenity = async (req, res) => {

  try {

    /*
    ==========================================================
    FIND AMENITY
    ==========================================================
    */

    const amenity = await PropertyAmenity.findOne({

      _id: req.params.amenityId,

      ...buildOrganizationQuery(req),

      active: true,

    });

    if (!amenity) {

      return res.status(404).json({

        success: false,

        message: "Property amenity not found.",

      });

    }

    /*
    ==========================================================
    SOFT DELETE
    ==========================================================
    */

    amenity.active = false;

    amenity.updatedBy = req.user._id;

    await amenity.save();

    return res.status(200).json({

      success: true,

      message: "Property amenity deleted successfully.",

    });

  }

  catch (error) {

    console.error("DELETE PROPERTY AMENITY ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * RESTORE PROPERTY AMENITY
 *
 * PATCH /api/property-amenities/:amenityId/restore
 * ==========================================================
 */

export const restorePropertyAmenity = async (req, res) => {

  try {

    /*
    ==========================================================
    FIND ARCHIVED AMENITY
    ==========================================================
    */

    const amenity = await PropertyAmenity.findOne({

      _id: req.params.amenityId,

      ...buildOrganizationQuery(req),

      active: false,

    });

    if (!amenity) {

      return res.status(404).json({

        success: false,

        message: "Archived property amenity not found.",

      });

    }

    /*
    ==========================================================
    RESTORE
    ==========================================================
    */

    amenity.active = true;

    amenity.updatedBy = req.user._id;

    await amenity.save();

    return res.status(200).json({

      success: true,

      message: "Property amenity restored successfully.",

      data: amenity,

    });

  }

  catch (error) {

    console.error("RESTORE PROPERTY AMENITY ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};