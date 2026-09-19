/**
 * =====================================================
 *
 * Powers:
 * -----------------------------------------------------
 * • Admin Dashboard
 * • Agent Dashboard
 * • Dashboard KPIs
 * • Lead Pipeline
 * • Agent Performance
 * • AI Insights
 * • Dashboard Notifications
 * • Recent Activity
 * • Viewing Analytics
 *
 * Main Workflow:
 *
 * Lead
 *   ↓
 * Conversation
 *   ↓
 * Qualification
 *   ↓
 * Viewing Request
 *   ↓
 * Approval
 *   ↓
 * Reschedule
 *   ↓
 * Completed
 *   ↓
 * Negotiation / Won / Lost
 *
 * =====================================================
 */

import Lead from "../models/lead.js";
import Viewing from "../models/viewing.js";

/* =====================================================
   LEAD STATUS SOURCE OF TRUTH
===================================================== */

/**
 * IMPORTANT
 * -----------------------------------------------------
 * These values MUST match the existing Lead model.
 *
 * Lead.status is ONLY allowed to contain:
 *
 * new
 * contacted
 * qualified
 * viewing
 * negotiation
 * won
 * lost
 *
 * Other workflow concepts belong to their own fields:
 *
 * HOT
 * → lead.score
 *
 * FOLLOW-UP
 * → lead.followUpStatus
 * → lead.followUpOutcome
 *
 * VIEWING STATE
 * → lead.viewingStatus
 *
 * CLOSED / SUCCESSFUL DEAL
 * → lead.status = "won"
 *
 * =====================================================
 */

const VALID_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "viewing",
  "negotiation",
  "won",
  "lost",
];

/* =====================================================
   DASHBOARD SUMMARY
===================================================== */

/**
 * GET /api/dashboard/summary
 *
 * Returns organization-wide dashboard metrics.
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: "Organization ID is required.",
      });
    }

    const [leads, viewings] = await Promise.all([
      Lead.find({ organizationId }),
      Viewing.find({
        organizationId,
        isArchived: false,
      }),
    ]);

    /* --------------------------------------------
       Lead Metrics
    --------------------------------------------- */

    const totalLeads = leads.length;

    const newInquiries = leads.filter(
      (lead) => lead.status === "new"
    ).length;

    const qualifiedLeads = leads.filter(
      (lead) => lead.status === "qualified"
    ).length;

    /**
     * HOT LEADS
     * ------------------------------------------------
     * "hot" is NOT a valid Lead.status.
     *
     * Hot leads are determined by the lead score.
     */
    const hotLeads = leads.filter(
      (lead) => Number(lead.score || 0) >= 80
    ).length;

    /* --------------------------------------------
       Viewing Metrics
    --------------------------------------------- */

    const scheduledViewings = viewings.filter(
      (viewing) =>
        [
          "Requested",
          "Pending Approval",
          "Approved",
          "Rescheduled",
        ].includes(viewing.status)
    ).length;

    const completedViewings = viewings.filter(
      (viewing) => viewing.status === "Completed"
    ).length;

    const cancelledViewings = viewings.filter(
      (viewing) =>
        [
          "Cancelled",
          "Rejected",
          "No Show",
        ].includes(viewing.status)
    ).length;

    /* --------------------------------------------
       Conversion
    --------------------------------------------- */

    const conversionRate =
      totalLeads === 0
        ? 0
        : Number(
            (
              (qualifiedLeads / totalLeads) *
              100
            ).toFixed(2)
          );

    /* --------------------------------------------
       Pipeline Health
    --------------------------------------------- */

    const pipelineHealth =
      totalLeads === 0
        ? 0
        : Number(
            (
              (hotLeads * 4 +
                qualifiedLeads * 2 +
                completedViewings * 5) /
              totalLeads
            ).toFixed(2)
          );

    return res.json({
      success: true,

      data: {
        totalLeads,
        newInquiries,
        qualifiedLeads,
        hotLeads,

        scheduledViewings,
        completedViewings,
        cancelledViewings,

        conversionRate,
        pipelineHealth,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =====================================================
   LEAD PIPELINE
===================================================== */

/**
 * GET /api/dashboard/pipeline
 *
 * Uses ONLY the existing Lead.status enum.
 *
 * Hot is intentionally NOT a pipeline status.
 * Follow-up is intentionally NOT a pipeline status.
 * Closed is represented by "won".
 */
export const getLeadPipeline = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: "Organization ID is required.",
      });
    }

    const leads = await Lead.find({
      organizationId,
    });

    const pipeline = [
      {
        stage: "New",
        value: leads.filter(
          (lead) => lead.status === "new"
        ).length,
      },

      {
        stage: "Contacted",
        value: leads.filter(
          (lead) => lead.status === "contacted"
        ).length,
      },

      {
        stage: "Qualified",
        value: leads.filter(
          (lead) => lead.status === "qualified"
        ).length,
      },

      {
        stage: "Viewing",
        value: leads.filter(
          (lead) => lead.status === "viewing"
        ).length,
      },

      {
        stage: "Negotiation",
        value: leads.filter(
          (lead) => lead.status === "negotiation"
        ).length,
      },

      {
        stage: "Won",
        value: leads.filter(
          (lead) => lead.status === "won"
        ).length,
      },

      {
        stage: "Lost",
        value: leads.filter(
          (lead) => lead.status === "lost"
        ).length,
      },
    ];

    return res.json({
      success: true,
      data: pipeline,
    });
  } catch (error) {
    console.error(
      "Lead pipeline error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =====================================================
   AGENT PERFORMANCE
===================================================== */

/**
 * GET /api/dashboard/agent/:id
 */
export const getAgentPerformance = async (
  req,
  res
) => {
  try {
    const organizationId =
      req.user?.organizationId;

    const agentId = req.params.id;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: "Organization ID is required.",
      });
    }

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: "Agent ID is required.",
      });
    }

    const [leads, viewings] = await Promise.all([
      Lead.find({
        organizationId,
        assignedTo: agentId,
      }),

      Viewing.find({
        organizationId,
        agent: agentId,
        isArchived: false,
      }),
    ]);

    const totalAssigned = leads.length;

    /**
     * HOT LEADS
     * ------------------------------------------------
     * Hot is based on score.
     *
     * It is NOT Lead.status = "hot".
     */
    const hotLeads = leads.filter(
      (lead) => Number(lead.score || 0) >= 80
    ).length;

    /**
     * WON LEADS
     * ------------------------------------------------
     * The existing Lead model uses "won",
     * not "closed".
     *
     * Keep the response field "closedLeads"
     * for frontend compatibility.
     */
    const closedLeads = leads.filter(
      (lead) => lead.status === "won"
    ).length;

    const completedViewings = viewings.filter(
      (viewing) =>
        viewing.status === "Completed"
    ).length;

    const upcomingViewings = viewings.filter(
      (viewing) =>
        [
          "Requested",
          "Pending Approval",
          "Approved",
          "Rescheduled",
        ].includes(viewing.status)
    ).length;

    const successRate =
      totalAssigned === 0
        ? 0
        : Number(
            (
              (closedLeads /
                totalAssigned) *
              100
            ).toFixed(2)
          );

    return res.json({
      success: true,

      data: {
        agentId,
        totalAssigned,
        hotLeads,
        closedLeads,
        completedViewings,
        upcomingViewings,

        workload:
          totalAssigned +
          upcomingViewings,

        successRate,
      },
    });
  } catch (error) {
    console.error(
      "Agent performance error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =====================================================
   AI INSIGHTS
===================================================== */

/**
 * GET /api/dashboard/ai-insights
 */
export const getAIInsights = async (
  req,
  res
) => {
  try {
    const organizationId =
      req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: "Organization ID is required.",
      });
    }

    const leads = await Lead.find({
      organizationId,
    });

    const highQuality = leads.filter(
      (lead) =>
        (lead.score || 0) >= 70
    ).length;

    const mediumQuality = leads.filter(
      (lead) => {
        const score = lead.score || 0;

        return (
          score >= 40 &&
          score < 70
        );
      }
    ).length;

    const lowQuality = leads.filter(
      (lead) =>
        (lead.score || 0) < 40
    ).length;

    const averageScore =
      leads.reduce(
        (sum, lead) =>
          sum + (lead.score || 0),
        0
      ) / (leads.length || 1);

    const aiEffectiveness =
      averageScore >= 60
        ? "strong"
        : "needs improvement";

    return res.json({
      success: true,

      data: {
        averageScore:
          Number(
            averageScore.toFixed(2)
          ),

        highQuality,
        mediumQuality,
        lowQuality,
        aiEffectiveness,
      },
    });
  } catch (error) {
    console.error(
      "AI insights error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =====================================================
   DASHBOARD NOTIFICATIONS
===================================================== */

/**
 * GET /api/dashboard/notifications
 */
export const getDashboardNotifications = async (
  req,
  res
) => {
  try {
    const organizationId =
      req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: "Organization ID is required.",
      });
    }

    const [leads, viewings] =
      await Promise.all([
        Lead.find({
          organizationId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(20),

        Viewing.find({
          organizationId,
          isArchived: false,
        })
          .sort({
            updatedAt: -1,
          })
          .limit(30),
      ]);

    const notifications = [];

    /* --------------------------------------------
       New Leads
    --------------------------------------------- */

    leads
      .filter(
        (lead) =>
          lead.status === "new"
      )
      .slice(0, 5)
      .forEach((lead) => {
        const customerName =
          lead.name ||
          lead.customerName ||
          "A customer";

        notifications.push({
          id: `lead-${lead._id}`,

          type: "lead",

          priority: "high",

          title: "New Lead",

          message:
            `${customerName} submitted a new inquiry.`,

          referenceId: lead._id,

          action: "View Lead",

          route:
            `/agent/leads/${lead._id}`,

          createdAt:
            lead.createdAt ||
            new Date(),

          read: false,
        });
      });

    /* --------------------------------------------
       Pending Viewing Requests
    --------------------------------------------- */

    viewings
      .filter(
        (viewing) =>
          [
            "Requested",
            "Pending Approval",
          ].includes(
            viewing.status
          )
      )
      .slice(0, 5)
      .forEach((viewing) => {
        notifications.push({
          id:
            `viewing-${viewing._id}`,

          type: "viewing",

          priority: "high",

          title:
            "Viewing Request",

          message:
            "A customer has requested a property viewing.",

          referenceId:
            viewing._id,

          action:
            "Review Viewing",

          route:
            `/admin/viewings/${viewing._id}`,

          createdAt:
            viewing.createdAt ||
            viewing.updatedAt ||
            new Date(),

          read: false,
        });
      });

    /* --------------------------------------------
       Approved Viewings
    --------------------------------------------- */

    viewings
      .filter(
        (viewing) =>
          viewing.status ===
          "Approved"
      )
      .slice(0, 5)
      .forEach((viewing) => {
        notifications.push({
          id:
            `approved-${viewing._id}`,

          type: "viewing",

          priority: "medium",

          title:
            "Viewing Approved",

          message:
            "A property viewing has been approved and is ready for scheduling.",

          referenceId:
            viewing._id,

          action:
            "View Details",

          route:
            `/admin/viewings/${viewing._id}`,

          createdAt:
            viewing.updatedAt ||
            new Date(),

          read: false,
        });
      });

    /* --------------------------------------------
       Rescheduled Viewings
    --------------------------------------------- */

    viewings
      .filter(
        (viewing) =>
          viewing.status ===
          "Rescheduled"
      )
      .slice(0, 5)
      .forEach((viewing) => {
        notifications.push({
          id:
            `rescheduled-${viewing._id}`,

          type: "viewing",

          priority: "medium",

          title:
            "Viewing Rescheduled",

          message:
            "A customer viewing has been rescheduled.",

          referenceId:
            viewing._id,

          action:
            "Review Schedule",

          route:
            `/admin/viewings/${viewing._id}`,

          createdAt:
            viewing.updatedAt ||
            new Date(),

          read: false,
        });
      });

    notifications.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    const unreadCount =
      notifications.filter(
        (notification) =>
          notification.read === false
      ).length;

    const notificationSummary = {
      total:
        notifications.length,

      unread:
        unreadCount,

      newLeads:
        notifications.filter(
          (notification) =>
            notification.type ===
            "lead"
        ).length,

      viewingRequests:
        notifications.filter(
          (notification) =>
            notification.type ===
              "viewing" &&
            notification.title ===
              "Viewing Request"
        ).length,

      viewingUpdates:
        notifications.filter(
          (notification) =>
            notification.type ===
              "viewing" &&
            notification.title !==
              "Viewing Request"
        ).length,
    };

    return res.json({
      success: true,

      data: {
        notifications,
        summary:
          notificationSummary,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =====================================================
   RECENT ACTIVITY
===================================================== */

/**
 * GET /api/dashboard/recent-activity
 *
 * Builds recent activity from existing Lead and
 * Viewing records.
 *
 * This intentionally does NOT depend on an
 * ActivityLog model.
 */
export const getRecentActivity = async (
  req,
  res
) => {
  try {
    const organizationId =
      req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: "Organization ID is required.",
      });
    }

    const [leads, viewings] =
      await Promise.all([
        Lead.find({
          organizationId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(10),

        Viewing.find({
          organizationId,
          isArchived: false,
        })
          .sort({
            updatedAt: -1,
          })
          .limit(10),
      ]);

    const activities = [];

    /* --------------------------------------------
       Lead Activity
    --------------------------------------------- */

    leads.forEach((lead) => {
      const customerName =
        lead.name ||
        lead.customerName ||
        lead.fullName ||
        "Customer";

      activities.push({
        _id:
          `lead-${lead._id}`,

        type: "lead",

        title:
          "New Lead",

        description:
          `${customerName} submitted a property inquiry.`,

        createdAt:
          lead.createdAt ||
          new Date(),
      });
    });

    /* --------------------------------------------
       Viewing Activity
    --------------------------------------------- */

    viewings.forEach((viewing) => {
      let title =
        "Viewing Updated";

      let description =
        "A property viewing was updated.";

      switch (
        String(
          viewing.status || ""
        ).toLowerCase()
      ) {
        case "requested":
          title =
            "Viewing Requested";
          description =
            "A customer requested a property viewing.";
          break;

        case "pending approval":
          title =
            "Viewing Pending Approval";
          description =
            "A property viewing is awaiting approval.";
          break;

        case "approved":
          title =
            "Viewing Approved";
          description =
            "A property viewing has been approved.";
          break;

        case "rescheduled":
          title =
            "Viewing Rescheduled";
          description =
            "A property viewing was rescheduled.";
          break;

        case "completed":
          title =
            "Viewing Completed";
          description =
            "A property viewing was completed.";
          break;

        case "cancelled":
        case "canceled":
          title =
            "Viewing Cancelled";
          description =
            "A property viewing was cancelled.";
          break;

        case "rejected":
          title =
            "Viewing Rejected";
          description =
            "A property viewing request was rejected.";
          break;

        case "no show":
        case "no-show":
        case "noshow":
          title =
            "Viewing No-Show";
          description =
            "A customer did not attend the scheduled viewing.";
          break;

        default:
          break;
      }

      activities.push({
        _id:
          `viewing-${viewing._id}`,

        type: "viewing",

        title,

        description,

        createdAt:
          viewing.updatedAt ||
          viewing.createdAt ||
          new Date(),
      });
    });

    /* --------------------------------------------
       Sort
    --------------------------------------------- */

    activities.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    /* --------------------------------------------
       Limit
    --------------------------------------------- */

    const recentActivities =
      activities.slice(0, 20);

    return res.json({
      success: true,
      data: recentActivities,
    });
  } catch (error) {
    console.error(
      "Recent activity error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =====================================================
   VIEWING ANALYTICS
===================================================== */

/**
 * GET /api/dashboard/viewings
 */
export const getViewingAnalytics = async (
  req,
  res
) => {
  try {
    const organizationId =
      req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({
        success: false,
        error: "Organization ID is required.",
      });
    }

    const viewings =
      await Viewing.find({
        organizationId,
        isArchived: false,
      }).sort({
        createdAt: -1,
      });

    const requested =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "Requested"
      ).length;

    const pendingApproval =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "Pending Approval"
      ).length;

    const approved =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "Approved"
      ).length;

    const rescheduled =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "Rescheduled"
      ).length;

    const completed =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "Completed"
      ).length;

    const cancelled =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "Cancelled"
      ).length;

    const rejected =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "Rejected"
      ).length;

    const noShow =
      viewings.filter(
        (viewing) =>
          viewing.status ===
          "No Show"
      ).length;

    const totalViewings =
      viewings.length;

    const upcomingViewings =
      viewings.filter(
        (viewing) =>
          [
            "Requested",
            "Pending Approval",
            "Approved",
            "Rescheduled",
          ].includes(
            viewing.status
          )
      ).length;

    const approvalRate =
      totalViewings === 0
        ? 0
        : Number(
            (
              (approved /
                totalViewings) *
              100
            ).toFixed(2)
          );

    const completionRate =
      totalViewings === 0
        ? 0
        : Number(
            (
              (completed /
                totalViewings) *
              100
            ).toFixed(2)
          );

    const cancellationRate =
      totalViewings === 0
        ? 0
        : Number(
            (
              (cancelled /
                totalViewings) *
              100
            ).toFixed(2)
          );

    const terminalViewings =
      completed +
      cancelled +
      rejected +
      noShow;

    const successfulOutcomeRate =
      terminalViewings === 0
        ? 0
        : Number(
            (
              (completed /
                terminalViewings) *
              100
            ).toFixed(2)
          );

    const workflowHealth =
      totalViewings === 0
        ? 0
        : Number(
            (
              (approved * 2 +
                completed * 4 +
                rescheduled) /
              totalViewings
            ).toFixed(2)
          );

    return res.json({
      success: true,

      data: {
        totalViewings,
        requested,
        pendingApproval,
        approved,
        rescheduled,
        completed,
        cancelled,
        rejected,
        noShow,
        upcomingViewings,
        approvalRate,
        completionRate,
        cancellationRate,
        successfulOutcomeRate,
        workflowHealth,
      },
    });
  } catch (error) {
    console.error(
      "Viewing analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =====================================================
   DEFAULT EXPORT
===================================================== */

export default {
  getDashboardSummary,
  getLeadPipeline,
  getAgentPerformance,
  getAIInsights,
  getDashboardNotifications,
  getRecentActivity,
  getViewingAnalytics,
};