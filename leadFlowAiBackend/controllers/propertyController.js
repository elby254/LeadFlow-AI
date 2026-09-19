/**
 * ==========================================================
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Property CRUD
 * • Property listing
 * • Property retrieval
 * • Property creation
 * • Property update
 * • Archive / restore
 * • Permanent delete
 * • Property search
 * • Available properties
 * • Reserved properties
 * • Occupied properties
 * • Inactive properties
 * • Sold properties
 * • Featured properties
 * • New listings
 * • Dashboard
 * • Inventory
 * • Statistics
 * • Price history
 * • Recommendations
 * • Lead-specific recommendations
 * • Property matches
 * • Agent workflow properties
 *
 * IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Property.coverImage is ALWAYS:
 *
 *     ObjectId -> PropertyImage
 *
 * The PropertyImage controller is the SINGLE authority
 * responsible for image creation/replacement.
 *
 * Property creation:
 *
 *     Property
 *        ↓
 *     coverImage = null
 *
 * Image upload:
 *
 *     PropertyImage
 *        ↓
 *     Property.coverImage = PropertyImage._id
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * This controller does NOT create PropertyImage records.
 *
 * This prevents duplicate PropertyImage records from being
 * created by different parts of the workflow.
 *
 * ==========================================================
 */

import propertyService from "../services/propertyService.js";
import Property from "../models/property.js";

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Get authenticated organization.
 */
const getOrganizationId = (req) => {
  return req.user?.organizationId;
};

/**
 * Get authenticated user ID.
 */
const getUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

/**
 * Require organization context.
 */
const requireOrganization = (req, res) => {
  const organizationId = getOrganizationId(req);

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
   GET ALL PROPERTIES
   GET /api/properties
========================================================== */

export const getAllProperties = async (req, res) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const properties =
      await propertyService.getAllProperties({
        organizationId,

        status:
          req.query.status,

        availability:
          req.query.availability,

        propertyType:
          req.query.propertyType,

        featured:
          req.query.featured,

        location:
          req.query.location,

        county:
          req.query.county,

        city:
          req.query.city,

        estate:
          req.query.estate,

        bedrooms:
          req.query.bedrooms,

        furnished:
          req.query.furnished,

        petsAllowed:
          req.query.petsAllowed,

        paymentType:
          req.query.paymentType,

        minPrice:
          req.query.minPrice,

        maxPrice:
          req.query.maxPrice,
      });

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET ALL PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch properties.",
    });
  }
};

/* ==========================================================
   GET MY AGENT PROPERTIES
   GET /api/properties/my
========================================================== */

/**
 * Returns properties assigned to the authenticated agent.
 *
 * LeadFlow AI workflow:
 *
 * Agent
 *   ↓
 * My Properties
 *   ↓
 * Lead Requirements
 *   ↓
 * Property Matching
 *   ↓
 * Recommendations
 *   ↓
 * Viewing
 *   ↓
 * Follow-up
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * The agent ID comes ONLY from the authenticated session.
 *
 * The frontend cannot choose another agent's ID.
 *
 * Organization isolation is also enforced.
 *
 * The property service is responsible for filtering the
 * properties by authenticated agent and organization.
 */
export const getMyProperties = async (req, res) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const agentId =
      getUserId(req);

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated agent ID is required.",
      });
    }

    const result =
      await propertyService.getMyProperties({
        organizationId,

        agentId,

        status:
          req.query.status,

        availability:
          req.query.availability,

        propertyType:
          req.query.propertyType,

        featured:
          req.query.featured,

        location:
          req.query.location,

        county:
          req.query.county,

        city:
          req.query.city,

        estate:
          req.query.estate,

        bedrooms:
          req.query.bedrooms,

        furnished:
          req.query.furnished,

        petsAllowed:
          req.query.petsAllowed,

        paymentType:
          req.query.paymentType,

        minPrice:
          req.query.minPrice,

        maxPrice:
          req.query.maxPrice,

        page:
          req.query.page,

        limit:
          req.query.limit,
      });

    return res.status(200).json({
      success: true,

      count:
        result.total,

      data:
        result.properties,

      pagination: {
        page:
          result.page,

        limit:
          result.limit,

        total:
          result.total,

        totalPages:
          result.totalPages,
      },
    });

  } catch (error) {
    console.error(
      "GET MY AGENT PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch agent properties.",
    });
  }
};

/* ==========================================================
   GET PROPERTY BY ID
   GET /api/properties/:id
========================================================== */

export const getPropertyById = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const property =
      await propertyService.getPropertyById(
        req.params.propertyId,
        organizationId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: property,
    });

  } catch (error) {
    console.error(
      "GET PROPERTY BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch property.",
    });
  }
};

/* ==========================================================
   CREATE PROPERTY
   POST /api/properties
========================================================== */

export const createProperty = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const userId =
      getUserId(req);

    const propertyPayload = {
      ...(req.body || {}),

      coverImage: null,
    };

    const property =
      await propertyService.createProperty(
        propertyPayload,
        organizationId,
        userId
      );

    return res.status(201).json({
      success: true,

      message:
        "Property created successfully.",

      data: property,
    });

  } catch (error) {
    console.error(
      "CREATE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create property.",
    });
  }
};

/* ==========================================================
   UPDATE PROPERTY
   PUT /api/properties/:id
========================================================== */

export const updateProperty = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const userId =
      getUserId(req);

    const property =
      await propertyService.findActiveProperty(
        req.params.propertyId,
        organizationId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const updatedProperty =
      await propertyService.updateProperty(
        property,
        req.body,
        organizationId,
        userId
      );

    const finalProperty =
      await propertyService.getPropertyById(
        updatedProperty._id,
        organizationId
      );

    return res.status(200).json({
      success: true,

      message:
        "Property updated successfully.",

      data:
        finalProperty ||
        updatedProperty,
    });

  } catch (error) {
    console.error(
      "UPDATE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update property.",
    });
  }
};

/* ==========================================================
   ARCHIVE PROPERTY
   PATCH /api/properties/:id/archive
========================================================== */

export const archiveProperty = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const userId =
      getUserId(req);

    const property =
      await propertyService.findActiveProperty(
        req.params.propertyId,
        organizationId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const archivedProperty =
      await propertyService.archiveProperty(
        property,
        userId
      );

    return res.status(200).json({
      success: true,

      message:
        "Property archived successfully.",

      data: archivedProperty,
    });

  } catch (error) {
    console.error(
      "ARCHIVE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   RESTORE PROPERTY
   PATCH /api/properties/:id/restore
========================================================== */

export const restoreProperty = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const property =
      await propertyService.findArchivedProperty(
        req.params.propertyId,
        organizationId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message:
          "Archived property not found.",
      });
    }

    const restoredProperty =
      await propertyService.restoreProperty(
        property
      );

    return res.status(200).json({
      success: true,

      message:
        "Property restored successfully.",

      data: restoredProperty,
    });

  } catch (error) {
    console.error(
      "RESTORE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   DELETE PROPERTY
   DELETE /api/properties/:id
========================================================== */

export const deleteProperty = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const property =
      await propertyService.findPropertyForDelete(
        req.params.propertyId,
        organizationId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    await propertyService.deleteProperty(
      property
    );

    return res.status(200).json({
      success: true,

      message:
        "Property permanently deleted.",
    });

  } catch (error) {
    console.error(
      "DELETE PROPERTY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to delete property.",
    });
  }
};

/* ==========================================================
   SEARCH PROPERTIES
   GET /api/properties/search?q=
========================================================== */

export const searchProperties = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const keyword =
      req.query.q ||
      req.query.keyword ||
      "";

    const properties =
      await propertyService.searchProperties({
        organizationId,
        keyword,
      });

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "SEARCH PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   AVAILABLE PROPERTIES
   GET /api/properties/available
========================================================== */

export const getAvailableProperties = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const properties =
      await propertyService.getAvailableProperties(
        organizationId,
        {
          propertyType:
            req.query.propertyType,

          featured:
            req.query.featured,

          location:
            req.query.location,

          county:
            req.query.county,

          city:
            req.query.city,

          estate:
            req.query.estate,

          bedrooms:
            req.query.bedrooms,

          furnished:
            req.query.furnished,

          petsAllowed:
            req.query.petsAllowed,

          paymentType:
            req.query.paymentType,

          minPrice:
            req.query.minPrice,

          maxPrice:
            req.query.maxPrice,
        }
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET AVAILABLE PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   RESERVED PROPERTIES
   GET /api/properties/reserved
========================================================== */

export const getReservedProperties = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const properties =
      await propertyService.getReservedProperties(
        organizationId,
        {
          propertyType:
            req.query.propertyType,

          featured:
            req.query.featured,

          location:
            req.query.location,

          county:
            req.query.county,

          city:
            req.query.city,

          estate:
            req.query.estate,

          bedrooms:
            req.query.bedrooms,

          furnished:
            req.query.furnished,

          petsAllowed:
            req.query.petsAllowed,

          paymentType:
            req.query.paymentType,

          minPrice:
            req.query.minPrice,

          maxPrice:
            req.query.maxPrice,
        }
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET RESERVED PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   OCCUPIED PROPERTIES
   GET /api/properties/occupied
========================================================== */

export const getOccupiedProperties = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const properties =
      await propertyService.getOccupiedProperties(
        organizationId,
        {
          propertyType:
            req.query.propertyType,

          featured:
            req.query.featured,

          location:
            req.query.location,

          county:
            req.query.county,

          city:
            req.query.city,

          estate:
            req.query.estate,

          bedrooms:
            req.query.bedrooms,

          furnished:
            req.query.furnished,

          petsAllowed:
            req.query.petsAllowed,

          paymentType:
            req.query.paymentType,

          minPrice:
            req.query.minPrice,

          maxPrice:
            req.query.maxPrice,
        }
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET OCCUPIED PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   INACTIVE PROPERTIES
   GET /api/properties/inactive
========================================================== */

export const getInactiveProperties = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const properties =
      await propertyService.getInactiveProperties(
        organizationId,
        {
          propertyType:
            req.query.propertyType,

          featured:
            req.query.featured,

          location:
            req.query.location,

          county:
            req.query.county,

          city:
            req.query.city,

          estate:
            req.query.estate,

          bedrooms:
            req.query.bedrooms,

          furnished:
            req.query.furnished,

          petsAllowed:
            req.query.petsAllowed,

          paymentType:
            req.query.paymentType,

          minPrice:
            req.query.minPrice,

          maxPrice:
            req.query.maxPrice,
        }
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET INACTIVE PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   SOLD PROPERTIES
   GET /api/properties/sold
========================================================== */

export const getSoldProperties = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const properties =
      await propertyService.getSoldProperties(
        organizationId,
        {
          propertyType:
            req.query.propertyType,

          featured:
            req.query.featured,

          location:
            req.query.location,

          county:
            req.query.county,

          city:
            req.query.city,

          estate:
            req.query.estate,

          bedrooms:
            req.query.bedrooms,

          furnished:
            req.query.furnished,

          petsAllowed:
            req.query.petsAllowed,

          paymentType:
            req.query.paymentType,

          minPrice:
            req.query.minPrice,

          maxPrice:
            req.query.maxPrice,
        }
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET SOLD PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   FEATURED PROPERTIES
   GET /api/properties/featured
========================================================== */

export const getFeaturedProperties = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const properties =
      await propertyService.getFeaturedProperties(
        organizationId
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET FEATURED PROPERTIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   NEW LISTINGS
   GET /api/properties/new
========================================================== */

export const getNewListings = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const limit =
      Number(req.query.limit) || 5;

    const properties =
      await propertyService.getNewListings(
        organizationId,
        limit
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET NEW LISTINGS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   PROPERTY DASHBOARD
   GET /api/properties/dashboard
========================================================== */

export const getPropertyDashboard = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const dashboard =
      await propertyService.getPropertyDashboard(
        organizationId
      );

    return res.status(200).json({
      success: true,
      data: dashboard,
    });

  } catch (error) {
    console.error(
      "GET PROPERTY DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   INVENTORY
   GET /api/properties/inventory
========================================================== */

export const getInventoryStatus = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const inventory =
      await propertyService.getInventoryStatus(
        organizationId
      );

    return res.status(200).json({
      success: true,
      data: inventory,
    });

  } catch (error) {
    console.error(
      "GET INVENTORY STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   PROPERTY STATISTICS
   GET /api/properties/statistics
========================================================== */

export const getPropertyStatistics = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const statistics =
      await propertyService.getPropertyStatistics(
        organizationId
      );

    return res.status(200).json({
      success: true,
      data: statistics,
    });

  } catch (error) {
    console.error(
      "GET PROPERTY STATISTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   PRICE HISTORY
   GET /api/properties/:id/price-history
========================================================== */

export const getPriceHistory = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const property =
      await propertyService.findPropertyForDelete(
        req.params.propertyId,
        organizationId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const history =
      await propertyService.getPriceHistory(
        req.params.propertyId,
        organizationId
      );

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });

  } catch (error) {
    console.error(
      "GET PRICE HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   LATEST PRICE
   GET /api/properties/:id/latest-price
========================================================== */

export const getLatestPrice = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const property =
      await propertyService.findPropertyForDelete(
        req.params.propertyId,
        organizationId
      );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    const latestPrice =
      await propertyService.getLatestPrice(
        req.params.propertyId,
        organizationId
      );

    return res.status(200).json({
      success: true,
      data: latestPrice,
    });

  } catch (error) {
    console.error(
      "GET LATEST PRICE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   RECOMMENDATIONS
   GET /api/properties/recommendations
========================================================== */

export const getRecommendations = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const options = {
      limit:
        Number(req.query.limit) || 10,

      propertyType:
        req.query.propertyType,

      location:
        req.query.location,

      minPrice:
        req.query.minPrice,

      maxPrice:
        req.query.maxPrice,

      bedrooms:
        req.query.bedrooms,

      availability:
        req.query.availability,
    };

    const properties =
      await propertyService.getRecommendations(
        organizationId,
        options
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET PROPERTY RECOMMENDATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   LEAD-SPECIFIC RECOMMENDATIONS
   GET /api/properties/recommendations/lead/:leadId
========================================================== */

export const getLeadRecommendations = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const lead = {
      budget:
        req.query.budget !== undefined
          ? Number(req.query.budget)
          : undefined,

      bedrooms:
        req.query.bedrooms !== undefined
          ? Number(req.query.bedrooms)
          : undefined,

      location:
        req.query.location,

      propertyType:
        req.query.propertyType,
    };

    const options = {
      limit:
        Number(req.query.limit) || 10,
    };

    const properties =
      await propertyService.getLeadRecommendations(
        organizationId,
        lead,
        options
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET LEAD RECOMMENDATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   PROPERTY MATCHES
   GET /api/properties/matches
========================================================== */

export const getPropertyMatches = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const criteria = {
      budget:
        req.query.budget,

      minPrice:
        req.query.minPrice,

      maxPrice:
        req.query.maxPrice,

      location:
        req.query.location,

      bedrooms:
        req.query.bedrooms,

      propertyType:
        req.query.propertyType,

      availability:
        req.query.availability,

      status:
        req.query.status ||
        "available",
    };

    const properties =
      await propertyService.getPropertyMatches(
        organizationId,
        criteria
      );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error(
      "GET PROPERTY MATCHES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   ARCHIVED PROPERTY COUNT
   GET /api/properties/count/archived
========================================================== */

export const getArchivedPropertyCount = async (
  req,
  res
) => {
  try {
    const organizationId =
      requireOrganization(req, res);

    if (!organizationId) {
      return;
    }

    const count =
      await propertyService.getArchivedPropertyCount(
        organizationId
      );

    return res.status(200).json({
      success: true,
      data: {
        count,
      },
    });

  } catch (error) {
    console.error(
      "GET ARCHIVED PROPERTY COUNT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch archived property count.",
    });
  }
};

/* ==========================================================
   EXPORT
========================================================== */

export default {
  getAllProperties,

  getMyProperties,

  getPropertyById,

  createProperty,
  updateProperty,

  archiveProperty,
  restoreProperty,
  deleteProperty,

  searchProperties,

  getAvailableProperties,
  getReservedProperties,
  getOccupiedProperties,
  getInactiveProperties,
  getSoldProperties,
  getFeaturedProperties,
  getNewListings,

  getPropertyDashboard,
  getInventoryStatus,
  getPropertyStatistics,

  getArchivedPropertyCount,

  getPriceHistory,
  getLatestPrice,

  getRecommendations,
  getLeadRecommendations,
  getPropertyMatches,
};