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


  // ==========================================================
// LOAD DASHBOARD
// ==========================================================

const loadDashboard = async () => {
  try {
    setLoading(true);
    setError(null);

    console.log("[ADMIN DASHBOARD] Starting data refresh...");

    const results = await Promise.allSettled([
      userService.getUsers({
        page: 1,
        limit: 100,
      }),

      propertyService.getProperties({
        page: 1,
        limit: 100,
      }),

      leadService.getLeads(),

      dashboardService.getRecentActivity(),
    ]);

    const [
      usersResult,
      propertiesResult,
      leadsResult,
      activityResult,
    ] = results;

    // ------------------------------------------------------
    // NORMALIZE API RESPONSE SHAPES
    // Supports arrays and common paginated API responses.
    // ------------------------------------------------------

    const extractArray = (result, label) => {
      if (result.status !== "fulfilled") {
        console.error(
          `[ADMIN DASHBOARD] Failed to load ${label}:`,
          result.reason
        );

        return [];
      }

      const response = result.value;

      // Services may return an array directly.
      if (Array.isArray(response)) {
        return response;
      }

      // Handle common API response structures.
      const candidates = [
        response?.data,
        response?.data?.data,
        response?.data?.users,
        response?.data?.properties,
        response?.data?.leads,
        response?.users,
        response?.properties,
        response?.leads,
        response?.results,
      ];

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate;
        }
      }

      console.warn(
        `[ADMIN DASHBOARD] ${label} response was not an array:`,
        response
      );

      return [];
    };

    const users = extractArray(
      usersResult,
      "users"
    );

    const properties = extractArray(
      propertiesResult,
      "properties"
    );

    const leads = extractArray(
      leadsResult,
      "leads"
    );

    // ------------------------------------------------------
    // RECENT ACTIVITY
    // Activity failures must not block the summary cards.
    // ------------------------------------------------------

    if (activityResult.status === "fulfilled") {
      const activityResponse = activityResult.value;

      const activityItems = Array.isArray(activityResponse)
        ? activityResponse
        : Array.isArray(activityResponse?.data)
          ? activityResponse.data
          : Array.isArray(activityResponse?.data?.data)
            ? activityResponse.data.data
            : [];

      setActivity(activityItems);
    } else {
      console.error(
        "[ADMIN DASHBOARD] Failed to load recent activity:",
        activityResult.reason
      );

      setActivity([]);
    }

    // ------------------------------------------------------
    // SUMMARY COUNTS
    // ------------------------------------------------------

    const nextSummary = {
      totalUsers: users.length,

      totalAgents: users.filter(
        (user) =>
          String(user?.role || "").toLowerCase() === "agent"
      ).length,

      totalProperties: properties.length,

      totalLeads: leads.length,
    };

    console.log(
      "[ADMIN DASHBOARD] Loaded summary:",
      nextSummary
    );

    console.log(
      "[ADMIN DASHBOARD] Record counts:",
      {
        users: users.length,
        properties: properties.length,
        leads: leads.length,
      }
    );

    setSummary(nextSummary);

    // ------------------------------------------------------
    // PARTIAL FAILURE NOTICE
    // ------------------------------------------------------

    const failedRequests = results.filter(
      (result) => result.status === "rejected"
    );

    if (failedRequests.length > 0) {
      console.warn(
        `[ADMIN DASHBOARD] ${failedRequests.length} request(s) failed.`
      );
    }
  } catch (err) {
    console.error(
      "[ADMIN DASHBOARD] Unexpected error:",
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
    to: "/admin/users",
  },

  {
    title: "Agents",
    value: summary.totalAgents,
    icon: Building2,
    to: "/admin/agents",
  },

  {
    title: "Properties",
    value: summary.totalProperties,
    icon: Home,
    to: "/admin/properties",
  },

  {
    title: "Leads",
    value: summary.totalLeads,
    icon: TrendingUp,
    to: "/admin/leads",
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
      <Link
        key={card.title}
        to={card.to}
        className="
          block rounded-xl border bg-card p-6
          transition-colors hover:border-primary
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-primary
        "
        aria-label={`View ${card.title}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <Icon className="h-7 w-7 text-primary" />

          <span className="text-3xl font-bold">
            {card.value}
          </span>
        </div>

        <h3 className="font-semibold">
          {card.title}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          View {card.title.toLowerCase()}
        </p>
      </Link>
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
    LEADS
------------------------------------------------ */}

<Link
  to="/admin/leads"
  className="
    rounded-xl border bg-card p-6
    transition-colors hover:border-primary
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-primary
  "
>
  <TrendingUp className="mb-3 h-8 w-8 text-primary" />

  <h3 className="font-semibold">
    Manage Leads
  </h3>

  <p className="mt-2 text-sm text-muted-foreground">
    Review, qualify and manage customer enquiries.
  </p>
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