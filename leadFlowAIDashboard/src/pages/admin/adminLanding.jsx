/**
 * ==========================================================
 * Executive overview of the platform.
 *
 * Displays:
 * • Platform statistics
 * • Recent activity
 * • Quick navigation
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This page is rendered INSIDE MainLayout.
 *
 * App routing:
 *
 * /admin
 *    ↓
 * RoleRoute
 *    ↓
 * MainLayout
 *    ↓
 * Outlet
 *    ↓
 * AdminLanding
 *
 * Therefore this component MUST NOT render MainLayout.
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Users,
  Building2,
  Home,
  TrendingUp,
  Activity,
} from "lucide-react";

import dashboardService from "../../services/dashboardService";
import propertyService from "../../services/propertyService";
import leadService from "../../services/leadService";
import userService from "../../services/userService";

// ==========================================================
// COMPONENT
// ==========================================================

const AdminLanding = () => {
  // ========================================================
  // DASHBOARD SUMMARY
  // ========================================================

  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalProperties: 0,
    totalLeads: 0,
  });

  // ========================================================
  // RECENT ACTIVITY
  // ========================================================

  const [activity, setActivity] = useState([]);

  // ========================================================
  // UI STATE
  // ========================================================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  // ========================================================
  // LOAD DASHBOARD
  // ========================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // ====================================================
      // IMPORTANT
      // ----------------------------------------------------
      // We use Promise.allSettled instead of Promise.all.
      //
      // Recent activity is not critical enough to prevent
      // the rest of the admin dashboard from rendering.
      // ====================================================

      const results = await Promise.allSettled([
        userService.getUsers({
          page: 1,
          limit: 100,
        }),

        propertyService.getProperties({
          page: 1,
          limit: 100,
        }),

        leadService.getLeads({
          page: 1,
          limit: 100,
        }),

        dashboardService.getRecentActivity(),
      ]);

      // ====================================================
      // EXTRACT RESULTS
      // ====================================================

      const [
        usersResult,
        propertiesResult,
        leadsResult,
        activityResult,
      ] = results;

      // ====================================================
      // USERS
      // ====================================================

      let users = [];

      if (usersResult.status === "fulfilled") {
        users =
          usersResult.value?.data || [];
      } else {
        console.error(
          "Admin dashboard: unable to load users",
          usersResult.reason
        );
      }

      // ====================================================
      // PROPERTIES
      // ====================================================

      let properties = [];

      if (
        propertiesResult.status === "fulfilled"
      ) {
        properties =
          propertiesResult.value?.data || [];
      } else {
        console.error(
          "Admin dashboard: unable to load properties",
          propertiesResult.reason
        );
      }

      // ====================================================
      // LEADS
      // ====================================================

      let leads = [];

      if (leadsResult.status === "fulfilled") {
        leads =
          leadsResult.value?.data || [];
      } else {
        console.error(
          "Admin dashboard: unable to load leads",
          leadsResult.reason
        );
      }

      // ====================================================
      // RECENT ACTIVITY
      // ====================================================

      if (activityResult.status === "fulfilled") {
        setActivity(
          activityResult.value?.data || []
        );
      } else {
        // -----------------------------------------------
        // Recent activity is optional.
        //
        // A 500 from this endpoint should NOT prevent
        // the admin dashboard from rendering.
        // -----------------------------------------------

        console.error(
          "Admin dashboard: unable to load recent activity",
          activityResult.reason
        );

        setActivity([]);
      }

      // ====================================================
      // SUMMARY
      // ====================================================

      setSummary({
        totalUsers: users.length,

        totalAgents: users.filter(
          (user) =>
            String(user?.role || "")
              .toLowerCase() === "agent"
        ).length,

        totalProperties:
          properties.length,

        totalLeads:
          leads.length,
      });

      // ====================================================
      // PARTIAL FAILURE NOTICE
      // ====================================================

      const failedRequests =
        results.filter(
          (result) =>
            result.status === "rejected"
        );

      if (failedRequests.length > 0) {
        console.warn(
          `${failedRequests.length} admin dashboard request(s) failed.`
        );
      }

    } catch (err) {
      // ====================================================
      // UNEXPECTED ERROR
      // ====================================================

      console.error(
        "Unable to load admin dashboard",
        err
      );

      setError(
        "Some dashboard information could not be loaded."
      );

    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // ========================================================
  // SUMMARY CARDS
  // ========================================================

  const dashboardCards = [
    {
      title: "Users",
      value: summary.totalUsers,
      icon: Users,
    },

    {
      title: "Agents",
      value: summary.totalAgents,
      icon: Building2,
    },

    {
      title: "Properties",
      value: summary.totalProperties,
      icon: Home,
    },

    {
      title: "Leads",
      value: summary.totalLeads,
      icon: TrendingUp,
    },
  ];

  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-muted-foreground">
          Loading admin dashboard...
        </p>
      </div>
    );
  }

  // ========================================================
  // PAGE
  // ========================================================

  return (
    <section className="space-y-10">

      {/* ==================================================
          OPTIONAL PARTIAL ERROR
      ================================================== */}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm text-amber-700">
            {error}
          </p>
        </div>
      )}

      {/* ==================================================
          HERO
      ================================================== */}

      <div className="rounded-2xl bg-primary p-8 text-primary-foreground">

        <h1 className="text-4xl font-bold">
          Admin Dashboard
        </h1>

        <p className="mt-3 max-w-3xl text-lg opacity-90">
          Monitor platform growth, user activity,
          properties, agents and system performance
          across LeadFlow AI.
        </p>

      </div>

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border bg-card p-6"
            >

              <div className="mb-4 flex items-center justify-between">

                <Icon
                  className="h-7 w-7 text-primary"
                />

                <span className="text-3xl font-bold">
                  {card.value}
                </span>

              </div>

              <h3 className="font-semibold">
                {card.title}
              </h3>

            </div>
          );
        })}

      </div>

      {/* ==================================================
          QUICK NAVIGATION
      ================================================== */}

      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">
          Quick Access
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {/* ------------------------------------------------
              PROPERTIES
          ------------------------------------------------ */}
          <Link
            to="/admin/properties"
            className="rounded-xl border bg-card p-6 transition hover:border-primary"
          >
            <Home className="mb-3 h-8 w-8 text-primary" />

            <h3 className="font-semibold">
              Manage Properties
            </h3>
          </Link>

          {/* ------------------------------------------------
              USERS
          ------------------------------------------------ */}

          <a
            href="/admin/users"
            className="rounded-xl border bg-card p-6 transition hover:border-primary"
          >

            <Users className="mb-3 h-8 w-8 text-primary" />

            <h3 className="font-semibold">
              Manage Users
            </h3>

          </a>

          {/* ------------------------------------------------
              AGENTS
          ------------------------------------------------ */}

          <a
           href="/admin/agents"
           className="rounded-xl border bg-card p-6 transition hover:border-primary"
          >

          <Building2
            className="mb-3 h-8 w-8 text-primary"
          />

          <h3 className="font-semibold">
            Manage Agents
          </h3>

          </a>

          {/* ------------------------------------------------
              ANALYTICS
          ------------------------------------------------ */}

          <a
            href="/admin/analytics"
            className="rounded-xl border bg-card p-6 transition hover:border-primary"
          >

            <TrendingUp
              className="mb-3 h-8 w-8 text-primary"
            />

            <h3 className="font-semibold">
              Analytics
            </h3>

          </a>

        </div>

      </section>

      {/* ==================================================
          RECENT ACTIVITY
      ================================================== */}

      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <h2 className="text-2xl font-semibold">
            Recent Activity
          </h2>

          <Activity className="h-6 w-6 text-primary" />

        </div>

        <div className="rounded-xl border bg-card">

          {activity.length === 0 ? (

            <p className="p-6 text-muted-foreground">
              No recent activity.
            </p>

          ) : (

            <div className="divide-y">

              {activity.map((item, index) => (

                <div
                  key={
                    item?._id ||
                    item?.id ||
                    `activity-${index}`
                  }
                  className="flex items-start gap-4 p-5"
                >

                  <Activity
                    className="mt-1 h-5 w-5 text-primary"
                  />

                  <div>

                    <h3 className="font-medium">
                      {item?.title ||
                        "Activity"}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {item?.description ||
                        "No description available."}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item?.createdAt ||
                        "Date unavailable"}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

    </section>
  );
};

export default AdminLanding;