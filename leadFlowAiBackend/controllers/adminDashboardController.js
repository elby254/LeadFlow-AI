import mongoose from "mongoose";

import Lead from "../models/lead.js";
import User from "../models/user.js";
import Conversation from "../models/conversation.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

import {
  LEAD_STATUS,
} from "../services/leadLifeCycleService.js";

import {
  HOT_SCORE_THRESHOLD,
} from "../services/leadScoringRulesEngine.js";

import Viewing from "../models/viewing.js";

/**
 * ==========================================================
 * ADMIN DASHBOARD CONTROLLER
 * ==========================================================
 *
 * Canonical dashboard semantics
 *
 * Lead lifecycle:
 *
 *   new
 *   contacted
 *   qualified
 *   viewing
 *   negotiation
 *   won
 *   lost
 *
 * Lead score:
 *
 *   0–49   → new
 *   50–79  → qualified
 *   80–100 → hot
 *
 * IMPORTANT
 * ----------------------------------------------------------
 *
 * "hot" is derived from Lead.score.
 *
 * "hot" is NOT Lead.status.
 *
 * Viewing workflow belongs to the Viewing model.
 *
 * Follow-up workflow belongs to Lead.followUpStatus.
 *
 * Successful conversion:
 *
 *   Lead.status = "won"
 *
 * Unsuccessful terminal outcome:
 *
 *   Lead.status = "lost"
 *
 * ==========================================================
 */


/**
 * ==========================================================
 * RESOLVE ORGANIZATION
 * ==========================================================
 *
 * Organization must always come from the centralized
 * organization resolver.
 *
 * Raw organization identifiers supplied by the client are
 * never trusted directly.
 *
 * ==========================================================
 */

const getOrganizationId = async (
  req
) => {

  const organization =
    await resolveFromRequest(
      req
    );

  if (
    !organization
  ) {

    return null;
  }

  return (
    organization._id ||
    null
  );
};


/**
 * ==========================================================
 * CANONICAL PIPELINE ORDER
 * ==========================================================
 */

const CANONICAL_PIPELINE_STATUSES = [
  LEAD_STATUS.NEW,
  LEAD_STATUS.CONTACTED,
  LEAD_STATUS.QUALIFIED,
  LEAD_STATUS.VIEWING,
  LEAD_STATUS.NEGOTIATION,
  LEAD_STATUS.WON,
  LEAD_STATUS.LOST,
];


/**
 * ==========================================================
 * HELPER
 * ==========================================================
 */

const getPipelineLabel = (
  status
) => {

  return status
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};


/**
 * ==========================================================
 * ADMIN DASHBOARD
 * ==========================================================
 */

export const getAdminDashboard = async (
  req,
  res
) => {

  try {

    // ======================================================
    // RESOLVE AUTHENTICATED ORGANIZATION
    // ======================================================

    const organizationId =
      await getOrganizationId(
        req
      );


    if (
      !organizationId
    ) {

      return res.status(401).json({

        success:
          false,

        message:
          "Authentication required",

      });
    }


    // ======================================================
    // NORMALIZE OBJECT ID
    // ======================================================

    const organizationObjectId =
      new mongoose.Types.ObjectId(
        organizationId
      );


    // ======================================================
    // PART 1
    // KPI QUERIES
    // ======================================================
    //
    // IMPORTANT:
    //
    // hotLeads comes from score.
    //
    // closedLeads is retained as a frontend compatibility
    // alias for wonLeads.
    //
    // "closed" is NOT queried as a Lead.status.
    //
    // ======================================================

    const [
      totalLeads,

      newLeads,

      contactedLeads,

      qualifiedLeads,

      viewingLeads,

      negotiationLeads,

      wonLeads,

      lostLeads,

      hotLeads,

      activeAgents,

      totalConversations,

    ] = await Promise.all([

      Lead.countDocuments({
        organizationId,
      }),

      Lead.countDocuments({
        organizationId,
        status:
          LEAD_STATUS.NEW,
      }),

      Lead.countDocuments({
        organizationId,
        status:
          LEAD_STATUS.CONTACTED,
      }),

      Lead.countDocuments({
        organizationId,
        status:
          LEAD_STATUS.QUALIFIED,
      }),

      Lead.countDocuments({
        organizationId,
        status:
          LEAD_STATUS.VIEWING,
      }),

      Lead.countDocuments({
        organizationId,
        status:
          LEAD_STATUS.NEGOTIATION,
      }),

      Lead.countDocuments({
        organizationId,
        status:
          LEAD_STATUS.WON,
      }),

      Lead.countDocuments({
        organizationId,
        status:
          LEAD_STATUS.LOST,
      }),

      Lead.countDocuments({
        organizationId,

        score: {
          $gte:
            HOT_SCORE_THRESHOLD,
        },
      }),

      User.countDocuments({
        organizationId,
        role:
          "agent",
        isActive:
          true,
      }),

      Conversation.countDocuments({
        organizationId,
      }),

    ]);


    const conversionRate =
      totalLeads === 0
        ? 0
        : Number(
            (
              (
                wonLeads /
                totalLeads
              ) *
              100
            ).toFixed(1)
          );


    const qualificationRate =
      totalLeads === 0
        ? 0
        : Number(
            (
              (
                qualifiedLeads /
                totalLeads
              ) *
              100
            ).toFixed(1)
          );


    const lossRate =
      totalLeads === 0
        ? 0
        : Number(
            (
              (
                lostLeads /
                totalLeads
              ) *
              100
            ).toFixed(1)
          );


    const kpis = {

      totalLeads,

      newLeads,

      contactedLeads,

      qualifiedLeads,

      viewingLeads,

      negotiationLeads,

      wonLeads,

      lostLeads,

      hotLeads,

      activeAgents,

      totalConversations,

      conversionRate,

      qualificationRate,

      lossRate,

      // ---------------------------------------------------
      // FRONTEND COMPATIBILITY
      // ---------------------------------------------------
      //
      // Existing frontend code may still expect
      // "closedLeads".
      //
      // This is an alias only.
      //
      // Canonical lifecycle value = wonLeads.
      //
      closedLeads:
        wonLeads,

    };


    // ======================================================
    // PART 2
    // CANONICAL PIPELINE AGGREGATION
    // ======================================================
    //
    // Pipeline contains lifecycle states only.
    //
    // HOT is deliberately excluded.
    //
    // Follow-up is deliberately excluded.
    //
    // Viewing scheduled is deliberately excluded.
    //
    // ======================================================

    const pipeline =
      await Lead.aggregate([

        {
          $match: {
            organizationId:
              organizationObjectId,
          },
        },

        {
          $group: {

            _id:
              "$status",

            count: {
              $sum: 1,
            },

          },
        },

      ]);


    const pipelineData =
      CANONICAL_PIPELINE_STATUSES.map(
        (status) => ({

          status,

          stage:
            getPipelineLabel(
              status
            ),

          count:
            pipeline.find(
              (item) =>
                item._id ===
                status
            )?.count ||
            0,

        })
      );


    // ======================================================
    // PART 2A
    // DERIVED PIPELINE METRICS
    // ======================================================
    //
    // These are intentionally separate from the lifecycle.
    //
    // ======================================================

    const pipelineDerived = {

      hot:
        hotLeads,

      followUp:
        await Lead.countDocuments({

          organizationId,

          followUpStatus: {
            $in: [
              "pending",
              "scheduled",
            ],
          },

        }),

    };


    // ======================================================
    // PART 3
    // SOURCE AGGREGATION
    // ======================================================

    const sourceAggregation =
      await Lead.aggregate([

        {
          $match: {
            organizationId:
              organizationObjectId,
          },
        },

        {
          $group: {

            _id:
              "$source",

            count: {
              $sum: 1,
            },

          },
        },

        {
          $sort: {
            count:
              -1,
          },
        },

      ]);


    const sourceData =
      sourceAggregation.map(
        (item) => ({

          source:
            item._id,

          value:
            item.count,

        })
      );


    // ======================================================
    // PART 4
    // QUALIFICATION / OUTCOME ANALYTICS
    // ======================================================
    //
    // Hot is score-derived.
    //
    // Won is the canonical successful conversion.
    //
    // Lost is the canonical unsuccessful terminal outcome.
    //
    // ======================================================

    const qualificationData = [

      {
        label:
          "Qualified",

        value:
          qualifiedLeads,
      },

      {
        label:
          "Hot",

        value:
          hotLeads,
      },

      {
        label:
          "Won",

        value:
          wonLeads,
      },

      {
        label:
          "Lost",

        value:
          lostLeads,
      },

    ];


    // ======================================================
    // PART 5
    // MONTHLY TREND
    // ======================================================

    const monthlyAggregation =
      await Lead.aggregate([

        {
          $match: {
            organizationId:
              organizationObjectId,
          },
        },

        {
          $group: {

            _id: {

              year: {
                $year:
                  "$createdAt",
              },

              month: {
                $month:
                  "$createdAt",
              },

            },

            leads: {
              $sum: 1,
            },

          },
        },

        {
          $sort: {

            "_id.year":
              1,

            "_id.month":
              1,

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


    const monthlyTrend =
      monthlyAggregation.map(
        (item) => ({

          year:
            item._id.year,

          month:
            monthNames[
              item._id.month - 1
            ],

          leads:
            item.leads,

        })
      );


    // ======================================================
    // PART 6
    // AI ANALYTICS
    // ======================================================

    const aiAggregation =
      await Lead.aggregate([

        {
          $match: {
            organizationId:
              organizationObjectId,
          },
        },

        {
          $group: {

            _id:
              null,

            avgBuyingIntent: {
              $avg:
                "$aiInsights.buyingIntent",
            },

            avgBudgetConfidence: {
              $avg:
                "$aiInsights.budgetConfidence",
            },

            avgLocationConfidence: {
              $avg:
                "$aiInsights.locationConfidence",
            },

            avgScore: {
              $avg:
                "$score",
            },

          },

        },

      ]);


    const ai =
      aiAggregation[0] ||
      {};


    const aiAnalytics = {

      avgBuyingIntent:
        Math.round(
          ai.avgBuyingIntent ||
          0
        ),

      avgBudgetConfidence:
        Math.round(
          ai.avgBudgetConfidence ||
          0
        ),

      avgLocationConfidence:
        Math.round(
          ai.avgLocationConfidence ||
          0
        ),

      avgScore:
        Math.round(
          ai.avgScore ||
          0
        ),

    };


    // ======================================================
    // PART 7
    // AGENT LEADERBOARD
    // ======================================================
    //
    // Important semantic rules:
    //
    // qualifiedLeads:
    //   qualified and all downstream successful pipeline
    //   stages except new/contacted/lost.
    //
    // hotLeads:
    //   score >= HOT_SCORE_THRESHOLD.
    //
    // closedDeals:
    //   canonical won status.
    //
    // There is intentionally no:
    //
    //   status = "hot"
    //   status = "closed"
    //   status = "viewing_scheduled"
    //
    // ======================================================

    const agentLeaderboard =
      await Lead.aggregate([

        {
          $match: {

            organizationId:
              organizationObjectId,

            assignedTo: {
              $ne:
                null,
            },

          },
        },

        {
          $group: {

            _id:
              "$assignedTo",

            assignedLeads: {
              $sum: 1,
            },

            qualifiedLeads: {

              $sum: {

                $cond: [

                  {
                    $in: [

                      "$status",

                      [
                        LEAD_STATUS.QUALIFIED,
                        LEAD_STATUS.VIEWING,
                        LEAD_STATUS.NEGOTIATION,
                        LEAD_STATUS.WON,
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

                  {
                    $gte: [

                      "$score",

                      HOT_SCORE_THRESHOLD,

                    ],
                  },

                  1,

                  0,

                ],

              },

            },

            viewingLeads: {

              $sum: {

                $cond: [

                  {
                    $eq: [

                      "$status",

                      LEAD_STATUS.VIEWING,

                    ],
                  },

                  1,

                  0,

                ],

              },

            },

            negotiationLeads: {

              $sum: {

                $cond: [

                  {
                    $eq: [

                      "$status",

                      LEAD_STATUS.NEGOTIATION,

                    ],
                  },

                  1,

                  0,

                ],

              },

            },

            wonDeals: {

              $sum: {

                $cond: [

                  {
                    $eq: [

                      "$status",

                      LEAD_STATUS.WON,

                    ],
                  },

                  1,

                  0,

                ],

              },

            },

            lostLeads: {

              $sum: {

                $cond: [

                  {
                    $eq: [

                      "$status",

                      LEAD_STATUS.LOST,

                    ],
                  },

                  1,

                  0,

                ],

              },

            },

            averageScore: {
              $avg:
                "$score",
            },

          },

        },

        // ==================================================
        // USER LOOKUP
        // ==================================================

        {
          $lookup: {

            from:
              "users",

            localField:
              "_id",

            foreignField:
              "_id",

            as:
              "agent",

          },
        },

        {
          $unwind:
            "$agent",
        },

        // ==================================================
        // PROJECT
        // ==================================================

        {
          $project: {

            _id:
              1,

            name:
              "$agent.name",

            email:
              "$agent.email",

            assignedLeads:
              1,

            qualifiedLeads:
              1,

            hotLeads:
              1,

            viewingLeads:
              1,

            negotiationLeads:
              1,

            wonDeals:
              1,

            lostLeads:
              1,

            averageScore: {

              $round: [

                {
                  $ifNull: [
                    "$averageScore",
                    0,
                  ],
                },

                1,

              ],

            },

            conversionRate: {

              $round: [

                {

                  $multiply: [

                    {

                      $cond: [

                        {
                          $eq: [

                            "$assignedLeads",
                            0,

                          ],
                        },

                        0,

                        {

                          $divide: [

                            "$wonDeals",

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

            conversionRate:
              -1,

            wonDeals:
              -1,

            hotLeads:
              -1,

            averageScore:
              -1,

          },
        },

      ]);


    // ======================================================
    // PART 7A
    // CANONICAL VIEWING WORKFLOW SUMMARY
    // ======================================================
    //
    // Viewing scheduling does NOT come from Lead.status.
    //
    // The Viewing model is authoritative.
    //
    // Canonical scheduled viewing states:
    //
    //   Approved
    //   Rescheduled
    //
    // ======================================================

    const viewingAggregation =
      await Viewing.aggregate([

        {
          $match: {

            organizationId:
              organizationObjectId,

            status: {
              $in: [
                "Approved",
                "Rescheduled",
              ],
            },

          },
        },

        {
          $group: {

            _id:
              null,

            scheduledViewings: {
              $sum: 1,
            },

          },

        },

      ]);


    const scheduledViewings =
      viewingAggregation[0]
        ?.scheduledViewings ||
      0;


    // ======================================================
    // PART 8
    // RECENT ACTIVITY
    // ======================================================

    const recentLeads =
      await Lead.find({

        organizationId,

      })
        .sort({

          updatedAt:
            -1,

        })
        .limit(10)
        .select(
          "name status score updatedAt assignedTo currentViewing followUpStatus"
        )
        .populate(
          "assignedTo",
          "name"
        )
        .lean();


    const recentActivity =
      recentLeads.map(
        (lead) => ({

          id:
            lead._id,

          customer:
            lead.name,

          status:
            lead.status,

          score:
            Number(
              lead.score ||
              0
            ),

          category:
            lead.score >=
            HOT_SCORE_THRESHOLD
              ? "hot"
              : lead.score >= 50
                ? "qualified"
                : "new",

          agent:
            lead.assignedTo?.name ||
            "Unassigned",

          currentViewingId:
            lead.currentViewing ||
            null,

          followUpStatus:
            lead.followUpStatus ||
            null,

          time:
            lead.updatedAt,

        })
      );


    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({

      success:
        true,

      data: {

        // -----------------------------------------------
        // KPI DATA
        // -----------------------------------------------

        kpis,

        // -----------------------------------------------
        // CANONICAL LIFECYCLE PIPELINE
        // -----------------------------------------------

        pipelineData,

        // -----------------------------------------------
        // DERIVED PIPELINE METRICS
        // -----------------------------------------------

        pipelineDerived,

        // -----------------------------------------------
        // SOURCES
        // -----------------------------------------------

        sourceData,

        // -----------------------------------------------
        // QUALIFICATION / OUTCOME
        // -----------------------------------------------

        qualificationData,

        // -----------------------------------------------
        // TREND
        // -----------------------------------------------

        monthlyTrend,

        // -----------------------------------------------
        // AI
        // -----------------------------------------------

        aiAnalytics,

        // -----------------------------------------------
        // AGENT PERFORMANCE
        // -----------------------------------------------

        agentLeaderboard,

        // -----------------------------------------------
        // VIEWING WORKFLOW
        // -----------------------------------------------

        viewingAnalytics: {

          scheduled:
            scheduledViewings,

        },

        // -----------------------------------------------
        // RECENT ACTIVITY
        // -----------------------------------------------

        recentActivity,

      },

    });

  } catch (
    error
  ) {

    console.error(
      "Admin dashboard error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      message:
        "Failed to load dashboard analytics.",

      error:
        error.message,

    });
  }
};