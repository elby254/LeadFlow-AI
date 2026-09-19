/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Retrieves all currently available properties for agents.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyAvailabilityPanel
 * • AgentDashboard
 * • Recommendation Engine
 * • Viewing Scheduler
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/properties/available
 *
 * Expected Response
 * ----------------------------------------------------------
 * {
 *   success: true,
 *   data: [
 *     {
 *       _id,
 *       title,
 *       location,
 *       propertyType,
 *       price,
 *       bedrooms,
 *       bathrooms,
 *       status,
 *       images:[]
 *     }
 *   ]
 * }
 *
 * ==========================================================
 */

import {

  useState,

  useEffect,

  useCallback,

} from "react";

import propertyService from "../services/propertyService";

const useAvailableProperties = () => {

  //----------------------------------------------------------
  // State
  //----------------------------------------------------------

  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  //----------------------------------------------------------
  // Fetch Properties
  //----------------------------------------------------------

  const fetchAvailableProperties = useCallback(async () => {

    try {

      setLoading(true);

      setError("");

      /**
       * Service
       *
       * GET /api/properties/available
       */

      const response =
        await propertyService.getAvailableProperties();

      const payload = response?.data || [];

      setProperties(

        Array.isArray(payload)

          ? payload

          : []

      );

    } catch (err) {

      console.error(

        "Failed loading available properties:",

        err

      );

      setError(

        err?.response?.data?.message ||

        "Unable to load available properties."

      );

      setProperties([]);

    } finally {

      setLoading(false);

    }

  }, []);

  //----------------------------------------------------------
  // Initial Load
  //----------------------------------------------------------

  useEffect(() => {

    fetchAvailableProperties();

  }, [fetchAvailableProperties]);

  //----------------------------------------------------------
  // Computed Values
  //----------------------------------------------------------

  const hasProperties = properties.length > 0;

  const availableCount = properties.length;

  //----------------------------------------------------------
  // Hook API
  //----------------------------------------------------------

  return {

    /**
     * Available Properties
     */

    properties,

    /**
     * Counts
     */

    availableCount,

    hasProperties,

    /**
     * UI State
     */

    loading,

    error,

    /**
     * Actions
     */

    refresh: fetchAvailableProperties,

  };

};

export default useAvailableProperties;