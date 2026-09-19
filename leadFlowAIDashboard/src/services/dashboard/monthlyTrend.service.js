/**
  * Generates monthly lead creation trends.
 *
 * Used by:
 * AdminDashboardController
 * DashboardCharts.jsx
 *
 * Uses:
 * Lead.createdAt
 *
 * Returns the last 12 months of lead creation data.
 *
 * Organization-aware.
 * ============================================================
 */

import Lead from "../../models/lead.js";

/**
 * Returns monthly lead creation trend
 */
export const getMonthlyTrend = async (organizationId) => {
  /**
   * ---------------------------------------
   * Last 12 months
   * ---------------------------------------
   */

  const today = new Date();

  const startDate = new Date(
    today.getFullYear(),
    today.getMonth() - 11,
    1
  );

  /**
   * ---------------------------------------
   * Aggregate by Year + Month
   * ---------------------------------------
   */

  const results = await Lead.aggregate([
    {
      $match: {
        organizationId,
        createdAt: {
          $gte: startDate,
        },
      },
    },

    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },

          month: {
            $month: "$createdAt",
          },
        },

        leads: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  /**
   * ---------------------------------------
   * Convert aggregation to lookup map
   * ---------------------------------------
   */

  const lookup = {};

  results.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`;

    lookup[key] = item.leads;
  });

  /**
   * ---------------------------------------
   * Month Labels
   * ---------------------------------------
   */

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  /**
   * ---------------------------------------
   * Build final chart
   * ---------------------------------------
   */

  const trend = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );

    const year = date.getFullYear();

    const month = date.getMonth() + 1;

    const key = `${year}-${month}`;

    trend.push({
      month: `${monthNames[month - 1]} ${String(year).slice(-2)}`,
      leads: lookup[key] || 0,
    });
  }

  return trend;
};