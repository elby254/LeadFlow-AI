/**
 * ============================================================
 *
 * PURPOSE
 * -------
 * Generates AI qualification analytics for the dashboard.
 *
 * USED BY
 * -------
 * - AdminDashboardController
 * - DashboardCharts.jsx
 *
 * QUALIFICATION WORKFLOW
 * ----------------------
 *
 * Lead Score:
 *
 * 70 - 100
 * → HOT
 *
 * 50 - 69
 * → QUALIFIED
 *
 * 0 - 49
 * → NEW / COLD
 *
 * The thresholds intentionally match the latest LeadFlow AI
 * lead scoring and assignment workflow.
 *
 * SOURCE OF TRUTH
 * ---------------
 * Lead.score
 *
 * MULTI-TENANT SECURITY
 * ---------------------
 * Only leads belonging to the supplied organizationId
 * are included.
 *
 * ============================================================
 */

import Lead from "../../models/lead.js";

// ============================================================
// QUALIFICATION THRESHOLDS
// ============================================================
//
// Keep these aligned with:
//
// - leadScoringRulesEngine.js
// - leadLifeCycleService.js
// - leadAutoAssignmentService.js
//
// ============================================================

const HOT_SCORE_THRESHOLD = 70;
const QUALIFIED_SCORE_THRESHOLD = 50;

// ============================================================
// GET QUALIFICATION DATA
// ============================================================
//
// Returns chart-ready qualification distribution.
//
// ============================================================

export const getQualificationData = async (
  organizationId
) => {
  try {
    // ========================================================
    // VALIDATE ORGANIZATION
    // ========================================================

    if (!organizationId) {
      console.log(
        "⚠️ Qualification analytics skipped: organizationId is missing."
      );

      return [
        {
          qualification: "Hot",
          count: 0,
        },
        {
          qualification: "Qualified",
          count: 0,
        },
        {
          qualification: "New",
          count: 0,
        },
      ];
    }

    // ========================================================
    // FETCH LEAD SCORES
    // ========================================================
    //
    // Only retrieve fields required by this analytics service.
    //
    // Organization filtering is mandatory for SaaS isolation.
    //
    // ========================================================

    const leads = await Lead.find({
      organizationId,
    }).select("score");

    // ========================================================
    // COUNTERS
    // ========================================================

    let hot = 0;
    let qualified = 0;
    let newLeads = 0;

    // ========================================================
    // CLASSIFY LEADS
    // ========================================================

    for (const lead of leads) {
      // ------------------------------------------------------
      // Normalize score
      // ------------------------------------------------------

      const score = Number(lead.score || 0);

      // ------------------------------------------------------
      // HOT
      // ------------------------------------------------------

      if (score >= HOT_SCORE_THRESHOLD) {
        hot++;
        continue;
      }

      // ------------------------------------------------------
      // QUALIFIED
      // ------------------------------------------------------

      if (
        score >= QUALIFIED_SCORE_THRESHOLD
      ) {
        qualified++;
        continue;
      }

      // ------------------------------------------------------
      // NEW / COLD
      // ------------------------------------------------------

      newLeads++;
    }

    // ========================================================
    // CHART-READY RESPONSE
    // ========================================================

    return [
      {
        qualification: "Hot",
        count: hot,
      },
      {
        qualification: "Qualified",
        count: qualified,
      },
      {
        qualification: "New",
        count: newLeads,
      },
    ];

  } catch (error) {
    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "❌ Qualification analytics error:",
      error
    );

    // Safe dashboard fallback
    return [
      {
        qualification: "Hot",
        count: 0,
      },
      {
        qualification: "Qualified",
        count: 0,
      },
      {
        qualification: "New",
        count: 0,
      },
    ];
  }
};

// ============================================================
// EXPORT THRESHOLDS
// ============================================================
//
// Exported for testing or future dashboard services.
// ============================================================

export {
  HOT_SCORE_THRESHOLD,
  QUALIFIED_SCORE_THRESHOLD,
};