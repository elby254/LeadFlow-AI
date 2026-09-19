// For managing lead-related data.
// This hook centralizes:
// • Hot leads
// • Follow-up leads
// • Loading state
// • Error handling
// • Refresh operations

import { useCallback, useEffect, useState } from "react";
import socket from "../services/socketClient";

import {
  getLeads,
  getMyLeads,
  getHotLeads,
  getFollowUpLeads,
  getNewLeads,
} from "../services/leadService";

const useLeads = () => {
  const [leads, setLeads] = useState([]);
const [hotLeads, setHotLeads] = useState([]);
const [followUpLeads, setFollowUpLeads] = useState([]);
const [myLeads, setMyLeads] = useState([]);
const [newLeads, setNewLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [allLeads, hot, followUps, myLeads, newLeads ] = await Promise.all([
    getLeads(),
    getHotLeads(),
    getFollowUpLeads(),
    getMyLeads(),
    getNewLeads(),
]);
      setLeads(Array.isArray(allLeads) ? allLeads : []);
      setHotLeads(Array.isArray(hot) ? hot : []);
      setFollowUpLeads(Array.isArray(followUps) ? followUps : []);
      setMyLeads(Array.isArray(myLeads) ? myLeads : []);
      setNewLeads(Array.isArray(newLeads) ? newLeads : []);
    } catch (err) {
      console.error("Failed to load lead data:", err);

      setError("Unable to load lead information.");

      setLeads([]);
      setHotLeads([]);
      setFollowUpLeads([]);
      setMyLeads([]);
      setNewLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  useEffect(() => {
    const handleNewLead = () => {
      refreshLeads();
    };

    const handleHotLead = () => {
      refreshLeads();
    };

    socket.on("new_lead", handleNewLead);
    socket.on("hot_lead", handleHotLead);

    return () => {
      socket.off("new_lead", handleNewLead);
      socket.off("hot_lead", handleHotLead);
    };
  }, [refreshLeads]);

  return {
    leads,
    hotLeads,
    followUpLeads,
    loading,
    error,
    myLeads,
    newLeads,
    refreshLeads,
};
};

export default useLeads;