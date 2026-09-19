import { useEffect, useState } from "react";
import socket from "../services/socketClient";
import { getHotLeads } from "../services/leadService";

const useHotLeads = () => {
  const [hotLeads, setHotLeads] = useState([]);

  const fetchHotLeads = async () => {
    const data = await getHotLeads();
    setHotLeads(data);
  };

  useEffect(() => {
    fetchHotLeads();

    socket.on("hot_lead", (lead) => {
      setHotLeads((prev) => [lead, ...prev]);
    });

    return () => socket.off("hot_lead");
  }, []);

  return { hotLeads, refetch: fetchHotLeads };
};

export default useHotLeads;