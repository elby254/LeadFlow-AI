/**
 * ==========================================================
 * MainLayout
 * ==========================================================
 *
 * Shared application layout used across all dashboards.
 *
 * Layout Structure
 * ----------------------------------------------------------
 *
 * ┌──────────────────────────────────────────────┐
 * │ SidebarRouter │ TopBar                       │
 * │               ├──────────────────────────────┤
 * │               │                              │
 * │               │      Page Content            │
 * │               │                              │
 * └──────────────────────────────────────────────┘
 *
 * SidebarRouter automatically renders:
 *
 * • AdminSidebar
 * • AgentSidebar
 * • ViewerSidebar
 *
 * based on the authenticated user's role.
 *
 * ==========================================================
 */

import { useState } from "react";

import { Outlet } from "react-router-dom";

import SidebarRouter from "./sidebars/SidebarRouter";
import Topbar from "./Topbar";


const MainLayout = () => {
  //----------------------------------------------------------
  // Sidebar collapse state
  //----------------------------------------------------------

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      {/* =========================================
          ROLE-BASED SIDEBAR
      ========================================= */}

      <SidebarRouter
        sidebarOpen={sidebarOpen}
      />

      {/* =========================================
          MAIN CONTENT AREA
      ========================================= */}

      <div className="flex flex-1 flex-col">

        {/* =====================================
            TOP BAR
        ===================================== */}

        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() =>
            setSidebarOpen(previous => !previous)
          }  
        />

        {/* =====================================
            PAGE CONTENT
        ===================================== */}

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default MainLayout;