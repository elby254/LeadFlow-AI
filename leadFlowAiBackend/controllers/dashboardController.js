/**
 * =====================================================
 *
 * DASHBOARD CONTROLLER
 *
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
 * =====================================================
 *
 * CANONICAL ARCHITECTURE
 * =====================================================
 *
 * Lead lifecycle:
 *
 *   services/leadLifeCycleService.js
 *
 * Lead scoring:
 *
 *   services/leadScoringRulesEngine.js
 *
 * Viewing workflow:
 *
 *   Viewing.status
 *
 * Follow-up:
 *
 *   Lead.followUpStatus
 *
 * Successful conversion:
 *
 *   Lead.status === "won"
 *
 * Lost conversion:
 *
 *   Lead.status === "lost"
 *
 * HOT:
 *
 *   Lead.score >= HOT_SCORE_THRESHOLD
 *
 * IMPORTANT
 * -----------------------------------------------------
 * This controller is READ-ONLY with respect to lead
 * lifecycle, scoring and viewing workflow.
 *
 * It must NOT mutate:
 *
 *   lead.status
 *   lead.score
 *   lead.assignedTo
 *
 * =====================================================
 */

import mongoose from "mongoose";

import Lead from "../models/lead.js";
import Viewing, {
  VIEWING_STATUS,
  VIEWING_REQUEST_STATUSES,
  VIEWING_SCHEDULED_STATUSES,
} from "../models/viewing.js";

import {
  resolveFromRequest,
} from "../services/organizationResolverService.js";

import {
  LEAD_STATUS,
} from "../services/leadLifeCycleService.js";

import {
  HOT_SCORE_THRESHOLD,
  getLeadCategory,
} from "../services/leadScoringRulesEngine.js";


// =====================================================
// HELPER: VIEWING DATE
// =====================================================
//
// The canonical viewing date is Viewing.viewingDate.
//
// startTime is stored separately as a string.
//
// This helper is intentionally conservative:
// it first uses viewingDate and, when the time is usable,
// applies the configured viewing time.
//
// =====================================================

const getViewingStartDate = (
  viewing
) => {

  if (
    !viewing?.viewingDate
  ) {

    return null;
  }


  const baseDate =
    new Date(
      viewing.viewingDate
    );


  if (
    Number.isNaN(
      baseDate.getTime()
    )
  ) {

    return null;
  }


  const startTime =
    String(
      viewing.startTime ||
      ""
    ).trim();


  const match =
    startTime.match(
      /^(\d{1,2}):(\d{2})$/
    );


  if (
    match
  ) {

    const hours =
      Number(
        match[1]
      );

    const minutes =
      Number(
        match[2]
      );


    if (
      Number.isInteger(
        hours
      ) &&
      Number.isInteger(
        minutes
      ) &&
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {

      baseDate.setHours(
        hours,
        minutes,
        0,
        0
      );
    }
  }


  return baseDate;
};


// =====================================================
// HELPER: UPCOMING VIEWING
// =====================================================

const isUpcomingViewing = (
  viewing,
  now = new Date()
) => {

  if (
    !VIEWING_SCHEDULED_STATUSES.includes(
      viewing?.status
    )
  ) {

    return false;
  }


  const viewingStart =
    getViewingStartDate(
      viewing
    );


  if (
    !viewingStart
  ) {

    return false;
  }


  return (
    viewingStart >=
    now
  );
};


// =====================================================
// HELPER: ORGANIZATION RESOLUTION
// =====================================================
//
// Resolve the authenticated organization through the
// centralized organization resolver.
//
// Controllers must NOT resolve tenant identity directly
// from req.user.organizationId or req.organizationId.
//
// =====================================================

const getAuthenticatedOrganizationId =
  async (
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


// =====================================================
// HELPER: SAFE SCORE
// =====================================================

const getSafeScore = (
  lead
) => {

  const score =
    Number(
      lead?.score ||
      0
    );


  if (
    !Number.isFinite(
      score
    )
  ) {

    return 0;
  }


  return Math.max(

    0,

    Math.min(
      100,
      score
    )

  );
};


// =====================================================
// HELPER: HOT LEAD
// =====================================================

const isHotLead = (
  lead
) => {

  return (
    getSafeScore(
      lead
    ) >=
    HOT_SCORE_THRESHOLD
  );
};


// =====================================================
// HELPER: WON LEAD
// =====================================================

const isWonLead = (
  lead
) => {

  return (
    lead?.status ===
    LEAD_STATUS.WON
  );
};


// =====================================================
// HELPER: LOST LEAD
// =====================================================

const isLostLead = (
  lead
) => {

  return (
    lead?.status ===
    LEAD_STATUS.LOST
  );
};


// =====================================================
// HELPER: ACTIVE LEAD
// =====================================================

const isActiveLead = (
  lead
) => {

  return (
    !isWonLead(
      lead
    ) &&
    !isLostLead(
      lead
    )
  );
};


// =====================================================
// HELPER: SAFE PERCENTAGE
// =====================================================

const percentage = (
  numerator,
  denominator
) => {

  if (
    !denominator
  ) {

    return 0;
  }


  return Number(

    (
      (
        numerator /
        denominator
      ) *
      100

    ).toFixed(
      2
    )

  );
};


// =====================================================
// DASHBOARD SUMMARY
// =====================================================
//
// GET /api/dashboard/summary
//
// Returns organization-wide dashboard metrics.
//
// =====================================================

export const getDashboardSummary =
  async (
    req,
    res
  ) => {

    try {

      const organizationId =
        await getAuthenticatedOrganizationId(
          req
        );


      if (
        !organizationId
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Organization ID is required.",

        });
      }


      const [
        leads,
        viewings,
      ] =
        await Promise.all([

          Lead.find({

            organizationId,

          })
            .lean(),

          Viewing.find({

            organizationId,

            isArchived: {
              $ne:
                true,
            },

          })
            .lean(),

        ]);


      // ==================================================
      // LEAD METRICS
      // ==================================================

      const totalLeads =
        leads.length;


      const newInquiries =
        leads.filter(

          (lead) =>
            lead.status ===
            LEAD_STATUS.NEW

        ).length;


      const qualifiedLeads =
        leads.filter(

          (lead) =>
            lead.status ===
            LEAD_STATUS.QUALIFIED

        ).length;


      const viewingLeads =
        leads.filter(

          (lead) =>
            lead.status ===
            LEAD_STATUS.VIEWING

        ).length;


      const negotiationLeads =
        leads.filter(

          (lead) =>
            lead.status ===
            LEAD_STATUS.NEGOTIATION

        ).length;


      const wonLeads =
        leads.filter(
          isWonLead
        ).length;


      const lostLeads =
        leads.filter(
          isLostLead
        ).length;


      const activeLeads =
        leads.filter(
          isActiveLead
        ).length;


      // ==================================================
      // CONTACTED LEADS
      // ==================================================

      const contactedLeads =
        leads.filter(

          (lead) =>
            lead.status ===
            LEAD_STATUS.CONTACTED

        ).length;


      // ==================================================
      // HOT LEADS
      // ==================================================

      const hotLeads =
        leads.filter(
          isHotLead
        ).length;


      // ==================================================
      // VIEWING METRICS
      // ==================================================

      const requestedViewings =
        viewings.filter(

          (viewing) =>
            VIEWING_REQUEST_STATUSES.includes(
              viewing.status
            )

        ).length;


      const scheduledViewings =
        viewings.filter(

          (viewing) =>
            VIEWING_SCHEDULED_STATUSES.includes(
              viewing.status
            )

        ).length;


      const upcomingViewings =
        viewings.filter(

          (viewing) =>
            isUpcomingViewing(
              viewing
            )

        ).length;


      const completedViewings =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.COMPLETED

        ).length;


      const cancelledViewings =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.CANCELLED

        ).length;


      const rejectedViewings =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.REJECTED

        ).length;


      const pendingApprovalViewings =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.PENDING_APPROVAL

        ).length;


      // ==================================================
      // FOLLOW-UP
      // ==================================================

      const followUpLeads =
        leads.filter(

          (lead) =>

            [

              "pending",

              "scheduled",

            ].includes(

              String(
                lead.followUpStatus ||
                ""
              )
                .trim()
                .toLowerCase()

            )

        ).length;


      // ==================================================
      // ASSIGNMENT
      // ==================================================

      const assignedLeads =
        leads.filter(

          (lead) =>
            Boolean(
              lead.assignedTo
            )

        ).length;


      const unassignedLeads =
        leads.filter(

          (lead) =>
            !lead.assignedTo

        ).length;


      // ==================================================
      // CONVERSION
      // ==================================================

      /**
       * Canonical successful conversion:
       *
       *   won / total
       */

      const conversionRate =
        percentage(

          wonLeads,

          totalLeads

        );


      /**
       * Qualified rate remains a separate KPI.
       */

      const qualificationRate =
        percentage(

          qualifiedLeads,

          totalLeads

        );


      const lossRate =
        percentage(

          lostLeads,

          totalLeads

        );


      // ==================================================
      // PIPELINE HEALTH
      // ==================================================
      //
      // Dashboard-derived indicator only.
      //
      // It is NOT the lifecycle authority.
      //
      // ==================================================

      const pipelineHealth =
        totalLeads === 0

          ? 0

          : Number(

              (

                (

                  hotLeads * 4 +

                  qualifiedLeads * 2 +

                  completedViewings * 5

                ) /

                totalLeads

              ).toFixed(
                2
              )

            );


      // ==================================================
      // ACTIVE PIPELINE RATE
      // ==================================================

      const activePipelineRate =
        percentage(

          activeLeads,

          totalLeads

        );


      return res.json({

        success:
          true,

        data: {

          totalLeads,

          activeLeads,

          newInquiries,

          contactedLeads,

          qualifiedLeads,

          viewingLeads,

          negotiationLeads,

          wonLeads,

          lostLeads,

          hotLeads,

          requestedViewings,

          pendingApprovalViewings,

          scheduledViewings,

          upcomingViewings,

          completedViewings,

          cancelledViewings,

          rejectedViewings,

          followUpLeads,

          assignedLeads,

          unassignedLeads,

          conversionRate,

          qualificationRate,

          lossRate,

          activePipelineRate,

          pipelineHealth,

          hotScoreThreshold:
            HOT_SCORE_THRESHOLD,

        },

      });

    } catch (
      error
    ) {

      console.error(

        "Dashboard summary error:",

        error

      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  };


// =====================================================
// LEAD PIPELINE
// =====================================================
//
// GET /api/dashboard/pipeline
//
// Uses ONLY canonical Lead.status values.
//
// Hot, follow-up and viewing sub-states are deliberately
// excluded from lifecycle pipeline stages.
//
// =====================================================

export const getLeadPipeline =
  async (
    req,
    res
  ) => {

    try {

      const organizationId =
        await getAuthenticatedOrganizationId(
          req
        );


      if (
        !organizationId
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Organization ID is required.",

        });
      }


      const leads =
        await Lead.find({

          organizationId,

        })
          .lean();


      const pipeline = [

        {

          stage:
            "New",

          status:
            LEAD_STATUS.NEW,

          value:
            leads.filter(

              (lead) =>
                lead.status ===
                LEAD_STATUS.NEW

            ).length,

        },


        {

          stage:
            "Contacted",

          status:
            LEAD_STATUS.CONTACTED,

          value:
            leads.filter(

              (lead) =>
                lead.status ===
                LEAD_STATUS.CONTACTED

            ).length,

        },


        {

          stage:
            "Qualified",

          status:
            LEAD_STATUS.QUALIFIED,

          value:
            leads.filter(

              (lead) =>
                lead.status ===
                LEAD_STATUS.QUALIFIED

            ).length,

        },


        {

          stage:
            "Viewing",

          status:
            LEAD_STATUS.VIEWING,

          value:
            leads.filter(

              (lead) =>
                lead.status ===
                LEAD_STATUS.VIEWING

            ).length,

        },


        {

          stage:
            "Negotiation",

          status:
            LEAD_STATUS.NEGOTIATION,

          value:
            leads.filter(

              (lead) =>
                lead.status ===
                LEAD_STATUS.NEGOTIATION

            ).length,

        },


        {

          stage:
            "Won",

          status:
            LEAD_STATUS.WON,

          value:
            leads.filter(
              isWonLead
            ).length,

        },


        {

          stage:
            "Lost",

          status:
            LEAD_STATUS.LOST,

          value:
            leads.filter(
              isLostLead
            ).length,

        },

      ];


      return res.json({

        success:
          true,

        data:
          pipeline,

      });

    } catch (
      error
    ) {

      console.error(

        "Lead pipeline error:",

        error

      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  };


// =====================================================
// AGENT PERFORMANCE
// =====================================================
//
// GET /api/dashboard/agent/:id
//
// Agent metrics are explicitly scoped to the authenticated
// organization.
//
// =====================================================

export const getAgentPerformance =
  async (
    req,
    res
  ) => {

    try {

      const organizationId =
        await getAuthenticatedOrganizationId(
          req
        );


      const agentId =
        req.params.id;


      if (
        !organizationId
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Organization ID is required.",

        });
      }


      if (
        !agentId
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Agent ID is required.",

        });
      }


      if (
        !mongoose.Types.ObjectId.isValid(
          agentId
        )
      ) {

        return res.status(400).json({

          success:
            false,

          error:
            "Invalid Agent ID.",

        });
      }


      const [
        leads,
        viewings,
      ] =
        await Promise.all([

          Lead.find({

            organizationId,

            assignedTo:
              agentId,

          })
            .lean(),


          Viewing.find({

            organizationId,

            agent:
              agentId,

            isArchived: {
              $ne:
                true,
            },

          })
            .lean(),

        ]);


      const totalAssigned =
        leads.length;


      const activeLeads =
        leads.filter(
          isActiveLead
        ).length;


      const hotLeads =
        leads.filter(
          isHotLead
        ).length;


      const wonLeads =
        leads.filter(
          isWonLead
        ).length;


      const lostLeads =
        leads.filter(
          isLostLead
        ).length;


      // ==================================================
      // BACKWARD COMPATIBILITY
      // ==================================================

      const closedLeads =
        wonLeads;


      // ==================================================
      // QUALIFICATION
      // ==================================================

      const qualifiedLeads =
        leads.filter(

          (lead) =>
            lead.status ===
            LEAD_STATUS.QUALIFIED

        ).length;


      // ==================================================
      // VIEWINGS
      // ==================================================

      const completedViewings =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.COMPLETED

        ).length;


      const requestedViewings =
        viewings.filter(

          (viewing) =>
            VIEWING_REQUEST_STATUSES.includes(
              viewing.status
            )

        ).length;


      const upcomingViewings =
        viewings.filter(

          (viewing) =>
            isUpcomingViewing(
              viewing
            )

        ).length;


      const scheduledViewings =
        viewings.filter(

          (viewing) =>
            VIEWING_SCHEDULED_STATUSES.includes(
              viewing.status
            )

        ).length;


      const cancelledViewings =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.CANCELLED

        ).length;


      // ==================================================
      // PERFORMANCE
      // ==================================================

      const successRate =
        percentage(

          wonLeads,

          totalAssigned

        );


      const lossRate =
        percentage(

          lostLeads,

          totalAssigned

        );


      const qualificationRate =
        percentage(

          qualifiedLeads,

          totalAssigned

        );


      return res.json({

        success:
          true,

        data: {

          agentId,

          organizationId,

          totalAssigned,

          activeLeads,

          qualifiedLeads,

          hotLeads,

          wonLeads,

          closedLeads,

          lostLeads,

          requestedViewings,

          scheduledViewings,

          completedViewings,

          cancelledViewings,

          upcomingViewings,

          workload:
            totalAssigned +
            upcomingViewings,

          successRate,

          lossRate,

          qualificationRate,

          hotScoreThreshold:
            HOT_SCORE_THRESHOLD,

        },

      });

    } catch (
      error
    ) {

      console.error(

        "Agent performance error:",

        error

      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  };


// =====================================================
// AI INSIGHTS
// =====================================================
//
// GET /api/dashboard/ai-insights
//
// Score categories:
//
//   0–49   = new
//   50–79  = qualified
//   80–100 = hot
//
// These are SCORE categories.
//
// They are not Lead.status values.
//
// =====================================================

export const getAIInsights =
  async (
    req,
    res
  ) => {

    try {

      const organizationId =
        await getAuthenticatedOrganizationId(
          req
        );


      if (
        !organizationId
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Organization ID is required.",

        });
      }


      const leads =
        await Lead.find({

          organizationId,

        })
          .lean();


      const totalLeads =
        leads.length;


      // ==================================================
      // SCORE CATEGORY BREAKDOWN
      // ==================================================

      const scoreCategories =
        leads.map(

          (lead) => {

            const score =
              getSafeScore(
                lead
              );


            return {

              lead,

              score,

              category:
                getLeadCategory(
                  score
                ),

            };

          }

        );


      const highQuality =
        scoreCategories.filter(

          ({
            category,
          }) =>
            category ===
            "hot"

        ).length;


      const mediumQuality =
        scoreCategories.filter(

          ({
            category,
          }) =>
            category ===
            "qualified"

        ).length;


      const lowQuality =
        scoreCategories.filter(

          ({
            category,
          }) =>
            category ===
            "new"

        ).length;


      // ==================================================
      // SCORED LEADS
      // ==================================================

      const scoredLeads =
        leads.filter(

          (lead) =>
            getSafeScore(
              lead
            ) > 0

        );


      const totalScore =
        leads.reduce(

          (
            sum,
            lead
          ) =>

            sum +
            getSafeScore(
              lead
            ),

          0

        );


      const averageScore =
        totalLeads === 0

          ? 0

          : Number(

              (

                totalScore /
                totalLeads

              ).toFixed(
                2
              )

            );


      // ==================================================
      // HOT RATIO
      // ==================================================

      const hotLeadRatio =
        percentage(

          highQuality,

          totalLeads

        );


      // ==================================================
      // SCORING COVERAGE
      // ==================================================

      const scoringCoverage =
        percentage(

          scoredLeads.length,

          totalLeads

        );


      // ==================================================
      // WON FROM SCORED LEADS
      // ==================================================

      const scoredAndWon =
        scoredLeads.filter(
          isWonLead
        ).length;


      const scoredConversionRate =
        percentage(

          scoredAndWon,

          scoredLeads.length

        );


      // ==================================================
      // AI EFFECTIVENESS
      // ==================================================
      //
      // Dashboard-derived label only.
      //
      // It does not modify any lead state.
      //
      // ==================================================

      const aiEffectiveness =
        scoringCoverage >= 80 &&
        scoredConversionRate > 0

          ? "strong"

          : "needs improvement";


      return res.json({

        success:
          true,

        data: {

          totalLeads,

          averageScore,

          highQuality,

          mediumQuality,

          lowQuality,

          hotLeads:
            highQuality,

          qualifiedScoreLeads:
            mediumQuality,

          newScoreLeads:
            lowQuality,

          scoredLeads:
            scoredLeads.length,

          scoringCoverage,

          hotLeadRatio,

          scoredAndWon,

          scoredConversionRate,

          hotScoreThreshold:
            HOT_SCORE_THRESHOLD,

          aiEffectiveness,

        },

      });

    } catch (
      error
    ) {

      console.error(

        "AI insights error:",

        error

      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  };


// =====================================================
// DASHBOARD NOTIFICATIONS
// =====================================================
//
// GET /api/dashboard/notifications
//
// =====================================================

export const getDashboardNotifications =
  async (
    req,
    res
  ) => {

    try {

      const organizationId =
        await getAuthenticatedOrganizationId(
          req
        );


      if (
        !organizationId
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Organization ID is required.",

        });
      }


      const [
        leads,
        viewings,
      ] =
        await Promise.all([

          Lead.find({

            organizationId,

          })
            .sort({

              createdAt:
                -1,

            })
            .limit(
              20
            )
            .lean(),


          Viewing.find({

            organizationId,

            isArchived: {
              $ne:
                true,
            },

          })
            .sort({

              updatedAt:
                -1,

            })
            .limit(
              30
            )
            .lean(),

        ]);


      const notifications =
        [];


      // ==================================================
      // NEW LEADS
      // ==================================================

      leads

        .filter(

          (lead) =>
            lead.status ===
            LEAD_STATUS.NEW

        )

        .slice(
          0,
          5
        )

        .forEach(

          (lead) => {

            const customerName =
              lead.name ||
              "A customer";


            notifications.push({

              id:
                `lead-${lead._id}`,

              type:
                "lead",

              priority:
                "high",

              title:
                "New Lead",

              message:
                `${customerName} submitted a new inquiry.`,

              referenceId:
                lead._id,

              action:
                "View Lead",

              route:
                `/agent/leads/${lead._id}`,

              createdAt:
                lead.createdAt ||
                new Date(),

              read:
                false,

            });

          }

        );


      // ==================================================
      // PENDING VIEWING REQUESTS
      // ==================================================

      viewings

        .filter(

          (viewing) =>
            VIEWING_REQUEST_STATUSES.includes(
              viewing.status
            )

        )

        .slice(
          0,
          5
        )

        .forEach(

          (viewing) => {

            notifications.push({

              id:
                `viewing-${viewing._id}`,

              type:
                "viewing",

              priority:
                "high",

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

              read:
                false,

            });

          }

        );


      // ==================================================
      // APPROVED VIEWINGS
      // ==================================================

      viewings

        .filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.APPROVED

        )

        .slice(
          0,
          5
        )

        .forEach(

          (viewing) => {

            notifications.push({

              id:
                `approved-${viewing._id}`,

              type:
                "viewing",

              priority:
                "medium",

              title:
                "Viewing Approved",

              message:
                "A property viewing has been approved and is ready for its scheduled time.",

              referenceId:
                viewing._id,

              action:
                "View Details",

              route:
                `/admin/viewings/${viewing._id}`,

              createdAt:
                viewing.updatedAt ||
                new Date(),

              read:
                false,

            });

          }

        );


      // ==================================================
      // RESCHEDULED VIEWINGS
      // ==================================================

      viewings

        .filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.RESCHEDULED

        )

        .slice(
          0,
          5
        )

        .forEach(

          (viewing) => {

            notifications.push({

              id:
                `rescheduled-${viewing._id}`,

              type:
                "viewing",

              priority:
                "medium",

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

              read:
                false,

            });

          }

        );


      // ==================================================
      // SORT
      // ==================================================

      notifications.sort(

        (
          first,
          second
        ) =>

          new Date(
            second.createdAt
          ) -

          new Date(
            first.createdAt
          )

      );


      const unreadCount =
        notifications.filter(

          (notification) =>
            notification.read ===
            false

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

        success:
          true,

        data: {

          notifications,

          summary:
            notificationSummary,

        },

      });

    } catch (
      error
    ) {

      console.error(

        "Dashboard notifications error:",

        error

      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  };


// =====================================================
// RECENT ACTIVITY
// =====================================================
//
// GET /api/dashboard/recent-activity
//
// Builds recent activity from existing Lead and
// Viewing records.
//
// This intentionally does NOT depend on an ActivityLog
// model.
//
// =====================================================

export const getRecentActivity =
  async (
    req,
    res
  ) => {

    try {

      const organizationId =
        await getAuthenticatedOrganizationId(
          req
        );


      if (
        !organizationId
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Organization ID is required.",

        });
      }


      const [
        leads,
        viewings,
      ] =
        await Promise.all([

          Lead.find({

            organizationId,

          })
            .sort({

              createdAt:
                -1,

            })
            .limit(
              10
            )
            .lean(),


          Viewing.find({

            organizationId,

            isArchived: {
              $ne:
                true,
            },

          })
            .sort({

              updatedAt:
                -1,

            })
            .limit(
              10
            )
            .lean(),

        ]);


      const activities =
        [];


      // ==================================================
      // LEAD ACTIVITY
      // ==================================================

      leads.forEach(

        (lead) => {

          const customerName =
            lead.name ||
            "Customer";


          activities.push({

            _id:
              `lead-${lead._id}`,

            type:
              "lead",

            title:
              "New Lead",

            description:
              `${customerName} submitted a property inquiry.`,

            createdAt:
              lead.createdAt ||
              new Date(),

          });

        }

      );


      // ==================================================
      // VIEWING ACTIVITY
      // ==================================================

      viewings.forEach(

        (viewing) => {

          let title =
            "Viewing Updated";


          let description =
            "A property viewing was updated.";


          switch (
            viewing.status
          ) {

            case VIEWING_STATUS.REQUESTED:

              title =
                "Viewing Requested";

              description =
                "A customer requested a property viewing.";

              break;


            case VIEWING_STATUS.PENDING_APPROVAL:

              title =
                "Viewing Pending Approval";

              description =
                "A property viewing is awaiting approval.";

              break;


            case VIEWING_STATUS.APPROVED:

              title =
                "Viewing Approved";

              description =
                "A property viewing has been approved.";

              break;


            case VIEWING_STATUS.RESCHEDULED:

              title =
                "Viewing Rescheduled";

              description =
                "A property viewing was rescheduled.";

              break;


            case VIEWING_STATUS.COMPLETED:

              title =
                "Viewing Completed";

              description =
                "A property viewing was completed.";

              break;


            case VIEWING_STATUS.CANCELLED:

              title =
                "Viewing Cancelled";

              description =
                "A property viewing was cancelled.";

              break;


            case VIEWING_STATUS.REJECTED:

              title =
                "Viewing Rejected";

              description =
                "A property viewing request was rejected.";

              break;


            default:

              break;

          }


          activities.push({

            _id:
              `viewing-${viewing._id}`,

            type:
              "viewing",

            title,

            description,

            createdAt:
              viewing.updatedAt ||
              viewing.createdAt ||
              new Date(),

          });

        }

      );


      // ==================================================
      // SORT
      // ==================================================

      activities.sort(

        (
          first,
          second
        ) =>

          new Date(
            second.createdAt
          ) -

          new Date(
            first.createdAt
          )

      );


      const recentActivities =
        activities.slice(
          0,
          20
        );


      return res.json({

        success:
          true,

        data:
          recentActivities,

      });

    } catch (
      error
    ) {

      console.error(

        "Recent activity error:",

        error

      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  };


// =====================================================
// VIEWING ANALYTICS
// =====================================================
//
// GET /api/dashboard/viewings
//
// Viewing analytics use Viewing.status.
//
// They do NOT use Lead.status or Lead.viewingStatus.
//
// =====================================================

export const getViewingAnalytics =
  async (
    req,
    res
  ) => {

    try {

      const organizationId =
        await getAuthenticatedOrganizationId(
          req
        );


      if (
        !organizationId
      ) {

        return res.status(401).json({

          success:
            false,

          error:
            "Organization ID is required.",

        });
      }


      const viewings =
        await Viewing.find({

          organizationId,

          isArchived: {
            $ne:
              true,
          },

        })
          .sort({

            createdAt:
              -1,

          })
          .lean();


      // ==================================================
      // STATUS COUNTS
      // ==================================================

      const requested =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.REQUESTED

        ).length;


      const pendingApproval =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.PENDING_APPROVAL

        ).length;


      const approved =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.APPROVED

        ).length;


      const rescheduled =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.RESCHEDULED

        ).length;


      const completed =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.COMPLETED

        ).length;


      const cancelled =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.CANCELLED

        ).length;


      const rejected =
        viewings.filter(

          (viewing) =>
            viewing.status ===
            VIEWING_STATUS.REJECTED

        ).length;


      // ==================================================
      // TOTAL
      // ==================================================

      const totalViewings =
        viewings.length;


      // ==================================================
      // WORKFLOW GROUPS
      // ==================================================

      const scheduled =
        viewings.filter(

          (viewing) =>
            VIEWING_SCHEDULED_STATUSES.includes(
              viewing.status
            )

        ).length;


      const upcomingViewings =
        viewings.filter(

          (viewing) =>
            isUpcomingViewing(
              viewing
            )

        ).length;


      const pendingViewings =
        viewings.filter(

          (viewing) =>
            VIEWING_REQUEST_STATUSES.includes(
              viewing.status
            )

        ).length;


      // ==================================================
      // RATES
      // ==================================================

      const approvalRate =
        totalViewings === 0

          ? 0

          : Number(

              (
                (
                  approved /
                  totalViewings
                ) *
                100

              ).toFixed(
                2
              )

            );


      const completionRate =
        totalViewings === 0

          ? 0

          : Number(

              (
                (
                  completed /
                  totalViewings
                ) *
                100

              ).toFixed(
                2
              )

            );


      const cancellationRate =
        totalViewings === 0

          ? 0

          : Number(

              (
                (
                  cancelled /
                  totalViewings
                ) *
                100

              ).toFixed(
                2
              )

            );


      const rejectionRate =
        totalViewings === 0

          ? 0

          : Number(

              (
                (
                  rejected /
                  totalViewings
                ) *
                100

              ).toFixed(
                2
              )

            );


      // ==================================================
      // TERMINAL OUTCOMES
      // ==================================================

      const terminalViewings =
        completed +
        cancelled +
        rejected;


      const successfulOutcomeRate =
        terminalViewings === 0

          ? 0

          : Number(

              (
                (
                  completed /
                  terminalViewings
                ) *
                100

              ).toFixed(
                2
              )

            );


      // ==================================================
      // WORKFLOW HEALTH
      // ==================================================
      //
      // Dashboard-derived metric only.
      //
      // It does not modify viewing or lead state.
      //
      // ==================================================

      const workflowHealth =
        totalViewings === 0

          ? 0

          : Number(

              (

                (
                  approved * 2 +

                  completed * 4 +

                  rescheduled

                ) /
                totalViewings

              ).toFixed(
                2
              )

            );


      return res.json({

        success:
          true,

        data: {

          totalViewings,

          requested,

          pendingApproval,

          pendingViewings,

          approved,

          rescheduled,

          scheduled,

          completed,

          cancelled,

          rejected,

          upcomingViewings,

          approvalRate,

          completionRate,

          cancellationRate,

          rejectionRate,

          successfulOutcomeRate,

          workflowHealth,

        },

      });

    } catch (
      error
    ) {

      console.error(

        "Viewing analytics error:",

        error

      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  };


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {

  getDashboardSummary,

  getLeadPipeline,

  getAgentPerformance,

  getAIInsights,

  getDashboardNotifications,

  getRecentActivity,

  getViewingAnalytics,

};