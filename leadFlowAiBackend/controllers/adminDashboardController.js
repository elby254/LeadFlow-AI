import mongoose from "mongoose";

import Lead from "../models/lead.js";
import User from "../models/user.js";
import Conversation from "../models/conversation.js";

export const getAdminDashboard = async (req, res) => {
  try {

    // ==============================================
// Part 1
// KPI Queries
// ==============================================

const organizationId = req.user.organizationId;

const [
  totalLeads,
  newLeads,
  qualifiedLeads,
  hotLeads,
  closedLeads,
  activeAgents,
  totalConversations,
] = await Promise.all([
  Lead.countDocuments({ organizationId }),

  Lead.countDocuments({
    organizationId,
    status: "new",
  }),

  Lead.countDocuments({
    organizationId,
    status: "qualified",
  }),

  Lead.countDocuments({
    organizationId,
    status: "hot",
  }),

  Lead.countDocuments({
    organizationId,
    status: "closed",
  }),

  User.countDocuments({
    organizationId,
    role: "agent",
    isActive: true,
  }),

  Conversation.countDocuments({
    organizationId,
  }),
]);

const conversionRate =
  totalLeads === 0
    ? 0
    : Number(
        ((closedLeads / totalLeads) * 100).toFixed(1)
      );

const kpis = {
  totalLeads,
  newLeads,
  qualifiedLeads,
  hotLeads,
  closedLeads,
  activeAgents,
  totalConversations,
  conversionRate,
};

    // ==============================================
// Part 2
// Pipeline Aggregation
// ==============================================

const pipeline = await Lead.aggregate([
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
]);

const pipelineData = [
  "new",
  "qualified",
  "hot",
  "follow_up",
  "viewing_scheduled",
  "closed",
].map((status) => ({
  stage: status.replace("_", " "),
  count:
    pipeline.find((p) => p._id === status)?.count || 0,
}));

    // ==============================================
// Part 3
// Source Aggregation
// ==============================================

const sourceAggregation = await Lead.aggregate([
  {
    $match: {
      organizationId,
    },
  },

  {
    $group: {
      _id: "$source",
      count: {
        $sum: 1,
      },
    },
  },
]);

const sourceData = sourceAggregation.map((item) => ({
  source: item._id,
  value: item.count,
}));

    // ==============================================
// Part 4
// Qualification
// ==============================================

const qualificationData = [
  {
    label: "Qualified",
    value: qualifiedLeads,
  },
  {
    label: "Hot",
    value: hotLeads,
  },
  {
    label: "Closed",
    value: closedLeads,
  },
];

    // ==============================================
// Part 5
// Monthly Trend
// ==============================================

const monthlyAggregation = await Lead.aggregate([
  {
    $match: {
      organizationId,
    },
  },

  {
    $group: {
      _id: {
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
      "_id.month": 1,
    },
  },
]);

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

const monthlyTrend = monthlyAggregation.map((m) => ({
  month: monthNames[m._id.month - 1],
  leads: m.leads,
}));

    // ==============================================
// Part 6
// AI Analytics
// ==============================================

const aiAggregation = await Lead.aggregate([
  {
    $match: {
      organizationId,
    },
  },

  {
    $group: {
      _id: null,

      avgBuyingIntent: {
        $avg: "$aiInsights.buyingIntent",
      },

      avgBudgetConfidence: {
        $avg: "$aiInsights.budgetConfidence",
      },

      avgLocationConfidence: {
        $avg: "$aiInsights.locationConfidence",
      },
    },
  },
]);

const ai = aiAggregation[0] || {};

const aiAnalytics = {
  avgBuyingIntent:
    Math.round(ai.avgBuyingIntent || 0),

  avgBudgetConfidence:
    Math.round(ai.avgBudgetConfidence || 0),

  avgLocationConfidence:
    Math.round(ai.avgLocationConfidence || 0),
};

// =============================================
// Part 7
// Agent Leaderboard (Live from Leads)
// =============================================

const agentLeaderboard = await Lead.aggregate([
  {
    $match: {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      assignedTo: { $ne: null },
    },
  },

  {
    $group: {
      _id: "$assignedTo",

      assignedLeads: { $sum: 1 },

      qualifiedLeads: {
        $sum: {
          $cond: [
            {
              $in: [
                "$status",
                [
                  "qualified",
                  "hot",
                  "follow_up",
                  "viewing_scheduled",
                  "closed",
                ],
              ],
            },
            1,
            0,
          ],
        },
      },

      hotLeads: {
        $sum: {
          $cond: [
            { $eq: ["$status", "hot"] },
            1,
            0,
          ],
        },
      },

      viewingScheduled: {
        $sum: {
          $cond: [
            {
              $eq: [
                "$status",
                "viewing_scheduled",
              ],
            },
            1,
            0,
          ],
        },
      },

      closedDeals: {
        $sum: {
          $cond: [
            { $eq: ["$status", "closed"] },
            1,
            0,
          ],
        },
      },

      averageScore: {
        $avg: "$score",
      },
    },
  },

  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "agent",
    },
  },

  {
    $unwind: "$agent",
  },

  {
    $project: {
      _id: 1,

      name: "$agent.name",

      email: "$agent.email",

      assignedLeads: 1,

      qualifiedLeads: 1,

      hotLeads: 1,

      viewingScheduled: 1,

      closedDeals: 1,

      averageScore: {
        $round: ["$averageScore", 1],
      },

      conversionRate: {
        $round: [
          {
            $multiply: [
              {
                $cond: [
                  { $eq: ["$assignedLeads", 0] },
                  0,
                  {
                    $divide: [
                      "$closedDeals",
                      "$assignedLeads",
                    ],
                  },
                ],
              },
              100,
            ],
          },
          1,
        ],
      },
    },
  },

  {
    $sort: {
      conversionRate: -1,
      closedDeals: -1,
      hotLeads: -1,
      averageScore: -1,
    },
  },
]);

    // ==============================================
// Part 8
// Recent Activity
// ==============================================

const recentLeads = await Lead.find({
  organizationId,
})
.sort({
  updatedAt: -1,
})
.limit(10)
.select(
  "name status updatedAt assignedTo"
)
.populate("assignedTo", "name")
.lean();

const recentActivity = recentLeads.map((lead) => ({
  id: lead._id,

  customer: lead.name,

  status: lead.status,

  agent:
    lead.assignedTo?.name ||
    "Unassigned",

  time: lead.updatedAt,
}));

    return res.status(200).json({
      success: true,
      data: {
        kpis,
        pipelineData,
        sourceData,
        qualificationData,
        monthlyTrend,
        aiAnalytics,
        agentLeaderboard,
        recentActivity,
      },
    });

  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard analytics.",
      error: error.message,
    });
  }
};