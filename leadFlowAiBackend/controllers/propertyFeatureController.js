/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Feature Management.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Get property features
 * • Add property feature
 * • Update property feature
 * • Delete property feature
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
import PropertyFeature from "../models/PropertyFeature.js";

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
 * GET PROPERTY FEATURES
 *
 * GET /api/properties/:propertyId/features
 * ==========================================================
 */

export const getPropertyFeatures = async (req, res) => {

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
    FETCH FEATURES
    ==========================================================
    */

    const features = await PropertyFeature.find({

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

      count: features.length,

      data: features,

    });

  }

  catch (error) {

    console.error("GET PROPERTY FEATURES ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * CREATE PROPERTY FEATURE
 *
 * POST /api/properties/:propertyId/features
 * ==========================================================
 */

export const createPropertyFeature = async (req, res) => {

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

      type,

      category,

      displayOrder,

    } = req.body;

    /*
    ==========================================================
    VALIDATION
    ==========================================================
    */

    if (!name || !value) {

      return res.status(400).json({

        success: false,

        message: "Feature name and value are required.",

      });

    }

    /*
    ==========================================================
    CREATE FEATURE
    ==========================================================
    */

    const feature = await PropertyFeature.create({

      property: property._id,

      organizationId: property.organizationId,

      name,

      value,

      type,

      category,

      displayOrder,

      createdBy: req.user._id,

    });

    return res.status(201).json({

      success: true,

      message: "Property feature created successfully.",

      data: feature,

    });

  }

  catch (error) {

    console.error("CREATE PROPERTY FEATURE ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * UPDATE PROPERTY FEATURE
 *
 * PATCH /api/property-features/:featureId
 * ==========================================================
 */

export const updatePropertyFeature = async (req, res) => {

  try {

    const feature = await PropertyFeature.findOne({

      _id: req.params.featureId,

      ...buildOrganizationQuery(req),

      active: true,

    });

    if (!feature) {

      return res.status(404).json({

        success: false,

        message: "Property feature not found.",

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

      type,

      category,

      displayOrder,

    } = req.body;

    if (name !== undefined) {
      feature.name = name;
    }

    if (value !== undefined) {
      feature.value = value;
    }

    if (type !== undefined) {
      feature.type = type;
    }

    if (category !== undefined) {
      feature.category = category;
    }

    if (displayOrder !== undefined) {
      feature.displayOrder = displayOrder;
    }

    feature.updatedBy = req.user._id;

    await feature.save();

    return res.status(200).json({

      success: true,

      message: "Property feature updated successfully.",

      data: feature,

    });

  }

  catch (error) {

    console.error("UPDATE PROPERTY FEATURE ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * DELETE PROPERTY FEATURE
 *
 * DELETE /api/property-features/:featureId
 *
 * Soft Delete
 * ==========================================================
 */

export const deletePropertyFeature = async (req, res) => {

  try {

    /*
    ==========================================================
    FIND FEATURE
    ==========================================================
    */

    const feature = await PropertyFeature.findOne({

      _id: req.params.featureId,

      ...buildOrganizationQuery(req),

      active: true,

    });

    if (!feature) {

      return res.status(404).json({

        success: false,

        message: "Property feature not found.",

      });

    }

    /*
    ==========================================================
    SOFT DELETE
    ==========================================================
    */

    feature.active = false;

    feature.updatedBy = req.user._id;

    await feature.save();

    return res.status(200).json({

      success: true,

      message: "Property feature deleted successfully.",

    });

  }

  catch (error) {

    console.error("DELETE PROPERTY FEATURE ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * RESTORE PROPERTY FEATURE
 *
 * PATCH /api/property-features/:featureId/restore
 * ==========================================================
 */

export const restorePropertyFeature = async (req, res) => {

  try {

    /*
    ==========================================================
    FIND FEATURE
    ==========================================================
    */

    const feature = await PropertyFeature.findOne({

      _id: req.params.featureId,

      ...buildOrganizationQuery(req),

      active: false,

    });

    if (!feature) {

      return res.status(404).json({

        success: false,

        message: "Archived property feature not found.",

      });

    }

    /*
    ==========================================================
    RESTORE
    ==========================================================
    */

    feature.active = true;

    feature.updatedBy = req.user._id;

    await feature.save();

    return res.status(200).json({

      success: true,

      message: "Property feature restored successfully.",

      data: feature,

    });

  }

  catch (error) {

    console.error("RESTORE PROPERTY FEATURE ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};