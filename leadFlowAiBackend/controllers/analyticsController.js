/**
 * ==========================================================
 * LEADFLOW AI
 * ANALYTICS CONTROLLER
 * ==========================================================
 *
 * Purpose
 * -------
 * Provides executive/platform analytics for the Admin
 * Analytics dashboard.
 *
 * Endpoint
 * --------
 *
 * GET /api/analytics/dashboard
 *
 * Response
 * --------
 *
 * {
 *   success: true,
 *   data: {
 *     summary: {
 *       totalProperties,
 *       totalLeads,
 *       conversionRate,
 *       monthlyGrowth
 *     },
 *     monthlyData: [],
 *     topAgents: []
 *   }
 * }
 *
 * IMPORTANT
 * ---------
 * This controller intentionally contains ONLY the
 * dashboard analytics required by AdminAnalytics.jsx.
 *
 * It does NOT duplicate the existing:
 *
 *   propertyAnalyticsController
 *   propertyService analytics
 *   lead analytics
 *   conversation analytics
 *   agent analytics
 *
 * ==========================================================
 */

import Property from "../models/property.js";
import Lead from "../models/lead.js";
import User from "../models/user.js";

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Resolve organization from authenticated request.
 *
 * Authentication middleware is expected to populate
 * req.organizationId and/or req.user.organizationId.
 */
const getOrganizationId = (req) => {
  return (
    req.organizationId ||
    req.user?.organizationId ||
    null
  );
};

/**
 * Normalize a value to a lowercase string.
 */
const normalize = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

/**
 * Determine whether a lead is converted.
 *
 * Current Lead workflow supports:
 *
 *   new
 *   qualified
 *   hot
 *   follow_up
 *   viewing_requested
 *   viewing_scheduled
 *   negotiation
 *   won
 *   lost
 *   closed
 *
 * The completed/conversion states are treated as:
 *
 *   won
 *   closed
 */
const isConvertedLead = (lead) => {
  const status = normalize(lead?.status);

  return (
    status === "won" ||
    status === "closed"
  );
};

/**
 * Format a month bucket.
 *
 * Example:
 *
 *   "Jan 2026"
 */
const formatMonth = (date) => {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

/**
 * Create the previous six monthly buckets.
 *
 * The oldest month is first.
 *
 * Example:
 *
 * [
 *   {
 *     key: "2026-04",
 *     month: "Apr 2026"
 *   },
 *   ...
 * ]
 */
const createMonthlyBuckets = () => {
  const buckets = [];

  const now = new Date();

  /*
   * Start six months ago.
   */
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - index,
      1
    );

    const year = date.getFullYear();

    const monthNumber = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    buckets.push({
      key: `${year}-${monthNumber}`,
      month: formatMonth(date),
      properties: 0,
      leads: 0,
      sales: 0,
    });
  }

  return buckets;
};

/**
 * Get YYYY-MM key from a date.
 */
const getMonthKey = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const monthNumber = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${monthNumber}`;
};

/* ==========================================================
   GET DASHBOARD ANALYTICS
========================================================== */

/**
 * ==========================================================
 *
 * GET /api/analytics/dashboard
 *
 * Admin executive analytics.
 *
 * ==========================================================
 */

export const getDashboardAnalytics = async (
  req,
  res
) => {
  try {
    console.log(
      "=================================================="
    );

    console.log(
      "📊 GET /api/analytics/dashboard"
    );

    console.log(
      "=================================================="
    );

    /* ------------------------------------------------------
       AUTHENTICATED USER
    ------------------------------------------------------ */

    const userId =
      req.user?._id ||
      req.user?.id ||
      null;

    const role =
      normalize(req.user?.role);

    const organizationId =
      getOrganizationId(req);

    console.log(
      "📊 Analytics authenticated context:",
      {
        userId: userId
          ? String(userId)
          : null,

        role,

        organizationId:
          organizationId
            ? String(organizationId)
            : null,
      }
    );

    /* ------------------------------------------------------
       ORGANIZATION VALIDATION
    ------------------------------------------------------ */

    if (!organizationId) {
      console.error(
        "❌ Analytics: organizationId is missing."
      );

      return res.status(403).json({
        success: false,
        message:
          "Organization not assigned.",
      });
    }

    /* ------------------------------------------------------
       ROLE VALIDATION
       ------------------------------------------------------

       The route already protects this endpoint.

       This second check is intentionally defensive.
    ------------------------------------------------------ */

    if (role !== "admin") {
      console.error(
        "❌ Analytics: unauthorized role:",
        role
      );

      return res.status(403).json({
        success: false,
        message:
          "Only administrators can access dashboard analytics.",
      });
    }

    /* ======================================================
       BASE QUERIES
    ====================================================== */

    /*
     * Properties are ALWAYS scoped to the authenticated
     * organization.
     *
     * Archived properties are excluded from the platform
     * property total.
     */
    const propertyQuery = {
      organizationId,
      isArchived: false,
    };

    /*
     * Leads are ALWAYS scoped to the authenticated
     * organization.
     */
    const leadQuery = {
      organizationId,
    };

    /*
     * Agents are ALWAYS scoped to the authenticated
     * organization.
     */
    const agentQuery = {
      organizationId,
      role: "agent",
    };

    /* ======================================================
       FETCH DATA
    ====================================================== */

    const [
      properties,
      leads,
      agents,
    ] = await Promise.all([
      Property.find(propertyQuery)
        .select(
          "_id status availability createdAt"
        )
        .lean(),

      Lead.find(leadQuery)
        .select(
          "_id status assignedTo createdAt"
        )
        .lean(),

      User.find(agentQuery)
        .select(
          "_id name email role"
        )
        .lean(),
    ]);

    console.log(
      "📊 Analytics records:",
      {
        properties:
          properties.length,

        leads:
          leads.length,

        agents:
          agents.length,
      }
    );

    /* ======================================================
       SUMMARY
    ====================================================== */

    const totalProperties =
      properties.length;

    const totalLeads =
      leads.length;

    const convertedLeads =
      leads.filter(
        isConvertedLead
      ).length;

    const conversionRate =
      totalLeads > 0
        ? Number(
            (
              (convertedLeads /
                totalLeads) *
              100
            ).toFixed(2)
          )
        : 0;

    /* ======================================================
       MONTHLY DATA
    ====================================================== */

    const monthlyData =
      createMonthlyBuckets();

    /*
     * Property creation trend.
     */
    properties.forEach(
      (property) => {
        const key =
          getMonthKey(
            property.createdAt
          );

        if (!key) {
          return;
        }

        const bucket =
          monthlyData.find(
            (item) =>
              item.key === key
          );

        if (bucket) {
          bucket.properties += 1;
        }
      }
    );

    /*
     * Lead creation trend.
     */
    leads.forEach(
      (lead) => {
        const key =
          getMonthKey(
            lead.createdAt
          );

        if (!key) {
          return;
        }

        const bucket =
          monthlyData.find(
            (item) =>
              item.key === key
          );

        if (bucket) {
          bucket.leads += 1;
        }

        /*
         * Sales are counted using the lead's
         * conversion state and creation month.
         *
         * This avoids inventing a sale date field
         * that is not part of the current Lead model.
         */
        if (
          isConvertedLead(lead)
        ) {
          if (bucket) {
            bucket.sales += 1;
          }
        }
      }
    );

    /*
     * Remove the internal key before returning data
     * to the frontend.
     */
    const formattedMonthlyData =
      monthlyData.map(
        ({
          key,
          ...month
        }) => month
      );

    /* ======================================================
       MONTHLY GROWTH
    ====================================================== */

    let monthlyGrowth = 0;

    if (
      monthlyData.length >= 2
    ) {
      const currentMonth =
        monthlyData[
          monthlyData.length - 1
        ];

      const previousMonth =
        monthlyData[
          monthlyData.length - 2
        ];

      const currentValue =
        currentMonth.properties;

      const previousValue =
        previousMonth.properties;

      if (
        previousValue === 0
      ) {
        monthlyGrowth =
          currentValue > 0
            ? 100
            : 0;
      } else {
        monthlyGrowth =
          Number(
            (
              ((currentValue -
                previousValue) /
                previousValue) *
              100
            ).toFixed(2)
          );
      }
    }

    /* ======================================================
       TOP AGENTS
    ====================================================== */

    /*
     * Build an in-memory performance map.
     *
     * assignedTo is the authoritative Lead assignment
     * field in the current model.
     */
    const agentMap =
      new Map();

    agents.forEach(
      (agent) => {
        const agentId =
          String(agent._id);

        agentMap.set(
          agentId,
          {
            _id:
              agent._id,

            name:
              agent.name ||
              "Unnamed Agent",

            email:
              agent.email ||
              "",

            sales: 0,

            properties: 0,
          }
        );
      }
    );

    /* ------------------------------------------------------
       COUNT CONVERTED LEADS PER AGENT
    ------------------------------------------------------ */

    leads.forEach(
      (lead) => {
        if (
          !lead.assignedTo
        ) {
          return;
        }

        const agentId =
          String(
            lead.assignedTo
          );

        const agent =
          agentMap.get(
            agentId
          );

        if (!agent) {
          return;
        }

        if (
          isConvertedLead(
            lead
          )
        ) {
          agent.sales += 1;
        }
      }
    );

    /* ------------------------------------------------------
       PROPERTY AGENT SUPPORT
       ------------------------------------------------------

       The property schema can vary in how an agent is
       represented. We therefore inspect only fields that
       already exist on returned documents.

       No new field is written or assumed.
    ------------------------------------------------------ */

    properties.forEach(
      (property) => {
        const possibleAgent =
          property.assignedAgent ||
          property.agent ||
          property.assignedTo;

        if (
          !possibleAgent
        ) {
          return;
        }

        const agentId =
          typeof possibleAgent ===
          "object"
            ? possibleAgent._id
              ? String(
                  possibleAgent._id
                )
              : null
            : String(
                possibleAgent
              );

        if (!agentId) {
          return;
        }

        const agent =
          agentMap.get(
            agentId
          );

        if (!agent) {
          return;
        }

        agent.properties += 1;
      }
    );

    /*
     * Convert map to array.
     *
     * The frontend only expects an array.
     */
    const topAgents =
      Array.from(
        agentMap.values()
      )
        .sort(
          (a, b) =>
            b.sales - a.sales ||
            b.properties -
              a.properties
        )
        .slice(0, 10);

    /* ======================================================
       FINAL RESPONSE
    ====================================================== */

    const responseData = {
      summary: {
        totalProperties,

        totalLeads,

        conversionRate,

        monthlyGrowth,
      },

      monthlyData:
        formattedMonthlyData,

      topAgents,
    };

    console.log(
      "📊 Dashboard analytics response:",
      {
        summary:
          responseData.summary,

        monthlyRows:
          responseData
            .monthlyData.length,

        topAgents:
          responseData
            .topAgents.length,
      }
    );

    console.log(
      "=================================================="
    );

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error(
      "❌ DASHBOARD ANALYTICS ERROR:",
      error
    );

    console.error(
      "❌ Analytics error message:",
      error?.message
    );

    console.error(
      "❌ Analytics error stack:",
      error?.stack
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard analytics.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error?.message
          : undefined,
    });
  }
};