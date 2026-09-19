// Responsible for managing the lead pipeline.
// It centralizes:
// • Pipeline stage retrieval
// • Loading state
// • Error handling
// • Refresh capability

import { useCallback, useEffect, useState } from "react";
import { getLeadPipeline } from "../services/dashboardService";
import socket from "../services/socketClient";

const usePipeline = () => {
  // Pipeline stages
  const [pipelineStages, setPipelineStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Refresh pipeline data
   */
  const refreshPipeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getLeadPipeline();

      setPipelineStages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load lead pipeline:", err);

      setError("Unable to load lead pipeline.");
      setPipelineStages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPipeline();

    const handlePipelineUpdate = () => {
      refreshPipeline();
    };

    socket.on("pipeline_update", handlePipelineUpdate);

    return () => {
      socket.off("pipeline_update", handlePipelineUpdate);
    };
  }, [refreshPipeline]);

  return {
    pipelineStages,
    loading,
    error,
    refreshPipeline,
  };
};

export default usePipeline;