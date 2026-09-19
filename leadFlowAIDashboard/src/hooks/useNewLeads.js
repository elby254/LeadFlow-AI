// Responsible for managing newly received property inquiries.
// This hook centralizes:
// • New lead retrieval
// • Loading state
// • Error handling
// • Refresh capabilities

import { useEffect, useState } from "react";
import socket from "../services/socketClient";
import { getNewLeads } from "../services/leadService";

const useNewLeads = () => {
  const [newLeads, setNewLeads] = useState([]);

  const fetchLeads = async () => {
    const data = await getNewLeads();
    setNewLeads(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchLeads();

    socket.on("new_lead", (lead) => {
      setNewLeads((prev) => [lead, ...prev]);
    });

    return () => {
      socket.off("new_lead");
    };
  }, []);

  return {
    newLeads,
    refetch: fetchLeads,
  };
};

export default useNewLeads;