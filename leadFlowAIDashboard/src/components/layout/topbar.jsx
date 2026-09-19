/**
 * ==========================================================
 *
 * Global application header shared by:
 *
 * • Admin Dashboard
 * • Agent Dashboard
 * • Viewer Dashboard
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Display page title
 * • Display current date
 * • Sidebar toggle
 * • Global search
 * • Notifications
 * • Logged-in user information
 *
 * Authentication
 * ----------------------------------------------------------
 * Uses AuthContext through useAuth().
 *
 * Never reads localStorage directly.
 *
 * ==========================================================
 */

import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

const Topbar = ({ onToggleSidebar }) => {
  //----------------------------------------------------------
  // Router
  //----------------------------------------------------------

  const location = useLocation();

  //----------------------------------------------------------
  // Authentication
  //----------------------------------------------------------

  const { user } = useAuth();

  //----------------------------------------------------------
  // Current Date
  //----------------------------------------------------------

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-KE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  //----------------------------------------------------------
  // Page Title
  //----------------------------------------------------------

  const pageTitle = useMemo(() => {
    const path = location.pathname;

    /*
    ========================================================
    ADMIN
    ========================================================
    */

    if (path === "/dashboard/admin")
      return "Admin Dashboard";

    if (path === "/properties")
      return "Properties Dashboard";

    if (path === "/admin/users")
      return "User Management";

    if (path === "/admin/settings")
      return "Workspace Settings";

    if (path === "/admin/analytics")
      return "Analytics";

    if (path === "/admin/conversations")
      return "Conversation Center";

    /*
    ========================================================
    AGENT
    ========================================================
    */

    if (path === "/dashboard/agent")
      return "Agent Dashboard";

    if (path === "/leads")
      return "My Leads";

    if (path === "/properties")
      return "Properties Dashboard";

    if (path === "/followups/calendar")
      return "Calendar";

    if (path === "/conversations")
      return "Conversation Center";

    /*
    ========================================================
    VIEWER
    ========================================================
    */

    if (path === "/dashboard/viewer")
      return "Dashboard";

    if (path === "/properties")
      return "Browse Properties";

    if (path === "/viewer/saved-properties")
      return "Saved Properties";

    if (path === "/viewer/profile")
      return "My Profile";

    if (path === "/conversations")
      return "Messages";

    return "LeadFlow AI";
  }, [location.pathname]);

  //----------------------------------------------------------
  // Search Placeholder
  //----------------------------------------------------------

  const searchPlaceholder = useMemo(() => {
    switch (user?.role) {
      case "admin":
        return "Search users, agencies, properties...";

      case "agent":
        return "Search leads, conversations...";

      case "viewer":
        return "Search properties...";

      default:
        return "Search...";
    }
  }, [user]);

  //----------------------------------------------------------
  // Role Badge Colors
  //----------------------------------------------------------

  const roleColors = {
    admin:
      "bg-red-500/20 text-red-400 border border-red-500/30",

    agent:
      "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",

    viewer:
      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  };

  //----------------------------------------------------------
  // Role Labels
  //----------------------------------------------------------

  const roleLabels = {
    admin: "Platform Admin",

    agent: "Property Agent",

    viewer: "Property Seeker",
  };

  //----------------------------------------------------------
  // Render
  //----------------------------------------------------------

  return (
    <header
      className="
        sticky
        top-0
        z-40
        flex
        h-20
        items-center
        justify-between
        border-b
        border-slate-800
        bg-slate-900
        px-6
      "
    >
      {/* =====================================
          LEFT
      ===================================== */}

      <div className="flex items-center gap-5">

        <button
          onClick={onToggleSidebar}
          className="
            rounded-xl
            bg-slate-800
            p-3
            text-white
            transition
            hover:bg-slate-700
          "
        >
          ☰
        </button>

        <div>

          <h1 className="text-2xl font-bold text-white">
            {pageTitle}
          </h1>

          <p className="text-sm text-slate-400">
            {currentDate}
          </p>

        </div>

      </div>

      {/* =====================================
          CENTER
      ===================================== */}

      <div className="hidden w-[420px] lg:block">

        <div className="relative">

          <span className="absolute left-4 top-3.5 text-slate-500">
            🔍
          </span>

          <input
            type="text"
            placeholder={searchPlaceholder}
            className="
              w-full
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              py-3
              pl-12
              pr-4
              text-sm
              text-white
              placeholder:text-slate-500
              outline-none
              transition
              focus:border-cyan-500
            "
          />

        </div>

      </div>

      {/* =====================================
          RIGHT
      ===================================== */}

      <div className="flex items-center gap-5">

        {/* ==============================
            Notifications
        ============================== */}

        <button
          className="
            relative
            rounded-xl
            bg-slate-800
            p-3
            transition
            hover:bg-slate-700
          "
        >
          <span className="text-xl">🔔</span>

          <span
            className="
              absolute
              right-2
              top-2
              h-2
              w-2
              rounded-full
              bg-red-500
            "
          />
        </button>

        {/* ==============================
            User Role
        ============================== */}

        <span
          className={`
            rounded-full
            px-4
            py-2
            text-sm
            font-semibold
            capitalize
            ${
              roleColors[user?.role] ??
              "border border-slate-700 bg-slate-800 text-white"
            }
          `}
        >
          {roleLabels[user?.role] ?? "User"}
        </span>

        {/* ==============================
            User Profile
        ============================== */}

        <div className="flex items-center gap-3">

          {/* Avatar */}

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-cyan-500
              text-lg
              font-bold
              text-slate-950
            "
          >
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : "U"}
          </div>

          {/* User Details */}

          <div className="hidden lg:block">

            <p className="font-semibold text-white">
              {user?.name ?? "Unknown User"}
            </p>

            <p className="text-sm text-slate-400">
              {user?.email ?? "No email"}
            </p>

          </div>

        </div>

      </div>

    </header>
  );
};

export default Topbar;