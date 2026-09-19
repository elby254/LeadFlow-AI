/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Central hook for property analytics across LeadFlow AI.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyPerformanceTable
 * • PropertyAnalytics
 * • Admin Dashboard
 * • Executive Dashboard
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/analytics/properties
 *
 * Returns
 * ----------------------------------------------------------
 * {
 *   summary,
 *   properties
 * }
 *
 * ==========================================================
 */

import {

  useState,

  useEffect,

  useCallback,

} from "react";

import analyticsService from "../services/analyticsService";

const usePropertyAnalytics = () => {

  //----------------------------------------------------------
  // Analytics State
  //----------------------------------------------------------

  const [properties, setProperties] = useState([]);

  const [summary, setSummary] = useState({

    totalProperties: 0,

    totalViews: 0,

    totalLeads: 0,

    totalViewings: 0,

    totalRevenue: 0,

    averageConversionRate: 0,

  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  //----------------------------------------------------------
  // Fetch Property Analytics
  //----------------------------------------------------------

  const fetchPropertyAnalytics = useCallback(async () => {

    try {

      setLoading(true);

      setError("");

      /**
       * analyticsService
       *
       * GET /api/analytics/properties
       */

      const response =
        await analyticsService.getPropertyAnalytics();

      /**
       * Expected response
       *
       * {
       *   success:true,
       *   data:{
       *      summary:{...},
       *      properties:[]
       *   }
       */

      const payload = response?.data || {};

      setSummary({

        totalProperties:
          payload.summary?.totalProperties || 0,

        totalViews:
          payload.summary?.totalViews || 0,

        totalLeads:
          payload.summary?.totalLeads || 0,

        totalViewings:
          payload.summary?.totalViewings || 0,

        totalRevenue:
          payload.summary?.totalRevenue || 0,

        averageConversionRate:
          payload.summary?.averageConversionRate || 0,

      });

      setProperties(

        Array.isArray(payload.properties)

          ? payload.properties

          : []

      );

    } catch (err) {

      console.error(

        "Failed loading property analytics:",

        err

      );

      setError(

        err?.response?.data?.message ||

        "Unable to load property analytics."

      );

      setSummary({

        totalProperties: 0,

        totalViews: 0,

        totalLeads: 0,

        totalViewings: 0,

        totalRevenue: 0,

        averageConversionRate: 0,

      });

      setProperties([]);

    } finally {

      setLoading(false);

    }

  }, []);

  //----------------------------------------------------------
  // Initial Load
  //----------------------------------------------------------

  useEffect(() => {

    fetchPropertyAnalytics();

  }, [fetchPropertyAnalytics]);

  //----------------------------------------------------------
  // Derived Metrics
  //----------------------------------------------------------

  const hasProperties = properties.length > 0;

  const topPerformingProperty =
    hasProperties
      ? [...properties].sort(
          (a, b) =>
            (b.totalLeads || 0) -
            (a.totalLeads || 0)
        )[0]
      : null;

  const highestRevenueProperty =
    hasProperties
      ? [...properties].sort(
          (a, b) =>
            (b.revenue || 0) -
            (a.revenue || 0)
        )[0]
      : null;

  //----------------------------------------------------------
  // Hook API
  //----------------------------------------------------------

  return {

    /**
     * Raw analytics
     */

    properties,

    summary,

    /**
     * Loading State
     */

    loading,

    error,

    /**
     * Computed Helpers
     */

    hasProperties,

    topPerformingProperty,

    highestRevenueProperty,

    /**
     * Refresh Analytics
     */

    refresh: fetchPropertyAnalytics,

  };

};

export default usePropertyAnalytics;