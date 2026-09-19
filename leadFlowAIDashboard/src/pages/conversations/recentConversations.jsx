/**
 * ==========================================================
 *
 * Agent Conversation Inbox
 *
 * Route
 * ----------------------------------------------------------
 * /conversations
 *
 * Purpose
 * ----------------------------------------------------------
 * Gives agents a simple workspace for reviewing customer
 * conversations before taking the next action.
 *
 * Agent Workflow
 * ----------------------------------------------------------
 * 1. Review customer conversation
 * 2. Check qualification status
 * 3. Check latest message
 * 4. Check follow-up status
 * 5. Open conversation
 * 6. Open lead when further action is required
 *
 * ==========================================================
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MessageSquare,
  User,
  Phone,
  CalendarClock,
  RefreshCw,
  Search,
  ArrowRight,
} from "lucide-react";

import MainLayout from "../../components/layout/mainlayout";
import useConversations from "../../hooks/useConversations";

console.log("RecentConversations page mounted");

/**
 * ==========================================================
 * STATUS STYLES
 * ==========================================================
 */

const getStatusStyle = (status) => {
  switch (status) {
    case "Hot Lead":
      return "bg-red-500/10 text-red-400 border-red-500/20";

    case "Qualified":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    case "Cold":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";

    case "New":
    default:
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  }
};

/**
 * ==========================================================
 * COMPONENT
 * ==========================================================
 */

const RecentConversations = () => {
  const navigate = useNavigate();

  /**
   * ========================================================
   * CONVERSATIONS
   * ========================================================
   */

  const {
    conversations = [],
    loading,
    error,
    refreshConversations,
  } = useConversations();

  /**
   * ========================================================
   * SEARCH
   * ========================================================
   */

  const [search, setSearch] = useState("");

  /**
   * ========================================================
   * FILTER
   * ========================================================
   */

  const [statusFilter, setStatusFilter] = useState("All");

  /**
   * ========================================================
   * FILTER CONVERSATIONS
   * ========================================================
   */

  const filteredConversations = useMemo(() => {
    let data = [...conversations];

    /**
     * ------------------------------------------------------
     * SEARCH CUSTOMER / PHONE
     * ------------------------------------------------------
     */

    if (search.trim()) {
      const value = search.toLowerCase();

      data = data.filter((conversation) => {
        const customerName =
          conversation.customerName ||
          conversation.lead?.name ||
          "";

        const phone =
          conversation.phone ||
          conversation.lead?.phone ||
          "";

        return (
          customerName.toLowerCase().includes(value) ||
          phone.toLowerCase().includes(value)
        );
      });
    }

    /**
     * ------------------------------------------------------
     * QUALIFICATION FILTER
     * ------------------------------------------------------
     */

    if (statusFilter !== "All") {
      data = data.filter(
        (conversation) =>
          (conversation.qualificationStatus || "New") ===
          statusFilter
      );
    }

    /**
     * ------------------------------------------------------
     * NEWEST FIRST
     * ------------------------------------------------------
     */

    data.sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0);
      const dateB = new Date(b.updatedAt || 0);

      return dateB - dateA;
    });

    return data;
  }, [
    conversations,
    search,
    statusFilter,
  ]);

  /**
   * ========================================================
   * OPEN CONVERSATION
   * ========================================================
   */

  const openConversation = (conversation) => {
    const leadId =
      conversation.leadId ||
      conversation.lead?._id;

    if (!leadId) {
      console.warn(
        "Cannot open conversation: lead ID missing",
        conversation
      );

      return;
    }

    navigate(`/conversations/${leadId}`);
  };

  /**
   * ========================================================
   * OPEN LEAD
   * ========================================================
   */

  const openLead = (conversation) => {
    const leadId =
      conversation.leadId ||
      conversation.lead?._id;

    if (!leadId) {
      console.warn(
        "Cannot open lead: lead ID missing",
        conversation
      );

      return;
    }

    navigate(`/leads/${leadId}`);
  };

  /**
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <MessageSquare
              size={40}
              className="mx-auto animate-pulse text-cyan-400"
            />

            <p className="mt-4 text-slate-400">
              Loading conversations...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  /**
   * ========================================================
   * ERROR
   * ========================================================
   */

  if (error) {
    return (
      <MainLayout>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h2 className="text-lg font-semibold text-red-400">
            Unable to load conversations
          </h2>

          <p className="mt-2 text-sm text-red-300">
            {error}
          </p>

          <button
            onClick={refreshConversations}
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-red-500
              px-4
              py-2
              font-semibold
              text-white
              hover:bg-red-400
            "
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </MainLayout>
    );
  }

  /**
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>
            <div className="flex items-center gap-3">
              <MessageSquare
                size={30}
                className="text-cyan-400"
              />

              <h1 className="text-3xl font-bold text-white">
                Conversations
              </h1>
            </div>

            <p className="mt-2 text-slate-400">
              Review customer conversations and decide the next
              agent action.
            </p>
          </div>

          <button
            onClick={refreshConversations}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-700
              bg-slate-900
              px-5
              py-3
              font-medium
              text-white
              transition
              hover:border-cyan-500
              hover:bg-slate-800
            "
          >
            <RefreshCw size={17} />
            Refresh
          </button>

        </section>

        {/* ==================================================
            SEARCH + FILTERS
        ================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">

            {/* Search */}

            <div className="relative">

              <Search
                size={18}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                "
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customer or phone..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  py-3
                  pl-11
                  pr-4
                  text-white
                  outline-none
                  placeholder:text-slate-600
                  focus:border-cyan-500
                "
              />

            </div>

            {/* Qualification */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                px-4
                py-3
                text-white
                outline-none
                focus:border-cyan-500
              "
            >
              <option value="All">
                All Qualifications
              </option>

              <option value="New">
                New
              </option>

              <option value="Hot Lead">
                Hot Lead
              </option>

              <option value="Qualified">
                Qualified
              </option>

              <option value="Cold">
                Cold
              </option>
            </select>

            {/* Result count */}

            <div className="
              flex
              items-center
              justify-center
              rounded-xl
              border
              border-cyan-500/20
              bg-cyan-500/10
              px-5
              py-3
              text-sm
              font-semibold
              text-cyan-300
            ">
              {filteredConversations.length} Conversations
            </div>

          </div>

        </section>

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {filteredConversations.length === 0 && (

          <section className="
            rounded-3xl
            border
            border-dashed
            border-slate-700
            bg-slate-900
            p-16
            text-center
          ">

            <MessageSquare
              size={44}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-5 text-xl font-semibold text-white">
              No Conversations Found
            </h2>

            <p className="mt-2 text-slate-400">
              Try changing your search or qualification filter.
            </p>

          </section>

        )}

        {/* ==================================================
            CONVERSATION LIST
        ================================================== */}

        {filteredConversations.length > 0 && (

          <section className="space-y-4">

            {filteredConversations.map((conversation) => {

              const customerName =
                conversation.customerName ||
                conversation.lead?.name ||
                "Unknown Customer";

              const phone =
                conversation.phone ||
                conversation.lead?.phone ||
                "-";

              const qualification =
                conversation.qualificationStatus ||
                "New";

              const lastMessage =
                conversation.lastMessage ||
                conversation.messages?.at(-1)?.text ||
                conversation.messages?.at(-1)?.message ||
                "No messages yet.";

              const leadId =
                conversation.leadId ||
                conversation.lead?._id;

              const followUp =
                conversation.nextFollowUp ||
                conversation.lead?.nextFollowUpDate;

              return (
                <article
                  key={conversation._id}
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-5
                    transition
                    hover:border-slate-700
                  "
                >

                  <div className="
                    flex
                    flex-col
                    gap-5
                    xl:flex-row
                    xl:items-center
                    xl:justify-between
                  ">

                    {/* ====================================
                        CUSTOMER
                    ==================================== */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start gap-4">

                        <div className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-cyan-500/10
                        ">
                          <User
                            size={21}
                            className="text-cyan-400"
                          />
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-3">

                            <h2 className="text-lg font-semibold text-white">
                              {customerName}
                            </h2>

                            <span className={`
                              rounded-full
                              border
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              ${getStatusStyle(
                                qualification
                              )}
                            `}>
                              {qualification}
                            </span>

                          </div>

                          {/* Phone */}

                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">

                            <Phone size={15} />

                            {phone}

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* ====================================
                        CONVERSATION INFO
                    ==================================== */}

                    <div className="grid gap-4 sm:grid-cols-2 xl:flex xl:items-center">

                      {/* Last Message */}

                      <div className="max-w-md">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Last Message
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-300">
                          {lastMessage}
                        </p>

                      </div>

                      {/* Follow-up */}

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Follow-up
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-sm">

                          <CalendarClock
                            size={15}
                            className={
                              followUp
                                ? "text-yellow-400"
                                : "text-slate-600"
                            }
                          />

                          <span className={
                            followUp
                              ? "text-yellow-300"
                              : "text-slate-500"
                          }>
                            {followUp
                              ? new Date(
                                  followUp
                                ).toLocaleDateString()
                              : "Not scheduled"}
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* ====================================
                        ACTIONS
                    ==================================== */}

                    <div className="flex flex-wrap gap-2">

                      <button
                        onClick={() =>
                          openConversation(
                            conversation
                          )
                        }
                        disabled={!leadId}
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          bg-cyan-500
                          px-4
                          py-2.5
                          text-sm
                          font-semibold
                          text-slate-950
                          transition
                          hover:bg-cyan-400
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                      >
                        Open Conversation
                        <ArrowRight size={16} />
                      </button>

                      <button
                        onClick={() =>
                          openLead(
                            conversation
                          )
                        }
                        disabled={!leadId}
                        className="
                          rounded-xl
                          border
                          border-slate-700
                          px-4
                          py-2.5
                          text-sm
                          font-medium
                          text-white
                          transition
                          hover:bg-slate-800
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                      >
                        Lead
                      </button>

                    </div>

                  </div>

                </article>
              );
            })}

          </section>

        )}

      </div>
    </MainLayout>
  );
};

export default RecentConversations;