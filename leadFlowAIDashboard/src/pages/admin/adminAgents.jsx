/**
 * ==========================================================
 *
 * LEADFLOW AI — ORGANIZATION AGENTS
 *
 * File
 * ----------------------------------------------------------
 * src/pages/admin/adminAgents.jsx
 *
 * Purpose
 * ----------------------------------------------------------
 * Organization-scoped agent management for administrators.
 *
 * This page is intentionally separate from AdminUsers.jsx.
 *
 * AdminUsers
 * ----------
 * Manages users.
 *
 * AdminAgents
 * -----------
 * Manages agents belonging to the authenticated
 * administrator's organization.
 *
 * ==========================================================
 *
 * ARCHITECTURE
 * ==========================================================
 *
 * /admin/agents
 *      ↓
 * RoleRoute
 *      ↓
 * MainLayout
 *      ↓
 * Outlet
 *      ↓
 * AdminAgents
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This component MUST NOT render MainLayout.
 *
 * ==========================================================
 *
 * ORGANIZATION SCOPE
 * ==========================================================
 *
 * The organization is determined from the authenticated
 * administrator context.
 *
 * The frontend does NOT allow an administrator to select
 * another organization.
 *
 * Backend authorization remains responsible for enforcing
 * the actual organization boundary.
 *
 * ==========================================================
 *
 * FEATURES
 * ==========================================================
 *
 * • Organization agents
 * • Agent search
 * • Agent status filtering
 * • Agent statistics
 * • Agent details
 * • Agent selection
 * • Pagination
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Search,
  X,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";

import userService from "../../services/userService";


/* ==========================================================
   DEFAULT FILTERS
========================================================== */

const DEFAULT_FILTERS = {
  search: "",
  status: "",
};


/* ==========================================================
   COMPONENT
========================================================== */

const AdminAgents = () => {

  /* ========================================================
     AUTHENTICATED ADMIN
  ======================================================== */

  const {
    user,
  } = useAuth();


  /* ========================================================
     AGENTS
  ======================================================== */

  const [
    agents,
    setAgents,
  ] = useState([]);


  /* ========================================================
     FILTERS
  ======================================================== */

  const [
    filters,
    setFilters,
  ] = useState(
    DEFAULT_FILTERS
  );


  /* ========================================================
     PAGINATION
  ======================================================== */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);


  /* ========================================================
     SELECTED AGENT
  ======================================================== */

  const [
    selectedAgent,
    setSelectedAgent,
  ] = useState(null);


  /* ========================================================
     SUMMARY
  ======================================================== */

  const [
    summary,
    setSummary,
  ] = useState({
    totalAgents: 0,
    activeAgents: 0,
    inactiveAgents: 0,
    suspendedAgents: 0,
  });


  /* ========================================================
     UI STATE
  ======================================================== */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(null);


  /* ========================================================
     LOAD ORGANIZATION AGENTS
  ======================================================== */

  const loadAgents = async (
    page = currentPage
  ) => {

    try {

      setLoading(true);

      setError(null);

      console.log(
        "AdminAgents: Loading organization agents...",
        {
          organizationId:
            user?.organizationId ||
            user?.organization?._id ||
            null,

          page,

          search:
            filters.search,

          status:
            filters.status,
        }
      );


      /*
      ======================================================
      IMPORTANT
      ------------------------------------------------------
      We explicitly request the AGENT role.

      The authenticated organization is still enforced by
      the backend authorization layer.
      ======================================================
      */

      const response =
        await userService.getUsers({

          page,

          role: "agent",

          search:
            filters.search,

          status:
            filters.status,

        });


      console.log(
        "AdminAgents: Agent response:",
        response
      );


      /* ====================================================
         RESPONSE DATA
      ==================================================== */

      const agentData =
        Array.isArray(
          response?.data
        )
          ? response.data
          : [];


      setAgents(
        agentData
      );


      /* ====================================================
         PAGINATION
      ==================================================== */

      setTotalPages(

        response?.pagination?.totalPages ||

        1

      );


      /* ====================================================
         SUMMARY
      ==================================================== */

      setSummary({

        totalAgents:
          agentData.length,

        activeAgents:
          agentData.filter(
            (agent) =>
              String(
                agent?.status || ""
              ).toLowerCase() ===
              "active"
          ).length,

        inactiveAgents:
          agentData.filter(
            (agent) =>
              String(
                agent?.status || ""
              ).toLowerCase() ===
              "inactive"
          ).length,

        suspendedAgents:
          agentData.filter(
            (agent) =>
              String(
                agent?.status || ""
              ).toLowerCase() ===
              "suspended"
          ).length,

      });


    } catch (requestError) {

      console.error(
        "AdminAgents: Unable to load organization agents.",
        requestError
      );


      setAgents([]);

      setSummary({
        totalAgents: 0,
        activeAgents: 0,
        inactiveAgents: 0,
        suspendedAgents: 0,
      });


      setError(
        requestError?.response?.data?.message ||
        "Unable to load organization agents."
      );


    } finally {

      setLoading(false);

    }

  };


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    loadAgents(
      currentPage
    );

  }, [

    currentPage,

    filters.status,

  ]);


  /* ========================================================
     SEARCH
  ======================================================== */

  const handleSearch = async () => {

    setCurrentPage(1);

    await loadAgents(1);

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


    setFilters(
      (previous) => ({

        ...previous,

        [name]:
          value,

      })
    );

  };


  /* ========================================================
     RESET FILTERS
  ======================================================== */

  const handleResetFilters = () => {

    setFilters(
      DEFAULT_FILTERS
    );

    setCurrentPage(1);

    setSelectedAgent(null);

  };


  /* ========================================================
     SELECT AGENT
  ======================================================== */

  const handleSelectAgent = (
    agent
  ) => {

    console.log(
      "AdminAgents: Selected agent:",
      agent
    );

    setSelectedAgent(
      agent
    );

  };


  /* ========================================================
     CLEAR SELECTED AGENT
  ======================================================== */

  const clearSelectedAgent = () => {

    setSelectedAgent(
      null
    );

  };


  /* ========================================================
     AGENT DISPLAY NAME
  ======================================================== */

  const getAgentName = (
    agent
  ) => {

    const firstName =
      agent?.firstName ||
      "";

    const lastName =
      agent?.lastName ||
      "";

    const combinedName =
      `${firstName} ${lastName}`.trim();


    return (
      combinedName ||
      agent?.name ||
      agent?.fullName ||
      agent?.email ||
      "Unnamed Agent"
    );

  };


  /* ========================================================
     AGENT INITIAL
  ======================================================== */

  const getAgentInitial = (
    agent
  ) => {

    const name =
      getAgentName(
        agent
      );


    return (
      name
        ?.trim()
        ?.charAt(0)
        ?.toUpperCase() ||
      "A"
    );

  };


  /* ========================================================
     SUMMARY CARDS
  ======================================================== */

  const dashboardCards = [

    {
      title: "Organization Agents",

      value:
        summary.totalAgents,

      icon: Users,
    },

    {
      title: "Active Agents",

      value:
        summary.activeAgents,

      icon: UserCheck,
    },

    {
      title: "Inactive Agents",

      value:
        summary.inactiveAgents,

      icon: Activity,
    },

    {
      title: "Suspended Agents",

      value:
        summary.suspendedAgents,

      icon: UserX,
    },

  ];


  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {

    return (

      <section className="space-y-10">

        <div>

          <h1 className="text-3xl font-bold">

            Organization Agents

          </h1>

          <p className="text-muted-foreground">

            Loading agents belonging to your
            organization...

          </p>

        </div>


        <div className="flex items-center justify-center py-32">

          <p className="text-muted-foreground">

            Loading organization agents...

          </p>

        </div>

      </section>

    );

  }


  /* ========================================================
     PAGE
  ======================================================== */

  return (

    <section className="space-y-10">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div>

        <h1 className="text-3xl font-bold">

          Organization Agents

        </h1>

        <p className="mt-1 text-muted-foreground">

          Manage sales agents belonging to your
          LeadFlow AI organization.

        </p>

        {user?.organizationId && (

          <p className="mt-2 text-xs text-muted-foreground">

            Organization scope:

            {" "}

            {String(
              user.organizationId
            )}

          </p>

        )}

      </div>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-5
            py-4
          "
        >

          <p className="text-sm text-red-700">

            {error}

          </p>

        </div>

      )}


      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {dashboardCards.map(
          (card) => {

            const Icon =
              card.icon;


            return (

              <div
                key={
                  card.title
                }
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
                    className="
                      h-7
                      w-7
                      text-primary
                    "
                  />

                  <span
                    className="
                      text-3xl
                      font-bold
                    "
                  >
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


      {/* ==================================================
          SEARCH + FILTERS
      ================================================== */}

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

        {/* SEARCH */}

        <div
          className="
            relative
            flex-1
          "
        >

          <Search
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              h-5
              w-5
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <input
            type="text"
            name="search"
            value={
              filters.search
            }
            onChange={
              handleFilterChange
            }
            onKeyDown={(
              event
            ) => {

              if (
                event.key ===
                "Enter"
              ) {

                handleSearch();

              }

            }}
            placeholder="Search agents..."
            className="
              w-full
              rounded-lg
              border
              bg-background
              py-3
              pl-12
              pr-4
            "
          />

        </div>


        {/* STATUS */}

        <select
          name="status"
          value={
            filters.status
          }
          onChange={
            handleFilterChange
          }
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

          <option value="active">

            Active

          </option>

          <option value="inactive">

            Inactive

          </option>

          <option value="suspended">

            Suspended

          </option>

        </select>


        {/* SEARCH BUTTON */}

        <button
          type="button"
          onClick={
            handleSearch
          }
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-primary
            px-5
            py-3
            text-primary-foreground
            transition
            hover:opacity-90
          "
        >

          <Search
            className="h-4 w-4"
          />

          Search

        </button>


        {/* RESET */}

        <button
          type="button"
          onClick={
            handleResetFilters
          }
          className="
            rounded-lg
            border
            px-5
            py-3
            transition
            hover:bg-muted
          "
        >

          Reset

        </button>

      </div>


      {/* ==================================================
          CONTENT
      ================================================== */}

      <div
        className="
          grid
          gap-8
          lg:grid-cols-2
        "
      >


        {/* ==================================================
            AGENT LIST
        ================================================== */}

        <div
          className="
            rounded-xl
            border
            bg-card
          "
        >

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              p-5
            "
          >

            <div>

              <h2
                className="
                  text-xl
                  font-semibold
                "
              >

                Organization Agents

              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-muted-foreground
                "
              >

                Sales agents assigned to your
                organization.

              </p>

            </div>

            <Users
              className="
                h-6
                w-6
                text-primary
              "
            />

          </div>


          {agents.length === 0 ? (

            <div className="p-8 text-center">

              <Users
                className="
                  mx-auto
                  mb-3
                  h-10
                  w-10
                  text-muted-foreground
                "
              />

              <p className="font-medium">

                No agents found.

              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-muted-foreground
                "
              >

                No agents match the current
                search and status filters.

              </p>

            </div>

          ) : (

            <div className="divide-y">

              {agents.map(
                (agent) => (

                  <button
                    key={
                      agent?._id ||
                      agent?.id
                    }
                    type="button"
                    onClick={() =>
                      handleSelectAgent(
                        agent
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

                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-4
                      "
                    >

                      {/* AVATAR */}

                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-primary/10
                          font-semibold
                          text-primary
                        "
                      >

                        {getAgentInitial(
                          agent
                        )}

                      </div>


                      {/* DETAILS */}

                      <div className="min-w-0">

                        <h3
                          className="
                            truncate
                            font-medium
                          "
                        >

                          {getAgentName(
                            agent
                          )}

                        </h3>

                        <p
                          className="
                            truncate
                            text-sm
                            text-muted-foreground
                          "
                        >

                          {agent?.email ||
                            "No email available"}

                        </p>

                      </div>

                    </div>


                    {/* STATUS */}

                    <span
                      className="
                        shrink-0
                        rounded-full
                        bg-primary/10
                        px-3
                        py-1
                        text-sm
                        capitalize
                        text-primary
                      "
                    >

                      {agent?.status ||
                        "unknown"}

                    </span>

                  </button>

                )
              )}

            </div>

          )}

        </div>


        {/* ==================================================
            AGENT DETAILS
        ================================================== */}

        <div
          className="
            rounded-xl
            border
            bg-card
            p-6
          "
        >

          {selectedAgent ? (

            <div className="space-y-6">


              {/* HEADER */}

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >

                <div>

                  <h2
                    className="
                      text-2xl
                      font-semibold
                    "
                  >

                    Agent Details

                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-muted-foreground
                    "
                  >

                    Organization agent profile

                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    clearSelectedAgent
                  }
                  aria-label="Close agent details"
                  className="
                    rounded-lg
                    border
                    p-2
                    transition
                    hover:bg-muted
                  "
                >

                  <X
                    className="h-5 w-5"
                  />

                </button>

              </div>


              {/* AGENT IDENTITY */}

              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-xl
                  bg-muted/40
                  p-4
                "
              >

                <div
                  className="
                    flex
                    h-14
                    w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-primary
                    text-lg
                    font-bold
                    text-primary-foreground
                  "
                >

                  {getAgentInitial(
                    selectedAgent
                  )}

                </div>


                <div className="min-w-0">

                  <h3
                    className="
                      truncate
                      text-lg
                      font-semibold
                    "
                  >

                    {getAgentName(
                      selectedAgent
                    )}

                  </h3>

                  <p
                    className="
                      truncate
                      text-sm
                      text-muted-foreground
                    "
                  >

                    {selectedAgent?.email ||
                      "No email available"}

                  </p>

                </div>

              </div>


              {/* NAME */}

              <div>

                <p
                  className="
                    text-sm
                    text-muted-foreground
                  "
                >

                  Name

                </p>

                <p className="font-medium">

                  {getAgentName(
                    selectedAgent
                  )}

                </p>

              </div>


              {/* EMAIL */}

              <div>

                <p
                  className="
                    text-sm
                    text-muted-foreground
                  "
                >

                  Email

                </p>

                <p className="font-medium">

                  {selectedAgent?.email ||
                    "-"}

                </p>

              </div>


              {/* PHONE */}

              <div>

                <p
                  className="
                    text-sm
                    text-muted-foreground
                  "
                >

                  Phone

                </p>

                <p className="font-medium">

                  {selectedAgent?.phone ||
                    "-"}

                </p>

              </div>


              {/* ROLE */}

              <div>

                <p
                  className="
                    text-sm
                    text-muted-foreground
                  "
                >

                  Role

                </p>

                <p
                  className="
                    font-medium
                    capitalize
                  "
                >

                  {selectedAgent?.role ||
                    "agent"}

                </p>

              </div>


              {/* STATUS */}

              <div>

                <p
                  className="
                    text-sm
                    text-muted-foreground
                  "
                >

                  Status

                </p>

                <p
                  className="
                    font-medium
                    capitalize
                  "
                >

                  {selectedAgent?.status ||
                    "-"}

                </p>

              </div>


              {/* ORGANIZATION */}

              <div>

                <p
                  className="
                    text-sm
                    text-muted-foreground
                  "
                >

                  Organization

                </p>

                <p className="font-medium">

                  {selectedAgent?.organizationId
                    ? String(
                        selectedAgent.organizationId
                      )
                    : user?.organizationId
                      ? String(
                          user.organizationId
                        )
                      : "-"}

                </p>

              </div>


              {/* CLOSE */}

              <button
                type="button"
                onClick={
                  clearSelectedAgent
                }
                className="
                  rounded-lg
                  border
                  px-4
                  py-2
                  transition
                  hover:bg-muted
                "
              >

                Close

              </button>

            </div>

          ) : (

            <div
              className="
                flex
                h-full
                min-h-[320px]
                items-center
                justify-center
                text-center
              "
            >

              <div>

                <Users
                  className="
                    mx-auto
                    mb-4
                    h-10
                    w-10
                    text-muted-foreground
                  "
                />

                <p
                  className="
                    font-medium
                  "
                >

                  Select an agent

                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-muted-foreground
                  "
                >

                  Select an organization agent
                  to view their details.

                </p>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* ==================================================
          PAGINATION
      ================================================== */}

      {totalPages > 1 && (

        <div
          className="
            flex
            items-center
            justify-center
            gap-3
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
                  page - 1
              )
            }
            className="
              rounded-lg
              border
              px-4
              py-2
              transition
              hover:bg-muted
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            Previous

          </button>


          <span
            className="
              text-sm
              text-muted-foreground
            "
          >

            Page {currentPage} of {totalPages}

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
                  page + 1
              )
            }
            className="
              rounded-lg
              border
              px-4
              py-2
              transition
              hover:bg-muted
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


export default AdminAgents;