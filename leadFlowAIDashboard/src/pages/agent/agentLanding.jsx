/**
 * ==========================================================
 *
 * LeadFlow AI — Agent Dashboard
 *
 * Purpose
 * ----------------------------------------------------------
 * Operational workspace for sales agents.
 *
 * Agent Workflow
 * ----------------------------------------------------------
 *
 * Lead
 *   ↓
 * Conversation
 *   ↓
 * Qualification
 *   ↓
 * Property Matching
 *   ↓
 * Viewing
 *   ↓
 * Follow-up
 *   ↓
 * Negotiation
 *   ↓
 * Conversion
 *
 * Agent Dashboard Focus
 * ----------------------------------------------------------
 * • My Leads
 * • New / Hot Leads
 * • Property Matching
 * • Upcoming Viewings
 * • Follow-ups
 * • Conversations
 * • Personal Performance
 *
 * Agent Restrictions
 * ----------------------------------------------------------
 * ✗ User Management
 * ✗ Organization Settings
 * ✗ System Administration
 * ✗ Organization-wide Analytics
 * ✗ Property Administration
 *
 * IMAGE HANDLING
 * ----------------------------------------------------------
 * Property images are resolved through the shared property
 * image helper.
 *
 * The dashboard NEVER generates property images.
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Home,
  Users,
  CalendarCheck,
  MessageSquare,
  Clock,
  TrendingUp,
  Flame,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import propertyService from "../../services/propertyService";
import leadService from "../../services/leadService";
import viewingService from "../../services/viewingService";

import getPropertyImage from "../../utils/propertyImage";


const AgentLanding = () => {

  const navigate = useNavigate();


  /* ==========================================================
     STATE
  ========================================================== */

  const [properties, setProperties] = useState([]);

  const [leads, setLeads] = useState([]);

  const [viewings, setViewings] = useState([]);

  const [loading, setLoading] = useState(true);


  /* ==========================================================
     SUMMARY
  ========================================================== */

  const [summary, setSummary] = useState({
    activeListings: 0,
    totalLeads: 0,
    hotLeads: 0,
    scheduledViewings: 0,
    pendingFollowUps: 0,
    conversions: 0,
  });


  /* ==========================================================
     LOAD AGENT DASHBOARD
  ========================================================== */

  const loadDashboard = async () => {

    try {

      setLoading(true);


      /* ======================================================
         MY PROPERTIES
      ====================================================== */

      let myProperties = [];

      try {

        const propertyResponse =
          await propertyService.getMyProperties({
            page: 1,
            limit: 6,
          });

        myProperties =
          Array.isArray(propertyResponse?.data)
            ? propertyResponse.data
            : [];

      } catch (propertyError) {

        console.error(
          "Agent property dashboard error:",
          propertyError
        );

      }

      setProperties(myProperties);


      /* ======================================================
         MY LEADS
      ====================================================== */

      let myLeads = [];

      try {

        const leadResponse =
          await leadService.getMyLeads({
            page: 1,
            limit: 10,
          });

        myLeads =
          Array.isArray(leadResponse?.data)
            ? leadResponse.data
            : [];

      } catch (leadError) {

        console.error(
          "Agent lead dashboard error:",
          leadError
        );

      }

      setLeads(myLeads);


      /* ======================================================
         MY VIEWINGS
      ====================================================== */

      let myViewings = [];

      try {

        const viewingResponse =
          await viewingService.getMyViewings({
            page: 1,
            limit: 10,
          });

        myViewings =
          Array.isArray(viewingResponse?.data)
            ? viewingResponse.data
            : [];

      } catch (viewingError) {

        console.error(
          "Agent viewing dashboard error:",
          viewingError
        );

      }

      setViewings(myViewings);


      /* ======================================================
         LEAD METRICS
      ====================================================== */

      const hotLeads =
        myLeads.filter(
          (lead) =>
            lead.status?.toLowerCase() === "hot"
        ).length;


      const conversions =
        myLeads.filter((lead) => {

          const status =
            lead.status?.toLowerCase();

          return [
            "converted",
            "closed",
          ].includes(status);

        }).length;


      /* ======================================================
         VIEWING METRICS
      ====================================================== */

      const scheduledViewings =
        myViewings.filter((viewing) => {

          const status =
            viewing.status?.toLowerCase();

          return [
            "requested",
            "pending approval",
            "approved",
            "rescheduled",
          ].includes(status);

        }).length;


      /* ======================================================
         FOLLOW-UP METRICS
         
         Until a dedicated follow-up service is connected,
         follow-up workload is derived from lead statuses.
      ====================================================== */

      const pendingFollowUps =
        myLeads.filter((lead) => {

          const status =
            lead.status?.toLowerCase();

          return [
            "follow_up",
            "follow-up",
            "follow up",
          ].includes(status);

        }).length;


      /* ======================================================
         SUMMARY
      ====================================================== */

      setSummary({

        activeListings:
          myProperties.filter(
            (property) =>
              property.status?.toLowerCase() ===
              "available"
          ).length,

        totalLeads:
          myLeads.length,

        hotLeads,

        scheduledViewings,

        pendingFollowUps,

        conversions,

      });

    } catch (error) {

      console.error(
        "Unable to load agent dashboard:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {

    loadDashboard();

  }, []);


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {

    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <p className="text-muted-foreground">
          Loading agent workspace...
        </p>

      </div>
    );

  }


  /* ==========================================================
     KPI CARDS
  ========================================================== */

  const dashboardCards = [

    {
    title: "My Leads",
    value: summary.totalLeads,
    icon: Users,
    path: "/agent/leads",
  },

  {
    title: "Hot Leads",
    value: summary.hotLeads,
    icon: Flame,
    path: "/agent/leads?filter=hot",
  },

    {
      title: "Upcoming Viewings",
      value: summary.scheduledViewings,
      icon: CalendarCheck,
      path: "/agent/viewings",
    },

    {
      title: "Pending Follow-ups",
      value: summary.pendingFollowUps,
      icon: Clock,
      path: "/agent/follow-ups",
    },

    {
      title: "My Listings",
      value: summary.activeListings,
      icon: Home,
      path: "/agent/properties",
    },

    {
      title: "Conversions",
      value: summary.conversions,
      icon: TrendingUp,
      path: "/agent/performance",
    },

  ];


  /* ==========================================================
     PAGE
  ========================================================== */

  return (

    <section className="space-y-8">


      {/* ======================================================
          HERO
      ====================================================== */}

      <div className="rounded-2xl bg-primary p-8 text-primary-foreground">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-sm font-medium uppercase tracking-wider opacity-80">
              LeadFlow AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Agent Workspace
            </h1>

            <p className="mt-3 max-w-2xl text-lg opacity-90">
              Manage your leads, conversations, property
              matches, viewings, and follow-ups from one
              workspace.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/agent/leads")
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-background
              px-5
              py-3
              font-semibold
              text-foreground
              transition
              hover:opacity-90
            "
          >
            Work My Leads

            <ArrowRight size={18} />

          </button>

        </div>

      </div>


      {/* ======================================================
          AGENT KPIs
      ====================================================== */}

      <section>

        <div className="mb-4">

          <h2 className="text-2xl font-semibold">
            My Workload
          </h2>

          <p className="text-sm text-muted-foreground">
            Your current sales activity and workload.
          </p>

        </div>


        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          {dashboardCards.map((card) => {

            const Icon = card.icon;

            return (

              <button
                key={card.title}
                type="button"
                onClick={() =>
                  navigate(card.path)
                }
                className="
                  rounded-xl
                  border
                  bg-card
                  p-5
                  text-left
                  transition
                  hover:-translate-y-1
                  hover:shadow-md
                "
              >

                <div className="flex items-center justify-between">

                  <Icon
                    className="h-6 w-6 text-primary"
                  />

                  <span className="text-2xl font-bold">
                    {card.value}
                  </span>

                </div>

                <p className="mt-3 text-sm font-medium">
                  {card.title}
                </p>

              </button>

            );

          })}

        </div>

      </section>


      {/* ======================================================
          SALES WORKFLOW
      ====================================================== */}

      <section className="rounded-xl border bg-card p-6">

        <div className="mb-5">

          <h2 className="text-xl font-semibold">
            Sales Workflow
          </h2>

          <p className="text-sm text-muted-foreground">
            Move customers through the LeadFlow AI sales
            process.
          </p>

        </div>


        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

          <button
            type="button"
            onClick={() =>
              navigate("/agent/leads")
            }
            className="
              rounded-xl
              border
              p-4
              text-left
              transition
              hover:bg-muted
            "
          >

            <Users className="mb-3 h-6 w-6 text-primary" />

            <h3 className="font-semibold">
              1. Qualify Leads
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Review and qualify assigned customers.
            </p>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/agent/conversations")
            }
            className="
              rounded-xl
              border
              p-4
              text-left
              transition
              hover:bg-muted
            "
          >

            <MessageSquare className="mb-3 h-6 w-6 text-primary" />

            <h3 className="font-semibold">
              2. Engage Customers
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Continue customer conversations and enquiries.
            </p>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/agent/properties/recommendations")
            }
            className="
              rounded-xl
              border
              p-4
              text-left
              transition
              hover:bg-muted
            "
          >

            <Home className="mb-3 h-6 w-6 text-primary" />

            <h3 className="font-semibold">
              3. Match Properties
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Find suitable properties for qualified leads.
            </p>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/agent/viewings")
            }
            className="
              rounded-xl
              border
              p-4
              text-left
              transition
              hover:bg-muted
            "
          >

            <CalendarCheck className="mb-3 h-6 w-6 text-primary" />

            <h3 className="font-semibold">
              4. Manage Viewings
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Schedule, confirm, and complete customer viewings.
            </p>

          </button>

        </div>

      </section>


      {/* ======================================================
          MY ACTIVE PROPERTIES
      ====================================================== */}

      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-semibold">
              My Active Properties
            </h2>

            <p className="text-sm text-muted-foreground">
              Properties available for your assigned customers.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/agent/properties")
            }
            className="
              flex
              items-center
              gap-1
              text-sm
              font-semibold
              text-primary
              hover:underline
            "
          >
            View Properties

            <ArrowRight size={16} />

          </button>

        </div>


        {properties.length === 0 ? (

          <div className="rounded-xl border bg-card p-8 text-center">

            <Home className="mx-auto h-10 w-10 text-muted-foreground" />

            <p className="mt-4 text-muted-foreground">
              No active properties assigned.
            </p>

          </div>

        ) : (

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            {properties.map((property) => {

              const propertyImage =
                getPropertyImage(property);


              return (

                <button
                  type="button"
                  key={property._id}
                  onClick={() =>
                    navigate(
                      `/agent/properties/${property._id}`
                    )
                  }
                  className="
                    overflow-hidden
                    rounded-xl
                    border
                    bg-card
                    text-left
                    transition
                    hover:-translate-y-1
                    hover:shadow-lg
                  "
                >

                  {/* IMAGE */}

                  {propertyImage ? (

                    <img
                      src={propertyImage}
                      alt={
                        property.title ||
                        "Property listing"
                      }
                      className="h-52 w-full object-cover"
                      onError={(event) => {

                        event.currentTarget.style.display =
                          "none";

                      }}
                    />

                  ) : (

                    <div className="
                      flex
                      h-52
                      w-full
                      items-center
                      justify-center
                      bg-muted
                    ">

                      <Home className="
                        h-12
                        w-12
                        text-muted-foreground
                      " />

                    </div>

                  )}


                  {/* DETAILS */}

                  <div className="space-y-2 p-4">

                    <h3 className="font-semibold">

                      {property.title ||
                        "Untitled Property"}

                    </h3>

                    <p className="text-sm text-muted-foreground">

                      {property.location ||
                        "Location not specified"}

                    </p>

                    <p className="font-semibold text-primary">

                      {property.currency || "KES"}{" "}

                      {Number(
                        property.price || 0
                      ).toLocaleString()}

                    </p>

                  </div>

                </button>

              );

            })}

          </div>

        )}

      </section>


      {/* ======================================================
          RECENT LEADS
      ====================================================== */}

      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-semibold">
              Recent Leads
            </h2>

            <p className="text-sm text-muted-foreground">
              Customers currently in your sales pipeline.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/agent/leads")
            }
            className="
              flex
              items-center
              gap-1
              text-sm
              font-semibold
              text-primary
              hover:underline
            "
          >
            View Leads

            <ArrowRight size={16} />

          </button>

        </div>


        <div className="rounded-xl border bg-card">

          {leads.length === 0 ? (

            <div className="p-6">

              <p className="text-muted-foreground">
                No assigned leads yet.
              </p>

            </div>

          ) : (

            <div className="divide-y">

              {leads.slice(0, 6).map((lead) => {

                const status =
                  lead.status || "new";


                return (

                  <button
                    type="button"
                    key={lead._id}
                    onClick={() =>
                      navigate(
                        `/agent/leads/${lead._id}`
                      )
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-4
                      p-5
                      text-left
                      transition
                      hover:bg-muted
                    "
                  >

                    <div>

                      <h3 className="font-medium">

                        {lead.name ||
                          lead.customerName ||
                          "Unnamed Lead"}

                      </h3>

                      <p className="text-sm text-muted-foreground">

                        {lead.email ||
                          lead.phone ||
                          "No contact information"}

                      </p>

                    </div>


                    <span className="
                      rounded-full
                      bg-primary/10
                      px-3
                      py-1
                      text-sm
                      font-medium
                      text-primary
                    ">

                      {status}

                    </span>

                  </button>

                );

              })}

            </div>

          )}

        </div>

      </section>


      {/* ======================================================
          UPCOMING VIEWINGS
      ====================================================== */}

      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-semibold">
              Upcoming Viewings
            </h2>

            <p className="text-sm text-muted-foreground">
              Your customer viewing schedule.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/agent/viewings")
            }
            className="
              flex
              items-center
              gap-1
              text-sm
              font-semibold
              text-primary
              hover:underline
            "
          >
            View All

            <ArrowRight size={16} />

          </button>

        </div>


        <div className="rounded-xl border bg-card">

          {viewings.length === 0 ? (

            <div className="p-6">

              <p className="text-muted-foreground">
                No upcoming viewings.
              </p>

            </div>

          ) : (

            <div className="divide-y">

              {viewings.slice(0, 6).map((viewing) => (

                <button
                  type="button"
                  key={viewing._id}
                  onClick={() =>
                    navigate("/agent/viewings")
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-4
                    p-5
                    text-left
                    transition
                    hover:bg-muted
                  "
                >

                  <div>

                    <h3 className="font-medium">

                      {viewing.propertyTitle ||
                        viewing.property?.title ||
                        "Property Viewing"}

                    </h3>

                    <p className="text-sm text-muted-foreground">

                      {viewing.clientName ||
                        viewing.lead?.name ||
                        "Customer"}

                    </p>

                  </div>


                  <div className="text-right">

                    <p className="text-sm font-medium">

                      {viewing.status ||
                        "Scheduled"}

                    </p>

                    <p className="text-xs text-muted-foreground">

                      {viewing.date ||
                        viewing.scheduledAt ||
                        "Date not specified"}

                    </p>

                  </div>

                </button>

              ))}

            </div>

          )}

        </div>

      </section>


      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <section>

        <h2 className="mb-4 text-2xl font-semibold">
          Quick Actions
        </h2>


        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">


          <button
            type="button"
            onClick={() =>
              navigate("/agent/leads")
            }
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              bg-card
              p-5
              text-left
              transition
              hover:bg-muted
            "
          >

            <Users className="h-6 w-6 text-primary" />

            <span className="font-semibold">
              Work Leads
            </span>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/agent/conversations")
            }
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              bg-card
              p-5
              text-left
              transition
              hover:bg-muted
            "
          >

            <MessageSquare className="h-6 w-6 text-primary" />

            <span className="font-semibold">
              Open Conversations
            </span>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/agent/follow-ups")
            }
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              bg-card
              p-5
              text-left
              transition
              hover:bg-muted
            "
          >

            <Clock className="h-6 w-6 text-primary" />

            <span className="font-semibold">
              Follow-ups
            </span>

          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/agent/performance")
            }
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              bg-card
              p-5
              text-left
              transition
              hover:bg-muted
            "
          >

            <TrendingUp className="h-6 w-6 text-primary" />

            <span className="font-semibold">
              My Performance
            </span>

          </button>


        </div>

      </section>

    </section>

  );

};


export default AgentLanding;