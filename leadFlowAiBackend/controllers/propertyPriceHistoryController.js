/**
 * ==========================================================
 * 
 * ----------------------------------------------------------
 * Handles Property Price History.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • View property price history
 * • Latest price change
 * • Price statistics
 *
 * Price history creation is handled automatically
 * by propertyController.js
 *
 * ==========================================================
 */

import Property from "../models/property.js";
import PropertyPriceHistory from "../models/propertyPriceHistory.js";

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
 * GET PROPERTY PRICE HISTORY
 *
 * GET /api/properties/:propertyId/price-history
 * ==========================================================
 */

export const getPropertyPriceHistory = async (req, res) => {

  try {

    /*
    ==========================================================
    VERIFY PROPERTY
    ==========================================================
    */

    const property = await Property.findOne({

      _id: req.params.propertyId,

      ...buildOrganizationQuery(req),

    });

    if (!property) {

      return res.status(404).json({

        success: false,

        message: "Property not found.",

      });

    }

    /*
    ==========================================================
    FETCH HISTORY
    ==========================================================
    */

    const history = await PropertyPriceHistory.find({

      property: property._id,

    })

      .populate(

        "changedBy",

        "name email"

      )

      .sort({

        effectiveDate: -1,

      })

      .lean();

    return res.status(200).json({

      success: true,

      count: history.length,

      data: history,

    });

  }

  catch (error) {

    console.error("GET PROPERTY PRICE HISTORY ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * GET LATEST PRICE CHANGE
 *
 * GET /api/properties/:propertyId/latest-price-change
 * ==========================================================
 */

export const getLatestPriceChange = async (req, res) => {

  try {

    const latest = await PropertyPriceHistory

      .findOne({

        property: req.params.propertyId,

        ...buildOrganizationQuery(req),

      })

      .populate(

        "changedBy",

        "name"

      )

      .sort({

        effectiveDate: -1,

      })

      .lean();

    if (!latest) {

      return res.status(404).json({

        success: false,

        message: "No price history found.",

      });

    }

    return res.status(200).json({

      success: true,

      data: latest,

    });

  }

  catch (error) {

    console.error("LATEST PRICE HISTORY ERROR");

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * GET PRICE STATISTICS
 *
 * GET /api/properties/:propertyId/price-statistics
 * ==========================================================
 */

export const getPriceStatistics = async (req, res) => {

  try {

    /*
    ==========================================================
    VERIFY PROPERTY
    ==========================================================
    */

    const property = await Property.findOne({

      _id: req.params.propertyId,

      ...buildOrganizationQuery(req),

    });

    if (!property) {

      return res.status(404).json({

        success: false,

        message: "Property not found.",

      });

    }

    /*
    ==========================================================
    FETCH HISTORY
    ==========================================================
    */

    const history = await PropertyPriceHistory.find({

      property: property._id,

    }).sort({

      effectiveDate: 1,

    });

    if (!history.length) {

      return res.status(200).json({

        success: true,

        data: {

          totalChanges: 0,

          currentPrice: property.price,

          highestPrice: property.price,

          lowestPrice: property.price,

          totalIncrease: 0,

          totalDecrease: 0,

        },

      });

    }

    /*
    ==========================================================
    CALCULATE STATISTICS
    ==========================================================
    */

    const prices = history.map(item => item.newPrice);

    const increases = history.filter(

      item => item.changeType === "increase"

    );

    const decreases = history.filter(

      item => item.changeType === "decrease"

    );

    return res.status(200).json({

      success: true,

      data: {

        totalChanges: history.length,

        currentPrice: property.price,

        highestPrice: Math.max(...prices),

        lowestPrice: Math.min(...prices),

        totalIncrease: increases.length,

        totalDecrease: decreases.length,

        firstRecordedPrice: history[0].newPrice,

        latestChange:

          history[history.length - 1],

      },

    });

  }

  catch (error) {

    console.error(

      "PROPERTY PRICE STATISTICS ERROR"

    );

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/**
 * ==========================================================
 * DELETE PRICE HISTORY RECORD
 *
 * DELETE /api/property-price-history/:historyId
 *
 * NOTE
 * ----------------------------------------------------------
 * Administrative cleanup only.
 * Normal property updates automatically
 * generate price history.
 * ==========================================================
 */

export const deletePriceHistoryRecord = async (req, res) => {

  try {

    const history = await PropertyPriceHistory.findOne({

      _id: req.params.historyId,

      ...buildOrganizationQuery(req),

    });

    if (!history) {

      return res.status(404).json({

        success: false,

        message: "Price history record not found.",

      });

    }

    await history.deleteOne();

    return res.status(200).json({

      success: true,

      message:

        "Price history record deleted successfully.",

    });

  }

  catch (error) {

    console.error(

      "DELETE PRICE HISTORY ERROR"

    );

    console.error(error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};