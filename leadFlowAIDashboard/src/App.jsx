/**
 * ==========================================================
 *
 * LeadFlow AI — Root Application
 *
 * Purpose
 * ----------------------------------------------------------
 * Central routing for the entire LeadFlow AI application.
 *
 * WORKSPACES
 * ----------------------------------------------------------
 *
 * Admin
 *   /admin/*
 *
 * Agent
 *   /agent/*
 *
 * Viewer
 *   /viewer/*
 *
 * Layout Architecture
 * ----------------------------------------------------------
 *
 * RoleRoute
 *    ↓
 * MainLayout
 *    ↓
 * Sidebar + Topbar + Outlet
 *    ↓
 * Workspace Page
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Workspace pages DO NOT render MainLayout themselves.
 *
 * Shared property pages live in:
 *
 *   /pages/properties/*
 *
 * They are reused by:
 *
 *   /admin/properties/*
 *   /agent/properties/*
 *   /viewer/properties/*
 *
 * ==========================================================
 */

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/authContext";
import { ViewingProvider } from "./context/viewingContext";

import MainLayout from "./components/layout/mainlayout";
import RoleRoute from "./components/auth/roleRoute";


/* ==========================================================
   AUTHENTICATION
========================================================== */

import Login from "./pages/auth/login";
import ForgotPassword from "./pages/auth/forgotPassword";
import VerifyOTP from "./pages/auth/verifyOTP";
import ResetPassword from "./pages/auth/resetPassword";


/* ==========================================================
   ADMIN
========================================================== */

import AdminLanding from "./pages/admin/adminLanding";
import AdminUsers from "./pages/admin/adminUsers";
import AdminSettings from "./pages/admin/adminSettings";
import AdminAnalytics from "./pages/admin/adminAnalytics";
import AdminViewings from "./pages/admin/adminViewings";
import AdminAgents from "./pages/admin/adminAgents";


/* ==========================================================
   AGENT
========================================================== */

import AgentLanding from "./pages/agent/agentLanding";
import AgentCalendar from "./pages/agent/agentCalendar";
import AgentLeads from "./pages/agent/agentLeads";
import AgentViewings from "./pages/agent/agentViewings";

import AgentFollowUps from "./pages/agent/agentFollowUps";
import AgentPerformance from "./pages/agent/agentPerformance";
import AgentProfile from "./pages/agent/agentProfile";


/* ==========================================================
   VIEWER
========================================================== */

import ViewerLanding from "./pages/viewer/viewerLanding";
import ViewerProfile from "./pages/viewer/profile";
import SavedProperties from "./pages/viewer/savedProperties";
import Viewings from "./pages/viewer/viewings";


/* ==========================================================
   ADMIN PROPERTY WORKSPACE
========================================================== */

import AdminPropertiesDashboard
  from "./pages/admin/properties/adminPropertiesDashboard";

import PropertySettings
  from "./pages/admin/properties/propertySettings";


/* ==========================================================
   AGENT PROPERTY WORKSPACE
========================================================== */

import AgentPropertiesDashboard
  from "./pages/agent/properties/agentPropertiesDashboard";


/* ==========================================================
   SHARED PROPERTY PAGES
   ----------------------------------------------------------
   These components are intentionally shared between:
 *
   Admin
   Agent
   Viewer
========================================================== */

import PropertyDetails
  from "./pages/properties/propertyDetails";

import Listings
  from "./pages/properties/listings";

import AvailableProperties
  from "./pages/properties/availableProperties";

import SoldProperties
  from "./pages/properties/soldProperties";

import Recommendations
  from "./pages/properties/recommendations";

import AddProperty
  from "./pages/properties/addProperty";

import PropertyStatistics
  from "./pages/properties/propertyStatistics";

import ReservedProperties
  from "./pages/properties/reservedProperties";

import OccupiedProperties
  from "./pages/properties/occupiedProperties";

import InactiveProperties
  from "./pages/properties/inactiveProperties";


/* ==========================================================
   AGENT-SPECIFIC PROPERTY PAGES
========================================================== */

import AgentOccupiedProperties
  from "./pages/properties/agentOccupiedProperties";


/* ==========================================================
   SHARED FOLLOW-UP PAGES
========================================================== */

import FollowUps from "./pages/followups/followups";
import FollowUpPage from "./pages/followups/followUpPage";
import Calendar from "./pages/followups/calendar";


/* ==========================================================
   CONVERSATIONS
========================================================== */

import AdminConversationCenter
  from "./pages/conversations/adminConversationCenter";

import AgentConversationCenter
  from "./pages/conversations/agentConversationCenter";

import ViewerConversationCenter
  from "./pages/conversations/viewerConversationCenter";


/* ==========================================================
   REPORTS
========================================================== */

import ReportsDashboard
  from "./pages/reports/reportsDashboard";


/* ==========================================================
   ROLE CONSTANTS
========================================================== */

const ROLES = {
  ADMIN: "admin",
  AGENT: "agent",
  VIEWER: "viewer",
};


/* ==========================================================
   APP
========================================================== */

export default function App() {

  return (

    <AuthProvider>

      <Routes>


        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOTP />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* ==================================================
            SHARED FOLLOW-UP ROUTES
        ================================================== */}

        <Route
          path="/followups"
          element={<FollowUps />}
        />

        <Route
          path="/followup/:leadId"
          element={<FollowUpPage />}
        />

        <Route
          path="/calendar"
          element={<Calendar />}
        />


        {/* ==================================================
            ADMIN WORKSPACE
        ================================================== */}

        <Route
          path="/admin"
          element={
            <RoleRoute
              allowedRoles={[ROLES.ADMIN]}
            >
              <MainLayout />
            </RoleRoute>
          }
        >

          {/* =================================================
              ADMIN DASHBOARD

              /admin

              AdminLanding is registered here as the
              default page of the Admin workspace.
          ================================================= */}

          <Route
            index
            element={<AdminLanding />}
          />


          {/* =================================================
              ADMIN USERS

              /admin/users
          ================================================= */}

          <Route
            path="users"
            element={<AdminUsers />}
          />

          {/* =================================================
            ADMIN AGENTS

            /admin/agents
          ================================================= */}

          <Route
            path="agents"
            element={<AdminAgents />}
          />


          {/* =================================================
              ADMIN CONVERSATIONS

              /admin/conversations
          ================================================= */}

          <Route
            path="conversations"
            element={<AdminConversationCenter />}
          />


          {/* =================================================
              ADMIN SETTINGS

              /admin/settings
          ================================================= */}

          <Route
            path="settings"
            element={<AdminSettings />}
          />


          {/* =================================================
              ADMIN ANALYTICS

              /admin/analytics
          ================================================= */}

          <Route
            path="analytics"
            element={<AdminAnalytics />}
          />


          {/* =================================================
              ADMIN VIEWINGS

              /admin/viewings
          ================================================= */}

          <Route
            path="viewings"
            element={
              <ViewingProvider>
                <AdminViewings />
              </ViewingProvider>
            }
          />


          {/* =================================================
              ADMIN PROPERTY WORKSPACE
          ================================================= */}


          {/* -------------------------------------------------
              PROPERTY DASHBOARD

              /admin/properties
          ------------------------------------------------- */}

          <Route
            path="properties"
            element={
              <AdminPropertiesDashboard />
            }
          />


          {/* -------------------------------------------------
              ADD PROPERTY

              /admin/properties/add
          ------------------------------------------------- */}

          <Route
            path="properties/add"
            element={<AddProperty />}
          />


          {/* -------------------------------------------------
              ALL LISTINGS

              /admin/properties/listings
          ------------------------------------------------- */}

          <Route
            path="properties/listings"
            element={<Listings />}
          />


          {/* -------------------------------------------------
              AVAILABLE PROPERTIES

              /admin/properties/available
          ------------------------------------------------- */}

          <Route
            path="properties/available"
            element={<AvailableProperties />}
          />


          {/* -------------------------------------------------
              SOLD PROPERTIES

              /admin/properties/sold
          ------------------------------------------------- */}

          <Route
            path="properties/sold"
            element={<SoldProperties />}
          />


          {/* -------------------------------------------------
              RESERVED PROPERTIES

              /admin/properties/reserved
          ------------------------------------------------- */}

          <Route
            path="properties/reserved"
            element={<ReservedProperties />}
          />


          {/* -------------------------------------------------
              OCCUPIED PROPERTIES

              /admin/properties/occupied
          ------------------------------------------------- */}

          <Route
            path="properties/occupied"
            element={<OccupiedProperties />}
          />


          {/* -------------------------------------------------
              INACTIVE PROPERTIES

              /admin/properties/inactive
          ------------------------------------------------- */}

          <Route
            path="properties/inactive"
            element={<InactiveProperties />}
          />


          {/* -------------------------------------------------
              AI RECOMMENDATIONS

              /admin/properties/recommendations
          ------------------------------------------------- */}

          <Route
            path="properties/recommendations"
            element={<Recommendations />}
          />


          {/* -------------------------------------------------
              PROPERTY STATISTICS

              /admin/properties/statistics
          ------------------------------------------------- */}

          <Route
            path="properties/statistics"
            element={<PropertyStatistics />}
          />


          {/* -------------------------------------------------
              PROPERTY SETTINGS

              /admin/properties/settings
          ------------------------------------------------- */}

          <Route
            path="properties/settings"
            element={<PropertySettings />}
          />


          {/* -------------------------------------------------
              PROPERTY DETAILS

              /admin/properties/:propertyId

              IMPORTANT:
              Keep this after named property routes.
          ------------------------------------------------- */}

          <Route
            path="properties/:propertyId"
            element={<PropertyDetails />}
          />


          {/* =================================================
              ADMIN REPORTS

              /admin/reports
          ================================================= */}

          <Route
            path="reports"
            element={<ReportsDashboard />}
          />

        </Route>


        {/* ==================================================
            AGENT WORKSPACE
        ================================================== */}

        <Route
          path="/agent"
          element={
            <RoleRoute
              allowedRoles={[ROLES.AGENT]}
            >
              <MainLayout />
            </RoleRoute>
          }
        >

          {/* =================================================
              AGENT DASHBOARD

              /agent
          ================================================= */}

          <Route
            index
            element={<AgentLanding />}
          />


          {/* =================================================
              AGENT LEADS

              /agent/leads
          ================================================= */}

          <Route
            path="leads"
            element={<AgentLeads />}
          />


          {/* =================================================
              AGENT PROPERTY WORKSPACE
          ================================================= */}


          {/* -------------------------------------------------
              AGENT PROPERTY DASHBOARD

              /agent/properties
          ------------------------------------------------- */}

          <Route
            path="properties"
            element={
              <AgentPropertiesDashboard />
            }
          />


          {/* -------------------------------------------------
              AGENT ADD PROPERTY

              /agent/properties/add
          ------------------------------------------------- */}

          <Route
            path="properties/add"
            element={<AddProperty />}
          />


          {/* -------------------------------------------------
              AGENT ALL LISTINGS

              /agent/properties/listings
          ------------------------------------------------- */}

          <Route
            path="properties/listings"
            element={<Listings />}
          />


          {/* -------------------------------------------------
              AGENT AVAILABLE PROPERTIES

              /agent/properties/available
          ------------------------------------------------- */}

          <Route
            path="properties/available"
            element={<AvailableProperties />}
          />


          {/* -------------------------------------------------
              AGENT SOLD PROPERTIES

              /agent/properties/sold
          ------------------------------------------------- */}

          <Route
            path="properties/sold"
            element={<SoldProperties />}
          />


          {/* -------------------------------------------------
              AGENT RESERVED PROPERTIES

              /agent/properties/reserved
          ------------------------------------------------- */}

          <Route
            path="properties/reserved"
            element={<ReservedProperties />}
          />


          {/* -------------------------------------------------
              AGENT OCCUPIED PROPERTIES

              /agent/properties/occupied
          ------------------------------------------------- */}

          <Route
            path="properties/occupied"
            element={<AgentOccupiedProperties />}
          />


          {/* -------------------------------------------------
              AGENT INACTIVE PROPERTIES

              /agent/properties/inactive
          ------------------------------------------------- */}

          <Route
            path="properties/inactive"
            element={<InactiveProperties />}
          />


          {/* -------------------------------------------------
              AGENT AI RECOMMENDATIONS

              /agent/properties/recommendations
          ------------------------------------------------- */}

          <Route
            path="properties/recommendations"
            element={<Recommendations />}
          />


          {/* -------------------------------------------------
              AGENT PROPERTY STATISTICS

              /agent/properties/statistics
          ------------------------------------------------- */}

          <Route
            path="properties/statistics"
            element={<PropertyStatistics />}
          />


          {/* -------------------------------------------------
              AGENT PROPERTY SETTINGS

              /agent/properties/settings
          ------------------------------------------------- */}

          <Route
            path="properties/settings"
            element={<PropertySettings />}
          />


          {/* -------------------------------------------------
              AGENT PROPERTY DETAILS

              /agent/properties/:propertyId

              IMPORTANT:
              Keep this after all named property routes.
          ------------------------------------------------- */}

          <Route
            path="properties/:propertyId"
            element={<PropertyDetails />}
          />


          {/* =================================================
              AGENT VIEWINGS

              /agent/viewings
          ================================================= */}

          <Route
            path="viewings"
            element={
              <ViewingProvider>
                <AgentViewings />
              </ViewingProvider>
            }
          />


          {/* =================================================
              AGENT CALENDAR

              /agent/calendar
          ================================================= */}

          <Route
            path="calendar"
            element={<AgentCalendar />}
          />


          {/* =================================================
              AGENT FOLLOW-UPS

              /agent/follow-ups
          ================================================= */}

          <Route
            path="follow-ups"
            element={<AgentFollowUps />}
          />


          {/* =================================================
              AGENT CONVERSATIONS

              /agent/conversations
          ================================================= */}

          <Route
            path="conversations"
            element={
              <AgentConversationCenter />
            }
          />


          {/* =================================================
              AGENT PERFORMANCE

              /agent/performance
          ================================================= */}

          <Route
            path="performance"
            element={<AgentPerformance />}
          />


          {/* =================================================
              AGENT PROFILE

              /agent/profile
          ================================================= */}

          <Route
            path="profile"
            element={<AgentProfile />}
          />

        </Route>


        {/* ==================================================
            VIEWER WORKSPACE
        ================================================== */}

        <Route
          path="/viewer"
          element={
            <RoleRoute
              allowedRoles={[ROLES.VIEWER]}
            >
              <MainLayout />
            </RoleRoute>
          }
        >

          {/* =================================================
              VIEWER DASHBOARD

              /viewer

              ViewerLanding is registered here as the
              default page of the Viewer workspace.
          ================================================= */}

          <Route
            index
            element={<ViewerLanding />}
          />


          {/* =================================================
              VIEWER PROFILE

              /viewer/profile
          ================================================= */}

          <Route
            path="profile"
            element={<ViewerProfile />}
          />


          {/* =================================================
              SAVED PROPERTIES

              /viewer/saved-properties
          ================================================= */}

          <Route
            path="saved-properties"
            element={<SavedProperties />}
          />


          {/* =================================================
              VIEWER PROPERTIES

              /viewer/properties

              Uses shared AvailableProperties page.
          ================================================= */}

          <Route
            path="properties"
            element={<AvailableProperties />}
          />


          {/* =================================================
              VIEWER PROPERTY DETAILS

              /viewer/properties/:propertyId
          ================================================= */}

          <Route
            path="properties/:propertyId"
            element={<PropertyDetails />}
          />


          {/* =================================================
              VIEWER RECOMMENDATIONS

              /viewer/recommendations
          ================================================= */}

          <Route
            path="recommendations"
            element={<Recommendations />}
          />


          {/* =================================================
              VIEWER VIEWINGS

              /viewer/viewings
          ================================================= */}

          <Route
            path="viewings"
            element={
              <ViewingProvider>
                <Viewings />
              </ViewingProvider>
            }
          />


          {/* =================================================
              VIEWER CONVERSATIONS

              /viewer/conversations
          ================================================= */}

          <Route
            path="conversations"
            element={
              <ViewerConversationCenter />
            }
          />

        </Route>


        {/* ==================================================
            GLOBAL 404
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </AuthProvider>
  );
}