/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Monitor conversations across the platform.
 *
 * Features
 * ----------------------------------------------------------
 * • All conversations
 * • Search conversations
 * • Filter by agent
 * • Filter by status
 * • Escalated chats
 * • Conversation details
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {

  MessageSquare,

  AlertTriangle,

  Users,

  Search,

} from "lucide-react";

import conversationService from "../../services/conversationService";

const DEFAULT_FILTERS = {

  search: "",

  agent: "",

  status: "",

};

const AdminConversationCenter = () => {

  /*
  ==========================================================
  CONVERSATIONS
  ==========================================================
  */

  const [

    conversations,

    setConversations,

  ] = useState([]);

  /*
  ==========================================================
  SELECTED
  ==========================================================
  */

  const [

    selectedConversation,

    setSelectedConversation,

  ] = useState(null);

  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [

    filters,

    setFilters,

  ] = useState(DEFAULT_FILTERS);

  /*
  ==========================================================
  PAGINATION
  ==========================================================
  */

  const [

    currentPage,

    setCurrentPage,

  ] = useState(1);

  const [

    totalPages,

    setTotalPages,

  ] = useState(1);

  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const [

    summary,

    setSummary,

  ] = useState({

    total: 0,

    active: 0,

    escalated: 0,

    resolved: 0,

  });

  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [

    loading,

    setLoading,

  ] = useState(true);

/*
==========================================================
LOAD CONVERSATIONS
==========================================================
*/

const loadConversations = async (

  page = currentPage

) => {

  try {

    setLoading(true);

    const response =

      await conversationService.getAllConversations({

        page,

        search: filters.search,

        agent: filters.agent,

        status: filters.status,

      });

    /*
    Expected Backend

    {
      data:[],
      pagination:{
        totalPages
      }
    }
    */

    const conversationData =

      response?.data || [];

    setConversations(

      conversationData

    );

    setTotalPages(

      response?.pagination?.totalPages ||

      1

    );

    /*
    ======================================================
    SUMMARY
    ======================================================
    */

    setSummary({

      total:

        conversationData.length,

      active:

        conversationData.filter(

          (conversation) =>

            conversation.status ===

            "active"

        ).length,

      escalated:

        conversationData.filter(

          (conversation) =>

            conversation.status ===

            "escalated"

        ).length,

      resolved:

        conversationData.filter(

          (conversation) =>

            conversation.status ===

            "resolved"

        ).length,

    });

  } catch (error) {

    console.error(

      "Unable to load conversations",

      error

    );

  } finally {

    setLoading(false);

  }

};

/*
==========================================================
INITIAL LOAD
==========================================================
*/

useEffect(() => {

  loadConversations(currentPage);

}, [

  currentPage,

  filters.agent,

  filters.status,

]);

/*
==========================================================
SEARCH
==========================================================
*/

const handleSearch = async () => {

  setCurrentPage(1);

  await loadConversations(1);

};

/*
==========================================================
FILTERS
==========================================================
*/

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

/*
==========================================================
RESET
==========================================================
*/

const handleResetFilters = () => {

  setFilters(

    DEFAULT_FILTERS

  );

  setCurrentPage(1);

};

/*
==========================================================
SELECT CONVERSATION
==========================================================
*/

const handleSelectConversation = (

  conversation

) => {

  setSelectedConversation(

    conversation

  );

};

/*
==========================================================
CLEAR
==========================================================
*/

const clearConversation = () => {

  setSelectedConversation(

    null

  );

};

/*
==========================================================
SUMMARY CARDS
==========================================================
*/

const dashboardCards = [

  {

    title: "Conversations",

    value: summary.total,

    icon: MessageSquare,

  },

  {

    title: "Active",

    value: summary.active,

    icon: Users,

  },

  {

    title: "Escalated",

    value: summary.escalated,

    icon: AlertTriangle,

  },

  {

    title: "Resolved",

    value: summary.resolved,

    icon: Search,

  },

];

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Loading conversations...

        </p>

      </div>

    );

  }

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (

    <section className="space-y-10">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>

        <h1 className="text-3xl font-bold">

          Conversation Center

        </h1>

        <p className="text-muted-foreground">

          Monitor conversations across all
          agents and customers.

        </p>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {dashboardCards.map((card) => {

          const Icon = card.icon;

          return (

            <div

              key={card.title}

              className="rounded-xl border bg-card p-6"

            >

              <div className="mb-4 flex items-center justify-between">

                <Icon className="h-7 w-7 text-primary" />

                <span className="text-3xl font-bold">

                  {card.value}

                </span>

              </div>

              <h3 className="font-semibold">

                {card.title}

              </h3>

            </div>

          );

        })}

      </div>

      {/* ======================================================
          SEARCH + FILTER
      ====================================================== */}

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 md:flex-row">

        <input

          type="text"

          name="search"

          value={filters.search}

          onChange={handleFilterChange}

          placeholder="Search conversations..."

          className="flex-1 rounded-lg border bg-background px-4 py-3"

        />

        <input

          type="text"

          name="agent"

          value={filters.agent}

          onChange={handleFilterChange}

          placeholder="Agent"

          className="rounded-lg border bg-background px-4 py-3"

        />

        <select

          name="status"

          value={filters.status}

          onChange={handleFilterChange}

          className="rounded-lg border bg-background px-4 py-3"

        >

          <option value="">

            All Status

          </option>

          <option value="active">

            Active

          </option>

          <option value="resolved">

            Resolved

          </option>

          <option value="escalated">

            Escalated

          </option>

        </select>

        <button

          onClick={handleSearch}

          className="rounded-lg bg-primary px-5 py-3 text-primary-foreground"

        >

          Search

        </button>

        <button

          onClick={handleResetFilters}

          className="rounded-lg border px-5 py-3"

        >

          Reset

        </button>

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="grid gap-8 lg:grid-cols-2">

        {/* ==================================================
            CONVERSATIONS
        ================================================== */}

        <div className="rounded-xl border bg-card">

          <div className="border-b p-5">

            <h2 className="text-xl font-semibold">

              Conversations

            </h2>

          </div>

          {conversations.length === 0 ? (

            <p className="p-6 text-muted-foreground">

              No conversations found.

            </p>

          ) : (

            <div className="divide-y">

              {conversations.map(

                (conversation) => (

                  <button

                    key={conversation._id}

                    onClick={() =>

                      handleSelectConversation(

                        conversation

                      )

                    }

                    className="flex w-full items-center justify-between p-5 text-left transition hover:bg-muted"

                  >

                    <div>

                      <h3 className="font-medium">

                        {

                          conversation.customerName

                        }

                      </h3>

                      <p className="text-sm text-muted-foreground">

                        {

                          conversation.agentName

                        }

                      </p>

                    </div>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">

                      {

                        conversation.status

                      }

                    </span>

                  </button>

                )

              )}

            </div>

          )}

        </div>

        {/* ==================================================
            DETAILS
        ================================================== */}

        <div className="rounded-xl border bg-card p-6">

          {selectedConversation ? (

            <div className="space-y-5">

              <h2 className="text-2xl font-semibold">

                Conversation Details

              </h2>

              <div>

                <p className="text-sm text-muted-foreground">

                  Customer

                </p>

                <p className="font-medium">

                  {

                    selectedConversation.customerName

                  }

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Assigned Agent

                </p>

                <p className="font-medium">

                  {

                    selectedConversation.agentName

                  }

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Property

                </p>

                <p className="font-medium">

                  {

                    selectedConversation.propertyTitle

                  }

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Status

                </p>

                <p className="font-medium capitalize">

                  {

                    selectedConversation.status

                  }

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Last Message

                </p>

                <p>

                  {

                    selectedConversation.lastMessage

                  }

                </p>

              </div>

              <button

                onClick={clearConversation}

                className="rounded-lg border px-4 py-2 hover:bg-muted"

              >

                Close

              </button>

            </div>

          ) : (

            <div className="flex h-full items-center justify-center text-center">

              <p className="text-muted-foreground">

                Select a conversation to view
                its details.

              </p>

            </div>

          )}

        </div>

      </div>

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {totalPages > 1 && (

        <div className="flex items-center justify-center gap-3">

          <button

            disabled={currentPage === 1}

            onClick={() =>

              setCurrentPage(

                (page) => page - 1

              )

            }

            className="rounded-lg border px-4 py-2 disabled:opacity-50"

          >

            Previous

          </button>

          <span className="text-sm text-muted-foreground">

            Page {currentPage} of {totalPages}

          </span>

          <button

            disabled={

              currentPage === totalPages

            }

            onClick={() =>

              setCurrentPage(

                (page) => page + 1

              )

            }

            className="rounded-lg border px-4 py-2 disabled:opacity-50"

          >

            Next

          </button>

        </div>

      )}

    </section>

  );

};

export default AdminConversationCenter;