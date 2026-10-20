// ==========================================================
// USE LEADS
// ==========================================================
//
// Central hook for LeadFlow AI lead-related data.
//
// Responsibilities:
// • Organization-visible leads
// • Agent-assigned leads
// • Hot leads
// • Follow-up leads
// • New leads
// • Loading and error handling
// • Refresh operations
// • Socket.IO real-time updates
//
// Access strategy:
// • Admin: organization-visible lead collection
// • Agent: organization-visible and assigned lead collections
// • Viewer: organization-visible collection, subject to
//   backend authorization
//
// The backend remains the source of truth for authorization.
//
// ==========================================================

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import socket from "../services/socketClient";
import useAuth from "./useAuth";

import {
  getLeads,
  getMyLeads,
  getHotLeads,
  getFollowUpLeads,
  getNewLeads,
} from "../services/leadService";

// ==========================================================
// RESPONSE NORMALIZATION
// ==========================================================

const normalizeLeadCollection = (result) => {
  // Some service functions return an array directly.
  if (Array.isArray(result)) {
    return result;
  }

  // Other functions return the API response object.
  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
};

// ==========================================================
// HOOK
// ==========================================================

const useLeads = () => {
  const { user, loading: authLoading } = useAuth();

  const role = String(
    user?.role || ""
  ).trim().toLowerCase();

  // --------------------------------------------------------
  // STATE
  // --------------------------------------------------------

  const [leads, setLeads] = useState([]);
  const [hotLeads, setHotLeads] = useState([]);
  const [followUpLeads, setFollowUpLeads] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [newLeads, setNewLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------------------------------------------
  // REFRESH LEAD DATA
  // --------------------------------------------------------

  const refreshLeads = useCallback(async () => {
    // Do not request protected data before authentication
    // restoration has completed.
    if (authLoading) {
      return;
    }

    if (!user) {
      setLeads([]);
      setHotLeads([]);
      setFollowUpLeads([]);
      setMyLeads([]);
      setNewLeads([]);

      setError("Please sign in to view leads.");
      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ----------------------------------------------------
      // ROLE-AWARE REQUESTS
      // ----------------------------------------------------
      //
      // getLeads() uses GET /api/lead.
      //
      // getMyLeads() uses GET /api/lead/my, which is
      // explicitly restricted to agents.
      //
      // Never request /lead/my for an administrator.
      // ----------------------------------------------------

      const requests = [
        {
          key: "all",
          request: () => getLeads(),
        },
        {
          key: "hot",
          request: () => getHotLeads(),
        },
        {
          key: "followUps",
          request: () => getFollowUpLeads(),
        },
        {
          key: "new",
          request: () => getNewLeads(),
        },
      ];

      if (role === "agent") {
        requests.push({
          key: "assigned",
          request: () => getMyLeads(),
        });
      }

      const results = await Promise.allSettled(
        requests.map((item) => item.request())
      );

      const collections = {};

      const failures = [];

      results.forEach((result, index) => {
        const key = requests[index].key;

        if (result.status === "fulfilled") {
          collections[key] = normalizeLeadCollection(
            result.value
          );
        } else {
          collections[key] = [];

          failures.push({
            key,
            reason: result.reason,
          });

          console.error(
            `[LEADS] Failed to load ${key}:`,
            result.reason
          );
        }
      });

      // ----------------------------------------------------
      // UPDATE STATE
      // ----------------------------------------------------

      setLeads(collections.all || []);

      setHotLeads(collections.hot || []);

      setFollowUpLeads(
        collections.followUps || []
      );

      setNewLeads(collections.new || []);

      // Admins do not have an agent-only collection.
      setMyLeads(
        collections.assigned || []
      );

      // The primary lead collection determines whether
      // the page can display useful data.
      //
      // Optional collections may fail independently.
      if (
        failures.some(
          (failure) => failure.key === "all"
        )
      ) {
        setError(
          "Unable to load the lead collection. Please retry."
        );
      } else if (failures.length > 0) {
        console.warn(
          "[LEADS] The primary collection loaded, but one or more optional collections failed."
        );
      }
    } catch (err) {
      console.error(
        "[LEADS] Unexpected loading error:",
        err
      );

      setError(
        "Unable to load lead information."
      );

      setLeads([]);
      setHotLeads([]);
      setFollowUpLeads([]);
      setMyLeads([]);
      setNewLeads([]);
    } finally {
      setLoading(false);
    }
  }, [
    authLoading,
    user,
    role,
  ]);

  // --------------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------------

  useEffect(() => {
    if (authLoading) {
      return;
    }

    refreshLeads();
  }, [
    authLoading,
    refreshLeads,
  ]);

  // --------------------------------------------------------
  // REAL-TIME SOCKET.IO LISTENERS
  // --------------------------------------------------------

  useEffect(() => {
    if (authLoading || !user) {
      return undefined;
    }

    let refreshTimer = null;

    // ------------------------------------------------------
    // DEBOUNCED REFRESH
    // ------------------------------------------------------
    //
    // Multiple related events can arrive close together.
    // Debouncing avoids firing several simultaneous sets
    // of HTTP requests for the same update.
    // ------------------------------------------------------

    const scheduleRefresh = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        refreshLeads();
      }, 150);
    };

    // ------------------------------------------------------
    // EVENT HANDLERS
    // ------------------------------------------------------

    const handleNewLead = (lead) => {
      console.log(
        "[LEADS] NEW_LEAD received:",
        lead
      );

      scheduleRefresh();
    };

    const handleHotLead = (lead) => {
      console.log(
        "[LEADS] HOT_LEAD received:",
        lead
      );

      scheduleRefresh();
    };

    const handleLeadAssigned = (data) => {
      console.log(
        "[LEADS] LEAD_ASSIGNED received:",
        data
      );

      scheduleRefresh();
    };

    const handlePipelineUpdate = (data) => {
      console.log(
        "[LEADS] PIPELINE_UPDATE received:",
        data
      );

      scheduleRefresh();
    };

    // ------------------------------------------------------
    // REGISTER LISTENERS
    // ------------------------------------------------------

    socket.on(
      "NEW_LEAD",
      handleNewLead
    );

    socket.on(
      "HOT_LEAD",
      handleHotLead
    );

    socket.on(
      "LEAD_ASSIGNED",
      handleLeadAssigned
    );

    socket.on(
      "PIPELINE_UPDATE",
      handlePipelineUpdate
    );

    console.log(
      "[LEADS] Real-time event listeners registered."
    );

    // ------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      socket.off(
        "NEW_LEAD",
        handleNewLead
      );

      socket.off(
        "HOT_LEAD",
        handleHotLead
      );

      socket.off(
        "LEAD_ASSIGNED",
        handleLeadAssigned
      );

      socket.off(
        "PIPELINE_UPDATE",
        handlePipelineUpdate
      );

      console.log(
        "[LEADS] Real-time event listeners removed."
      );
    };
  }, [
    authLoading,
    user,
    refreshLeads,
  ]);

  // --------------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------------

  return {
    leads,
    hotLeads,
    followUpLeads,
    myLeads,
    newLeads,
    loading: authLoading || loading,
    error,
    refreshLeads,
  };
};

export default useLeads;