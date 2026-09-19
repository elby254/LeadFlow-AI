/**
 * ==========================================================
 *
 * Route
 * ----------------------------------------------------------
 * /admin/properties
 *
 * Purpose
 * ----------------------------------------------------------
 * Main administrative property control center.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This file is ONLY the ADMIN PROPERTY OVERVIEW.
 *
 * It does NOT render:
 * • Listings page
 * • AvailableProperties page
 * • SoldProperties page
 * • Recommendations page
 * • MainLayout
 * • Another AdminDashboard
 *
 * Those are separate routes handled by App.jsx.
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import {
  Building2,
  CheckCircle2,
  BadgeDollarSign,
  Plus,
  List,
  Sparkles,
  Archive,
  Settings2,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Home,
  Ban,
} from "lucide-react";

/* ==========================================================
   ADMIN PROPERTIES DASHBOARD
========================================================== */

const AdminPropertiesDashboard = () => {
  const navigate = useNavigate();

  /* ========================================================
     PROPERTY MANAGEMENT NAVIGATION
  ======================================================== */

  const managementCards = [
    {
      title: "All Listings",
      description:
        "View and manage every property registered in the organization.",
      icon: List,
      route: "/admin/properties/listings",
      iconClass: "text-cyan-400",
      iconBackground: "bg-cyan-500/10",
      hoverBorder: "hover:border-cyan-500/40",
    },

    {
      title: "Available Properties",
      description:
        "Monitor properties currently available for customers.",
      icon: CheckCircle2,
      route: "/admin/properties/available",
      iconClass: "text-emerald-400",
      iconBackground: "bg-emerald-500/10",
      hoverBorder: "hover:border-emerald-500/40",
    },

    {
      title: "Reserved Properties",
      description:
        "Review properties currently reserved for prospective customers.",
      icon: CalendarClock,
      route: "/admin/properties/reserved",
      iconClass: "text-blue-400",
      iconBackground: "bg-blue-500/10",
      hoverBorder: "hover:border-blue-500/40",
    },

    {
      title: "Occupied Properties",
      description:
        "Review properties currently occupied by tenants or customers.",
      icon: Home,
      route: "/admin/properties/occupied",
      iconClass: "text-orange-400",
      iconBackground: "bg-orange-500/10",
      hoverBorder: "hover:border-orange-500/40",
    },

    {
      title: "Sold Properties",
      description:
        "Review completed property transactions and sales history.",
      icon: BadgeDollarSign,
      route: "/admin/properties/sold",
      iconClass: "text-amber-400",
      iconBackground: "bg-amber-500/10",
      hoverBorder: "hover:border-amber-500/40",
    },

    {
      title: "Inactive Properties",
      description:
        "Review properties that are currently inactive in the inventory.",
      icon: Ban,
      route: "/admin/properties/inactive",
      iconClass: "text-rose-400",
      iconBackground: "bg-rose-500/10",
      hoverBorder: "hover:border-rose-500/40",
    },

    {
      title: "AI Recommendations",
      description:
        "Review AI-assisted property matches for qualified leads.",
      icon: Sparkles,
      route: "/admin/properties/recommendations",
      iconClass: "text-violet-400",
      iconBackground: "bg-violet-500/10",
      hoverBorder: "hover:border-violet-500/40",
    },
  ];

  /* ========================================================
     ADMIN ACTIONS
  ======================================================== */

  const adminActions = [
    {
      title: "Add Property",
      description:
        "Register a new property in the LeadFlow AI inventory.",
      icon: Plus,
      route: "/admin/properties/add",
    },

    {
      title: "Property Inventory",
      description:
        "Review the complete organization property portfolio.",
      icon: Building2,
      route: "/admin/properties/listings",
    },

    {
      title: "Property Analytics",
      description:
        "Review inventory, availability and transaction statistics.",
      icon: BarChart3,
      route: "/admin/properties/statistics",
    },

    {
      title: "Property Settings",
      description:
        "Configure property management options.",
      icon: Settings2,
      route: "/admin/properties/settings",
    },
  ];

  /* ========================================================
     NAVIGATION HELPER
  ======================================================== */

  const handleNavigate = (route) => {
    navigate(route);
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section className="space-y-10">

      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <header
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
            <h1 className="text-3xl font-bold text-white">
              Properties Management
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Administrative control center for the LeadFlow AI
              property portfolio.
            </p>
          </div>

        </div>

        {/* ==================================================
            ADD PROPERTY
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            handleNavigate("/admin/properties/add")
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
          <Plus className="h-5 w-5" />

          Add Property
        </button>

      </header>


      {/* ====================================================
          PROPERTY OVERVIEW
      ==================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Property Overview
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Quickly access the main areas of your organization
            property portfolio.
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

          {/* ==================================================
              INVENTORY
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleNavigate("/admin/properties/listings")
            }
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
              text-left
              transition
              hover:border-cyan-500/40
              hover:bg-slate-900/80
            "
          >

            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-cyan-500/10
                  text-cyan-400
                "
              >
                <Building2 className="h-5 w-5" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600" />

            </div>

            <p className="mt-5 text-sm text-slate-400">
              Property Inventory
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              Listings
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Organization-wide property portfolio.
            </p>

          </button>


          {/* ==================================================
              AVAILABLE
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleNavigate("/admin/properties/available")
            }
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
              text-left
              transition
              hover:border-emerald-500/40
              hover:bg-slate-900/80
            "
          >

            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-500/10
                  text-emerald-400
                "
              >
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600" />

            </div>

            <p className="mt-5 text-sm text-slate-400">
              Availability
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              Available
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Properties currently open for customers.
            </p>

          </button>


          {/* ==================================================
              RESERVED
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleNavigate("/admin/properties/reserved")
            }
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
              text-left
              transition
              hover:border-blue-500/40
              hover:bg-slate-900/80
            "
          >

            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-500/10
                  text-blue-400
                "
              >
                <CalendarClock className="h-5 w-5" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600" />

            </div>

            <p className="mt-5 text-sm text-slate-400">
              Reservation Status
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              Reserved
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Properties currently reserved for customers.
            </p>

          </button>


          {/* ==================================================
              OCCUPIED
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleNavigate("/admin/properties/occupied")
            }
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
              text-left
              transition
              hover:border-orange-500/40
              hover:bg-slate-900/80
            "
          >

            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-orange-500/10
                  text-orange-400
                "
              >
                <Home className="h-5 w-5" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600" />

            </div>

            <p className="mt-5 text-sm text-slate-400">
              Occupancy Status
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              Occupied
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Properties currently occupied by tenants or customers.
            </p>

          </button>


          {/* ==================================================
              SOLD
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleNavigate("/admin/properties/sold")
            }
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
              text-left
              transition
              hover:border-amber-500/40
              hover:bg-slate-900/80
            "
          >

            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-amber-500/10
                  text-amber-400
                "
              >
                <BadgeDollarSign className="h-5 w-5" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600" />

            </div>

            <p className="mt-5 text-sm text-slate-400">
              Transactions
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              Sold
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Completed property transactions.
            </p>

          </button>


          {/* ==================================================
              INACTIVE
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleNavigate("/admin/properties/inactive")
            }
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
              text-left
              transition
              hover:border-rose-500/40
              hover:bg-slate-900/80
            "
          >

            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-rose-500/10
                  text-rose-400
                "
              >
                <Ban className="h-5 w-5" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600" />

            </div>

            <p className="mt-5 text-sm text-slate-400">
              Inventory Status
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              Inactive
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Properties currently inactive in the inventory.
            </p>

          </button>


          {/* ==================================================
              AI MATCHES
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleNavigate(
                "/admin/properties/recommendations"
              )
            }
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
              text-left
              transition
              hover:border-violet-500/40
              hover:bg-slate-900/80
            "
          >

            <div className="flex items-center justify-between">

              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-500/10
                  text-violet-400
                "
              >
                <Sparkles className="h-5 w-5" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600" />

            </div>

            <p className="mt-5 text-sm text-slate-400">
              Intelligence
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              AI Matches
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              AI-assisted lead/property matching.
            </p>

          </button>

        </div>

      </section>


      {/* ====================================================
          PROPERTY MANAGEMENT NAVIGATION
      ==================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Property Management
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage the property lifecycle across the organization.
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

          {/* ==================================================
              MANAGEMENT CARDS
          ================================================== */}

          {managementCards.map((card) => {

            const Icon = card.icon;

            return (
              <button
                key={card.title}
                type="button"
                onClick={() =>
                  handleNavigate(card.route)
                }
                className={`
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950
                  p-6
                  text-left
                  transition
                  ${card.hoverBorder}
                  hover:bg-slate-900
                `}
              >

                <div
                  className={`
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    ${card.iconBackground}
                  `}
                >
                  <Icon
                    className={`h-6 w-6 ${card.iconClass}`}
                  />
                </div>

                <h3 className="mt-5 font-semibold text-white">
                  {card.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {card.description}
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
          ADMIN ACTION CENTER
      ==================================================== */}

      <section>

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Administrative Actions
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Common property administration tasks.
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

          {/* ==================================================
              ADMIN ACTIONS
          ================================================== */}

          {adminActions.map((action) => {

            const Icon = action.icon;

            return (
              <button
                key={action.title}
                type="button"
                onClick={() =>
                  handleNavigate(action.route)
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
                  hover:bg-slate-900/80
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
          ADMIN PROPERTY RESPONSIBILITY
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

          <Archive
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
              Admin Property Oversight
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
              This workspace provides administrators with
              organization-wide visibility and control over the
              property lifecycle. Use the navigation above to
              open dedicated property pages for listings,
              availability, reserved properties, occupied
              properties, completed sales, inactive properties
              and AI-assisted recommendations.
            </p>

          </div>

        </div>

      </section>

    </section>
  );
};

export default AdminPropertiesDashboard;

