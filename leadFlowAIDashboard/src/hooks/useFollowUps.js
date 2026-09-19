/**
 *
 * Centralized Follow-up hook.
 *
 * Responsibilities
 * ----------------
 * • Fetch scheduled follow-ups
 * • Loading state
 * • Error state
 * • Refresh function
 * • Simple client-side filtering
 *
 * Used by:
 * • FollowUps.jsx
 *
 * API
 * ---
 * GET /api/lead/follow-up
 *
 * ==========================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import axiosClient from "../api/axiosClient";

const useFollowUps = () => {

  /**
   * --------------------------------------------
   * STATE
   * --------------------------------------------
   */

  const [followUps, setFollowUps] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /**
   * --------------------------------------------
   * FETCH FOLLOW UPS
   * --------------------------------------------
   */

  const fetchFollowUps = useCallback(async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await axiosClient.get(
          "/lead/follow-up"
        );

      setFollowUps(response.data.data || []);

    } catch (err) {

      console.error(
        "Failed loading follow-ups:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load follow-ups."
      );

      setFollowUps([]);

    } finally {

      setLoading(false);

    }

  }, []);

  /**
   * --------------------------------------------
   * LOAD ONCE
   * --------------------------------------------
   */

  useEffect(() => {

    fetchFollowUps();

  }, [fetchFollowUps]);

  /**
   * --------------------------------------------
   * DATE HELPERS
   * --------------------------------------------
   */

  const today = useMemo(() => {

    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;

  }, []);

  /**
   * --------------------------------------------
   * CATEGORY HELPER
   * --------------------------------------------
   */

  const getCategory = useCallback(

    (followUpDate) => {

      if (!followUpDate) {

        return "upcoming";

      }

      const date = new Date(followUpDate);

      date.setHours(0, 0, 0, 0);

      if (date < today) {

        return "overdue";

      }

      if (date.getTime() === today.getTime()) {

        return "today";

      }

      return "upcoming";

    },

    [today]

  );

  /**
   * --------------------------------------------
   * SORTED FOLLOW UPS
   * --------------------------------------------
   */

  const sortedFollowUps = useMemo(() => {

    return [...followUps].sort((a, b) => {

      if (!a.nextFollowUpDate) return 1;

      if (!b.nextFollowUpDate) return -1;

      return (
        new Date(a.nextFollowUpDate) -
        new Date(b.nextFollowUpDate)
      );

    });

  }, [followUps]);

  /**
   * --------------------------------------------
   * GROUPS
   * --------------------------------------------
   */

  const groupedFollowUps = useMemo(() => {

    return {

      overdue:

        sortedFollowUps.filter(

          (lead) =>

            getCategory(
              lead.nextFollowUpDate
            ) === "overdue"

        ),

      today:

        sortedFollowUps.filter(

          (lead) =>

            getCategory(
              lead.nextFollowUpDate
            ) === "today"

        ),

      upcoming:

        sortedFollowUps.filter(

          (lead) =>

            getCategory(
              lead.nextFollowUpDate
            ) === "upcoming"

        ),

    };

  }, [sortedFollowUps, getCategory]);

  /**
   * --------------------------------------------
   * QUICK STATS
   * --------------------------------------------
   */

  const stats = useMemo(() => {

    return {

      total:

        followUps.length,

      overdue:

        groupedFollowUps.overdue.length,

      today:

        groupedFollowUps.today.length,

      upcoming:

        groupedFollowUps.upcoming.length,

    };

  }, [followUps, groupedFollowUps]);

  /**
   * --------------------------------------------
   * RETURN
   * --------------------------------------------
   */

  return {

    followUps,

    sortedFollowUps,

    groupedFollowUps,

    stats,

    loading,

    error,

    refreshFollowUps:
      fetchFollowUps,

    getCategory,

  };

};

export default useFollowUps;