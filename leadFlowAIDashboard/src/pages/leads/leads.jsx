/**
 *
 * Path
 * ----
 * src/pages/leads/leads.jsx
 *
 * Responsibilities
 * ----------------
 * • View leads available to the authenticated user
 * • Search customers
 * • Filter by workflow status
 * • Display AI lead score
 * • Display assigned agent
 * • Navigate to Lead Details
 * • Navigate to AI Qualification
 * • Contact customer
 *
 * Latest Agent Workflow
 * ---------------------
 *
 * new
 *   ↓
 * qualified
 *   ↓
 * hot
 *   ↓
 * follow_up
 *   ↓
 * viewing_scheduled
 *   ↓
 * closed
 *
 * The backend remains the source of truth for:
 * • organization filtering
 * • agent assignment
 * • workflow transitions
 * • lead score
 * • qualification
 *
 * Uses
 * ----
 * • useLeads()
 * • leadService.js
 * • StatusBadge
 *
 * ==========================================================
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  User,
  Brain,
  Phone,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import MainLayout from "../../components/layout/mainlayout";
import PageHeader from "../../components/common/pageHeader";
import LoadingSpinner from "../../components/common/loadingSpinner";
import EmptyState from "../../components/common/emptyState";
import ErrorCard from "../../components/common/errorCard";
import StatusBadge from "../../components/common/statusBadge";

import useLeads from "../../hooks/useLeads";

/* ==========================================================
   CONSTANTS
========================================================== */

const PAGE_SIZE = 10;

/**
 * IMPORTANT
 * ----------
 * Status values must match the backend exactly.
 *
 * Do not use:
 * "New"
 * "Hot"
 * "Qualified"
 *
 * Backend workflow uses lowercase values.
 */
const STATUS_TABS = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "New",
    value: "new",
  },
  {
    label: "Qualified",
    value: "qualified",
  },
  {
    label: "Hot",
    value: "hot",
  },
  {
    label: "Follow-up",
    value: "follow_up",
  },
  {
    label: "Viewing",
    value: "viewing_scheduled",
  },
  {
    label: "Closed",
    value: "closed",
  },
];

/* ==========================================================
   HELPERS
========================================================== */

/**
 * Safely normalize a lead status.
 *
 * Protects the UI if an older backend record contains
 * uppercase status values.
 */
const normalizeStatus = (status) => {
  if (!status) {
    return "new";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

/**
 * Resolve an assigned agent name from the different
 * possible backend shapes.
 *
 * This allows the page to work with:
 *
 * assignedAgent: "John"
 *
 * OR
 *
 * assignedTo: {
 *   name: "John"
 * }
 *
 * OR
 *
 * assignedTo: "John"
 */
const getAssignedAgentName = (lead) => {
  if (!lead) {
    return "Unassigned";
  }

  if (
    typeof lead.assignedAgent === "string" &&
    lead.assignedAgent.trim()
  ) {
    return lead.assignedAgent;
  }

  if (
    lead.assignedTo &&
    typeof lead.assignedTo === "object" &&
    lead.assignedTo.name
  ) {
    return lead.assignedTo.name;
  }

  if (
    typeof lead.assignedTo === "string" &&
    lead.assignedTo.trim()
  ) {
    return lead.assignedTo;
  }

  if (
    lead.agent &&
    typeof lead.agent === "object" &&
    lead.agent.name
  ) {
    return lead.agent.name;
  }

  if (
    typeof lead.agentName === "string" &&
    lead.agentName.trim()
  ) {
    return lead.agentName;
  }

  return "Unassigned";
};

/**
 * Safely extract a lead identifier.
 */
const getLeadId = (lead) => {
  return lead?._id || lead?.id || null;
};

/* ==========================================================
   COMPONENT
========================================================== */

const Leads = () => {
  const {
    leads,
    loading,
    error,
    refreshLeads,
  } = useLeads();

  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  /* ========================================================
     SAFE LEADS
  ======================================================== */

  const safeLeads = useMemo(() => {
    return Array.isArray(leads)
      ? leads
      : [];
  }, [leads]);

  /* ========================================================
     FILTER LEADS
  ======================================================== */

  const filteredLeads = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return safeLeads.filter((lead) => {
      const leadStatus =
        normalizeStatus(lead.status);

      const leadName =
        String(lead.name || "")
          .toLowerCase();

      const leadPhone =
        String(lead.phone || "")
          .toLowerCase();

      const leadLocation =
        String(lead.location || "")
          .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        leadName.includes(normalizedSearch) ||
        leadPhone.includes(normalizedSearch) ||
        leadLocation.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        leadStatus === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    safeLeads,
    search,
    statusFilter,
  ]);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLeads.length / PAGE_SIZE
    )
  );

  /**
   * Prevent current page from becoming invalid
   * after filtering.
   */
  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedLeads = useMemo(() => {
    const start =
      (safeCurrentPage - 1) *
      PAGE_SIZE;

    return filteredLeads.slice(
      start,
      start + PAGE_SIZE
    );
  }, [
    filteredLeads,
    safeCurrentPage,
  ]);

  /* ========================================================
     DASHBOARD COUNTS
  ======================================================== */

  const stats = useMemo(() => {
    return {
      total: safeLeads.length,

      newLeads: safeLeads.filter(
        (lead) =>
          normalizeStatus(
            lead.status
          ) === "new"
      ).length,

      qualified: safeLeads.filter(
        (lead) =>
          normalizeStatus(
            lead.status
          ) === "qualified"
      ).length,

      hot: safeLeads.filter(
        (lead) =>
          normalizeStatus(
            lead.status
          ) === "hot"
      ).length,

      followUps: safeLeads.filter(
        (lead) =>
          normalizeStatus(
            lead.status
          ) === "follow_up"
      ).length,

      scheduledViewings: safeLeads.filter(
        (lead) =>
          normalizeStatus(
            lead.status
          ) === "viewing_scheduled"
      ).length,

      closed: safeLeads.filter(
        (lead) =>
          normalizeStatus(
            lead.status
          ) === "closed"
      ).length,
    };
  }, [safeLeads]);

  /* ========================================================
     NAVIGATION
  ======================================================== */

  const openLead = (id) => {
    if (!id) {
      console.error(
        "❌ Cannot open lead: missing lead ID."
      );

      return;
    }

    navigate(`/leads/${id}`);
  };

  const openQualification = (id) => {
    if (!id) {
      console.error(
        "❌ Cannot open qualification: missing lead ID."
      );

      return;
    }

    navigate(
      `/leads/${id}/qualification`
    );
  };

  const contactLead = (id) => {
    if (!id) {
      console.error(
        "❌ Cannot contact lead: missing lead ID."
      );

      return;
    }

    navigate(
      `/conversations/contact/${id}`
    );
  };

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  /* ========================================================
     ERROR
  ======================================================== */

  if (error) {
    return (
      <MainLayout>
        <ErrorCard
          message={error}
          onRetry={refreshLeads}
        />
      </MainLayout>
    );
  }

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <PageHeader
          title="Leads"
          subtitle="Manage, qualify and convert customer enquiries."
        />

        {/* ==================================================
            KPI SUMMARY
        ================================================== */}

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {/* Total */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Total Leads
            </p>

            <h2 className="mt-3 text-4xl font-bold text-white">
              {stats.total}
            </h2>

          </div>

          {/* New */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              New Leads
            </p>

            <h2 className="mt-3 text-4xl font-bold text-cyan-400">
              {stats.newLeads}
            </h2>

          </div>

          {/* Qualified */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Qualified
            </p>

            <h2 className="mt-3 text-4xl font-bold text-emerald-400">
              {stats.qualified}
            </h2>

          </div>

          {/* Hot */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Hot Leads
            </p>

            <h2 className="mt-3 text-4xl font-bold text-red-400">
              {stats.hot}
            </h2>

          </div>

        </section>

        {/* ==================================================
            WORKFLOW SUMMARY
        ================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Follow-up
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-400">
              {stats.followUps}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Viewings
            </p>

            <p className="mt-2 text-2xl font-bold text-violet-400">
              {stats.scheduledViewings}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Closed
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {stats.closed}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">

            <p className="text-xs uppercase tracking-wide text-slate-500">
              Pipeline
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-300">
              New → Qualified → Hot
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Follow-up → Viewing → Closed
            </p>

          </div>

        </section>

        {/* ==================================================
            SEARCH + WORKFLOW FILTERS
        ================================================== */}

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col gap-5">

            {/* Search */}

            <div className="relative w-full lg:max-w-md">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );

                  setCurrentPage(1);
                }}
                placeholder="Search customer, phone or location..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  py-3
                  pl-12
                  pr-4
                  text-white
                  outline-none
                  focus:border-cyan-500
                "
              />

            </div>

            {/* Status Tabs */}

            <div className="flex flex-wrap gap-3">

              {STATUS_TABS.map(
                (tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setStatusFilter(
                        tab.value
                      );

                      setCurrentPage(1);
                    }}
                    className={`
                      rounded-xl
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      transition

                      ${
                        statusFilter ===
                        tab.value
                          ? "bg-cyan-500 text-slate-950"
                          : "border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-500"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                )
              )}

            </div>

          </div>

        </section>

        {/* ==================================================
            LEADS TABLE
        ================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="border-b border-slate-800 bg-slate-950">

                <tr>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Location
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Budget
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    AI Score
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Agent
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {paginatedLeads.length === 0 ? (

                  <tr>

                    <td colSpan={7}>

                      <EmptyState
                        title="No Leads Found"
                        description="Try adjusting your search or workflow filters."
                      />

                    </td>

                  </tr>

                ) : (

                  paginatedLeads.map(
                    (lead) => {

                      const leadId =
                        getLeadId(lead);

                      const leadStatus =
                        normalizeStatus(
                          lead.status
                        );

                      const assignedAgent =
                        getAssignedAgentName(
                          lead
                        );

                      const score =
                        Number(
                          lead.score || 0
                        );

                      return (
                        <tr
                          key={leadId}
                          className="
                            border-b
                            border-slate-800
                            transition
                            hover:bg-slate-800
                          "
                        >

                          {/* =================================
                              CUSTOMER
                          ================================= */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div
                                className="
                                  flex
                                  h-12
                                  w-12
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-cyan-500/20
                                "
                              >

                                <User
                                  size={20}
                                  className="text-cyan-400"
                                />

                              </div>

                              <div className="min-w-0">

                                <h3 className="truncate font-semibold text-white">

                                  {lead.name ||
                                    "Unnamed Lead"}

                                </h3>

                                <p className="text-sm text-slate-400">

                                  {lead.phone ||
                                    "No phone"}

                                </p>

                              </div>

                            </div>

                          </td>

                          {/* =================================
                              LOCATION
                          ================================= */}

                          <td className="px-6 py-5 text-slate-300">

                            {lead.location ||
                              "-"}

                          </td>

                          {/* =================================
                              BUDGET
                          ================================= */}

                          <td className="px-6 py-5 font-semibold text-cyan-400">

                            {lead.budget
                              ? `KES ${Number(
                                  lead.budget
                                ).toLocaleString()}`
                              : "-"}

                          </td>

                          {/* =================================
                              AI SCORE
                          ================================= */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-2">

                              <Brain
                                size={18}
                                className="text-cyan-400"
                              />

                              <span className="font-bold text-white">

                                {score}%

                              </span>

                            </div>

                          </td>

                          {/* =================================
                              STATUS
                          ================================= */}

                          <td className="px-6 py-5">

                            <StatusBadge
                              status={leadStatus}
                            />

                          </td>

                          {/* =================================
                              ASSIGNED AGENT
                          ================================= */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-2">

                              {assignedAgent !==
                              "Unassigned" && (
                                <div className="
                                  flex
                                  h-8
                                  w-8
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-slate-800
                                ">

                                  <User
                                    size={14}
                                    className="text-slate-400"
                                  />

                                </div>
                              )}

                              <span
                                className={
                                  assignedAgent ===
                                  "Unassigned"
                                    ? "text-slate-500"
                                    : "text-slate-300"
                                }
                              >
                                {assignedAgent}
                              </span>

                            </div>

                          </td>

                          {/* =================================
                              ACTIONS
                          ================================= */}

                          <td className="px-6 py-5">

                            <div className="flex justify-center gap-3">

                              {/* View Lead */}

                              <button
                                type="button"
                                onClick={() =>
                                  openLead(
                                    leadId
                                  )
                                }
                                disabled={!leadId}
                                title="View lead"
                                className="
                                  rounded-lg
                                  bg-cyan-500/20
                                  p-2
                                  text-cyan-400
                                  transition
                                  hover:bg-cyan-500/30
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
                              >

                                <Eye size={18} />

                              </button>

                              {/* AI Qualification */}

                              <button
                                type="button"
                                onClick={() =>
                                  openQualification(
                                    leadId
                                  )
                                }
                                disabled={!leadId}
                                title="View AI qualification"
                                className="
                                  rounded-lg
                                  bg-violet-500/20
                                  p-2
                                  text-violet-400
                                  transition
                                  hover:bg-violet-500/30
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
                              >

                                <Brain size={18} />

                              </button>

                              {/* Contact */}

                              <button
                                type="button"
                                onClick={() =>
                                  contactLead(
                                    leadId
                                  )
                                }
                                disabled={!leadId}
                                title="Contact customer"
                                className="
                                  rounded-lg
                                  bg-emerald-500/20
                                  p-2
                                  text-emerald-400
                                  transition
                                  hover:bg-emerald-500/30
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
                              >

                                <Phone size={18} />

                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ==================================================
            PAGINATION
        ================================================== */}

        {filteredLeads.length > 0 &&
          totalPages > 1 && (

            <section className="flex items-center justify-between">

              {/* Previous */}

              <button
                type="button"
                disabled={
                  safeCurrentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        page - 1,
                        1
                      )
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-900
                  px-5
                  py-3
                  text-white
                  transition
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  hover:border-cyan-500
                "
              >

                <ChevronLeft size={18} />

                Previous

              </button>

              {/* Page Indicator */}

              <div className="text-slate-400">

                Page

                <span className="mx-2 font-bold text-white">

                  {safeCurrentPage}

                </span>

                of

                <span className="ml-2 font-bold text-white">

                  {totalPages}

                </span>

              </div>

              {/* Next */}

              <button
                type="button"
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        page + 1,
                        totalPages
                      )
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-900
                  px-5
                  py-3
                  text-white
                  transition
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  hover:border-cyan-500
                "
              >

                Next

                <ChevronRight size={18} />

              </button>

            </section>

          )}

      </div>
    </MainLayout>
  );
};

export default Leads;