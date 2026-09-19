/**
 * ==========================================================
 *
 * Displays an overview of the selected lead for agents.
 *
 * Used In
 * ----------------------------------------------------------
 * • Conversation Center
 * • Lead Details
 * • Dashboard
 * • AI Assistant
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/leads/:id
 * PATCH /api/leads/:id
 *
 * ==========================================================
 */

import {

  User,

  ShieldCheck,

  Globe,

  MessageCircle,

} from "lucide-react";

const LeadSummaryCard = ({

  lead,

  onCall,

  onWhatsApp,

  onEmail,

  onOpenConversation,

  onScheduleViewing,

}) => {

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (!lead) {

    return (

      <aside
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >

        <div className="text-center">

          <User
            className="
              mx-auto
              h-16
              w-16
              text-slate-600
            "
          />

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >

            No Lead Selected

          </h2>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-slate-400
            "
          >

            Select a lead from your dashboard
            to view customer information.

          </p>

        </div>

      </aside>

    );

  }

  /* ========================================================
     HELPERS
  ======================================================== */

  const initials =

    lead.fullName
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "NA";

  /* ========================================================
     INTENT DISPLAY
  ======================================================== */

  /**
   * ========================================================
   *
   * LEAD INTENT SEMANTICS
   *
   * --------------------------------------------------------
   *
   * lead.intent describes WHAT THE CUSTOMER WANTS TO DO.
   *
   * rent
   * ----
   * Customer explicitly wants to rent / lease.
   *
   * buy
   * ---
   * Customer explicitly wants to buy / purchase / own.
   *
   * property_search
   * ---------------
   * Customer is searching for a property but has not
   * explicitly specified whether they want to rent or buy.
   *
   * IMPORTANT
   * --------------------------------------------------------
   *
   * Do NOT default a missing intent to "Buyer".
   *
   * property_search is NOT equivalent to buy.
   *
   * ========================================================
   */

  const intentLabels = {

    rent: "Rent",

    buy: "Buy",

    property_search: "Property Search",

  };

  const normalizedIntent =
    String(
      lead.intent || ""
    )
      .trim()
      .toLowerCase();

  const intentLabel =
    intentLabels[
      normalizedIntent
    ] ||
    "Not Specified";

  /* ========================================================
     COMPONENT
  ======================================================== */

  return (

    <aside
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      {/*======================================================
        HEADER
      ======================================================*/}

      <div
        className="
          border-b
          border-slate-800
          bg-gradient-to-r
          from-cyan-600/10
          to-blue-600/10
          p-8
        "
      >

        <div
          className="
            flex
            flex-col
            items-center
            gap-6
            lg:flex-row
          "
        >

          {/* Avatar */}

          {lead.avatar ? (

            <img
              src={lead.avatar}
              alt={lead.fullName}
              className="
                h-24
                w-24
                rounded-full
                border-4
                border-cyan-500
                object-cover
                shadow-lg
              "
            />

          ) : (

            <div
              className="
                flex
                h-24
                w-24
                items-center
                justify-center
                rounded-full
                border-4
                border-cyan-500
                bg-slate-800
                text-2xl
                font-bold
                text-cyan-300
              "
            >

              {initials}

            </div>

          )}

          {/* Lead Identity */}

          <div className="flex-1">

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >

              <h2
                className="
                  text-3xl
                  font-bold
                  text-white
                "
              >

                {lead.fullName}

              </h2>

              {lead.verified && (

                <span
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-emerald-500/15
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-emerald-300
                  "
                >

                  <ShieldCheck className="h-4 w-4" />

                  Verified

                </span>

              )}

            </div>

            <p
              className="
                mt-3
                text-sm
                text-slate-400
              "
            >

              Customer interested in finding a property
              to rent or buy.

            </p>

            {/* Lead Source */}

            <div
              className="
                mt-5
                flex
                items-center
                gap-3
              "
            >

              <Globe
                className="
                  h-5
                  w-5
                  text-cyan-400
                "
              />

              <span
                className="
                  text-sm
                  font-medium
                  text-slate-300
                "
              >

                Lead Source:

              </span>

              <span
                className="
                  rounded-full
                  border
                  border-cyan-500/20
                  bg-cyan-500/10
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-cyan-300
                "
              >

                {lead.source || "Website"}

              </span>

            </div>

          </div>

        </div>

      </div>

      {/*======================================================
        QUICK STATUS
      ======================================================*/}

      <div
        className="
          flex
          flex-wrap
          gap-3
          p-6
        "
      >

        <span
          className="
            rounded-full
            bg-blue-500/10
            px-4
            py-2
            text-xs
            font-semibold
            text-blue-300
          "
        >

          {lead.status || "New Lead"}

        </span>

        <span
          className="
            rounded-full
            bg-emerald-500/10
            px-4
            py-2
            text-xs
            font-semibold
            text-emerald-300
          "
        >

          {intentLabel}

        </span>

        <span
          className="
            rounded-full
            bg-amber-500/10
            px-4
            py-2
            text-xs
            font-semibold
            text-amber-300
          "
        >

          {lead.priority || "Medium Priority"}

        </span>

      </div>

      {/*======================================================
        CONTACT INFORMATION
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            text-xl
            font-semibold
            text-white
          "
        >

          Contact Information

        </h3>

        <div
          className="
            mt-6
            grid
            gap-5
            lg:grid-cols-2
          "
        >

          {/* Phone */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/40
              p-5
            "
          >

            <p
              className="
                text-xs
                uppercase
                tracking-wide
                text-slate-500
              "
            >

              Phone Number

            </p>

            <p
              className="
                mt-2
                text-lg
                font-semibold
                text-white
              "
            >

              {lead.phone || "Not Provided"}

            </p>

          </div>

          {/* Email */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/40
              p-5
            "
          >

            <p
              className="
                text-xs
                uppercase
                tracking-wide
                text-slate-500
              "
            >

              Email Address

            </p>

            <p
              className="
                mt-2
                break-all
                text-lg
                font-semibold
                text-white
              "
            >

              {lead.email || "Not Provided"}

            </p>

          </div>

          {/* Preferred Contact */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/40
              p-5
            "
          >

            <p
              className="
                text-xs
                uppercase
                tracking-wide
                text-slate-500
              "
            >

              Preferred Contact

            </p>

            <div
              className="
                mt-3
                flex
                items-center
                gap-3
              "
            >

              <MessageCircle
                className="
                  h-5
                  w-5
                  text-cyan-400
                "
              />

              <span
                className="
                  font-semibold
                  text-white
                "
              >

                {lead.preferredContact || "WhatsApp"}

              </span>

            </div>

          </div>

          {/* Customer Availability */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950/40
              p-5
            "
          >

            <p
              className="
                text-xs
                uppercase
                tracking-wide
                text-slate-500
              "
            >

              Preferred Time

            </p>

            <p
              className="
                mt-2
                font-semibold
                text-white
              "
            >

              {lead.preferredTime || "Anytime"}

            </p>

          </div>

        </div>

      </div>

      {/*======================================================
        PROPERTY PREFERENCES
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            text-xl
            font-semibold
            text-white
          "
        >

          Property Preferences

        </h3>

        <div
          className="
            mt-6
            grid
            gap-5
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Property Type

            </p>

            <p className="mt-2 font-semibold text-white">

              {lead.propertyType || "Any"}

            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Budget

            </p>

            <p className="mt-2 font-semibold text-cyan-400">

              {lead.budget || "Not Specified"}

            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Preferred Location

            </p>

            <p className="mt-2 font-semibold text-white">

              {lead.location || "Any"}

            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Bedrooms

            </p>

            <p className="mt-2 font-semibold text-white">

              {lead.bedrooms || "Flexible"}

            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Timeline

            </p>

            <p className="mt-2 font-semibold text-white">

              {lead.timeline || "Not Specified"}

            </p>

          </div>

        </div>

      </div>

      {/*======================================================
        AI LEAD ANALYSIS
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            text-xl
            font-semibold
            text-white
          "
        >

          AI Lead Analysis

        </h3>

        <div
          className="
            mt-6
            grid
            gap-5
            lg:grid-cols-3
          "
        >

          {/* Lead Score */}

          <div
            className="
              rounded-2xl
              border
              border-cyan-500/20
              bg-cyan-500/10
              p-6
            "
          >

            <p className="text-xs uppercase tracking-wide text-cyan-300">

              AI Lead Score

            </p>

            <h2
              className="
                mt-2
                text-4xl
                font-bold
                text-cyan-400
              "
            >

              {lead.aiScore || 0}

            </h2>

            <p className="mt-2 text-sm text-slate-300">

              /100

            </p>

          </div>

          {/* Intent */}

          <div
            className="
              rounded-2xl
              border
              border-emerald-500/20
              bg-emerald-500/10
              p-6
            "
          >

            <p className="text-xs uppercase tracking-wide text-emerald-300">

              AI Intent

            </p>

            <h3 className="mt-3 text-2xl font-bold text-white">

              {intentLabel}

            </h3>

          </div>

          {/* Urgency */}

          <div
            className="
              rounded-2xl
              border
              border-amber-500/20
              bg-amber-500/10
              p-6
            "
          >

            <p className="text-xs uppercase tracking-wide text-amber-300">

              Urgency

            </p>

            <h3 className="mt-3 text-2xl font-bold text-white">

              {lead.urgency || "Medium"}

            </h3>

          </div>

        </div>

      </div>

      {/*======================================================
        QUICK ACTIONS
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            text-xl
            font-semibold
            text-white
          "
        >

          Quick Actions

        </h3>

        <div
          className="
            mt-6
            grid
            gap-4
            sm:grid-cols-2
          "
        >

          <button
            onClick={() => onCall?.(lead)}
            className="
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >

            Call Lead

          </button>

          <button
            onClick={() => onWhatsApp?.(lead)}
            className="
              rounded-xl
              bg-emerald-500
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-emerald-400
            "
          >

            WhatsApp

          </button>

          <button
            onClick={() => onEmail?.(lead)}
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-700
            "
          >

            Send Email

          </button>

          <button
            onClick={() =>
              onOpenConversation?.(lead)
            }
            className="
              rounded-xl
              border
              border-cyan-500/30
              bg-cyan-500/10
              px-5
              py-3
              text-sm
              font-semibold
              text-cyan-300
              transition
              hover:bg-cyan-500
              hover:text-slate-950
            "
          >

            Open Conversation

          </button>

          <button
            onClick={() =>
              onScheduleViewing?.(lead)
            }
            className="
              sm:col-span-2
              rounded-xl
              bg-amber-500
              px-5
              py-3
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-amber-400
            "
          >

            Schedule Property Viewing

          </button>

        </div>

      </div>

      {/*======================================================
        LAST ACTIVITY
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            text-lg
            font-semibold
            text-white
          "
        >

          Recent Activity

        </h3>

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-5
          "
        >

          <p
            className="
              text-sm
              text-slate-300
            "
          >

            {lead.lastActivity ||
              "No recent activity recorded."}

          </p>

          {lead.lastActivityTime && (

            <p
              className="
                mt-2
                text-xs
                text-slate-500
              "
            >

              {lead.lastActivityTime}

            </p>

          )}

        </div>

      </div>

      {/*======================================================
        ASSIGNED AGENT
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            text-lg
            font-semibold
            text-white
          "
        >

          Assigned Agent

        </h3>

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-5
          "
        >

          <p
            className="
              font-semibold
              text-white
            "
          >

            {lead.assignedAgent ||
              "Not Assigned"}

          </p>

        </div>

      </div>

      {/*======================================================
        FOOTER
      ======================================================*/}

      <div
        className="
          flex
          flex-col
          gap-4
          border-t
          border-slate-800
          bg-slate-950/40
          p-6
          text-sm
          text-slate-500
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <div>LeadFlow AI • Agent CRM</div>

        <div>
          Lead ID <span className="font-semibold">#{lead.id}</span>
        </div>

      </div>

    </aside>

  );

};

export default LeadSummaryCard;