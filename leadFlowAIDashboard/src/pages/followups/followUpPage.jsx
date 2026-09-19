/**
 * ==========================================================
 * SHARED FOLLOW-UP MANAGEMENT PAGE
 * ==========================================================
 *
 * File:
 * ----------------------------------------------------------
 * pages/followups/followUpPage.jsx
 *
 * Route:
 * ----------------------------------------------------------
 * /followup/:id
 *
 * Purpose:
 * ----------------------------------------------------------
 * Shared LeadFlowAI follow-up management workspace.
 *
 * This page can be accessed from:
 * ----------------------------------------------------------
 * • Agent follow-up inbox
 * • Lead details
 * • Shared follow-up workspace
 * • Other authorized lead workflows
 *
 * It is NOT an agent-specific page.
 *
 * ==========================================================
 *
 * Displays
 * ----------------------------------------------------------
 * • Customer Name
 * • Phone Number
 * • Lead Status
 * • AI Qualification Score
 * • Customer Intent
 * • AI Recommended Action
 * • AI Check-up Message
 *
 * Follow-up Actions
 * ----------------------------------------------------------
 * • Next Follow-up Date
 * • Reminder
 * • Follow-up Status
 * • Notes
 * • Outcome
 * • Send / record check-up action
 *
 * ==========================================================
 *
 * Future Enhancements
 * ----------------------------------------------------------
 * • Google Calendar sync
 * • Outlook Calendar sync
 * • SMS reminder
 * • WhatsApp reminder
 * • Automatic follow-up suggestions
 * • AI follow-up recommendations
 *
 * ==========================================================
 */

import axiosClient from "../../api/axiosClient";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Brain,
  CalendarClock,
  CheckCircle2,
  MessageCircle,
  Save,
  Send,
  Target,
  User,
} from "lucide-react";

import useLeadDetails from "../../hooks/useLeadDetails";

/*
==========================================================
SHARED FOLLOW-UP PAGE
==========================================================
*/

const FollowUpPage = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  /*
  ========================================================
  LEAD DATA
  ========================================================
  */

  const {
    lead,
    loading,
    error,
    refreshLead,
  } = useLeadDetails(id);

  /*
  ========================================================
  FOLLOW-UP STATE
  ========================================================
  */

  const [
    nextFollowUpDate,
    setNextFollowUpDate,
  ] = useState("");

  const [
    reminder,
    setReminder,
  ] = useState("");

  const [
    followUpStatus,
    setFollowUpStatus,
  ] = useState("Pending");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    outcome,
    setOutcome,
  ] = useState("");

  /*
  ========================================================
  CHECK-UP MESSAGE STATE
  ========================================================
  */

  const [
    checkUpMessage,
    setCheckUpMessage,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    sendingMessage,
    setSendingMessage,
  ] = useState(false);

  const [
    messageSent,
    setMessageSent,
  ] = useState(false);

  /*
  ==========================================================
  LOAD LEAD FOLLOW-UP DATA
  ==========================================================
  */

  useEffect(() => {
    if (!lead) return;

    /*
    --------------------------------------------------------
    NEXT FOLLOW-UP DATE
    --------------------------------------------------------
    Canonical field:
    nextFollowUpDate
    --------------------------------------------------------
    Legacy fallback:
    followUpDate
    --------------------------------------------------------
    */

    setNextFollowUpDate(
      lead.nextFollowUpDate
        ? new Date(
            lead.nextFollowUpDate
          )
            .toISOString()
            .split("T")[0]
        : lead.followUpDate
        ? new Date(
            lead.followUpDate
          )
            .toISOString()
            .split("T")[0]
        : ""
    );

    /*
    --------------------------------------------------------
    REMINDER
    --------------------------------------------------------
    */

    setReminder(
      lead.reminder ||
        lead.followUpReminder ||
        ""
    );

    /*
    --------------------------------------------------------
    FOLLOW-UP STATUS
    --------------------------------------------------------
    */

    setFollowUpStatus(
      lead.followUpStatus ||
        "Pending"
    );

    /*
    --------------------------------------------------------
    NOTES
    --------------------------------------------------------
    */

    setNotes(
      lead.notes ||
        ""
    );

    /*
    --------------------------------------------------------
    OUTCOME
    --------------------------------------------------------
    */

    setOutcome(
      lead.outcome ||
        ""
    );

    /*
    --------------------------------------------------------
    CHECK-UP MESSAGE
    --------------------------------------------------------
    */

    setCheckUpMessage(
      lead.checkUpMessage ||
        lead.checkupMessage ||
        lead.aiCheckUpMessage ||
        ""
    );

    /*
    --------------------------------------------------------
    MESSAGE SENT STATUS
    --------------------------------------------------------
    */

    setMessageSent(
      Boolean(
        lead.checkUpMessageSent ||
          lead.checkupMessageSent ||
          lead.followUpMessageSent
      )
    );
  }, [lead]);

  /*
  ==========================================================
  GENERATE CHECK-UP MESSAGE
  ==========================================================
  */

  const generateCheckUpMessage = () => {
    if (!lead) return;

    /*
    --------------------------------------------------------
    USE EXISTING AI MESSAGE FIRST
    --------------------------------------------------------
    */

    if (
      lead.checkUpMessage ||
      lead.checkupMessage ||
      lead.aiCheckUpMessage
    ) {
      setCheckUpMessage(
        lead.checkUpMessage ||
          lead.checkupMessage ||
          lead.aiCheckUpMessage
      );

      return;
    }

    /*
    --------------------------------------------------------
    CLIENT-SIDE FALLBACK
    --------------------------------------------------------
    */

    const customerName =
      lead.name || "there";

    const propertyReference =
      lead.propertyTitle ||
      lead.property?.title ||
      "the property options we discussed";

    const generatedMessage =
      `Hi ${customerName}, just checking in regarding ${propertyReference}. I wanted to see if you have any questions or if you would like us to arrange the next step.`;

    setCheckUpMessage(
      generatedMessage
    );
  };

  /*
  ==========================================================
  SEND CHECK-UP MESSAGE
  ==========================================================
  */

  const handleSendCheckUp = async () => {
    if (
      !lead?._id ||
      !checkUpMessage.trim()
    ) {
      return;
    }

    try {
      setSendingMessage(true);

      /*
      --------------------------------------------------------
      DEDICATED CHECK-UP ENDPOINT
      --------------------------------------------------------
      */

      await axiosClient.post(
        `/lead/${lead._id}/checkup-message`,
        {
          message:
            checkUpMessage.trim(),
        }
      );

      setMessageSent(true);

      console.log(
        "Check-up message sent successfully:",
        lead._id
      );
    } catch (error) {
      console.error(
        "Failed to send check-up message:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to send check-up message."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  /*
  ==========================================================
  SAVE FOLLOW-UP
  ==========================================================
  */

  const handleSave = async () => {
    if (!lead?._id) {
      console.error(
        "Cannot save follow-up: lead ID is missing."
      );

      return;
    }

    try {
      setSaving(true);

      /*
      --------------------------------------------------------
      CANONICAL FOLLOW-UP UPDATE
      --------------------------------------------------------
      */

      await axiosClient.patch(
        `/lead/${lead._id}/followup`,
        {
          nextFollowUpDate,
          reminder,
          followUpStatus,
          notes,
          outcome,
        }
      );

      console.log(
        "Follow-up saved successfully:",
        lead._id
      );

      alert(
        "Follow-up saved successfully."
      );

      /*
      --------------------------------------------------------
      RETURN TO LEAD
      --------------------------------------------------------
      */

      navigate(
        `/lead/${lead._id}`
      );
    } catch (error) {
      console.error(
        "Failed to save follow-up:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to save follow-up."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-950
          p-10
        "
      >
        <div className="text-center">
          <CalendarClock
            size={42}
            className="
              mx-auto
              mb-4
              animate-pulse
              text-cyan-400
            "
          />

          <p className="text-slate-300">
            Loading follow-up...
          </p>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  ERROR
  ==========================================================
  */

  if (error) {
    return (
      <div
        className="
          min-h-screen
          bg-slate-950
          p-10
        "
      >
        <div
          className="
            mx-auto
            max-w-3xl
            rounded-2xl
            border
            border-red-900
            bg-red-950/30
            p-8
          "
        >
          <h2
            className="
              text-xl
              font-semibold
              text-red-400
            "
          >
            Unable to load follow-up
          </h2>

          <p className="mt-3 text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={refreshLead}
            className="
              mt-6
              rounded-lg
              bg-cyan-500
              px-4
              py-2
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  LEAD NOT FOUND
  ==========================================================
  */

  if (!lead) {
    return (
      <div
        className="
          min-h-screen
          bg-slate-950
          p-10
          text-slate-400
        "
      >
        Lead not found.
      </div>
    );
  }

  /*
  ==========================================================
  TRANSACTION INTENT
  ==========================================================
  *
  * Canonical values:
  * • rent
  * • buy
  * • property_search
  *
  * This is separate from property search criteria such as:
  * • propertyType
  * • budget
  * • location
  * • bedrooms
  * • moveDate
  */

  const formatIntent = (intent) => {
    switch (
      String(intent || "")
        .trim()
        .toLowerCase()
    ) {
      case "rent":
        return "Rent";

      case "buy":
        return "Buy";

      case "property_search":
        return "Property Search";

      default:
        return "Not Specified";
    }
  };

  const transactionIntent =
    lead.intent ||
    lead.customerIntent ||
    "";

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (
    <main
      className="
        min-h-screen
        bg-slate-950
        p-6
        md:p-8
      "
    >
      <div
        className="
          mx-auto
          max-w-6xl
          space-y-6
        "
      >
        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-slate-700
            px-4
            py-2
            text-white
            transition
            hover:bg-slate-800
          "
        >
          <ArrowLeft size={18} />

          Back
        </button>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section>
          <div className="flex items-center gap-3">
            <CalendarClock
              size={30}
              className="text-cyan-400"
            />

            <h1
              className="
                text-3xl
                font-bold
                text-white
              "
            >
              Follow-up Manager
            </h1>
          </div>

          <p className="mt-2 text-slate-400">
            Manage the next customer action after
            the conversation.
          </p>
        </section>

        {/* ==================================================
            CUSTOMER SUMMARY
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >
          <div className="mb-6 flex items-center gap-3">
            <User
              size={22}
              className="text-cyan-400"
            />

            <h2
              className="
                text-xl
                font-semibold
                text-white
              "
            >
              Customer
            </h2>
          </div>

          <div
            className="
              grid
              gap-6
              md:grid-cols-2
              lg:grid-cols-5
            "
          >
            {/* NAME */}

            <div>
              <p className="text-sm text-slate-400">
                Name
              </p>

              <p className="mt-1 font-medium text-white">
                {lead.name || "Unnamed Customer"}
              </p>
            </div>

            {/* PHONE */}

            <div>
              <p className="text-sm text-slate-400">
                Phone
              </p>

              <p className="mt-1 font-medium text-white">
                {lead.phone || "-"}
              </p>
            </div>

            {/* STATUS */}

            <div>
              <p className="text-sm text-slate-400">
                Lead Status
              </p>

              <p
                className="
                  mt-1
                  font-medium
                  capitalize
                  text-cyan-400
                "
              >
                {lead.status || "Pending"}
              </p>
            </div>

            {/* SCORE */}

            <div>
              <p className="text-sm text-slate-400">
                AI Score
              </p>

              <p
                className="
                  mt-1
                  font-bold
                  text-cyan-400
                "
              >
                {lead.score ?? 0}%
              </p>
            </div>

            {/* TRANSACTION INTENT */}

            <div>
              <p className="text-sm text-slate-400">
                Transaction Intent
              </p>

              <p className="mt-1 font-medium text-white">
                {formatIntent(
                  transactionIntent
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            AI ACTION CONTEXT
        ================================================== */}

        <section
          className="
            grid
            gap-6
            lg:grid-cols-2
          "
        >
          {/* AI RECOMMENDED ACTION */}

          <div
            className="
              rounded-2xl
              border
              border-cyan-500/20
              bg-cyan-500/10
              p-6
            "
          >
            <div className="flex items-center gap-3">
              <Brain
                size={22}
                className="text-cyan-400"
              />

              <h2
                className="
                  text-xl
                  font-semibold
                  text-white
                "
              >
                AI Recommended Action
              </h2>
            </div>

            <p
              className="
                mt-5
                text-lg
                font-bold
                text-cyan-400
              "
            >
              {lead.nextAction ||
                "Continue customer engagement"}
            </p>

            <p
              className="
                mt-3
                leading-7
                text-slate-300
              "
            >
              Use the AI recommendation as guidance.
              The authorized user remains responsible
              for deciding the appropriate customer action.
            </p>
          </div>

          {/* CUSTOMER INTENT */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >
            <div className="flex items-center gap-3">
              <Target
                size={22}
                className="text-emerald-400"
              />

              <h2
                className="
                  text-xl
                  font-semibold
                  text-white
                "
              >
                Customer Intent
              </h2>
            </div>

            <div
              className="
                mt-5
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              {/* TRANSACTION INTENT */}

              <div>
                <p className="text-sm text-slate-400">
                  Transaction Intent
                </p>

                <p className="mt-1 font-semibold text-white">
                  {formatIntent(
                    transactionIntent
                  )}
                </p>
              </div>

              {/* BUDGET */}

              <div>
                <p className="text-sm text-slate-400">
                  Budget
                </p>

                <p className="mt-1 font-semibold text-white">
                  {lead.budget
                    ? `KES ${Number(
                        lead.budget
                      ).toLocaleString()}`
                    : "Not detected"}
                </p>
              </div>

              {/* LOCATION */}

              <div>
                <p className="text-sm text-slate-400">
                  Location
                </p>

                <p className="mt-1 font-semibold text-white">
                  {lead.location || "Unknown"}
                </p>
              </div>

              {/* BEDROOMS */}

              <div>
                <p className="text-sm text-slate-400">
                  Bedrooms
                </p>

                <p className="mt-1 font-semibold text-white">
                  {lead.bedrooms || "-"}
                </p>
              </div>

              {/* MOVE DATE */}

              <div>
                <p className="text-sm text-slate-400">
                  Move Date
                </p>

                <p className="mt-1 font-semibold text-white">
                  {lead.moveDate || "Flexible"}
                </p>
              </div>

              {/* PROPERTY TYPE */}

              <div>
                <p className="text-sm text-slate-400">
                  Property Type
                </p>

                <p className="mt-1 font-semibold capitalize text-white">
                  {lead.propertyType || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            AI CHECK-UP MESSAGE
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-cyan-500/20
            bg-slate-900
            p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <div className="flex items-center gap-3">
                <MessageCircle
                  size={22}
                  className="text-cyan-400"
                />

                <h2
                  className="
                    text-xl
                    font-semibold
                    text-white
                  "
                >
                  AI Check-up Message
                </h2>
              </div>

              <p className="mt-2 text-slate-400">
                Review the AI-assisted message before
                sending it to the customer.
              </p>
            </div>

            {messageSent && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-emerald-500/20
                  px-3
                  py-1
                  text-sm
                  font-semibold
                  text-emerald-400
                "
              >
                <CheckCircle2 size={16} />

                Sent
              </span>
            )}
          </div>

          <textarea
            rows={5}
            value={checkUpMessage}
            onChange={(e) =>
              setCheckUpMessage(
                e.target.value
              )
            }
            placeholder="
              Generate or enter a customer check-up message...
            "
            className="
              mt-6
              w-full
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              p-4
              text-white
              outline-none
              focus:border-cyan-500
            "
          />

          <div
            className="
              mt-4
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            {/* GENERATE */}

            <button
              type="button"
              onClick={generateCheckUpMessage}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-cyan-500/40
                px-5
                py-3
                font-semibold
                text-cyan-400
                transition
                hover:bg-cyan-500/10
              "
            >
              <Brain size={18} />

              Generate Check-up
            </button>

            {/* SEND */}

            <button
              type="button"
              onClick={handleSendCheckUp}
              disabled={
                sendingMessage ||
                !checkUpMessage.trim() ||
                messageSent
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-cyan-500
                px-5
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Send size={18} />

              {sendingMessage
                ? "Sending..."
                : messageSent
                ? "Message Sent"
                : "Send Check-up"}
            </button>
          </div>
        </section>

        {/* ==================================================
            NEXT FOLLOW-UP DATE
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >
          <h2
            className="
              mb-4
              text-xl
              font-semibold
              text-white
            "
          >
            Next Follow-up Date
          </h2>

          <input
            type="date"
            value={nextFollowUpDate}
            onChange={(e) =>
              setNextFollowUpDate(
                e.target.value
              )
            }
            className="
              w-full
              rounded-lg
              border
              border-slate-700
              bg-slate-950
              p-3
              text-white
              outline-none
              focus:border-cyan-500
            "
          />
        </section>

        {/* ==================================================
            REMINDER
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >
          <h2
            className="
              mb-4
              text-xl
              font-semibold
              text-white
            "
          >
            Reminder
          </h2>

          <input
            type="text"
            placeholder="Example: Call after salary week"
            value={reminder}
            onChange={(e) =>
              setReminder(
                e.target.value
              )
            }
            className="
              w-full
              rounded-lg
              border
              border-slate-700
              bg-slate-950
              p-3
              text-white
              outline-none
              focus:border-cyan-500
            "
          />
        </section>

        {/* ==================================================
            FOLLOW-UP STATUS
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >
          <h2
            className="
              mb-4
              text-xl
              font-semibold
              text-white
            "
          >
            Status
          </h2>

          <select
            value={followUpStatus}
            onChange={(e) =>
              setFollowUpStatus(
                e.target.value
              )
            }
            className="
              w-full
              rounded-lg
              border
              border-slate-700
              bg-slate-950
              p-3
              text-white
              outline-none
              focus:border-cyan-500
            "
          >
            <option value="Pending">
              Pending
            </option>

            <option value="Scheduled">
              Scheduled
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>
        </section>

        {/* ==================================================
            NOTES
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >
          <h2
            className="
              mb-4
              text-xl
              font-semibold
              text-white
            "
          >
            Notes
          </h2>

          <textarea
            rows={6}
            value={notes}
            onChange={(e) =>
              setNotes(
                e.target.value
              )
            }
            placeholder="
              Record what happened during the customer
              interaction and what should be remembered...
            "
            className="
              w-full
              rounded-lg
              border
              border-slate-700
              bg-slate-950
              p-4
              text-white
              outline-none
              focus:border-cyan-500
            "
          />
        </section>

        {/* ==================================================
            OUTCOME
        ================================================== */}

        <section
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >
          <h2
            className="
              mb-4
              text-xl
              font-semibold
              text-white
            "
          >
            Outcome
          </h2>

          <textarea
            rows={4}
            value={outcome}
            onChange={(e) =>
              setOutcome(
                e.target.value
              )
            }
            placeholder="
              Record the outcome of the interaction
              and the customer's next step...
            "
            className="
              w-full
              rounded-lg
              border
              border-slate-700
              bg-slate-950
              p-4
              text-white
              outline-none
              focus:border-cyan-500
            "
          />
        </section>

        {/* ==================================================
            SAVE FOLLOW-UP
        ================================================== */}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="
            inline-flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-cyan-500
            py-4
            text-lg
            font-bold
            text-slate-950
            transition
            hover:bg-cyan-400
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <Save size={20} />

          {saving
            ? "Saving..."
            : "Save Follow-up"}
        </button>
      </div>
    </main>
  );
};

export default FollowUpPage;