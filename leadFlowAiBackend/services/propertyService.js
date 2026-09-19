/**
 * ==========================================================
 *
 * PROPERTY SERVICE
 *
 * Business logic layer for Property Management.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Get all properties
 * • Get single property
 * • Create property
 * • Update property
 * • Archive property
 * • Restore property
 * • Permanently delete property
 * • Property filtering
 * • Available properties
 * • Sold properties
 * • Reserved properties
 * • Occupied properties
 * • Inactive properties
 * • Dashboard
 * • Inventory
 * • New listings
 * • AI recommendations
 * • Lead-specific recommendations
 * • Property search
 * • Property matching
 * • Property statistics
 * • Latest properties
 * • Featured properties
 * • Price history
 * • Organization isolation
 * • Consistent property-image population
 * • Agent workflow property retrieval
 *
 * ==========================================================
 *
 * IMPORTANT IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 *
 * Property.coverImage is an ObjectId reference to the
 * canonical PropertyImage document.
 *
 * Property lifecycle:
 *
 *     1. Property is created
 *     2. coverImage is preserved from image workflow
 *     3. PropertyImageController creates/reuses the image
 *     4. PropertyImageController assigns image._id to
 *        Property.coverImage
 *     5. Property queries populate that same PropertyImage
 *
 * THIS SERVICE DOES NOT CREATE PROPERTY IMAGES.
 *
 * ==========================================================
 */

import Property from "../models/property.js";
import PropertyPriceHistory from "../models/propertyPriceHistory.js";
import PropertyImage from "../models/propertyImage.js";


/* ==========================================================
   PROPERTY ENUMS
========================================================== */

const PROPERTY_TYPE_VALUES = [
  "Apartment",
  "Bedsitter",
  "Studio",
  "Maisonette",
  "House",
  "Villa",
  "Commercial",
  "Office",
  "Land",
];


const PROPERTY_STATUS_VALUES = [
  "available",
  "reserved",
  "sold",
  "occupied",
  "inactive",
];


/* ==========================================================
   ENUM NORMALIZATION
========================================================== */

const normalizeEnumValue = (
  value,
  allowedValues,
  fieldName
) => {

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return undefined;
  }


  const normalizedInput =
    String(value)
      .trim()
      .toLowerCase();


  const matchedValue =
    allowedValues.find(
      (allowedValue) =>
        allowedValue.toLowerCase() ===
        normalizedInput
    );


  if (!matchedValue) {
    throw new Error(
      `Invalid ${fieldName}. Allowed values: ${allowedValues.join(", ")}`
    );
  }


  return matchedValue;
};


/* ==========================================================
   PROPERTY SERVICE
========================================================== */

class PropertyService {


  /* ========================================================
     ORGANIZATION QUERY
  ======================================================== */

  buildOrganizationQuery(organizationId) {

    if (!organizationId) {
      throw new Error(
        "Organization ID is required."
      );
    }


    return {
      organizationId,
    };
  }


  /* ========================================================
     AGENT PROPERTY QUERY
     
     IMPORTANT
     --------------------------------------------------------
     This is the central security boundary for the agent
     workflow.
     
     Every agent property query MUST contain:
     
         organizationId
         assignedAgent
         isArchived
     
     This prevents:
     
     ❌ Agent A seeing Agent B's properties
     ❌ Agent seeing another organization's properties
     ❌ Agent seeing archived properties through normal workflow
     
     It also preserves:
     
         Property.coverImage
               ↓
         PropertyImage
               ↓
         Agent
  ======================================================== */

  buildAgentPropertyQuery(
    organizationId,
    agentId,
    additionalQuery = {}
  ) {

    if (!organizationId) {
      throw new Error(
        "Organization ID is required."
      );
    }


    if (!agentId) {
      throw new Error(
        "Agent ID is required."
      );
    }


    return {

      organizationId,

      assignedAgent:
        agentId,

      isArchived: false,

      ...additionalQuery,

    };
  }


  /* ========================================================
     REGEX HELPER
  ======================================================== */

  escapeRegex(value) {

    return String(value).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }


  /* ========================================================
     BOOLEAN HELPER
  ======================================================== */

  toBoolean(value) {

    if (typeof value === "boolean") {
      return value;
    }


    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }


    return Boolean(value);
  }


  /* ========================================================
     SAFE LIMIT
  ======================================================== */

  getSafeLimit(
    value,
    fallback = 10
  ) {

    const parsed =
      Number(value);


    if (
      !Number.isFinite(parsed) ||
      parsed <= 0
    ) {
      return fallback;
    }


    return Math.min(
      Math.floor(parsed),
      100
    );
  }


  /* ========================================================
     PROPERTY TYPE NORMALIZER
  ======================================================== */

  normalizePropertyType(value) {

    return normalizeEnumValue(
      value,
      PROPERTY_TYPE_VALUES,
      "propertyType"
    );
  }


  /* ========================================================
     STATUS NORMALIZER
  ======================================================== */

  normalizeStatus(value) {

    return normalizeEnumValue(
      value,
      PROPERTY_STATUS_VALUES,
      "status"
    );
  }


  /* ========================================================
     PROPERTY POPULATION
     
     CENTRAL POPULATION METHOD.
     
     IMPORTANT:
     --------------------------------------------------------
     Agent workflow uses this exact method.
     
     Therefore agent property cards receive:
     
         property.coverImage
                    ↓
         populated PropertyImage document
  ======================================================== */

  populateProperty(query) {

    return query

      .populate(
        "assignedAgent",
        "name email phone"
      )

      .populate({
        path: "coverImage",

        select: [
          "_id",
          "property",
          "organizationId",
          "url",
          "publicId",
          "caption",
          "altText",
          "isCover",
          "displayOrder",
          "width",
          "height",
          "size",
          "mimeType",
          "aiTags",
          "aiScore",
          "active",
          "createdAt",
          "updatedAt",
        ].join(" "),

        match: {
          active: true,
        },

      });
  }


  /* ========================================================
     PROPERTY FILTER BUILDER
     
     Shared by normal and agent workflows.
  ======================================================== */

  applyPropertyFilters(
    query,
    filters = {}
  ) {

    const {

      status,
      propertyType,
      featured,
      location,
      county,
      city,
      estate,
      bedrooms,
      furnished,
      petsAllowed,
      paymentType,
      minPrice,
      maxPrice,

    } = filters;


    /* ------------------------------------------------------
       STATUS
    ------------------------------------------------------ */

    if (status) {

      query.status =
        this.normalizeStatus(status);
    }


    /* ------------------------------------------------------
       PROPERTY TYPE
    ------------------------------------------------------ */

    if (propertyType) {

      query.propertyType =
        this.normalizePropertyType(
          propertyType
        );
    }


    /* ------------------------------------------------------
       FEATURED
    ------------------------------------------------------ */

    if (featured !== undefined) {

      query.featured =
        this.toBoolean(featured);
    }


    /* ------------------------------------------------------
       LOCATION
    ------------------------------------------------------ */

    if (location) {

      query.location =
        new RegExp(
          this.escapeRegex(location),
          "i"
        );
    }


    /* ------------------------------------------------------
       COUNTY
    ------------------------------------------------------ */

    if (county) {

      query.county =
        new RegExp(
          this.escapeRegex(county),
          "i"
        );
    }


    /* ------------------------------------------------------
       CITY
    ------------------------------------------------------ */

    if (city) {

      query.city =
        new RegExp(
          this.escapeRegex(city),
          "i"
        );
    }


    /* ------------------------------------------------------
       ESTATE
    ------------------------------------------------------ */

    if (estate) {

      query.estate =
        new RegExp(
          this.escapeRegex(estate),
          "i"
        );
    }


    /* ------------------------------------------------------
       BEDROOMS
    ------------------------------------------------------ */

    if (bedrooms !== undefined) {

      const parsedBedrooms =
        Number(bedrooms);


      if (
        Number.isFinite(
          parsedBedrooms
        )
      ) {

        query.bedrooms =
          parsedBedrooms;
      }
    }


    /* ------------------------------------------------------
       FURNISHED
    ------------------------------------------------------ */

    if (furnished !== undefined) {

      query.furnished =
        this.toBoolean(furnished);
    }


    /* ------------------------------------------------------
       PETS ALLOWED
    ------------------------------------------------------ */

    if (petsAllowed !== undefined) {

      query.petsAllowed =
        this.toBoolean(petsAllowed);
    }


    /* ------------------------------------------------------
       PAYMENT TYPE
    ------------------------------------------------------ */

    if (paymentType) {

      query.paymentType =
        paymentType;
    }


    /* ------------------------------------------------------
       PRICE RANGE
    ------------------------------------------------------ */

    if (
      minPrice !== undefined ||
      maxPrice !== undefined
    ) {

      query.price = {};


      if (
        minPrice !== undefined
      ) {

        const parsedMin =
          Number(minPrice);


        if (
          Number.isFinite(parsedMin)
        ) {

          query.price.$gte =
            parsedMin;
        }
      }


      if (
        maxPrice !== undefined
      ) {

        const parsedMax =
          Number(maxPrice);


        if (
          Number.isFinite(parsedMax)
        ) {

          query.price.$lte =
            parsedMax;
        }
      }
    }


    return query;
  }


  /* ========================================================
     GET ALL PROPERTIES
     
     ADMIN / GENERAL ORGANIZATION WORKFLOW
     
     NOTE:
     --------------------------------------------------------
     This method is intentionally NOT agent restricted.
     Agent pages must use the getMy* methods below.
  ======================================================== */

  async getAllProperties(filters = {}) {

    const {
      organizationId,
    } = filters;


    const query = {

      organizationId,

      isArchived: false,

    };


    this.applyPropertyFilters(
      query,
      filters
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     AGENT WORKFLOW
     GET MY PROPERTIES
     
     ONLY:
     
       organizationId = authenticated organization
       assignedAgent  = authenticated agent
     
     NEVER trust organizationId or agentId from the
     property payload itself.
  ======================================================== */

  async getMyProperties({

    organizationId,

    agentId,

    page = 1,

    limit = 10,

    ...filters

  }) {

    const safeLimit =
      this.getSafeLimit(
        limit,
        10
      );


    const parsedPage =
      Number(page);


    const safePage =
      Number.isFinite(parsedPage) &&
      parsedPage > 0
        ? Math.floor(parsedPage)
        : 1;


    const skip =
      (safePage - 1) *
      safeLimit;


    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    this.applyPropertyFilters(
      query,
      filters
    );


    const total =
      await Property.countDocuments(
        query
      );


    const properties =
      await this.populateProperty(
        Property.find(query)
      )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(safeLimit)
        .lean();


    return {

      properties,

      total,

      page:
        safePage,

      limit:
        safeLimit,

      totalPages:
        Math.ceil(
          total / safeLimit
        ),

    };
  }


  /* ========================================================
     AGENT WORKFLOW
     GET MY PROPERTY BY ID
     
     CRITICAL:
     --------------------------------------------------------
     An agent cannot retrieve another agent's property even
     when the property ID is known.
  ======================================================== */

  async getMyPropertyById(
    propertyId,
    organizationId,
    agentId
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          _id: propertyId,
        }
      );


    return await this.populateProperty(
      Property.findOne(query)
    ).lean();
  }


  /* ========================================================
     AGENT AVAILABLE PROPERTIES
  ======================================================== */

  async getMyAvailableProperties(
    organizationId,
    agentId,
    filters = {}
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          status: "available",
        }
      );


    this.applyPropertyFilters(
      query,
      {
        ...filters,
        status: "available",
      }
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     AGENT RESERVED PROPERTIES
  ======================================================== */

  async getMyReservedProperties(
    organizationId,
    agentId,
    filters = {}
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          status: "reserved",
        }
      );


    this.applyPropertyFilters(
      query,
      {
        ...filters,
        status: "reserved",
      }
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     AGENT SOLD PROPERTIES
  ======================================================== */

  async getMySoldProperties(
    organizationId,
    agentId,
    filters = {}
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          status: "sold",
        }
      );


    this.applyPropertyFilters(
      query,
      {
        ...filters,
        status: "sold",
      }
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     AGENT OCCUPIED PROPERTIES
  ======================================================== */

  async getMyOccupiedProperties(
    organizationId,
    agentId,
    filters = {}
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          status: "occupied",
        }
      );


    this.applyPropertyFilters(
      query,
      {
        ...filters,
        status: "occupied",
      }
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     AGENT INACTIVE PROPERTIES
  ======================================================== */

  async getMyInactiveProperties(
    organizationId,
    agentId,
    filters = {}
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          status: "inactive",
        }
      );


    this.applyPropertyFilters(
      query,
      {
        ...filters,
        status: "inactive",
      }
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     GET PROPERTY BY ID
     
     GENERAL / ADMIN ORGANIZATION-SCOPED ACCESS
  ======================================================== */

  async getPropertyById(
    propertyId,
    organizationId
  ) {

    const query =
      Property.findOne({

        _id: propertyId,

        organizationId,

        isArchived: false,

      });


    return await this.populateProperty(
      query
    ).lean();
  }


  /* ========================================================
     CREATE PROPERTY
  ======================================================== */

  async createProperty(
    data,
    organizationId,
    userId
  ) {

    const safeData = {
      ...(data || {}),
    };


    delete safeData.organizationId;

    delete safeData._id;


    if (
      safeData.propertyType !==
      undefined
    ) {

      safeData.propertyType =
        this.normalizePropertyType(
          safeData.propertyType
        );
    }


    if (
      safeData.status !==
      undefined
    ) {

      safeData.status =
        this.normalizeStatus(
          safeData.status
        );
    }


    const propertyData = {

      ...safeData,

      organizationId,

    };


    const property =
      await Property.create(
        propertyData
      );


    await this.recordPriceChange({

      property:
        property._id,

      organizationId,

      previousPrice:
        property.price,

      newPrice:
        property.price,

      currency:
        property.currency ||
        "KES",

      changeType:
        "initial",

      changedBy:
        userId,

      reason:
        "Initial property listing",

    });


    return await this.getPropertyById(

      property._id,

      organizationId

    );
  }


  /* ========================================================
     UPDATE PROPERTY
  ======================================================== */

  async updateProperty(
    property,
    updates,
    organizationId,
    userId
  ) {

    const oldPrice =
      property.price;


    const safeUpdates = {
      ...(updates || {}),
    };


    delete safeUpdates._id;

    delete safeUpdates.organizationId;

    delete safeUpdates.createdAt;

    delete safeUpdates.updatedAt;


    /*
     * IMPORTANT:
     *
     * coverImage is intentionally protected.
     *
     * PropertyImageController owns image assignment.
     */

    delete safeUpdates.coverImage;


    if (
      safeUpdates.propertyType !==
      undefined
    ) {

      safeUpdates.propertyType =
        this.normalizePropertyType(
          safeUpdates.propertyType
        );
    }


    if (
      safeUpdates.status !==
      undefined
    ) {

      safeUpdates.status =
        this.normalizeStatus(
          safeUpdates.status
        );
    }


    Object.assign(
      property,
      safeUpdates
    );


    property.organizationId =
      organizationId;


    await property.save();


    if (

      updates &&

      updates.price !== undefined &&

      Number(updates.price) !==
        Number(oldPrice)

    ) {

      await this.recordPriceChange({

        property:
          property._id,

        organizationId,

        previousPrice:
          oldPrice,

        newPrice:
          property.price,

        currency:
          property.currency ||
          "KES",

        changedBy:
          userId,

        changeType:
          Number(property.price) >
          Number(oldPrice)
            ? "increase"
            : "decrease",

        reason:
          updates.priceReason ||
          "Property price updated",

      });


      property.lastPriceUpdatedAt =
        new Date();


      await property.save();
    }


    return await this.getPropertyById(

      property._id,

      organizationId

    );
  }


  /* ========================================================
     ARCHIVE PROPERTY
  ======================================================== */

  async archiveProperty(
    property,
    userId
  ) {

    property.isArchived =
      true;

    property.archivedAt =
      new Date();

    property.archivedBy =
      userId;


    await property.save();


    return property;
  }


  /* ========================================================
     GET ARCHIVED PROPERTY COUNT
  ======================================================== */

  async getArchivedPropertyCount(
    organizationId
  ) {

    if (!organizationId) {
      throw new Error(
        "Organization ID is required."
      );
    }


    return await Property.countDocuments({

      organizationId,

      isArchived: true,

    });
  }


  /* ========================================================
     RESTORE PROPERTY
  ======================================================== */

  async restoreProperty(
    property
  ) {

    property.isArchived =
      false;

    property.archivedAt =
      null;

    property.archivedBy =
      null;


    await property.save();


    return property;
  }


  /* ========================================================
     PERMANENT DELETE
  ======================================================== */

  async deleteProperty(
    property
  ) {

    await PropertyImage.deleteMany({

      property:
        property._id,

      organizationId:
        property.organizationId,

    });


    await property.deleteOne();


    return true;
  }


  /* ========================================================
     FIND ACTIVE PROPERTY
  ======================================================== */

  async findActiveProperty(
    propertyId,
    organizationId
  ) {

    return await Property.findOne({

      _id: propertyId,

      organizationId,

      isArchived: false,

    });
  }


  /* ========================================================
     FIND ARCHIVED PROPERTY
  ======================================================== */

  async findArchivedProperty(
    propertyId,
    organizationId
  ) {

    return await Property.findOne({

      _id: propertyId,

      organizationId,

      isArchived: true,

    });
  }


  /* ========================================================
     FIND PROPERTY FOR DELETE
  ======================================================== */

  async findPropertyForDelete(
    propertyId,
    organizationId
  ) {

    return await Property.findOne({

      _id: propertyId,

      organizationId,

    });
  }


  /* ========================================================
     GENERAL AVAILABLE PROPERTIES
     
     ADMIN / ORGANIZATION WORKFLOW
  ======================================================== */

  async getAvailableProperties(
    organizationId,
    filters = {}
  ) {

    return await this.getAllProperties({

      organizationId,

      ...filters,

      status: "available",

    });
  }


  /* ========================================================
     GENERAL SOLD PROPERTIES
  ======================================================== */

  async getSoldProperties(
    organizationId,
    filters = {}
  ) {

    return await this.getAllProperties({

      organizationId,

      ...filters,

      status: "sold",

    });
  }


  /* ========================================================
     GENERAL RESERVED PROPERTIES
  ======================================================== */

  async getReservedProperties(
    organizationId,
    filters = {}
  ) {

    return await this.getAllProperties({

      organizationId,

      ...filters,

      status: "reserved",

    });
  }


  /* ========================================================
     GENERAL OCCUPIED PROPERTIES
  ======================================================== */

  async getOccupiedProperties(
    organizationId,
    filters = {}
  ) {

    return await this.getAllProperties({

      organizationId,

      ...filters,

      status: "occupied",

    });
  }


  /* ========================================================
     GENERAL INACTIVE PROPERTIES
  ======================================================== */

  async getInactiveProperties(
    organizationId,
    filters = {}
  ) {

    return await this.getAllProperties({

      organizationId,

      ...filters,

      status: "inactive",

    });
  }


  /* ========================================================
     GET NEW LISTINGS
     
     GENERAL ORGANIZATION WORKFLOW
  ======================================================== */

  async getNewListings(
    organizationId,
    limit = 10
  ) {

    const safeLimit =
      this.getSafeLimit(
        limit,
        10
      );


    const query =
      Property.find({

        organizationId,

        isArchived: false,

      });


    return await this.populateProperty(
      query
    )
      .sort({
        createdAt: -1,
      })
      .limit(safeLimit)
      .lean();
  }


  /* ========================================================
     AGENT NEW LISTINGS
     
     Only newly created properties assigned to this agent.
  ======================================================== */

  async getMyNewListings(
    organizationId,
    agentId,
    limit = 10
  ) {

    const safeLimit =
      this.getSafeLimit(
        limit,
        10
      );


    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({
        createdAt: -1,
      })
      .limit(safeLimit)
      .lean();
  }


  /* ========================================================
     PROPERTY SEARCH
     
     GENERAL ORGANIZATION WORKFLOW
  ======================================================== */

  async searchProperties({

    organizationId,

    keyword,

    filters = {},

  }) {

    if (!keyword) {
      return [];
    }


    const query = {

      organizationId,

      isArchived: false,

      $text: {
        $search: keyword,
      },

    };


    this.applyPropertyFilters(
      query,
      filters
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        score: {
          $meta: "textScore",
        },

      })
      .lean();
  }


  /* ========================================================
     AGENT PROPERTY SEARCH
     
     IMPORTANT:
     --------------------------------------------------------
     Search is restricted BEFORE MongoDB returns results.
     
     The text search therefore cannot expose another agent's
     property.
  ======================================================== */

  async searchMyProperties({

    organizationId,

    agentId,

    keyword,

    filters = {},

  }) {

    if (!keyword) {
      return [];
    }


    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          $text: {
            $search: keyword,
          },
        }
      );


    this.applyPropertyFilters(
      query,
      filters
    );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        score: {
          $meta: "textScore",
        },

      })
      .lean();
  }


  /* ========================================================
     FILTER PROPERTIES
  ======================================================== */

  async filterProperties(
    query,
    organizationId
  ) {

    const safeQuery = {

      ...(query || {}),

      organizationId,

      isArchived: false,

    };


    if (
      safeQuery.status !==
      undefined
    ) {

      safeQuery.status =
        this.normalizeStatus(
          safeQuery.status
        );
    }


    if (
      safeQuery.propertyType !==
      undefined
    ) {

      safeQuery.propertyType =
        this.normalizePropertyType(
          safeQuery.propertyType
        );
    }


    return await this.populateProperty(
      Property.find(safeQuery)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     AGENT FILTER PROPERTIES
  ======================================================== */

  async filterMyProperties(
    query,
    organizationId,
    agentId
  ) {

    const safeQuery =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          ...(query || {}),
        }
      );


    if (
      safeQuery.status !==
      undefined
    ) {

      safeQuery.status =
        this.normalizeStatus(
          safeQuery.status
        );
    }


    if (
      safeQuery.propertyType !==
      undefined
    ) {

      safeQuery.propertyType =
        this.normalizePropertyType(
          safeQuery.propertyType
        );
    }


    return await this.populateProperty(
      Property.find(safeQuery)
    )
      .sort({
        createdAt: -1,
      })
      .lean();
  }


  /* ========================================================
     GET PROPERTY DASHBOARD
     
     GENERAL / ADMIN
  ======================================================== */

  async getPropertyDashboard(
    organizationId
  ) {

    const analytics =
      await this.getPropertyAnalytics(
        organizationId
      );


    const [
      featured,
      recent,
    ] = await Promise.all([

      Property.countDocuments({

        organizationId,

        featured: true,

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        createdAt: {

          $gte:
            new Date(

              Date.now() -

              30 *
              24 *
              60 *
              60 *
              1000

            ),

        },

        isArchived: false,

      }),

    ]);


    return {

      ...analytics,

      featured,

      newListings:
        recent,

    };
  }


  /* ========================================================
     AGENT PROPERTY DASHBOARD
     
     Dashboard counts are calculated ONLY from the agent's
     assigned properties.
  ======================================================== */

  async getMyPropertyDashboard(
    organizationId,
    agentId
  ) {

    const baseQuery =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    const [

      total,

      available,

      reserved,

      sold,

      occupied,

      inactive,

      featured,

      recent,

    ] = await Promise.all([

      Property.countDocuments(
        baseQuery
      ),

      Property.countDocuments({

        ...baseQuery,

        status: "available",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "reserved",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "sold",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "occupied",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "inactive",

      }),

      Property.countDocuments({

        ...baseQuery,

        featured: true,

      }),

      Property.countDocuments({

        ...baseQuery,

        createdAt: {

          $gte:
            new Date(

              Date.now() -

              30 *
              24 *
              60 *
              60 *
              1000

            ),

        },

      }),

    ]);


    return {

      total,

      available,

      reserved,

      sold,

      occupied,

      inactive,

      featured,

      newListings:
        recent,

    };
  }


  /* ========================================================
     GET INVENTORY STATUS
     
     GENERAL / ADMIN
  ======================================================== */

  async getInventoryStatus(
    organizationId
  ) {

    const [

      available,

      reserved,

      sold,

      occupied,

      inactive,

      archived,

    ] = await Promise.all([

      Property.countDocuments({

        organizationId,

        status: "available",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "reserved",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "sold",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "occupied",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "inactive",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        isArchived: true,

      }),

    ]);


    return {

      available,

      reserved,

      sold,

      occupied,

      inactive,

      archived,

      totalActive:
        available +
        reserved +
        sold +
        occupied +
        inactive,

    };
  }


  /* ========================================================
     AGENT INVENTORY STATUS
     
     ONLY ASSIGNED PROPERTIES
  ======================================================== */

  async getMyInventoryStatus(
    organizationId,
    agentId
  ) {

    const baseQuery =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    const [

      available,

      reserved,

      sold,

      occupied,

      inactive,

    ] = await Promise.all([

      Property.countDocuments({

        ...baseQuery,

        status: "available",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "reserved",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "sold",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "occupied",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "inactive",

      }),

    ]);


    return {

      available,

      reserved,

      sold,

      occupied,

      inactive,

      totalActive:
        available +
        reserved +
        sold +
        occupied +
        inactive,

    };
  }


  /* ========================================================
     GET PROPERTY RECOMMENDATIONS
     
     GENERAL ORGANIZATION WORKFLOW
  ======================================================== */

  async getRecommendations(
    organizationId,
    options = {}
  ) {

    const {

      limit = 10,

      propertyType,

      location,

      minPrice,

      maxPrice,

      bedrooms,

    } = options;


    const query = {

      organizationId,

      status: "available",

      isArchived: false,

    };


    if (propertyType) {

      query.propertyType =
        this.normalizePropertyType(
          propertyType
        );
    }


    if (location) {

      query.location =
        new RegExp(

          this.escapeRegex(
            location
          ),

          "i"

        );
    }


    if (
      bedrooms !== undefined
    ) {

      const parsedBedrooms =
        Number(bedrooms);


      if (
        Number.isFinite(
          parsedBedrooms
        )
      ) {

        query.bedrooms =
          parsedBedrooms;
      }
    }


    if (

      minPrice !== undefined ||

      maxPrice !== undefined

    ) {

      query.price = {};


      if (
        minPrice !== undefined
      ) {

        query.price.$gte =
          Number(minPrice);
      }


      if (
        maxPrice !== undefined
      ) {

        query.price.$lte =
          Number(maxPrice);
      }
    }


    const safeLimit =
      this.getSafeLimit(
        limit,
        10
      );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        featured: -1,

        recommendedCount: -1,

        aiScore: -1,

        totalViews: -1,

        createdAt: -1,

      })
      .limit(safeLimit)
      .lean();
  }


  /* ========================================================
     AGENT RECOMMENDATIONS
     
     Recommendations are restricted to properties assigned
     to the authenticated agent.
  ======================================================== */

  async getMyRecommendations(
    organizationId,
    agentId,
    options = {}
  ) {

    const {

      limit = 10,

      propertyType,

      location,

      minPrice,

      maxPrice,

      bedrooms,

    } = options;


    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          status: "available",
        }
      );


    if (propertyType) {

      query.propertyType =
        this.normalizePropertyType(
          propertyType
        );
    }


    if (location) {

      query.location =
        new RegExp(

          this.escapeRegex(
            location
          ),

          "i"

        );
    }


    if (
      bedrooms !== undefined
    ) {

      const parsedBedrooms =
        Number(bedrooms);


      if (
        Number.isFinite(
          parsedBedrooms
        )
      ) {

        query.bedrooms =
          parsedBedrooms;
      }
    }


    if (

      minPrice !== undefined ||

      maxPrice !== undefined

    ) {

      query.price = {};


      if (
        minPrice !== undefined
      ) {

        query.price.$gte =
          Number(minPrice);
      }


      if (
        maxPrice !== undefined
      ) {

        query.price.$lte =
          Number(maxPrice);
      }
    }


    const safeLimit =
      this.getSafeLimit(
        limit,
        10
      );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        featured: -1,

        recommendedCount: -1,

        aiScore: -1,

        totalViews: -1,

        createdAt: -1,

      })
      .limit(safeLimit)
      .lean();
  }


  /* ========================================================
     CALCULATE RECOMMENDATION SCORE
  ======================================================== */

  calculateRecommendationScore(
    property,
    lead
  ) {

    let score = 0;


    if (
      !property ||
      !lead
    ) {
      return score;
    }


    if (

      lead.budget !== undefined &&

      lead.budget !== null &&

      property.price !== undefined &&

      Number(property.price) <=
        Number(lead.budget)

    ) {

      score += 30;
    }


    if (

      lead.bedrooms !== undefined &&

      lead.bedrooms !== null &&

      property.bedrooms !== undefined &&

      Number(property.bedrooms) ===
        Number(lead.bedrooms)

    ) {

      score += 25;
    }


    if (

      lead.location &&

      property.location

    ) {

      const leadLocation =
        String(
          lead.location
        ).toLowerCase();


      const propertyLocation =
        String(
          property.location
        ).toLowerCase();


      if (
        propertyLocation.includes(
          leadLocation
        )
      ) {

        score += 35;
      }
    }


    if (

      lead.propertyType &&

      property.propertyType

    ) {

      const normalizedLeadType =
        this.normalizePropertyType(
          lead.propertyType
        );


      if (
        String(
          property.propertyType
        ).toLowerCase() ===
        String(
          normalizedLeadType
        ).toLowerCase()
      ) {

        score += 10;
      }
    }


    if (

      property.featured &&

      !lead.propertyType

    ) {

      score += 10;
    }


    return Math.min(
      score,
      100
    );
  }


  /* ========================================================
     GET LEAD-SPECIFIC RECOMMENDATIONS
     
     GENERAL ORGANIZATION WORKFLOW
  ======================================================== */

  async getLeadRecommendations(
    organizationId,
    lead,
    options = {}
  ) {

    if (!lead) {
      return [];
    }


    const {
      limit = 10,
    } = options;


    const query = {

      organizationId,

      status: "available",

      isArchived: false,

    };


    if (lead.propertyType) {

      query.propertyType =
        this.normalizePropertyType(
          lead.propertyType
        );
    }


    if (

      lead.bedrooms !== undefined &&

      lead.bedrooms !== null

    ) {

      query.bedrooms =
        Number(lead.bedrooms);
    }


    if (lead.location) {

      query.location =
        new RegExp(

          this.escapeRegex(
            lead.location
          ),

          "i"

        );
    }


    if (

      lead.budget !== undefined &&

      lead.budget !== null

    ) {

      query.price = {

        $lte:
          Number(
            lead.budget
          ),

      };
    }


    const properties =
      await this.populateProperty(
        Property.find(query)
      ).lean();


    const scoredProperties =
      properties.map(
        (property) => ({

          ...property,

          recommendationScore:
            this.calculateRecommendationScore(
              property,
              lead
            ),

        })
      );


    scoredProperties.sort(
      (a, b) => {

        if (
          b.recommendationScore !==
          a.recommendationScore
        ) {

          return (
            b.recommendationScore -
            a.recommendationScore
          );
        }


        if (
          Boolean(b.featured) !==
          Boolean(a.featured)
        ) {

          return b.featured
            ? 1
            : -1;
        }


        return (
          new Date(b.createdAt) -
          new Date(a.createdAt)
        );
      }
    );


    return scoredProperties.slice(

      0,

      this.getSafeLimit(
        limit,
        10
      )

    );
  }


  /* ========================================================
     AGENT LEAD-SPECIFIC RECOMMENDATIONS
     
     ONLY properties assigned to this agent are eligible.
  ======================================================== */

  async getMyLeadRecommendations(
    organizationId,
    agentId,
    lead,
    options = {}
  ) {

    if (!lead) {
      return [];
    }


    const {
      limit = 10,
    } = options;


    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          status: "available",
        }
      );


    if (lead.propertyType) {

      query.propertyType =
        this.normalizePropertyType(
          lead.propertyType
        );
    }


    if (

      lead.bedrooms !== undefined &&

      lead.bedrooms !== null

    ) {

      query.bedrooms =
        Number(lead.bedrooms);
    }


    if (lead.location) {

      query.location =
        new RegExp(

          this.escapeRegex(
            lead.location
          ),

          "i"

        );
    }


    if (

      lead.budget !== undefined &&

      lead.budget !== null

    ) {

      query.price = {

        $lte:
          Number(
            lead.budget
          ),

      };
    }


    const properties =
      await this.populateProperty(
        Property.find(query)
      ).lean();


    const scoredProperties =
      properties.map(
        (property) => ({

          ...property,

          recommendationScore:
            this.calculateRecommendationScore(
              property,
              lead
            ),

        })
      );


    scoredProperties.sort(
      (a, b) => {

        if (
          b.recommendationScore !==
          a.recommendationScore
        ) {

          return (
            b.recommendationScore -
            a.recommendationScore
          );
        }


        if (
          Boolean(b.featured) !==
          Boolean(a.featured)
        ) {

          return b.featured
            ? 1
            : -1;
        }


        return (
          new Date(b.createdAt) -
          new Date(a.createdAt)
        );
      }
    );


    return scoredProperties.slice(

      0,

      this.getSafeLimit(
        limit,
        10
      )

    );
  }


  /* ========================================================
     GET PROPERTY MATCHES
     
     GENERAL ORGANIZATION WORKFLOW
  ======================================================== */

  async getPropertyMatches(
    organizationId,
    criteria = {}
  ) {

    const {

      budget,

      minPrice,

      maxPrice,

      location,

      bedrooms,

      propertyType,

      status = "available",

    } = criteria;


    const query = {

      organizationId,

      isArchived: false,

    };


    if (status) {

      query.status =
        this.normalizeStatus(
          status
        );
    }


    if (propertyType) {

      query.propertyType =
        this.normalizePropertyType(
          propertyType
        );
    }


    if (
      bedrooms !== undefined
    ) {

      query.bedrooms =
        Number(bedrooms);
    }


    if (location) {

      query.location =
        new RegExp(

          this.escapeRegex(
            location
          ),

          "i"

        );
    }


    if (
      budget !== undefined
    ) {

      query.price = {

        $lte:
          Number(budget),

      };

    } else if (

      minPrice !== undefined ||

      maxPrice !== undefined

    ) {

      query.price = {};


      if (
        minPrice !== undefined
      ) {

        query.price.$gte =
          Number(minPrice);
      }


      if (
        maxPrice !== undefined
      ) {

        query.price.$lte =
          Number(maxPrice);
      }
    }


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        featured: -1,

        aiScore: -1,

        recommendedCount: -1,

        createdAt: -1,

      })
      .lean();
  }


  /* ========================================================
     AGENT PROPERTY MATCHES
     
     ONLY properties assigned to authenticated agent.
  ======================================================== */

  async getMyPropertyMatches(
    organizationId,
    agentId,
    criteria = {}
  ) {

    const {

      budget,

      minPrice,

      maxPrice,

      location,

      bedrooms,

      propertyType,

      status = "available",

    } = criteria;


    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    if (status) {

      query.status =
        this.normalizeStatus(
          status
        );
    }


    if (propertyType) {

      query.propertyType =
        this.normalizePropertyType(
          propertyType
        );
    }


    if (
      bedrooms !== undefined
    ) {

      query.bedrooms =
        Number(bedrooms);
    }


    if (location) {

      query.location =
        new RegExp(

          this.escapeRegex(
            location
          ),

          "i"

        );
    }


    if (
      budget !== undefined
    ) {

      query.price = {

        $lte:
          Number(budget),

      };

    } else if (

      minPrice !== undefined ||

      maxPrice !== undefined

    ) {

      query.price = {};


      if (
        minPrice !== undefined
      ) {

        query.price.$gte =
          Number(minPrice);
      }


      if (
        maxPrice !== undefined
      ) {

        query.price.$lte =
          Number(maxPrice);
      }
    }


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        featured: -1,

        aiScore: -1,

        recommendedCount: -1,

        createdAt: -1,

      })
      .lean();
  }


  /* ========================================================
     GET ACTIVE PROPERTY COUNT
  ======================================================== */

  async getActivePropertyCount(
    organizationId
  ) {

    return await Property.countDocuments({

      organizationId,

      isArchived: false,

    });
  }


  /* ========================================================
     AGENT ACTIVE PROPERTY COUNT
  ======================================================== */

  async getMyActivePropertyCount(
    organizationId,
    agentId
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    return await Property.countDocuments(
      query
    );
  }


  /* ========================================================
     GET PROPERTY ANALYTICS
     
     GENERAL / ADMIN
  ======================================================== */

  async getPropertyAnalytics(
    organizationId
  ) {

    const [

      total,

      available,

      sold,

      reserved,

      occupied,

      inactive,

      archived,

    ] = await Promise.all([

      Property.countDocuments({

        organizationId,

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "available",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "sold",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "reserved",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "occupied",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        status: "inactive",

        isArchived: false,

      }),

      Property.countDocuments({

        organizationId,

        isArchived: true,

      }),

    ]);


    return {

      total,

      available,

      sold,

      reserved,

      occupied,

      inactive,

      archived,

    };
  }


  /* ========================================================
     AGENT PROPERTY ANALYTICS
  ======================================================== */

  async getMyPropertyAnalytics(
    organizationId,
    agentId
  ) {

    const baseQuery =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    const [

      total,

      available,

      sold,

      reserved,

      occupied,

      inactive,

    ] = await Promise.all([

      Property.countDocuments(
        baseQuery
      ),

      Property.countDocuments({

        ...baseQuery,

        status: "available",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "sold",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "reserved",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "occupied",

      }),

      Property.countDocuments({

        ...baseQuery,

        status: "inactive",

      }),

    ]);


    return {

      total,

      available,

      sold,

      reserved,

      occupied,

      inactive,

    };
  }


  /* ========================================================
     GET PROPERTY STATISTICS
     
     GENERAL / ADMIN
  ======================================================== */

  async getPropertyStatistics(
    organizationId
  ) {

    const analytics =
      await this.getPropertyAnalytics(
        organizationId
      );


    const [

      featured,

      totalViews,

      totalRecommended,

    ] = await Promise.all([

      Property.countDocuments({

        organizationId,

        featured: true,

        isArchived: false,

      }),

      Property.aggregate([

        {

          $match: {

            organizationId,

            isArchived: false,

          },

        },

        {

          $group: {

            _id: null,

            total: {

              $sum: {

                $ifNull: [

                  "$totalViews",

                  0,

                ],

              },

            },

          },

        },

      ]),


      Property.aggregate([

        {

          $match: {

            organizationId,

            isArchived: false,

          },

        },

        {

          $group: {

            _id: null,

            total: {

              $sum: {

                $ifNull: [

                  "$recommendedCount",

                  0,

                ],

              },

            },

          },

        },

      ]),

    ]);


    return {

      ...analytics,

      featured,

      totalViews:
        totalViews[0]?.total || 0,

      totalRecommended:
        totalRecommended[0]?.total || 0,

    };
  }


  /* ========================================================
     AGENT PROPERTY STATISTICS
  ======================================================== */

  async getMyPropertyStatistics(
    organizationId,
    agentId
  ) {

    const analytics =
      await this.getMyPropertyAnalytics(
        organizationId,
        agentId
      );


    const baseQuery =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    const [

      featured,

      totalViews,

      totalRecommended,

    ] = await Promise.all([

      Property.countDocuments({

        ...baseQuery,

        featured: true,

      }),

      Property.aggregate([

        {

          $match:
            baseQuery,

        },

        {

          $group: {

            _id: null,

            total: {

              $sum: {

                $ifNull: [

                  "$totalViews",

                  0,

                ],

              },

            },

          },

        },

      ]),


      Property.aggregate([

        {

          $match:
            baseQuery,

        },

        {

          $group: {

            _id: null,

            total: {

              $sum: {

                $ifNull: [

                  "$recommendedCount",

                  0,

                ],

              },

            },

          },

        },

      ]),

    ]);


    return {

      ...analytics,

      featured,

      totalViews:
        totalViews[0]?.total || 0,

      totalRecommended:
        totalRecommended[0]?.total || 0,

    };
  }


  /* ========================================================
     GET LATEST PROPERTIES
     
     GENERAL / ADMIN
  ======================================================== */

  async getLatestProperties(
    organizationId,
    limit = 5
  ) {

    const safeLimit =
      this.getSafeLimit(
        limit,
        5
      );


    const query =
      Property.find({

        organizationId,

        isArchived: false,

      });


    return await this.populateProperty(
      query
    )
      .sort({

        createdAt: -1,

      })
      .limit(safeLimit)
      .lean();
  }


  /* ========================================================
     AGENT LATEST PROPERTIES
  ======================================================== */

  async getMyLatestProperties(
    organizationId,
    agentId,
    limit = 5
  ) {

    const safeLimit =
      this.getSafeLimit(
        limit,
        5
      );


    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId
      );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        createdAt: -1,

      })
      .limit(safeLimit)
      .lean();
  }


  /* ========================================================
     GET FEATURED PROPERTIES
     
     GENERAL / ADMIN
  ======================================================== */

  async getFeaturedProperties(
    organizationId
  ) {

    const query =
      Property.find({

        organizationId,

        featured: true,

        isArchived: false,

      });


    return await this.populateProperty(
      query
    )
      .sort({

        createdAt: -1,

      })
      .lean();
  }


  /* ========================================================
     AGENT FEATURED PROPERTIES
  ======================================================== */

  async getMyFeaturedProperties(
    organizationId,
    agentId
  ) {

    const query =
      this.buildAgentPropertyQuery(
        organizationId,
        agentId,
        {
          featured: true,
        }
      );


    return await this.populateProperty(
      Property.find(query)
    )
      .sort({

        createdAt: -1,

      })
      .lean();
  }


  /* ========================================================
     RECORD PRICE CHANGE
  ======================================================== */

  async recordPriceChange(
    data
  ) {

    return await PropertyPriceHistory.create(
      data
    );
  }


  /* ========================================================
     GET PROPERTY PRICE HISTORY
  ======================================================== */

  async getPriceHistory(
    propertyId,
    organizationId
  ) {

    return await PropertyPriceHistory.find({

      property:
        propertyId,

      organizationId,

    })
      .sort({

        effectiveDate: -1,

        createdAt: -1,

      })
      .lean();
  }


  /* ========================================================
     GET LATEST PRICE
  ======================================================== */

  async getLatestPrice(
    propertyId,
    organizationId
  ) {

    return await PropertyPriceHistory.findOne({

      property:
        propertyId,

      organizationId,

    })
      .sort({

        effectiveDate: -1,

        createdAt: -1,

      })
      .lean();
  }


  /* ========================================================
     GET PROPERTY IMAGES
     
     GENERAL ORGANIZATION ACCESS
  ======================================================== */

  async getPropertyImages(
    propertyId,
    organizationId
  ) {

    return await PropertyImage.find({

      property:
        propertyId,

      organizationId,

      active: true,

    })
      .sort({

        isCover: -1,

        displayOrder: 1,

        createdAt: 1,

      })
      .lean();
  }


  /* ========================================================
     AGENT PROPERTY IMAGES
     
     IMPORTANT:
     --------------------------------------------------------
     First verifies the property belongs to the authenticated
     agent.
     
     Then returns only images belonging to that property.
  ======================================================== */

  async getMyPropertyImages(
    propertyId,
    organizationId,
    agentId
  ) {

    const property =
      await Property.findOne(

        this.buildAgentPropertyQuery(

          organizationId,

          agentId,

          {
            _id: propertyId,
          }

        )

      )
        .select("_id")
        .lean();


    if (!property) {
      return [];
    }


    return await PropertyImage.find({

      property:
        propertyId,

      organizationId,

      active: true,

    })
      .sort({

        isCover: -1,

        displayOrder: 1,

        createdAt: 1,

      })
      .lean();
  }


  /* ========================================================
     GET PROPERTY WITH IMAGES
  ======================================================== */

  async getPropertyWithImages(
    propertyId,
    organizationId
  ) {

    const property =
      await this.getPropertyById(

        propertyId,

        organizationId

      );


    if (!property) {
      return null;
    }


    const images =
      await this.getPropertyImages(

        propertyId,

        organizationId

      );


    return {

      ...property,

      images,

    };
  }


  /* ========================================================
     AGENT PROPERTY WITH IMAGES
     
     CRITICAL AGENT WORKFLOW METHOD.
     
     Verifies:
     
       organizationId
       assignedAgent
       propertyId
     
     before returning property + images.
  ======================================================== */

  async getMyPropertyWithImages(
    propertyId,
    organizationId,
    agentId
  ) {

    const property =
      await this.getMyPropertyById(

        propertyId,

        organizationId,

        agentId

      );


    if (!property) {
      return null;
    }


    const images =
      await this.getMyPropertyImages(

        propertyId,

        organizationId,

        agentId

      );


    return {

      ...property,

      images,

    };
  }


  /* ========================================================
     GET CANONICAL COVER IMAGE
  ======================================================== */

  async getCoverImage(
    propertyId,
    organizationId
  ) {

    const property =
      await Property.findOne({

        _id: propertyId,

        organizationId,

        isArchived: false,

      })
        .select("coverImage")
        .lean();


    if (
      !property ||
      !property.coverImage
    ) {

      return null;
    }


    return await PropertyImage.findOne({

      _id:
        property.coverImage,

      property:
        propertyId,

      organizationId,

      active: true,

    }).lean();
  }


  /* ========================================================
     AGENT CANONICAL COVER IMAGE
     
     First verifies assignment.
     
     This is important because an agent must not be able to
     request a cover image belonging to another agent's
     property simply by supplying a property ID.
  ======================================================== */

  async getMyCoverImage(
    propertyId,
    organizationId,
    agentId
  ) {

    const property =
      await Property.findOne(

        this.buildAgentPropertyQuery(

          organizationId,

          agentId,

          {
            _id: propertyId,
          }

        )

      )
        .select("coverImage")
        .lean();


    if (
      !property ||
      !property.coverImage
    ) {

      return null;
    }


    return await PropertyImage.findOne({

      _id:
        property.coverImage,

      property:
        propertyId,

      organizationId,

      active: true,

    }).lean();
  }


  /* ========================================================
     VERIFY IMAGE BELONGS TO PROPERTY
  ======================================================== */

  async findPropertyImage(
    imageId,
    propertyId,
    organizationId
  ) {

    return await PropertyImage.findOne({

      _id: imageId,

      property: propertyId,

      organizationId,

    });
  }


  /* ========================================================
     AGENT IMAGE VERIFICATION
     
     Verifies both:
     
       image → property
       property → agent
  ======================================================== */

  async findMyPropertyImage(
    imageId,
    propertyId,
    organizationId,
    agentId
  ) {

    const property =
      await Property.findOne(

        this.buildAgentPropertyQuery(

          organizationId,

          agentId,

          {
            _id: propertyId,
          }

        )

      )
        .select("_id")
        .lean();


    if (!property) {
      return null;
    }


    return await PropertyImage.findOne({

      _id: imageId,

      property: propertyId,

      organizationId,

    });
  }


  /* ========================================================
     ENSURE COVER IMAGE CONSISTENCY
  ======================================================== */

  async ensureCoverImageConsistency(
    propertyId,
    organizationId
  ) {

    const property =
      await Property.findOne({

        _id: propertyId,

        organizationId,

        isArchived: false,

      });


    if (!property) {
      return null;
    }


    if (!property.coverImage) {
      return property;
    }


    const image =
      await PropertyImage.findOne({

        _id:
          property.coverImage,

        property:
          propertyId,

        organizationId,

        active: true,

      });


    if (!image) {

      property.coverImage =
        null;


      await property.save();
    }


    return property;
  }


  /* ========================================================
     AGENT COVER IMAGE CONSISTENCY
     
     Same consistency check, but only for a property assigned
     to the authenticated agent.
  ======================================================== */

  async ensureMyCoverImageConsistency(
    propertyId,
    organizationId,
    agentId
  ) {

    const property =
      await Property.findOne(

        this.buildAgentPropertyQuery(

          organizationId,

          agentId,

          {
            _id: propertyId,
          }

        )

      );


    if (!property) {
      return null;
    }


    if (!property.coverImage) {
      return property;
    }


    const image =
      await PropertyImage.findOne({

        _id:
          property.coverImage,

        property:
          propertyId,

        organizationId,

        active: true,

      });


    if (!image) {

      property.coverImage =
        null;


      await property.save();
    }


    return property;
  }

}


/* ==========================================================
   EXPORT SINGLE SERVICE INSTANCE
========================================================== */

export default new PropertyService();