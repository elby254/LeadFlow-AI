/**
 * ==========================================================
 *
 * Purpose
 * -------
 * Controller layer for property-specific analytics.
 *
 * Routes
 * ------
 * GET /api/property-analytics
 * GET /api/property-analytics/performance
 * GET /api/property-analytics/occupancy
 * GET /api/property-analytics/viewings
 * GET /api/property-analytics/revenue
 *
 * Architecture
 * ------------
 * This controller works alongside:
 *
 *   propertyService.js
 *   viewingService.js
 *
 * It does NOT replace or duplicate:
 *
 *   analyticsController.js
 *
 * The executive analytics controller handles:
 *
 *   /api/analytics/dashboard
 *
 * This controller handles:
 *
 *   /api/property-analytics/*
 *
 * ==========================================================
 */

import Property from "../models/property.js";
import PropertyPriceHistory from "../models/propertyPriceHistory.js";
import Viewing from "../models/viewing.js";
import Lead from "../models/lead.js";
import User from "../models/user.js";

import propertyService from "../services/propertyService.js";

/* ==========================================================
   HELPERS
   ========================================================== */

/**
 * Resolve organization ID from authenticated request.
 *
 * Different middleware layers may expose organizationId
 * directly on req or through req.user.
 */
const getOrganizationId = (req) => {
  return (
    req.organizationId ||
    req.user?.organizationId ||
    null
  );
};


/**
 * Convert a value to a safe number.
 */
const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


/**
 * Safely calculate percentage.
 */
const percentage = (numerator, denominator) => {
  if (!denominator || denominator <= 0) {
    return 0;
  }

  return Number(
    ((numerator / denominator) * 100).toFixed(2)
  );
};


/**
 * Normalize MongoDB ObjectId values to strings
 * when required for grouping.
 */
const idToString = (value) => {
  if (!value) {
    return null;
  }

  return String(value);
};


/* ==========================================================
   GET PROPERTY ANALYTICS
   ========================================================== */

/**
 * GET /api/property-analytics
 *
 * Returns the overall property analytics snapshot.
 *
 * Uses the existing propertyService implementation
 * rather than duplicating its property-count logic.
 */
export const getPropertyAnalytics = async (
  req,
  res
) => {
  try {
    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required.",
      });
    }


    /* --------------------------------------------------------
       Existing property analytics
    -------------------------------------------------------- */

    const analytics =
      await propertyService.getPropertyAnalytics(
        organizationId
      );


    /* --------------------------------------------------------
       Existing property statistics
    -------------------------------------------------------- */

    const statistics =
      await propertyService.getPropertyStatistics(
        organizationId
      );


    /* --------------------------------------------------------
       Response
    -------------------------------------------------------- */

    return res.status(200).json({
      success: true,

      data: {
        ...analytics,

        featured:
          statistics.featured || 0,

        totalViews:
          statistics.totalViews || 0,

        totalRecommended:
          statistics.totalRecommended || 0,
      },
    });

  } catch (error) {
    console.error(
      "❌ GET PROPERTY ANALYTICS ERROR:"
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to load property analytics.",
      error: error.message,
    });
  }
};


/* ==========================================================
   GET PROPERTY PERFORMANCE
   ========================================================== */

/**
 * GET /api/property-analytics/performance
 *
 * Returns property performance rankings.
 *
 * Performance indicators:
 *
 *   • total views
 *   • AI recommendations
 *   • completed viewings
 *   • viewing requests
 *   • current status
 *   • assigned agent
 *
 * Properties are organization-scoped.
 */
export const getPropertyPerformance = async (
  req,
  res
) => {
  try {
    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required.",
      });
    }


    /* --------------------------------------------------------
       Load active properties
    -------------------------------------------------------- */

    const properties =
      await Property.find({
        organizationId,
        isArchived: false,
      })
        .select(
          [
            "_id",
            "title",
            "price",
            "status",
            "availability",
            "assignedAgent",
            "totalViews",
            "recommendedCount",
            "viewingStats",
            "createdAt",
          ].join(" ")
        )
        .populate(
          "assignedAgent",
          "name email"
        )
        .lean();


    /* --------------------------------------------------------
       Load viewing totals grouped by property
    -------------------------------------------------------- */

    const viewingStats =
      await Viewing.aggregate([
        {
          $match: {
            organizationId,
          },
        },

        {
          $group: {
            _id: "$property",

            totalViewings: {
              $sum: 1,
            },

            completedViewings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Completed",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledViewings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            rejectedViewings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Rejected",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            noShowViewings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "No Show",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);


    /* --------------------------------------------------------
       Convert viewing aggregation to lookup map
    -------------------------------------------------------- */

    const viewingMap =
      new Map();

    viewingStats.forEach(
      (item) => {
        viewingMap.set(
          idToString(item._id),
          item
        );
      }
    );


    /* --------------------------------------------------------
       Build performance response
    -------------------------------------------------------- */

    const performance =
      properties.map(
        (property) => {
          const stats =
            viewingMap.get(
              idToString(
                property._id
              )
            ) || {};


          const totalViewings =
            toNumber(
              stats.totalViewings
            );

          const completedViewings =
            toNumber(
              stats.completedViewings
            );


          return {
            _id:
              property._id,

            title:
              property.title,

            price:
              toNumber(
                property.price
              ),

            status:
              property.status,

            availability:
              property.availability,

            assignedAgent:
              property.assignedAgent || null,

            totalViews:
              toNumber(
                property.totalViews
              ),

            recommendedCount:
              toNumber(
                property.recommendedCount
              ),

            totalViewings,

            completedViewings,

            cancelledViewings:
              toNumber(
                stats.cancelledViewings
              ),

            rejectedViewings:
              toNumber(
                stats.rejectedViewings
              ),

            noShowViewings:
              toNumber(
                stats.noShowViewings
              ),

            viewingConversionRate:
              percentage(
                completedViewings,
                totalViewings
              ),

            createdAt:
              property.createdAt,
          };
        }
      );


    /* --------------------------------------------------------
       Sort by overall engagement
       --------------------------------------------------------
       We use a neutral calculated engagement value for
       ordering the returned performance list.
    -------------------------------------------------------- */

    performance.sort(
      (a, b) => {
        const scoreA =
          a.totalViews +
          a.recommendedCount +
          a.completedViewings;

        const scoreB =
          b.totalViews +
          b.recommendedCount +
          b.completedViewings;

        return scoreB - scoreA;
      }
    );


    return res.status(200).json({
      success: true,

      count:
        performance.length,

      data:
        performance,
    });

  } catch (error) {
    console.error(
      "❌ GET PROPERTY PERFORMANCE ERROR:"
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to load property performance.",
      error: error.message,
    });
  }
};


/* ==========================================================
   GET PROPERTY OCCUPANCY
   ========================================================== */

/**
 * GET /api/property-analytics/occupancy
 *
 * Returns property inventory and occupancy information.
 *
 * Property statuses currently used by the property service:
 *
 *   available
 *   reserved
 *   sold
 *   occupied
 *   inactive
 *
 * Archived properties are tracked separately.
 */
export const getPropertyOccupancy = async (
  req,
  res
) => {
  try {
    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required.",
      });
    }


    /* --------------------------------------------------------
       Active inventory
    -------------------------------------------------------- */

    const activeProperties =
      await Property.find({
        organizationId,
        isArchived: false,
      })
        .select(
          "_id title status availability price"
        )
        .lean();


    /* --------------------------------------------------------
       Count status distribution
    -------------------------------------------------------- */

    const statusCounts = {
      available: 0,
      reserved: 0,
      sold: 0,
      occupied: 0,
      inactive: 0,
    };


    activeProperties.forEach(
      (property) => {
        const status =
          String(
            property.status || ""
          ).toLowerCase();


        if (
          Object.prototype.hasOwnProperty.call(
            statusCounts,
            status
          )
        ) {
          statusCounts[status] += 1;
        }
      }
    );


    const totalActive =
      activeProperties.length;


    /* --------------------------------------------------------
       Occupancy calculation
       --------------------------------------------------------
       Occupied properties are counted as occupied inventory.
       Sold properties are kept separate from occupancy.
    -------------------------------------------------------- */

    const occupied =
      statusCounts.occupied;

    const occupancyRate =
      percentage(
        occupied,
        totalActive
      );


    /* --------------------------------------------------------
       Reserved rate
    -------------------------------------------------------- */

    const reservedRate =
      percentage(
        statusCounts.reserved,
        totalActive
      );


    /* --------------------------------------------------------
       Available rate
    -------------------------------------------------------- */

    const availableRate =
      percentage(
        statusCounts.available,
        totalActive
      );


    /* --------------------------------------------------------
       Sold rate
    -------------------------------------------------------- */

    const soldRate =
      percentage(
        statusCounts.sold,
        totalActive
      );


    return res.status(200).json({
      success: true,

      data: {
        totalActive,

        available:
          statusCounts.available,

        reserved:
          statusCounts.reserved,

        occupied:
          statusCounts.occupied,

        sold:
          statusCounts.sold,

        inactive:
          statusCounts.inactive,

        occupancyRate,

        reservedRate,

        availableRate,

        soldRate,

        properties:
          activeProperties,
      },
    });

  } catch (error) {
    console.error(
      "❌ GET PROPERTY OCCUPANCY ERROR:"
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to load property occupancy.",
      error: error.message,
    });
  }
};


/* ==========================================================
   GET PROPERTY VIEWING ANALYTICS
   ========================================================== */

/**
 * GET /api/property-analytics/viewings
 *
 * Returns analytics for property viewing activity.
 *
 * Uses the actual Viewing status values defined by the
 * LeadFlow AI Viewing model.
 */
export const getPropertyViewingAnalytics = async (
  req,
  res
) => {
  try {
    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required.",
      });
    }


    /* --------------------------------------------------------
       Overall viewing status distribution
    -------------------------------------------------------- */

    const statusAggregation =
      await Viewing.aggregate([
        {
          $match: {
            organizationId,
          },
        },

        {
          $group: {
            _id: "$status",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);


    /* --------------------------------------------------------
       Normalize status response
    -------------------------------------------------------- */

    const statusCounts = {
      requested: 0,
      pendingApproval: 0,
      approved: 0,
      rejected: 0,
      rescheduled: 0,
      cancelled: 0,
      completed: 0,
      noShow: 0,
    };


    statusAggregation.forEach(
      (item) => {
        switch (item._id) {
          case "Requested":
            statusCounts.requested =
              item.count;
            break;

          case "Pending Approval":
            statusCounts.pendingApproval =
              item.count;
            break;

          case "Approved":
            statusCounts.approved =
              item.count;
            break;

          case "Rejected":
            statusCounts.rejected =
              item.count;
            break;

          case "Rescheduled":
            statusCounts.rescheduled =
              item.count;
            break;

          case "Cancelled":
            statusCounts.cancelled =
              item.count;
            break;

          case "Completed":
            statusCounts.completed =
              item.count;
            break;

          case "No Show":
            statusCounts.noShow =
              item.count;
            break;

          default:
            break;
        }
      }
    );


    /* --------------------------------------------------------
       Total viewings
    -------------------------------------------------------- */

    const totalViewings =
      Object.values(
        statusCounts
      ).reduce(
        (total, count) =>
          total + count,
        0
      );


    /* --------------------------------------------------------
       Completion rate
    -------------------------------------------------------- */

    const completionRate =
      percentage(
        statusCounts.completed,
        totalViewings
      );


    /* --------------------------------------------------------
       Cancellation rate
    -------------------------------------------------------- */

    const cancellationRate =
      percentage(
        statusCounts.cancelled,
        totalViewings
      );


    /* --------------------------------------------------------
       No-show rate
    -------------------------------------------------------- */

    const noShowRate =
      percentage(
        statusCounts.noShow,
        totalViewings
      );


    /* --------------------------------------------------------
       Property-level viewing analytics
    -------------------------------------------------------- */

    const propertyViewings =
      await Viewing.aggregate([
        {
          $match: {
            organizationId,
          },
        },

        {
          $group: {
            _id: "$property",

            totalViewings: {
              $sum: 1,
            },

            completedViewings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Completed",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledViewings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "Cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            noShowViewings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "No Show",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            totalViewings: -1,
          },
        },

        {
          $limit: 50,
        },

        {
          $lookup: {
            from: "properties",

            localField: "_id",

            foreignField: "_id",

            as: "property",
          },
        },

        {
          $unwind: {
            path: "$property",

            preserveNullAndEmptyArrays:
              true,
          },
        },

        {
          $project: {
            _id: 1,

            totalViewings: 1,

            completedViewings: 1,

            cancelledViewings: 1,

            noShowViewings: 1,

            property: {
              _id:
                "$property._id",

              title:
                "$property.title",

              status:
                "$property.status",

              price:
                "$property.price",
            },
          },
        },
      ]);


    return res.status(200).json({
      success: true,

      data: {
        totalViewings,

        statusCounts,

        completionRate,

        cancellationRate,

        noShowRate,

        properties:
          propertyViewings,
      },
    });

  } catch (error) {
    console.error(
      "❌ GET PROPERTY VIEWING ANALYTICS ERROR:"
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to load property viewing analytics.",
      error: error.message,
    });
  }
};


/* ==========================================================
   GET PROPERTY REVENUE ANALYTICS
   ========================================================== */

/**
 * GET /api/property-analytics/revenue
 *
 * Provides property revenue/value analytics.
 *
 * IMPORTANT
 * ----------
 * This implementation does NOT invent rental-income fields.
 *
 * Revenue/value calculations are based on actual property
 * price data and recorded price history.
 *
 * Sold properties are treated as realized property value
 * based on their current recorded price.
 */
export const getPropertyRevenueAnalytics = async (
  req,
  res
) => {
  try {
    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required.",
      });
    }


    /* --------------------------------------------------------
       Active properties
    -------------------------------------------------------- */

    const properties =
      await Property.find({
        organizationId,
        isArchived: false,
      })
        .select(
          [
            "_id",
            "title",
            "price",
            "status",
            "availability",
            "assignedAgent",
            "createdAt",
          ].join(" ")
        )
        .populate(
          "assignedAgent",
          "name email"
        )
        .lean();


    /* --------------------------------------------------------
       Basic portfolio values
    -------------------------------------------------------- */

    let totalPortfolioValue = 0;

    let totalAvailableValue = 0;

    let totalReservedValue = 0;

    let totalOccupiedValue = 0;

    let totalSoldValue = 0;


    properties.forEach(
      (property) => {
        const price =
          toNumber(
            property.price
          );


        totalPortfolioValue +=
          price;


        const status =
          String(
            property.status || ""
          ).toLowerCase();


        switch (status) {
          case "available":
            totalAvailableValue +=
              price;
            break;

          case "reserved":
            totalReservedValue +=
              price;
            break;

          case "occupied":
            totalOccupiedValue +=
              price;
            break;

          case "sold":
            totalSoldValue +=
              price;
            break;

          default:
            break;
        }
      }
    );


    /* --------------------------------------------------------
       Price history
    -------------------------------------------------------- */

    const priceHistory =
      await PropertyPriceHistory.find({
        organizationId,
      })
        .select(
          [
            "property",
            "oldPrice",
            "newPrice",
            "price",
            "effectiveDate",
            "createdAt",
          ].join(" ")
        )
        .sort({
          effectiveDate: -1,
          createdAt: -1,
        })
        .lean();


    /* --------------------------------------------------------
       Price history summary
    -------------------------------------------------------- */

    let totalPriceIncrease = 0;

    let totalPriceDecrease = 0;

    let priceChanges = 0;


    priceHistory.forEach(
      (entry) => {
        const oldPrice =
          toNumber(
            entry.oldPrice
          );

        const newPrice =
          toNumber(
            entry.newPrice ??
              entry.price
          );


        if (
          oldPrice > 0 &&
          newPrice > 0
        ) {
          const difference =
            newPrice - oldPrice;


          if (difference > 0) {
            totalPriceIncrease +=
              difference;
          }

          if (difference < 0) {
            totalPriceDecrease +=
              Math.abs(
                difference
              );
          }


          priceChanges += 1;
        }
      }
    );


    /* --------------------------------------------------------
       Revenue summary
    -------------------------------------------------------- */

    const soldProperties =
      properties.filter(
        (property) =>
          String(
            property.status || ""
          ).toLowerCase() ===
          "sold"
      );


    const averageSoldValue =
      soldProperties.length > 0
        ? Number(
            (
              totalSoldValue /
              soldProperties.length
            ).toFixed(2)
          )
        : 0;


    /* --------------------------------------------------------
       Property revenue/value records
    -------------------------------------------------------- */

    const sold =
      soldProperties.map(
        (property) => ({
          _id:
            property._id,

          title:
            property.title,

          price:
            toNumber(
              property.price
            ),

          assignedAgent:
            property.assignedAgent ||
            null,

          createdAt:
            property.createdAt,
        })
      );


    return res.status(200).json({
      success: true,

      data: {
        totalPortfolioValue,

        totalAvailableValue,

        totalReservedValue,

        totalOccupiedValue,

        totalSoldValue,

        soldProperties:
          soldProperties.length,

        averageSoldValue,

        priceChanges,

        totalPriceIncrease,

        totalPriceDecrease,

        sold,
      },
    });

  } catch (error) {
    console.error(
      "❌ GET PROPERTY REVENUE ANALYTICS ERROR:"
    );

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to load property revenue analytics.",
      error: error.message,
    });
  }
};


/* ==========================================================
   DEFAULT EXPORT
   ========================================================== */

export default {
  getPropertyAnalytics,
  getPropertyPerformance,
  getPropertyOccupancy,
  getPropertyViewingAnalytics,
  getPropertyRevenueAnalytics,
};