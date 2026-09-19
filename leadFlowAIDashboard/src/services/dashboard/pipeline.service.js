/**
 * ============================================================
 *
 * PURPOSE
 * -------
 * Generates Lead Pipeline analytics for the dashboard.
 *
 * USED BY
 * -------
 * AdminDashboardController
 *
 * WORKFLOW
 * --------
 * 1. Receive organizationId
 * 2. Restrict query to that organization
 * 3. Aggregate leads by Lead.status
 * 4. Normalize all supported CRM stages
 * 5. Return ordered pipeline data
 *
 * MULTI-TENANT SECURITY
 * ---------------------
 * organizationId is ALWAYS included in the aggregation filter.
 *
 * LEAD LIFECYCLE
 * --------------
 * new
 * qualified
 * hot
 * follow_up
 * viewing_scheduled
 * closed
 *
 * ============================================================
 */

import Lead from "../../models/lead.js";

// ============================================================
// SUPPORTED PIPELINE STAGES
// ============================================================
//
// Keep this list synchronized with:
// - leadLifeCycleService.js
// - Lead model status enum
// - frontend pipeline components
// - dashboard analytics
//
// ============================================================

const PIPELINE_STAGES = [
  "new",
  "qualified",
  "hot",
  "follow_up",
  "viewing_scheduled",
  "closed",
];

// ============================================================
// GET PIPELINE DATA
// ============================================================

export const getPipelineData = async (organizationId) => {
  try {
    // ========================================================
    // VALIDATE ORGANIZATION
    // ========================================================

    if (!organizationId) {
      console.warn(
        "⚠️ Pipeline analytics skipped: organizationId is missing."
      );

      return PIPELINE_STAGES.map((stage) => ({
        stage,
        count: 0,
      }));
    }

    // ========================================================
    // AGGREGATE LEADS BY STATUS
    // ========================================================
    //
    // IMPORTANT:
    // Only leads belonging to the current organization are
    // included.
    //
    // This prevents one organization's pipeline data from
    // appearing in another organization's dashboard.
    //
    // ========================================================

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

    // ========================================================
    // CREATE STATUS MAP
    // ========================================================

    const pipelineMap = {};

    pipeline.forEach((item) => {
      if (item?._id) {
        pipelineMap[item._id] = Number(item.count || 0);
      }
    });

    // ========================================================
    // NORMALIZE PIPELINE
    // ========================================================
    //
    // Every supported stage is returned even when there are
    // currently no leads in that stage.
    //
    // This keeps the frontend predictable.
    //
    // ========================================================

    const result = PIPELINE_STAGES.map((stage) => ({
      stage,
      count: pipelineMap[stage] || 0,
    }));

    // ========================================================
    // DEBUG LOG
    // ========================================================

    console.log(
      "📊 Lead pipeline generated:",
      {
        organizationId,
        pipeline: result,
      }
    );

    // ========================================================
    // RETURN
    // ========================================================

    return result;
  } catch (error) {
    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Pipeline analytics error:",
      error
    );

    // Safe fallback for dashboard
    return PIPELINE_STAGES.map((stage) => ({
      stage,
      count: 0,
    }));
  }
};

// ============================================================
// EXPORT PIPELINE STAGES
// ============================================================
//
// Exported for testing and for other dashboard services that
// need to maintain the exact same lifecycle definition.
//
// ============================================================

export { PIPELINE_STAGES };