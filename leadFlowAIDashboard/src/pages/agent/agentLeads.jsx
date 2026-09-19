/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Manage buyer leads assigned to the logged-in agent.
 *
 * Routes
 * ----------------------------------------------------------
 * /agent/leads
 * /agent/leads?filter=hot
 *
 * Features
 * ----------------------------------------------------------
 * • View assigned leads
 * • View only hot leads
 * • Search leads
 * • Filter by status
 * • Lead statistics
 * • View lead details
 * • Pagination
 *
 * ==========================================================
 *
 * HOT LEADS
 * ----------------------------------------------------------
 * When the URL contains:
 *
 * /agent/leads?filter=hot
 *
 * this page switches into HOT LEADS mode and displays only
 * leads identified as hot.
 *
 * Normal route:
 *
 * /agent/leads
 *
 * displays all assigned leads.
 *
 * ==========================================================
 */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  Users,
  UserCheck,
  Phone,
  TrendingUp,
  Flame,
} from "lucide-react";

import leadService from "../../services/leadService";

/* ==========================================================
   DEFAULT FILTERS
========================================================== */

const DEFAULT_FILTERS = {
  search: "",
  status: "",
};

/* ==========================================================
   PAGINATION
========================================================== */

const ITEMS_PER_PAGE = 20;

/* ==========================================================
   HOT LEAD DETECTION
   ----------------------------------------------------------
   Different parts of the LeadFlow AI backend may expose the
   hot-lead classification using slightly different fields.

   This helper supports the common representations without
   changing the backend data.
========================================================== */

const isHotLead = (lead) => {
  if (!lead) {
    return false;
  }

  /* ========================================================
     EXPLICIT BOOLEAN FLAGS
  ======================================================== */

  if (
    lead.isHot === true ||
    lead.hot === true ||
    lead.is_hot === true
  ) {
    return true;
  }

  /* ========================================================
     TEMPERATURE
  ======================================================== */

  const temperatureValues = [
    lead.temperature,
    lead.leadTemperature,
    lead.lead_temperature,
  ]
    .filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .map((value) =>
      String(value).trim().toLowerCase()
    );

  if (
    temperatureValues.some(
      (value) => value === "hot"
    )
  ) {
    return true;
  }

  /* ========================================================
     PRIORITY
  ======================================================== */

  const priorityValues = [
    lead.priority,
    lead.leadPriority,
    lead.lead_priority,
  ]
    .filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .map((value) =>
      String(value).trim().toLowerCase()
    );

  if (
    priorityValues.some(
      (value) => value === "hot"
    )
  ) {
    return true;
  }

  /* ========================================================
     LEAD CATEGORY
  ======================================================== */

  const categoryValues = [
    lead.category,
    lead.leadCategory,
    lead.lead_category,
  ]
    .filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .map((value) =>
      String(value).trim().toLowerCase()
    );

  if (
    categoryValues.some(
      (value) => value === "hot"
    )
  ) {
    return true;
  }

  /* ========================================================
     LEAD TYPE
  ======================================================== */

  const typeValues = [
    lead.type,
    lead.leadType,
    lead.lead_type,
  ]
    .filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
    .map((value) =>
      String(value).trim().toLowerCase()
    );

  if (
    typeValues.some(
      (value) => value === "hot"
    )
  ) {
    return true;
  }

  return false;
};

/* ==========================================================
   COMPONENT
========================================================== */

const AgentLeads = () => {
  /* ========================================================
     URL SEARCH PARAMETERS
  ======================================================== */

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  /* ========================================================
     DETERMINE WHETHER HOT FILTER IS ACTIVE
  ======================================================== */

  const hotFilter =
    String(
      searchParams.get("filter") || ""
    )
      .trim()
      .toLowerCase() === "hot";

  /* ========================================================
     LEADS
  ======================================================== */

  const [leads, setLeads] = useState([]);

  /* ========================================================
     SELECTED LEAD
  ======================================================== */

  const [selectedLead, setSelectedLead] =
    useState(null);

  /* ========================================================
     FILTERS
  ======================================================== */

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(DEFAULT_FILTERS);

  /* ========================================================
     PAGINATION
  ======================================================== */

  const [currentPage, setCurrentPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  /* ========================================================
     SUMMARY
  ======================================================== */

  const [summary, setSummary] = useState({
    totalLeads: 0,
    hotLeads: 0,
    qualified: 0,
    contacted: 0,
    converted: 0,
  });

  /* ========================================================
     UI STATE
  ======================================================== */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ========================================================
     LOAD LEADS
  ======================================================== */

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Always retrieve the agent's assigned leads.
         *
         * The frontend then applies the hot filter when:
         *
         * /agent/leads?filter=hot
         *
         * is active.
         */

        const response =
          await leadService.getMyLeads({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: appliedFilters.search,
            status: appliedFilters.status,
          });

        /* ==================================================
           NORMALIZE RESPONSE
        ================================================== */

        const leadData =
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : [];

        /* ==================================================
           HOT FILTER
           --------------------------------------------------
           IMPORTANT:
           If ?filter=hot is active, ONLY hot leads are
           allowed into the rendered list.
        ================================================== */

        const displayedLeads = hotFilter
          ? leadData.filter(isHotLead)
          : leadData;

        setLeads(displayedLeads);

        /* ==================================================
           SUMMARY
        ================================================== */

        const totalAssigned =
          response?.pagination?.total ??
          leadData.length;

        const hotCount =
          leadData.filter(isHotLead).length;

        const qualifiedCount =
          leadData.filter(
            (lead) =>
              String(
                lead.status || ""
              )
                .trim()
                .toLowerCase() ===
              "qualified"
          ).length;

        const contactedCount =
          leadData.filter(
            (lead) =>
              String(
                lead.status || ""
              )
                .trim()
                .toLowerCase() ===
              "contacted"
          ).length;

        const convertedCount =
          leadData.filter(
            (lead) =>
              String(
                lead.status || ""
              )
                .trim()
                .toLowerCase() ===
              "converted"
          ).length;

        setSummary({
          totalLeads: totalAssigned,
          hotLeads: hotCount,
          qualified: qualifiedCount,
          contacted: contactedCount,
          converted: convertedCount,
        });

        /* ==================================================
           PAGINATION
           --------------------------------------------------
           When hot mode is active, calculate pagination from
           the currently returned hot records.

           Normal mode continues using backend pagination.
        ================================================== */

        if (hotFilter) {
          setTotalPages(
            Math.max(
              1,
              Math.ceil(
                displayedLeads.length /
                  ITEMS_PER_PAGE
              )
            )
          );
        } else {
          setTotalPages(
            response?.pagination?.totalPages ||
              1
          );
        }
      } catch (err) {
        console.error(
          "Unable to load agent leads",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load leads."
        );

        setLeads([]);

        setSummary({
          totalLeads: 0,
          hotLeads: 0,
          qualified: 0,
          contacted: 0,
          converted: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadLeads();
  }, [
    currentPage,
    appliedFilters,
    hotFilter,
  ]);

  /* ========================================================
     SEARCH
  ======================================================== */

  const handleSearch = () => {
    setCurrentPage(1);

    setAppliedFilters({
      ...filters,
    });
  };

  /* ========================================================
     FILTER CHANGE
  ======================================================== */

  const handleFilterChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* ========================================================
     RESET FILTERS
  ======================================================== */

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);

    setAppliedFilters(DEFAULT_FILTERS);

    setCurrentPage(1);

    setSelectedLead(null);

    /*
     * Remove ?filter=hot from the URL.
     *
     * This returns the page to:
     *
     * /agent/leads
     */

    setSearchParams({});
  };

  /* ========================================================
     SELECT LEAD
  ======================================================== */

  const handleSelectLead = (
    lead
  ) => {
    setSelectedLead(lead);
  };

  /* ========================================================
     CLEAR SELECTED LEAD
  ======================================================== */

  const clearSelectedLead = () => {
    setSelectedLead(null);
  };

  /* ========================================================
     SUMMARY CARDS
  ======================================================== */

  const dashboardCards = useMemo(
    () => [
      {
        title: "Total Leads",
        value: summary.totalLeads,
        icon: Users,
      },

      {
        title: "Hot Leads",
        value: summary.hotLeads,
        icon: Flame,
      },

      {
        title: "Qualified",
        value: summary.qualified,
        icon: UserCheck,
      },

      {
        title: "Contacted",
        value: summary.contacted,
        icon: Phone,
      },

      {
        title: "Converted",
        value: summary.converted,
        icon: TrendingUp,
      },
    ],
    [summary]
  );

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">

          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-2
              border-muted
              border-t-primary
            "
          />

          <p className="mt-4 text-muted-foreground">
            {hotFilter
              ? "Loading hot leads..."
              : "Loading leads..."}
          </p>

        </div>
      </div>
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <section className="space-y-10">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div>

        <div className="flex items-center gap-3">

          {hotFilter && (
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-red-500/10
              "
            >
              <Flame className="h-6 w-6 text-red-500" />
            </div>
          )}

          <div>

            <h1 className="text-3xl font-bold">

              {hotFilter
                ? "Hot Leads"
                : "Buyer Leads"}

            </h1>

            <p className="text-muted-foreground">

              {hotFilter
                ? "Focus on your hottest buyer enquiries and prioritize leads most likely to convert."
                : "Track, qualify and convert your assigned buyer enquiries."}

            </p>

          </div>

        </div>

      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-500/30
            bg-red-500/10
            p-4
            text-red-400
          "
        >
          {error}
        </div>
      )}

      {/* ====================================================
          SUMMARY
      ==================================================== */}

      <div
        className="
          grid
          gap-6
          md:grid-cols-2
          xl:grid-cols-5
        "
      >

        {dashboardCards.map(
          (card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="
                  rounded-xl
                  border
                  bg-card
                  p-6
                "
              >

                <div
                  className="
                    mb-4
                    flex
                    items-center
                    justify-between
                  "
                >

                  <Icon
                    className={`
                      h-7
                      w-7
                      ${
                        card.title ===
                        "Hot Leads"
                          ? "text-red-500"
                          : "text-primary"
                      }
                    `}
                  />

                  <span className="text-3xl font-bold">
                    {card.value}
                  </span>

                </div>

                <h3 className="font-semibold">
                  {card.title}
                </h3>

              </div>
            );
          }
        )}

      </div>

      {/* ====================================================
          HOT MODE INDICATOR
      ==================================================== */}

      {hotFilter && (
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            rounded-xl
            border
            border-red-500/20
            bg-red-500/5
            p-4
          "
        >

          <div className="flex items-center gap-3">

            <Flame className="h-5 w-5 text-red-500" />

            <div>

              <p className="font-semibold">
                Hot Leads Filter Active
              </p>

              <p className="text-sm text-muted-foreground">
                Only leads classified as hot are shown.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="
              rounded-lg
              border
              px-4
              py-2
              text-sm
              font-medium
              transition
              hover:bg-muted
            "
          >
            View All Leads
          </button>

        </div>
      )}

      {/* ====================================================
          SEARCH + FILTER
      ==================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          rounded-xl
          border
          bg-card
          p-5
          md:flex-row
        "
      >

        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder={
            hotFilter
              ? "Search hot leads..."
              : "Search leads..."
          }
          className="
            flex-1
            rounded-lg
            border
            bg-background
            px-4
            py-3
            outline-none
            focus:border-primary
          "
        />

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="
            rounded-lg
            border
            bg-background
            px-4
            py-3
          "
        >

          <option value="">
            All Status
          </option>

          <option value="new">
            New
          </option>

          <option value="qualified">
            Qualified
          </option>

          <option value="contacted">
            Contacted
          </option>

          <option value="converted">
            Converted
          </option>

        </select>

        <button
          type="button"
          onClick={handleSearch}
          className="
            rounded-lg
            bg-primary
            px-5
            py-3
            text-primary-foreground
          "
        >
          Search
        </button>

        <button
          type="button"
          onClick={handleResetFilters}
          className="
            rounded-lg
            border
            px-5
            py-3
          "
        >
          Reset
        </button>

      </div>

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="grid gap-8 lg:grid-cols-2">

        {/* ==================================================
            LEAD LIST
        ================================================== */}

        <div className="rounded-xl border bg-card">

          <div className="border-b p-5">

            <div className="flex items-center justify-between gap-4">

              <div>

                <h2 className="text-xl font-semibold">

                  {hotFilter
                    ? "Hot Leads"
                    : "Assigned Leads"}

                </h2>

                <p className="mt-1 text-sm text-muted-foreground">

                  {hotFilter
                    ? `${leads.length} hot lead${
                        leads.length === 1
                          ? ""
                          : "s"
                      } shown`
                    : `${leads.length} lead${
                        leads.length === 1
                          ? ""
                          : "s"
                      } on this page`}

                </p>

              </div>

              {hotFilter && (
                <Flame className="h-6 w-6 text-red-500" />
              )}

            </div>

          </div>

          {leads.length === 0 ? (

            <div className="p-6">

              <div className="text-center">

                {hotFilter ? (
                  <>
                    <Flame
                      className="
                        mx-auto
                        h-10
                        w-10
                        text-muted-foreground
                      "
                    />

                    <p className="mt-4 text-muted-foreground">
                      No hot leads found.
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      There are currently no assigned leads
                      classified as hot.
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No leads found.
                  </p>
                )}

              </div>

            </div>

          ) : (

            <div className="divide-y">

              {leads.map(
                (lead) => {

                  const leadId =
                    lead?._id ||
                    lead?.id;

                  return (
                    <button
                      type="button"
                      key={
                        leadId ||
                        `${lead?.email || "lead"}-${lead?.phone || ""}`
                      }
                      onClick={() =>
                        handleSelectLead(
                          lead
                        )
                      }
                      className="
                        flex
                        w-full
                        items-center
                        justify-between
                        p-5
                        text-left
                        transition
                        hover:bg-muted
                      "
                    >

                      <div className="min-w-0">

                        <h3 className="font-medium">

                          {lead.name ||
                            lead.fullName ||
                            "Unnamed Lead"}

                        </h3>

                        <p className="text-sm text-muted-foreground">

                          {lead.email ||
                            "No email"}

                        </p>

                        {lead.phone && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {lead.phone}
                          </p>
                        )}

                      </div>

                      <div className="ml-4 flex shrink-0 items-center gap-2">

                        {hotFilter && (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1
                              rounded-full
                              bg-red-500/10
                              px-3
                              py-1
                              text-sm
                              font-medium
                              text-red-500
                            "
                          >
                            <Flame className="h-3.5 w-3.5" />

                            Hot
                          </span>
                        )}

                        <span
                          className="
                            rounded-full
                            bg-primary/10
                            px-3
                            py-1
                            text-sm
                            capitalize
                            text-primary
                          "
                        >
                          {lead.status ||
                            "new"}
                        </span>

                      </div>

                    </button>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* ==================================================
            LEAD DETAILS
        ================================================== */}

        <div className="rounded-xl border bg-card p-6">

          {selectedLead ? (

            <div className="space-y-5">

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <h2 className="text-2xl font-semibold">
                  Lead Details
                </h2>

                <button
                  type="button"
                  onClick={
                    clearSelectedLead
                  }
                  className="
                    rounded-lg
                    border
                    px-4
                    py-2
                    hover:bg-muted
                  "
                >
                  Close
                </button>

              </div>

              {/* HOT INDICATOR */}

              {isHotLead(
                selectedLead
              ) && (
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-red-500/10
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-red-500
                  "
                >

                  <Flame className="h-4 w-4" />

                  Hot Lead

                </div>
              )}

              {/* NAME */}

              <div>

                <p className="text-sm text-muted-foreground">
                  Name
                </p>

                <p className="font-medium">
                  {selectedLead.name ||
                    selectedLead.fullName ||
                    "Unknown"}
                </p>

              </div>

              {/* EMAIL */}

              <div>

                <p className="text-sm text-muted-foreground">
                  Email
                </p>

                <p className="font-medium">
                  {selectedLead.email ||
                    "Not provided"}
                </p>

              </div>

              {/* PHONE */}

              <div>

                <p className="text-sm text-muted-foreground">
                  Phone
                </p>

                <p className="font-medium">
                  {selectedLead.phone ||
                    "Not provided"}
                </p>

              </div>

              {/* PROPERTY */}

              <div>

                <p className="text-sm text-muted-foreground">
                  Interested Property
                </p>

                <p className="font-medium">
                  {selectedLead.propertyTitle ||
                    selectedLead.property?.title ||
                    "Not specified"}
                </p>

              </div>

              {/* STATUS */}

              <div>

                <p className="text-sm text-muted-foreground">
                  Status
                </p>

                <p className="font-medium capitalize">
                  {selectedLead.status ||
                    "new"}
                </p>

              </div>

              {/* TEMPERATURE */}

              {(selectedLead.temperature ||
                selectedLead.leadTemperature ||
                selectedLead.priority ||
                selectedLead.leadPriority) && (
                <div>

                  <p className="text-sm text-muted-foreground">
                    Lead Temperature
                  </p>

                  <p className="font-medium capitalize">

                    {selectedLead.temperature ||
                      selectedLead.leadTemperature ||
                      selectedLead.priority ||
                      selectedLead.leadPriority}

                  </p>

                </div>
              )}

              {/* MESSAGE */}

              <div>

                <p className="text-sm text-muted-foreground">
                  Message
                </p>

                <p className="leading-7">
                  {selectedLead.message ||
                    selectedLead.notes ||
                    "No message provided."}
                </p>

              </div>

            </div>

          ) : (

            <div
              className="
                flex
                h-full
                min-h-[300px]
                items-center
                justify-center
                text-center
              "
            >

              <p className="text-muted-foreground">
                Select a lead to view its details.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* ====================================================
          PAGINATION
      ==================================================== */}

      {totalPages > 1 && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-4
          "
        >

          <button
            type="button"
            disabled={
              currentPage === 1
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
              rounded-lg
              border
              px-4
              py-2
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Previous
          </button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of{" "}
            {totalPages}
          </span>

          <button
            type="button"
            disabled={
              currentPage ===
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
              rounded-lg
              border
              px-4
              py-2
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Next
          </button>

        </div>
      )}

    </section>
  );
};

/* ==========================================================
   EXPORT
========================================================== */

export default AgentLeads;