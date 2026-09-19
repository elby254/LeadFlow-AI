/**
 * Chooses the correct sidebar based on the authenticated
 * user's role.
 *
 * Supported Roles
 * ----------------------------------------------------------
 * • admin
 * • agent
 * • viewer
 *
 * If no role exists, ViewerSidebar is used by default.
 *
 * Used by:
 * • MainLayout.jsx
 *
 * ==========================================================
 */

import useAuth from "../../../hooks/useAuth";

import AdminSidebar from "./adminSidebar";
import AgentSidebar from "./agentSidebar";
import ViewerSidebar from "./viewerSidebar";

const SidebarRouter = ({ sidebarOpen }) => {
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();

  switch (role) {
    case "admin":
      return <AdminSidebar sidebarOpen={sidebarOpen} />;

    case "agent":
      return <AgentSidebar sidebarOpen={sidebarOpen} />;

    case "viewer":
      return <ViewerSidebar sidebarOpen={sidebarOpen} />;

    default:
      console.warn("SidebarRouter: unknown role:", user?.role);
      return null;
  }
};

export default SidebarRouter;