import { useEffect } from "react";
import socket from "../services/socketClient";
import toast from "react-hot-toast";

/**
 * Central UI reaction layer for all real-time CRM events:
 * - hot leads
 * - new leads
 * - pipeline updates
 *
 * This is what makes the dashboard "feel alive"
 */

const useRealtimeLeads = ({
  onNewLead,
  onHotLead,
  onPipelineUpdate,
}) => {
  useEffect(() => {
    // -------------------------------------------------
    // NEW LEAD EVENT
    // -------------------------------------------------
    socket.on("new_lead", (lead) => {
      toast.success("📥 New lead received!");

      if (onNewLead) onNewLead(lead);
    });

    // -------------------------------------------------
    // HOT LEAD EVENT (HIGH PRIORITY)
    // -------------------------------------------------
    socket.on("hot_lead", (lead) => {
      toast.error(`🔥 HOT LEAD: ${lead.name || "Unknown"}`, {
        duration: 5000,
      });

      // Optional browser attention effect
      if (document.hidden) {
        document.title = "🔥 New Hot Lead!";
      }

      if (onHotLead) onHotLead(lead);
    });

    // -------------------------------------------------
    // PIPELINE UPDATE EVENT
    // -------------------------------------------------
    socket.on("pipeline_update", (data) => {
      if (onPipelineUpdate) onPipelineUpdate(data);
    });

    // cleanup
    return () => {
      socket.off("new_lead");
      socket.off("hot_lead");
      socket.off("pipeline_update");
    };
  }, [onNewLead, onHotLead, onPipelineUpdate]);
};

export default useRealtimeLeads;