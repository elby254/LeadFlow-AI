/**
 * ==========================================================
 *
 * Endpoint
 * ----------------------------------------------------------
 * GET /api/lead/:id
 *
 * Returns
 * ----------------------------------------------------------
 * {
 *   lead,
 *   notes,
 *   qualification,
 *   followUps,
 *   aiInsights
 * }
 *
 * Used By
 * ----------------------------------------------------------
 * • LeadDetails.jsx
 * • ContactLead.jsx
 * • FollowUpPage.jsx
 * • AIQualification.jsx
 *
 * NOT USED FOR
 * ----------------------------------------------------------
 * • Conversation History
 *   (Handled by useConversations)
 *
 * ==========================================================
 */

import { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";

const useLeadDetails = (id) => {
  const [lead, setLead] = useState(null);

  const [notes, setNotes] = useState([]);

  const [qualification, setQualification] = useState(null);

  const [followUps, setFollowUps] = useState([]);

  const [aiInsights, setAiInsights] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /**
   * --------------------------------------------------------
   * Fetch Lead CRM Data
   * --------------------------------------------------------
   */

  const fetchLead = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axiosClient.get(`/lead/${id}`);

      const payload = response.data.data || {};

      setLead(payload.lead || null);

      setNotes(payload.notes || []);

      setQualification(payload.qualification || null);

      setFollowUps(payload.followUps || []);

      setAiInsights(payload.aiInsights || null);

    } catch (err) {
      console.error("Failed loading lead:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load lead."
      );

    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * --------------------------------------------------------
   * Load on Mount
   * --------------------------------------------------------
   */

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  /**
   * --------------------------------------------------------
   * Hook API
   * --------------------------------------------------------
   */

  return {
    lead,

    notes,

    qualification,

    followUps,

    aiInsights,

    loading,

    error,

    refreshLead: fetchLead,
  };
};

export default useLeadDetails;