/**
 * ==========================================================
 *
 * AGENT PROPERTIES DASHBOARD
 *
 * File
 * ----
 * src/pages/agent/properties/agentPropertiesDashboard.jsx
 *
 * Route
 * -----
 * /agent/properties
 *
 * PURPOSE
 * -------
 * Agent-focused shared property workspace.
 *
 * IMPORTANT
 * ---------
 * This dashboard does NOT use a separate "My Properties"
 * collection.
 *
 * Instead, the dashboard reads from the centralized
 * useProperties hook and displays the property collections
 * available to the current agent.
 *
 * Shared property areas:
 *
 * • Available Properties
 * • New Listings
 * • Reserved Properties
 * • Occupied Properties
 * • Inactive Properties
 * • Sold Properties
 * • AI Property Matches
 * • Property Listings
 *
 * IMPORTANT
 * ---------
 * This page does NOT render MainLayout.
 *
 * MainLayout is provided by the parent /agent workspace.
 *
 * ==========================================================
 *
 * SHARED PROPERTY ARCHITECTURE
 * ----------------------------
 *
 * Agent
 *   ↓
 * useProperties()
 *   ↓
 * shared property inventory
 *   ↓
 * dashboard cards
 *   ↓
 * individual property workspace pages
 *
 * The dashboard does NOT:
 *
 * • Create properties
 * • Generate property images
 * • Construct image URLs
 * • Maintain a second property data source
 *
 * Property data remains owned by:
 *
 *     hooks/useProperties.js
 *
 * ==========================================================
 */

import { useMemo } from "react";

import { useNavigate } from "react-router-dom";

import {
  Building2,
  CheckCircle2,
  Sparkles,
  Clock3,
  CalendarCheck2,
  ArrowRight,
  Search,
  Users,
  Archive,
  Ban,
  CircleDollarSign,
} from "lucide-react";

import useProperties from "../../../hooks/useProperties";

/* ==========================================================
   AGENT PROPERTIES DASHBOARD
========================================================== */

const AgentPropertiesDashboard = () => {
  const navigate = useNavigate();

  /* ========================================================
     SHARED PROPERTY DATA
     
     IMPORTANT:
     
     The dashboard reads from the same centralized
     useProperties hook used by the property pages.
     
     No separate agent-only property source is created here.
  ======================================================== */

  const propertyData = useProperties();

  /* ========================================================
     SAFE SHARED PROPERTY ARRAY
     
     Different versions of the hook may expose the main
     property collection under slightly different names.
     
     Prefer:
     
     properties
     
     and defensively support:
     
     data
     items
     
     This does not alter the hook's data.
  ======================================================== */

  const properties = useMemo(() => {
    if (
      Array.isArray(propertyData?.properties)
    ) {
      return propertyData.properties;
    }

    if (
      Array.isArray(propertyData?.data)
    ) {
      return propertyData.data;
    }

    if (
      Array.isArray(propertyData?.items)
    ) {
      return propertyData.items;
    }

    return [];
  }, [
    propertyData?.properties,
    propertyData?.data,
    propertyData?.items,
  ]);

  /* ========================================================
     LOADING
  ======================================================== */

  const loading =
    Boolean(propertyData?.loading);

  /* ========================================================
     ERROR
  ======================================================== */

  const error =
    propertyData?.error || null;

  /* ========================================================
     REFRESH
     
     Support the centralized refresh function exposed by
     useProperties.
  ======================================================== */

  const refreshProperties =
    propertyData?.refreshProperties;

  /* ========================================================
     NORMALIZE STATUS
  ======================================================== */

  const normalizeStatus = (property) => {
    return String(
      property?.status ||
        property?.propertyStatus ||
        ""
    )
      .trim()
      .toLowerCase();
  };

  /* ========================================================
     SHARED PROPERTY COUNTS
     
     These counts are derived from the shared property
     collection available to the agent.
     
     The dashboard therefore reflects the same inventory
     source used by the property pages.
  ======================================================== */

  const propertyCounts = useMemo(() => {
    const counts = {
      total: properties.length,
      available: 0,
      reserved: 0,
      occupied: 0,
      inactive: 0,
      sold: 0,
      listings: properties.length,
    };

    properties.forEach((property) => {
      const status =
        normalizeStatus(property);

      switch (status) {
        case "available":
          counts.available += 1;
          break;

        case "reserved":
          counts.reserved += 1;
          break;

        case "occupied":
          counts.occupied += 1;
          break;

        case "inactive":
          counts.inactive += 1;
          break;

        case "sold":
          counts.sold += 1;
          break;

        default:
          break;
      }
    });

    return counts;
  }, [properties]);

  /* ========================================================
     NEW LISTINGS
     
     New listings are calculated from the shared property
     collection using createdAt.
     
     This does NOT create a new backend property collection.
     
     "New" means properties created within the last 30 days.
  ======================================================== */

  const newListingsCount = useMemo(() => {
    if (!properties.length) {
      return 0;
    }

    const now = Date.now();

    const thirtyDays =
      30 *
      24 *
      60 *
      60 *
      1000;

    return properties.filter(
      (property) => {
        if (!property?.createdAt) {
          return false;
        }

        const createdAt =
          new Date(
            property.createdAt
          ).getTime();

        if (
          !Number.isFinite(createdAt)
        ) {
          return false;
        }

        return (
          now - createdAt <=
          thirtyDays
        );
      }
    ).length;
  }, [properties]);

  /* ========================================================
     PROPERTY WORKSPACE
     
     No "My Properties" card.
     
     These cards represent the shared property areas that
     agents can access.
  ======================================================== */

  const propertyAreas = [
    {
      title: "Available Properties",
      description:
        "View properties currently available to present to qualified leads.",
      icon: CheckCircle2,
      route: "/agent/properties/available",
      count: propertyCounts.available,
      countLabel: "available",
      iconStyle:
        "bg-emerald-500/10 text-emerald-400",
      hoverStyle:
        "hover:border-emerald-500/40",
    },

    {
      title: "New Listings",
      description:
        "Review recently added properties before matching them to customers.",
      icon: Clock3,
      route: "/agent/properties/listings",
      count: newListingsCount,
      countLabel: "new",
      iconStyle:
        "bg-amber-500/10 text-amber-400",
      hoverStyle:
        "hover:border-amber-500/40",
    },

    {
      title: "Reserved Properties",
      description:
        "Review properties currently reserved by prospective buyers or tenants.",
      icon: CalendarCheck2,
      route: "/agent/properties/reserved",
      count: propertyCounts.reserved,
      countLabel: "reserved",
      iconStyle:
        "bg-orange-500/10 text-orange-400",
      hoverStyle:
        "hover:border-orange-500/40",
    },

    {
      title: "Occupied Properties",
      description:
        "Review properties that are currently occupied.",
      icon: Building2,
      route: "/agent/properties/occupied",
      count: propertyCounts.occupied,
      countLabel: "occupied",
      iconStyle:
        "bg-blue-500/10 text-blue-400",
      hoverStyle:
        "hover:border-blue-500/40",
    },

    {
      title: "Inactive Properties",
      description:
        "Review properties that are currently inactive or unavailable.",
      icon: Ban,
      route: "/agent/properties/inactive",
      count: propertyCounts.inactive,
      countLabel: "inactive",
      iconStyle:
        "bg-slate-500/10 text-slate-400",
      hoverStyle:
        "hover:border-slate-500/40",
    },

    {
      title: "Sold Properties",
      description:
        "Review properties where the sales transaction has been completed.",
      icon: CircleDollarSign,
      route: "/agent/properties/sold",
      count: propertyCounts.sold,
      countLabel: "sold",
      iconStyle:
        "bg-red-500/10 text-red-400",
      hoverStyle:
        "hover:border-red-500/40",
    },

    {
      title: "AI Property Matches",
      description:
        "Use AI-assisted matching to find properties that fit qualified lead requirements.",
      icon: Sparkles,
      route: "/agent/properties/recommendations",
      count: null,
      countLabel: "AI",
      iconStyle:
        "bg-violet-500/10 text-violet-400",
      hoverStyle:
        "hover:border-violet-500/40",
    },

    {
      title: "Property Listings",
      description:
        "Browse the shared property inventory available in your agent workspace.",
      icon: Search,
      route: "/agent/properties/listings",
      count: propertyCounts.total,
      countLabel: "properties",
      iconStyle:
        "bg-cyan-500/10 text-cyan-400",
      hoverStyle:
        "hover:border-cyan-500/40",
    },
  ];

  /* ========================================================
     AGENT SALES WORKFLOW
  ======================================================== */

  const workflowSteps = [
    {
      step: "Step 1",
      title: "Review Leads",
      description:
        "Identify qualified leads who are actively looking for property.",
      icon: Users,
      route: "/agent/leads",
    },

    {
      step: "Step 2",
      title: "Find Property",
      description:
        "Search shared property inventory that fits the lead's requirements.",
      icon: Building2,
      route: "/agent/properties/available",
    },

    {
      step: "Step 3",
      title: "Use AI Matching",
      description:
        "Compare qualified lead preferences with available property characteristics.",
      icon: Sparkles,
      route: "/agent/properties/recommendations",
    },

    {
      step: "Step 4",
      title: "Schedule Viewing",
      description:
        "Move interested leads toward a property viewing.",
      icon: CalendarCheck2,
      route: "/agent/viewings",
    },
  ];

  /* ========================================================
     AGENT ACTION CENTER
  ======================================================== */

  const agentActions = [
    {
      title: "Browse Properties",
      description:
        "Explore the shared property inventory available to your workspace.",
      icon: Building2,
      route: "/agent/properties/listings",
    },

    {
      title: "Find Available Property",
      description:
        "Search properties that are currently available for your leads.",
      icon: CheckCircle2,
      route: "/agent/properties/available",
    },

    {
      title: "AI Property Matching",
      description:
        "Identify suitable property matches for qualified customers.",
      icon: Sparkles,
      route: "/agent/properties/recommendations",
    },

    {
      title: "Manage Viewings",
      description:
        "Review and manage customer property viewing appointments.",
      icon: CalendarCheck2,
      route: "/agent/viewings",
    },
  ];

  /* ========================================================
     REFRESH HANDLER
  ======================================================== */

  const handleRefresh = async () => {
    if (
      typeof refreshProperties !==
      "function"
    ) {
      console.warn(
        "[AgentPropertiesDashboard] refreshProperties is not available from useProperties."
      );

      return;
    }

    try {
      await refreshProperties();
    } catch (refreshError) {
      console.error(
        "[AgentPropertiesDashboard] Failed to refresh shared properties:",
        refreshError
      );
    }
  };

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {
    return (
      <section className="space-y-8">

        {/* HEADER SKELETON */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <div className="animate-pulse">

            <div className="h-5 w-40 rounded bg-slate-800" />

            <div className="mt-3 h-9 w-64 rounded bg-slate-800" />

            <div className="mt-3 h-4 max-w-2xl rounded bg-slate-800" />

          </div>

        </section>

        {/* CARD SKELETONS */}

        <section>

          <div className="mb-5">

            <div className="h-7 w-56 animate-pulse rounded bg-slate-800" />

            <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800" />

          </div>

          <div
            className="
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-4
            "
          >

            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                key={index}
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-900
                  p-6
                "
              >

                <div className="animate-pulse">

                  <div className="h-11 w-11 rounded-xl bg-slate-800" />

                  <div className="mt-5 h-5 w-3/4 rounded bg-slate-800" />

                  <div className="mt-3 h-4 w-full rounded bg-slate-800" />

                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-800" />

                </div>

              </div>
            ))}

          </div>

        </section>

      </section>
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <section
        className="
          flex
          flex-col
          gap-5
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        {/* --------------------------------------------------
            TITLE
        -------------------------------------------------- */}

        <div className="flex items-center gap-4">

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-cyan-500/10
              text-cyan-400
            "
          >
            <Building2 className="h-6 w-6" />
          </div>

          <div>

            <p className="text-sm font-medium text-cyan-400">
              Agent Workspace
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              Properties
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Access shared property inventory, match
              properties with qualified leads, and move
              customers toward successful viewings.
            </p>

          </div>

        </div>

        {/* --------------------------------------------------
            HEADER ACTIONS
        -------------------------------------------------- */}

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/agent/properties/listings"
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:border-cyan-500/50
              hover:bg-slate-800
            "
          >

            <Search className="h-4 w-4" />

            Browse Properties

          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/agent/properties/recommendations"
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >

            <Sparkles className="h-4 w-4" />

            AI Property Matches

          </button>

          {typeof refreshProperties ===
            "function" && (
            <button
              type="button"
              onClick={handleRefresh}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:bg-slate-800
              "
            >
              Refresh
            </button>
          )}

        </div>

      </section>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <section
          className="
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-5
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <h2 className="font-semibold text-white">
                Unable to load shared properties
              </h2>

              <p className="mt-1 text-sm text-red-300">
                {error}
              </p>

            </div>

            {typeof refreshProperties ===
              "function" && (
              <button
                type="button"
                onClick={handleRefresh}
                className="
                  shrink-0
                  rounded-xl
                  border
                  border-red-500/30
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-red-300
                  transition
                  hover:bg-red-500/10
                "
              >
                Retry
              </button>
            )}

          </div>

        </section>
      )}

      {/* ====================================================
          SHARED INVENTORY SUMMARY
      ==================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Shared Property Inventory
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Property areas available to you through the
            shared property workspace.
          </p>

        </div>

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
            xl:grid-cols-4
          "
        >

          {propertyAreas.map((area) => {

            const Icon = area.icon;

            return (
              <button
                key={area.title}
                type="button"
                onClick={() =>
                  navigate(area.route)
                }
                className={`
                  group
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-900
                  p-6
                  text-left
                  transition
                  duration-200
                  hover:bg-slate-800
                  ${area.hoverStyle}
                `}
              >

                <div className="flex items-center justify-between">

                  <div
                    className={`
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      ${area.iconStyle}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowRight
                    className="
                      h-5
                      w-5
                      text-slate-600
                      transition
                      group-hover:translate-x-1
                      group-hover:text-slate-300
                    "
                  />

                </div>

                <h3 className="mt-5 font-semibold text-white">
                  {area.title}
                </h3>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-400">
                  {area.description}
                </p>

                {/* COUNT */}

                <div className="mt-5 flex items-end justify-between">

                  <div>

                    {area.count !== null ? (
                      <>
                        <p className="text-2xl font-bold text-white">
                          {area.count}
                        </p>

                        <p className="text-xs text-slate-500">
                          {area.countLabel}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-violet-400">
                          AI
                        </p>

                        <p className="text-xs text-slate-500">
                          matching
                        </p>
                      </>
                    )}

                  </div>

                  <span
                    className="
                      text-sm
                      font-medium
                      text-cyan-400
                      opacity-0
                      transition
                      group-hover:opacity-100
                    "
                  >
                    Open
                  </span>

                </div>

              </button>
            );

          })}

        </div>

      </section>

      {/* ====================================================
          AGENT SALES WORKFLOW
      ==================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Property Sales Workflow
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Move from a qualified lead to the right property
            and then toward a viewing.
          </p>

        </div>

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
            xl:grid-cols-4
          "
        >

          {workflowSteps.map((workflow) => {

            const Icon = workflow.icon;

            return (
              <button
                key={workflow.step}
                type="button"
                onClick={() =>
                  navigate(workflow.route)
                }
                className="
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-6
                  text-left
                  transition
                  hover:border-cyan-500/40
                  hover:bg-slate-900
                "
              >

                <div className="flex items-center justify-between">

                  <span
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-cyan-400
                    "
                  >
                    {workflow.step}
                  </span>

                  <Icon
                    className="
                      h-5
                      w-5
                      text-slate-600
                    "
                  />

                </div>

                <h3 className="mt-4 font-semibold text-white">
                  {workflow.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {workflow.description}
                </p>

                <div
                  className="
                    mt-5
                    flex
                    items-center
                    gap-2
                    text-sm
                    font-medium
                    text-cyan-400
                  "
                >
                  Open

                  <ArrowRight className="h-4 w-4" />
                </div>

              </button>
            );

          })}

        </div>

      </section>

      {/* ====================================================
          AGENT ACTION CENTER
      ==================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Agent Actions
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Common property tasks for your sales workflow.
          </p>

        </div>

        <div
          className="
            grid
            gap-5
            md:grid-cols-2
            xl:grid-cols-4
          "
        >

          {agentActions.map((action) => {

            const Icon = action.icon;

            return (
              <button
                key={action.title}
                type="button"
                onClick={() =>
                  navigate(action.route)
                }
                className="
                  flex
                  items-start
                  gap-4
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-900
                  p-5
                  text-left
                  transition
                  hover:border-cyan-500/40
                  hover:bg-slate-800
                "
              >

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-800
                    text-cyan-400
                  "
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>

                  <h3 className="font-semibold text-white">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    {action.description}
                  </p>

                </div>

              </button>
            );

          })}

        </div>

      </section>

      {/* ====================================================
          AGENT RESPONSIBILITY
      ==================================================== */}

      <section
        className="
          rounded-3xl
          border
          border-cyan-500/20
          bg-cyan-500/5
          p-6
        "
      >

        <div className="flex items-start gap-4">

          <Sparkles
            className="
              mt-1
              h-6
              w-6
              shrink-0
              text-cyan-400
            "
          />

          <div>

            <h2 className="font-semibold text-white">
              Shared Agent Property Workspace
            </h2>

            <p
              className="
                mt-2
                max-w-4xl
                text-sm
                leading-6
                text-slate-400
              "
            >
              This workspace gives agents access to the
              shared property inventory permitted by the
              application. Use available properties,
              listings, reserved, occupied, inactive and
              sold property views to understand inventory,
              while AI-assisted matching helps identify
              suitable properties for qualified customers.
              Property administration remains under the
              admin property workspace.
            </p>

          </div>

        </div>

      </section>

    </section>
  );
};

/* ==========================================================
   EXPORT
========================================================== */

export default AgentPropertiesDashboard;