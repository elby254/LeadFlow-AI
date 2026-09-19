/**
 * ==========================================================
 * Agent Navigation
 *
 * File
 * ----
 * src/components/layout/AgentSidebar.jsx
 *
 * Purpose
 * -------
 * Provides navigation for the Sales Agent workspace.
 *
 * ==========================================================
 *
 * AGENT WORKFLOW
 * ----------------------------------------------------------
 *
 * Dashboard
 *     ↓
 * Leads
 *     ↓
 * Qualification
 *     ↓
 * Property Matching
 *     ↓
 * Properties
 *     ↓
 * Conversations
 *     ↓
 * Viewings
 *     ↓
 * Calendar
 *     ↓
 * Follow-ups
 *     ↓
 * Negotiation
 *     ↓
 * Conversion
 *     ↓
 * Performance
 *
 * ==========================================================
 *
 * AGENT RESPONSIBILITIES
 * ----------------------------------------------------------
 *
 * • Manage assigned leads
 * • Qualify assigned leads
 * • Understand customer intent
 * • Match customers with properties
 * • Browse available properties
 * • Communicate with customers
 * • Schedule and manage property viewings
 * • Manage personal calendar
 * • Manage customer follow-ups
 * • Handle negotiation workflow
 * • Track converted leads
 * • Monitor personal sales performance
 * • Maintain personal profile
 *
 * ==========================================================
 *
 * AGENT DOES NOT HAVE ACCESS TO
 * ----------------------------------------------------------
 *
 * ✗ User Management
 * ✗ Organization Administration
 * ✗ System Settings
 * ✗ Admin Analytics
 * ✗ Admin Dashboard
 * ✗ Organization-wide administration
 * ✗ Permanent property deletion
 * ✗ Other agents' private performance data
 *
 * ==========================================================
 */

import useAuth from "../../../hooks/useAuth";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Building2,
  Sparkles,
  MessageSquare,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Handshake,
  BadgeCheck,
  TrendingUp,
  UserCircle,
  LogOut,
  BriefcaseBusiness,
} from "lucide-react";


/*
==========================================================
COMPONENT
==========================================================
*/

const AgentSidebar = ({
  sidebarOpen = true,
}) => {

  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();


  /*
  ==========================================================
  AGENT NAVIGATION
  ==========================================================
  */

  const menu = [

    /*
    --------------------------------------------------------
    DASHBOARD
    --------------------------------------------------------
    */

    {
      label: "Dashboard",
      path: "/agent",
      icon: LayoutDashboard,
    },


    /*
    --------------------------------------------------------
    LEADS
    --------------------------------------------------------
    */

    {
      label: "My Leads",
      path: "/agent/leads",
      icon: Users,
    },

    /*
    --------------------------------------------------------
    PROPERTIES
    --------------------------------------------------------
    */

    {
      label: "Properties",
      path: "/agent/properties",
      icon: Building2,
    },


    /*
    --------------------------------------------------------
    CONVERSATIONS
    --------------------------------------------------------
    */

    {
      label: "Conversations",
      path: "/agent/conversations",
      icon: MessageSquare,
    },


    /*
    --------------------------------------------------------
    VIEWINGS
    --------------------------------------------------------
    */

    {
      label: "Viewings",
      path: "/agent/viewings",
      icon: CalendarCheck,
    },


    /*
    --------------------------------------------------------
    CALENDAR
    --------------------------------------------------------
    */

    {
      label: "Calendar",
      path: "/agent/calendar",
      icon: CalendarDays,
    },


    /*
    --------------------------------------------------------
    FOLLOW-UPS
    --------------------------------------------------------
    */

    {
      label: "Follow-ups",
      path: "/agent/follow-ups",
      icon: ClipboardList,
    },


    /*
    --------------------------------------------------------
    NEGOTIATION
    --------------------------------------------------------
    */

    {
      label: "Negotiation",
      path: "/agent/negotiation",
      icon: Handshake,
    },


    /*
    --------------------------------------------------------
    CONVERSION
    --------------------------------------------------------
    */

    {
      label: "Conversions",
      path: "/agent/conversions",
      icon: BadgeCheck,
    },


    /*
    --------------------------------------------------------
    PERFORMANCE
    --------------------------------------------------------
    */

    {
      label: "My Performance",
      path: "/agent/performance",
      icon: TrendingUp,
    },

  ];


  /*
  ==========================================================
  LOGOUT
  ==========================================================
  */

  const handleLogout = () => {

    try {

      logout();

    } catch (error) {

      console.error(
        "[AgentSidebar] Logout error:",
        error
      );

    }

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (

    <aside
      className={`
        flex
        h-screen
        flex-col
        border-r
        border-slate-800
        bg-slate-950
        transition-all
        duration-300

        ${
          sidebarOpen
            ? "w-72"
            : "w-24"
        }
      `}
    >


      {/* ====================================================
          BRAND
      ==================================================== */}

      <div
        className="
          border-b
          border-slate-800
          p-6
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          {/* Brand Icon */}

          <div
            className="
              flex
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-cyan-500
              p-3
            "
          >

            <BriefcaseBusiness
              size={22}
              className="text-slate-950"
            />

          </div>


          {/* Brand Text */}

          {sidebarOpen && (

            <div>

              <h1
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                LeadFlow AI
              </h1>

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >
                Sales Agent Portal
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ====================================================
          AUTHENTICATED AGENT
      ==================================================== */}

      <div
        className="
          border-b
          border-slate-800
          p-5
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          {/* =================================================
              AGENT AVATAR
          ================================================= */}

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-cyan-500
              font-bold
              text-slate-950
            "
          >

            {user?.name
              ?.charAt(0)
              ?.toUpperCase() || "A"}

          </div>


          {/* =================================================
              AGENT INFORMATION
          ================================================= */}

          {sidebarOpen && (

            <div className="min-w-0">

              <p
                className="
                  truncate
                  font-semibold
                  text-white
                "
              >
                {user?.name || "Agent"}
              </p>

              <p
                className="
                  truncate
                  text-sm
                  text-cyan-400
                "
              >
                Sales Agent
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ====================================================
          AGENT NAVIGATION
      ==================================================== */}

      <nav
        className="
          flex-1
          overflow-y-auto
          p-4
        "
      >

        <ul className="space-y-2">

          {menu.map((item) => {

            const Icon = item.icon;

            return (

              <li
                key={item.path}
              >

                <NavLink
                  to={item.path}
                  end={
                    item.path === "/agent"
                  }
                  title={
                    !sidebarOpen
                      ? item.label
                      : undefined
                  }
                  className={({ isActive }) =>
                    `
                      flex
                      items-center
                      gap-4
                      rounded-xl
                      px-4
                      py-3
                      transition-all
                      duration-200

                      ${
                        isActive
                          ? `
                            bg-cyan-500
                            font-semibold
                            text-slate-950
                            shadow-lg
                          `
                          : `
                            text-slate-300
                            hover:bg-slate-800
                            hover:text-white
                          `
                      }
                    `
                  }
                >

                  <Icon
                    size={20}
                    className="
                      shrink-0
                    "
                  />


                  {sidebarOpen && (

                    <span>
                      {item.label}
                    </span>

                  )}

                </NavLink>

              </li>

            );

          })}

        </ul>

      </nav>


      {/* ====================================================
          AGENT ACCOUNT
      ==================================================== */}

      <div
        className="
          border-t
          border-slate-800
          p-4
        "
      >


        {/* ==================================================
            PROFILE
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/agent/profile"
            )
          }
          title={
            !sidebarOpen
              ? "Profile"
              : undefined
          }
          className="
            mb-2
            flex
            w-full
            items-center
            gap-4
            rounded-xl
            px-4
            py-3
            text-slate-300
            transition
            hover:bg-slate-800
            hover:text-white
          "
        >

          <UserCircle
            size={20}
            className="shrink-0"
          />

          {sidebarOpen && (

            <span>
              My Profile
            </span>

          )}

        </button>


        {/* ==================================================
            LOGOUT
        ================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          title={
            !sidebarOpen
              ? "Logout"
              : undefined
          }
          className="
            flex
            w-full
            items-center
            gap-4
            rounded-xl
            bg-red-500
            px-4
            py-3
            font-semibold
            text-white
            transition
            hover:bg-red-400
          "
        >

          <LogOut
            size={20}
            className="shrink-0"
          />

          {sidebarOpen && (

            <span>
              Logout
            </span>

          )}

        </button>

      </div>

    </aside>

  );

};


export default AgentSidebar;