/**
 * Generates live operational alerts for the Admin Dashboard.
 *
 * Called by:
 *
 * getAdminDashboard()
 *
 * ===============================================================
 */

import Lead from "../models/lead.js";
import User from "../models/user.js";
import FollowUp from "../models/followUp.js";

export const generateAgencyAlerts = async (organizationId) => {

  const alerts = [];

  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  //----------------------------------------------------
  // Overdue Follow-ups
  //----------------------------------------------------

  const overdueFollowUps =
    await FollowUp.countDocuments({

      organizationId,

      completed: false,

      nextFollowUp: {

        $lt: new Date(),

      },

    });

  if (overdueFollowUps > 0) {

    alerts.push({

      id: "overdue",

      type: "danger",

      icon: "🔴",

      title: "Overdue Follow-ups",

      message: `${overdueFollowUps} follow-ups require immediate attention.`,

    });

  }

  //----------------------------------------------------
  // Inactive Agents
  //----------------------------------------------------

  const inactiveAgents =
    await User.countDocuments({

      organizationId,

      role: "agent",

      lastLogin: {

        $lt: todayStart,

      },

    });

  if (inactiveAgents > 0) {

    alerts.push({

      id: "inactive",

      type: "warning",

      icon: "🟡",

      title: "Inactive Agents",

      message: `${inactiveAgents} agents have no activity today.`,

    });

  }

  //----------------------------------------------------
  // New Leads Today
  //----------------------------------------------------

  const newLeads =
    await Lead.countDocuments({

      organizationId,

      createdAt: {

        $gte: todayStart,

      },

    });

  if (newLeads > 0) {

    alerts.push({

      id: "newLeads",

      type: "info",

      icon: "🔵",

      title: "New Leads",

      message: `${newLeads} new leads arrived today.`,

    });

  }

  //----------------------------------------------------
  // Hot Leads Waiting
  //----------------------------------------------------

  const waitingHotLeads =
    await Lead.countDocuments({

      organizationId,

      status: "new",

      aiScore: {

        $gte: 90,

      },

    });

  if (waitingHotLeads > 0) {

    alerts.push({

      id: "hot",

      type: "warning",

      icon: "🔥",

      title: "Hot Leads Waiting",

      message: `${waitingHotLeads} high-value leads have not been contacted.`,

    });

  }

  //----------------------------------------------------
  // Closed Deals
  //----------------------------------------------------

  const closedDeals =
    await Lead.countDocuments({

      organizationId,

      status: "closed",

      updatedAt: {

        $gte: todayStart,

      },

    });

  if (closedDeals >= 5) {

    alerts.push({

      id: "pipeline",

      type: "success",

      icon: "🟢",

      title: "Pipeline Milestone",

      message: `${closedDeals} deals closed today.`,

    });

  }

  //----------------------------------------------------

  return alerts;

};

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default generateAgencyAlerts;