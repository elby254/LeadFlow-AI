// Responsible for loading and managing dashboard summary data.
// It centralizes:
// • Dashboard KPI fetching
// • Loading state
// • Error state
// • Refresh capability

import { useEffect, useState, useCallback } from "react";
import socket from "../services/socketClient";
import { getDashboardSummary } from "../services/dashboardService";

const DEFAULT_SUMMARY = {
  newInquiries: 0,
  qualifiedLeads: 0,
  hotLeads: 0,
  scheduledViewings: 0,
};

const useDashboard = () => {
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -------------------------------------------------
  // FETCH DASHBOARD DATA
  // -------------------------------------------------
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getDashboardSummary();

      setSummary(data || DEFAULT_SUMMARY);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load dashboard data.");
      setSummary(DEFAULT_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------
  // INITIAL LOAD
  // -------------------------------------------------
  useEffect(() => {
    fetchSummary();

    // REAL-TIME UPDATE TRIGGER
    socket.on("pipeline_update", fetchSummary);

    return () => {
      socket.off("pipeline_update", fetchSummary);
    };
  }, [fetchSummary]);

  // -------------------------------------------------
  // RETURN HOOK API
  // -------------------------------------------------
  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
};

export default useDashboard;