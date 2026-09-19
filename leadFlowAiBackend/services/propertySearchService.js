/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Search Operations.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Keyword Search
 * • Location Search
 * • Price Search
 * • Feature Search
 * • Pagination
 * • Sorting
 *
 * Used By
 * ----------------------------------------------------------
 * • Property Search Controller
 * • AI Recommendation Engine
 * • Viewer Portal
 *
 * ==========================================================
 */

import Property from "../models/property.js";

class PropertySearchService {

  /*
  ==========================================================
  KEYWORD SEARCH
  ==========================================================
  */

  async keywordSearch({
    organizationId,
    keyword,
    page = 1,
    limit = 20,
  }) {

    const skip = (page - 1) * limit;

    const query = {

      organizationId,

      isArchived: false,

      $text: {
        $search: keyword,
      },

    };

    const [properties, total] = await Promise.all([

      Property.find(query)

        .sort({
          score: {
            $meta: "textScore",
          },
        })

        .skip(skip)

        .limit(limit)

        .lean(),

      Property.countDocuments(query),

    ]);

    return {

      properties,

      pagination: {

        total,

        page,

        pages: Math.ceil(total / limit),

        limit,

      },

    };

  }

  /*
  ==========================================================
  LOCATION SEARCH
  ==========================================================
  */

  async searchByLocation({

    organizationId,

    location,

    page = 1,

    limit = 20,

  }) {

    const skip = (page - 1) * limit;

    const query = {

      organizationId,

      isArchived: false,

      location: new RegExp(location, "i"),

    };

    const [properties, total] = await Promise.all([

      Property.find(query)

        .skip(skip)

        .limit(limit)

        .sort({

          createdAt: -1,

        })

        .lean(),

      Property.countDocuments(query),

    ]);

    return {

      properties,

      pagination: {

        total,

        page,

        pages: Math.ceil(total / limit),

        limit,

      },

    };

  }

  /*
  ==========================================================
  PROPERTY TYPE SEARCH
  ==========================================================
  */

  async searchByType({

    organizationId,

    propertyType,

    page = 1,

    limit = 20,

  }) {

    const skip = (page - 1) * limit;

    const query = {

      organizationId,

      propertyType,

      isArchived: false,

    };

    const [properties, total] = await Promise.all([

      Property.find(query)

        .skip(skip)

        .limit(limit)

        .sort({

          createdAt: -1,

        })

        .lean(),

      Property.countDocuments(query),

    ]);

    return {

      properties,

      pagination: {

        total,

        page,

        pages: Math.ceil(total / limit),

        limit,

      },

    };

  }

  /*
  ==========================================================
  PRICE RANGE SEARCH
  ==========================================================
  */

  async searchByPrice({

    organizationId,

    minPrice = 0,

    maxPrice = Number.MAX_SAFE_INTEGER,

    page = 1,

    limit = 20,

  }) {

    const skip = (page - 1) * limit;

    const query = {

      organizationId,

      isArchived: false,

      price: {

        $gte: minPrice,

        $lte: maxPrice,

      },

    };

    const [properties, total] = await Promise.all([

      Property.find(query)

        .sort({

          price: 1,

        })

        .skip(skip)

        .limit(limit)

        .lean(),

      Property.countDocuments(query),

    ]);

    return {

      properties,

      pagination: {

        total,

        page,

        pages: Math.ceil(total / limit),

        limit,

      },

    };

  }

  /*
  ==========================================================
  BEDROOM SEARCH
  ==========================================================
  */

  async searchByBedrooms({

    organizationId,

    bedrooms,

    page = 1,

    limit = 20,

  }) {

    const skip = (page - 1) * limit;

    const query = {

      organizationId,

      bedrooms,

      isArchived: false,

    };

    const [properties, total] = await Promise.all([

      Property.find(query)

        .sort({

          createdAt: -1,

        })

        .skip(skip)

        .limit(limit)

        .lean(),

      Property.countDocuments(query),

    ]);

    return {

      properties,

      pagination: {

        total,

        page,

        pages: Math.ceil(total / limit),

        limit,

      },

    };

  }

  /*
  ==========================================================
  ADVANCED FILTERS
  ==========================================================
  */

  async advancedSearch(filters) {

    const {

      organizationId,

      propertyType,

      location,

      bedrooms,

      bathrooms,

      furnished,

      status,

      featured,

      minPrice,

      maxPrice,

      page = 1,

      limit = 20,

    } = filters;

    const skip = (page - 1) * limit;

    const query = {

      organizationId,

      isArchived: false,

    };

    if (propertyType)
      query.propertyType = propertyType;

    if (location)
      query.location = new RegExp(location, "i");

    if (bedrooms !== undefined)
      query.bedrooms = bedrooms;

    if (bathrooms !== undefined)
      query.bathrooms = bathrooms;

    if (status)
      query.status = status;

    if (featured !== undefined)
      query.featured = featured;

    if (furnished !== undefined)
      query.furnished = furnished;

    if (minPrice || maxPrice) {

      query.price = {};

      if (minPrice)
        query.price.$gte = minPrice;

      if (maxPrice)
        query.price.$lte = maxPrice;

    }

    const [properties, total] = await Promise.all([

      Property.find(query)

        .sort({

          featured: -1,

          createdAt: -1,

        })

        .skip(skip)

        .limit(limit)

        .lean(),

      Property.countDocuments(query),

    ]);

    return {

      properties,

      pagination: {

        total,

        page,

        pages: Math.ceil(total / limit),

        limit,

      },

    };

  }

  /*
  ==========================================================
  SORT RESULTS
  ==========================================================
  */

  sortResults(properties, sortBy) {

    switch (sortBy) {

      case "priceLow":

        return properties.sort(
          (a, b) => a.price - b.price
        );

      case "priceHigh":

        return properties.sort(
          (a, b) => b.price - a.price
        );

      case "latest":

        return properties.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );

      case "oldest":

        return properties.sort(
          (a, b) =>
            new Date(a.createdAt) -
            new Date(b.createdAt)
        );

      case "mostViewed":

        return properties.sort(
          (a, b) =>
            b.totalViews - a.totalViews
        );

      default:

        return properties;

    }

  }

  /*
  ==========================================================
  FEATURED SEARCH
  ==========================================================
  */

  async getFeaturedSearchResults(organizationId) {

    return await Property.find({

      organizationId,

      featured: true,

      isArchived: false,

      status: "available",

    })

      .sort({

        aiScore: -1,

        createdAt: -1,

      })

      .lean();

  }

  /*
  ==========================================================
  SIMILAR PROPERTIES
  ==========================================================
  */

  async getSimilarProperties(property, limit = 10) {

    return await Property.find({

      organizationId: property.organizationId,

      propertyType: property.propertyType,

      status: "available",

      isArchived: false,

      _id: {
        $ne: property._id,
      },

    })

      .sort({

        aiScore: -1,

        totalViews: -1,

      })

      .limit(limit)

      .lean();

  }

  /*
  ==========================================================
  NEARBY PROPERTIES
  ==========================================================
  */

  async getNearbyProperties({

    organizationId,

    location,

    limit = 20,

  }) {

    return await Property.find({

      organizationId,

      location: new RegExp(location, "i"),

      status: "available",

      isArchived: false,

    })

      .limit(limit)

      .sort({

        featured: -1,

        aiScore: -1,

      })

      .lean();

  }

  /*
  ==========================================================
  RECENT SEARCHES

  Placeholder until Search History module is added.
  ==========================================================
  */

  async getRecentSearches() {

    return [];

  }

  /*
  ==========================================================
  POPULAR SEARCHES

  Placeholder until Search Analytics module is added.
  ==========================================================
  */

  async getPopularSearches() {

    return [

      "Apartment",

      "Maisonette",

      "Nairobi",

      "Kiambu",

      "Rental",

      "Commercial",

    ];

  }

  /*
  ==========================================================
  AI SEARCH SUGGESTIONS
  ==========================================================
  */

  async getSearchSuggestions({

    organizationId,

    keyword,

    limit = 8,

  }) {

    return await Property.find({

      organizationId,

      isArchived: false,

      $text: {

        $search: keyword,

      },

    })

      .select(

        "title location propertyType price"

      )

      .limit(limit)

      .lean();

  }

}

/*
==========================================================
EXPORT SERVICE
==========================================================
*/

export default new PropertySearchService();