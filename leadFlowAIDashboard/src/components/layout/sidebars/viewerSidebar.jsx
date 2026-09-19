/**
 * ==========================================================
 *
 * VIEWER / CUSTOMER NAVIGATION
 *
 * ==========================================================
 *
 * Purpose
 * -------
 * Navigation sidebar for authenticated LeadFlow AI viewers.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • View personal dashboard
 * • Browse available properties
 * • Discover AI-powered recommendations
 * • View saved properties
 * • View own conversations
 * • View property viewing requests
 * • Manage personal profile
 * • Logout safely
 *
 * Permissions
 * ----------------------------------------------------------
 * CUSTOMER-SCOPED ACCESS
 *
 * The viewer can only access their own:
 *
 * • Dashboard
 * • Properties
 * • Recommendations
 * • Saved properties
 * • Conversations
 * • Viewing requests
 * • Profile
 *
 * The viewer MUST NOT receive navigation links to:
 *
 * • Leads
 * • Agents
 * • Admin properties
 * • Reports
 * • Analytics
 * • Organization settings
 * • User management
 * • Administrative tools
 *
 * ==========================================================
 *
 * CURRENT VIEWER ARCHITECTURE
 * ==========================================================
 *
 * Viewer
 *   │
 *   ├── Dashboard
 *   │
 *   ├── Browse Properties
 *   │
 *   ├── AI Recommendations
 *   │
 *   ├── Saved Properties
 *   │
 *   ├── Conversations
 *   │       │
 *   │       └── ViewerConversationCenter
 *   │               │
 *   │               ├── ConversationList
 *   │               ├── ConversationHeader
 *   │               ├── MessageList
 *   │               ├── MessageComposer
 *   │               └── ConversationPropertyCard
 *   │
 *   ├── My Viewings
 *   │
 *   └── Profile
 *
 * ==========================================================
 *
 * IMPORTANT
 * ==========================================================
 *
 * Navigation visibility is NOT a substitute for backend
 * authorization.
 *
 * RoleRoute and backend authorization must still enforce
 * viewer permissions.
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
  Building2,
  Sparkles,
  Bookmark,
  MessageSquare,
  CalendarCheck,
  User,
  LogOut,
} from "lucide-react";


/**
 * ==========================================================
 * COMPONENT
 * ==========================================================
 */

const ViewerSidebar = ({
  sidebarOpen = true,
}) => {

  /**
   * ========================================================
   * NAVIGATION
   * ========================================================
   */

  const navigate = useNavigate();


  /**
   * ========================================================
   * AUTH
   * ========================================================
   */

  const {
    user,
    logout,
  } = useAuth();


  /**
   * ========================================================
   * VIEWER NAVIGATION
   * ========================================================
   *
   * Keep this list limited to customer-facing functionality.
   *
   * IMPORTANT:
   * The Viewer dashboard is registered in App.jsx as:
   *
   *   /viewer
   *
   * through the index route:
   *
   *   <Route
   *     index
   *     element={<ViewerLanding />}
   *   />
   *
   * Therefore Dashboard MUST point to:
   *
   *   /viewer
   *
   * and NOT:
   *
   *   /viewer/dashboard
   *
   * ========================================================
   */

  const menu = [

    /**
     * ------------------------------------------------------
     * DASHBOARD
     * ------------------------------------------------------
     *
     * Registered in App.jsx as the Viewer index route:
     *
     * /viewer
     *
     * ------------------------------------------------------
     */

    {
      label: "Dashboard",
      path: "/viewer",
      icon: LayoutDashboard,
    },


    /**
     * ------------------------------------------------------
     * PROPERTY DISCOVERY
     * ------------------------------------------------------
     */

    {
      label: "Browse Properties",
      path: "/viewer/properties",
      icon: Building2,
    },


    /**
     * ------------------------------------------------------
     * AI RECOMMENDATIONS
     * ------------------------------------------------------
     *
     * Dedicated AI-powered property discovery page.
     *
     * Route:
     * /viewer/recommendations
     *
     * ------------------------------------------------------
     */

    {
      label: "AI Recommendations",
      path: "/viewer/recommendations",
      icon: Sparkles,
    },


    /**
     * ------------------------------------------------------
     * SAVED PROPERTIES
     * ------------------------------------------------------
     */

    {
      label: "Saved Properties",
      path: "/viewer/saved-properties",
      icon: Bookmark,
    },


    /**
     * ------------------------------------------------------
     * CONVERSATIONS
     * ------------------------------------------------------
     *
     * Main viewer/customer conversation center.
     *
     * Route:
     * /viewer/conversations
     *
     * ------------------------------------------------------
     */

    {
      label: "Conversations",
      path: "/viewer/conversations",
      icon: MessageSquare,
    },


    /**
     * ------------------------------------------------------
     * VIEWINGS
     * ------------------------------------------------------
     */

    {
      label: "My Viewings",
      path: "/viewer/viewings",
      icon: CalendarCheck,
    },


    /**
     * ------------------------------------------------------
     * PROFILE
     * ------------------------------------------------------
     */

    {
      label: "Profile",
      path: "/viewer/profile",
      icon: User,
    },

  ];


  /**
   * ==========================================================
   * LOGOUT
   * ==========================================================
   */

  const handleLogout = () => {

    console.log(
      "ViewerSidebar: Logging out viewer..."
    );


    try {

      logout();

    } catch (logoutError) {

      console.error(
        "ViewerSidebar: Logout error:",
        logoutError
      );

    } finally {

      /**
       * Always return the viewer to login after logout.
       */

      navigate("/login", {
        replace: true,
      });

    }

  };


  /**
   * ==========================================================
   * USER INITIAL
   * ==========================================================
   */

  const userInitial =
    user?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";


  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (

    <aside
      className={`
        flex
        h-screen
        shrink-0
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

      <div className="border-b border-slate-800 p-6">

        <div className="flex items-center gap-3">

          {/* Brand icon */}

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-cyan-500
            "
          >

            <User
              size={22}
              className="text-slate-950"
            />

          </div>


          {/* Brand text */}

          {sidebarOpen && (

            <div className="min-w-0">

              <h1
                className="
                  truncate
                  text-xl
                  font-bold
                  text-white
                "
              >
                LeadFlow AI
              </h1>


              <p
                className="
                  truncate
                  text-sm
                  text-slate-400
                "
              >
                Customer Portal
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ====================================================
          USER INFORMATION
      ==================================================== */}

      <div className="border-b border-slate-800 p-5">

        <div className="flex items-center gap-3">

          {/* Avatar */}

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
            title={
              user?.name ||
              "Customer"
            }
          >

            {userInitial}

          </div>


          {/* User details */}

          {sidebarOpen && (

            <div className="min-w-0">

              <p
                className="
                  truncate
                  font-semibold
                  text-white
                "
              >
                {user?.name ||
                  "Customer"}
              </p>


              <p
                className="
                  text-sm
                  text-cyan-400
                "
              >
                Viewer
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ====================================================
          NAVIGATION
      ==================================================== */}

      <nav
        className="
          flex-1
          overflow-y-auto
          p-4
        "
        aria-label="Viewer navigation"
      >

        <ul className="space-y-2">

          {menu.map((item) => {

            const Icon = item.icon;


            return (

              <li key={item.path}>

                <NavLink
                  to={item.path}
                  title={
                    !sidebarOpen
                      ? item.label
                      : undefined
                  }
                  aria-label={
                    item.label
                  }
                  className={({
                    isActive,
                  }) =>
                    `
                      group
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

                      ${
                        !sidebarOpen
                          ? "justify-center"
                          : ""
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

                    <span className="truncate">

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
          FOOTER / LOGOUT
      ==================================================== */}

      <div className="border-t border-slate-800 p-4">

        <button
          type="button"
          onClick={handleLogout}
          title={
            !sidebarOpen
              ? "Logout"
              : undefined
          }
          aria-label="Logout"
          className={`
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
            transition-all
            duration-200
            hover:bg-red-400

            ${
              !sidebarOpen
                ? "justify-center"
                : ""
            }
          `}
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


export default ViewerSidebar;