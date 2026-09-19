/**
 * ==========================================================
 *
 * Administrator Navigation
 *
 * Responsibilities
 * ----------------------------------------------------------
 * • Dashboard Overview
 * • Lead Pipeline
 * • Property Management
 * • User Management
 * • Conversation Oversight
 * • Viewing Oversight
 * • Analytics
 * • Settings
 *
 * Administrator has agency-wide access.
 *
 * ==========================================================
 */

import useAuth from "../../../hooks/useAuth";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const AdminSidebar = ({ sidebarOpen = true }) => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  /* ==========================================================
     ADMIN NAVIGATION
  ========================================================== */

  const menu = [
    {
     label: "Dashboard",
     path: "/admin",
     icon: LayoutDashboard,
    },

    {
      label: "Properties",
      path: "/admin/properties",
      icon: Building2,
    },

    {
      label: "Users",
      path: "/admin/users",
      icon: Users,
    },

    {
      label: "Conversations",
      path: "/admin/conversations",
      icon: MessageSquare,
    },

    {
      label: "Viewings",
      path: "/admin/viewings",
      icon: CalendarCheck,
    },

    {
      label: "Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
    },

    {
      label: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* ==========================================================
     RENDER
  ========================================================== */

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
        ${sidebarOpen ? "w-72" : "w-24"}
      `}
    >
      {/* ======================================================
          BRAND
      ====================================================== */}

      <div className="border-b border-slate-800 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500 p-3">
            <ShieldCheck
              size={22}
              className="text-slate-950"
            />
          </div>

          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold text-white">
                LeadFlow AI
              </h1>

              <p className="text-sm text-slate-400">
                Administrator
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          USER
      ====================================================== */}

      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-cyan-500
              font-bold
              text-slate-950
            "
          >
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          {sidebarOpen && (
            <div>
              <p className="font-semibold text-white">
                {user?.name || "Administrator"}
              </p>

              <p className="text-sm text-cyan-400">
                Platform Administrator
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-4
                    rounded-xl
                    px-4
                    py-3
                    transition-all

                    ${
                      isActive
                        ? "bg-cyan-500 font-semibold text-slate-950 shadow-lg"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                    `
                  }
                >
                  <Icon size={20} />

                  {sidebarOpen && (
                    <span>{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={handleLogout}
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
          <LogOut size={20} />

          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;