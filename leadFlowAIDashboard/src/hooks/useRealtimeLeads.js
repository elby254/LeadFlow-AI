import { useEffect } from "react";
import socket from "../services/socketClient";
import toast from "react-hot-toast";

/**
 * ==========================================================
 * REALTIME LEADS
 * ==========================================================
 *
 * Central UI reaction layer for all real-time CRM events:
 * - New leads
 * - Hot leads
 * - Pipeline updates
 * - Lead assignments
 *
 * IMPORTANT:
 * Event names must match the backend realtimeEngine.js
 * because Socket.IO event names are case-sensitive.
 *
 * Backend events:
 * - NEW_LEAD
 * - HOT_LEAD
 * - PIPELINE_UPDATE
 * - LEAD_ASSIGNED
 */

const useRealtimeLeads = ({
  onNewLead,
  onHotLead,
  onPipelineUpdate,
  onLeadAssigned,
} = {}) => {
  useEffect(() => {
    // -------------------------------------------------
    // NEW LEAD EVENT
    // -------------------------------------------------

    const handleNewLead = (lead) => {
      console.log(
        "[REALTIME UI] NEW_LEAD received:",
        lead
      );

      toast.success("📥 New lead received!");

      if (onNewLead) {
        onNewLead(lead);
      }
    };

    // -------------------------------------------------
    // HOT LEAD EVENT (HIGH PRIORITY)
    // -------------------------------------------------

    const handleHotLead = (lead) => {
      console.log(
        "[REALTIME UI] HOT_LEAD received:",
        lead
      );

      toast.error(
        `🔥 HOT LEAD: ${lead?.name || "Unknown"}`,
        {
          duration: 5000,
        }
      );

      // Optional browser attention effect.
      if (document.hidden) {
        document.title = "🔥 New Hot Lead!";
      }

      if (onHotLead) {
        onHotLead(lead);
      }
    };

    // -------------------------------------------------
    // PIPELINE UPDATE EVENT
    // -------------------------------------------------

    const handlePipelineUpdate = (data) => {
      console.log(
        "[REALTIME UI] PIPELINE_UPDATE received:",
        data
      );

      if (onPipelineUpdate) {
        onPipelineUpdate(data);
      }
    };

    // -------------------------------------------------
    // LEAD ASSIGNED EVENT
    // -------------------------------------------------

    const handleLeadAssigned = (data) => {
      console.log(
        "[REALTIME UI] LEAD_ASSIGNED received:",
        data
      );

      const leadName =
        data?.name ||
        data?.lead?.name ||
        "Lead";

      const agentName =
        data?.agentName ||
        data?.assignedAgent?.name ||
        null;

      toast.success(
        agentName
          ? `📌 ${leadName} assigned to ${agentName}`
          : `📌 ${leadName} assignment updated!`
      );

      if (onLeadAssigned) {
        onLeadAssigned(data);
      }

      // An assignment may affect dashboard totals
      // and the visible lead pipeline.
      if (onPipelineUpdate) {
        onPipelineUpdate(data);
      }
    };

    // -------------------------------------------------
    // REGISTER SOCKET LISTENERS
    // -------------------------------------------------

    socket.on("NEW_LEAD", handleNewLead);
    socket.on("HOT_LEAD", handleHotLead);
    socket.on("PIPELINE_UPDATE", handlePipelineUpdate);
    socket.on("LEAD_ASSIGNED", handleLeadAssigned);

    console.log(
      "[REALTIME UI] Registered CRM event listeners."
    );

    // -------------------------------------------------
    // CLEANUP SOCKET LISTENERS
    // -------------------------------------------------

    return () => {
      socket.off("NEW_LEAD", handleNewLead);
      socket.off("HOT_LEAD", handleHotLead);
      socket.off("PIPELINE_UPDATE", handlePipelineUpdate);
      socket.off("LEAD_ASSIGNED", handleLeadAssigned);

      console.log(
        "[REALTIME UI] Removed CRM event listeners."
      );
    };
  }, [
    onNewLead,
    onHotLead,
    onPipelineUpdate,
    onLeadAssigned,
  ]);
};

export default useRealtimeLeads;