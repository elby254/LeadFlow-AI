/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Messaging workspace for estate agents.
 *
 * Features
 * ----------------------------------------------------------
 * • Assigned conversations
 * • Customer messages
 * • Conversation details
 * • Property context
 * • AI qualification context
 * • AI check-up message suggestions
 * • Follow-up workflow
 *
 * Agent Workflow
 * ----------------------------------------------------------
 * 1. Agent receives / opens assigned conversation.
 * 2. Agent reviews customer and property context.
 * 3. LeadFlow AI provides qualification context.
 * 4. AI can suggest a customer check-up message.
 * 5. Agent reviews/edits the message.
 * 6. Agent sends the message.
 * 7. Agent schedules the next follow-up.
 * 8. Follow-up appears in the Follow-up Inbox and Calendar.
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  MessageSquare,
  Send,
  User,
  Home,
  Brain,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import conversationService from "../../services/conversationService";

const AgentConversationCenter = () => {

  const navigate = useNavigate();

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
  ACTIVE CONVERSATION
  ==========================================================
  */

  const [
    activeConversation,
    setActiveConversation,
  ] = useState(null);

  /*
  ==========================================================
  MESSAGES
  ==========================================================
  */

  const [
    messages,
    setMessages,
  ] = useState([]);

  /*
  ==========================================================
  MESSAGE INPUT
  ==========================================================
  */

  const [
    message,
    setMessage,
  ] = useState("");

  /*
  ==========================================================
  CHECK-UP MESSAGE
  ==========================================================
  */

  const [
    checkUpMessage,
    setCheckUpMessage,
  ] = useState("");

  const [
    checkUpSent,
    setCheckUpSent,
  ] = useState(false);

  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    sendingCheckUp,
    setSendingCheckUp,
  ] = useState(false);

  /*
  ==========================================================
  LOAD CONVERSATIONS
  ==========================================================
  */

  const loadConversations = async () => {

    try {

      setLoading(true);

      const response =
        await conversationService.getMyConversations();

      /*
      Expected Backend

      {
        data:[]
      }
      */

      const conversationData =
        Array.isArray(response?.data)
          ? response.data
          : [];

      setConversations(
        conversationData
      );

      /*
      Automatically open the first
      conversation if available.
      */

      if (
        conversationData.length > 0
      ) {

        await openConversation(
          conversationData[0]
        );

      }

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
  LOAD SINGLE CONVERSATION
  ==========================================================
  */

  const openConversation = async (
    conversation
  ) => {

    try {

      setActiveConversation(
        conversation
      );

      /*
      Reset check-up state whenever
      the agent switches customer.
      */

      setCheckUpSent(
        Boolean(
          conversation?.checkUpMessageSent ||
          conversation?.checkupMessageSent
        )
      );

      setCheckUpMessage(
        conversation?.checkUpMessage ||
        conversation?.checkupMessage ||
        conversation?.aiCheckUpMessage ||
        ""
      );

      const response =
        await conversationService.getConversationMessages(
          conversation._id
        );

      setMessages(
        Array.isArray(response?.data)
          ? response.data
          : []
      );

    } catch (error) {

      console.error(
        "Unable to load messages",
        error
      );

    }

  };

  /*
  ==========================================================
  SEND MESSAGE
  ==========================================================
  */

  const handleSendMessage = async () => {

    if (
      !message.trim() ||
      !activeConversation
    ) {

      return;

    }

    try {

      setSending(true);

      const response =
        await conversationService.sendMessage({

          conversationId:
            activeConversation._id,

          message:
            message.trim(),

        });

      /*
      Append newly created message
      */

      if (response?.data) {

        setMessages(
          (previous) => [
            ...previous,
            response.data,
          ]
        );

      }

      setMessage("");

    } catch (error) {

      console.error(
        "Unable to send message",
        error
      );

    } finally {

      setSending(false);

    }

  };

  /*
  ==========================================================
  GENERATE CHECK-UP MESSAGE
  ==========================================================
  */

  const generateCheckUpMessage = () => {

    if (!activeConversation) {
      return;
    }

    /*
    Use a backend-generated AI message
    when one is already available.
    */

    if (
      activeConversation.checkUpMessage ||
      activeConversation.checkupMessage ||
      activeConversation.aiCheckUpMessage
    ) {

      setCheckUpMessage(
        activeConversation.checkUpMessage ||
        activeConversation.checkupMessage ||
        activeConversation.aiCheckUpMessage
      );

      return;

    }

    const customerName =
      activeConversation.customerName ||
      "there";

    const propertyTitle =
      activeConversation.propertyTitle ||
      "the property options we discussed";

    const generatedMessage =
      `Hi ${customerName}, just checking in regarding ${propertyTitle}. I wanted to see if you have any questions or if you would like us to arrange the next step.`;

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
      !activeConversation ||
      !checkUpMessage.trim()
    ) {

      return;

    }

    try {

      setSendingCheckUp(true);

      /*
      Preferred dedicated conversation
      check-up action.
      */

      const response =
        await conversationService.sendMessage({

          conversationId:
            activeConversation._id,

          message:
            checkUpMessage.trim(),

        });

      /*
      Add the check-up message to the
      visible conversation immediately.
      */

      if (response?.data) {

        setMessages(
          (previous) => [
            ...previous,
            response.data,
          ]
        );

      }

      setCheckUpSent(true);

      setCheckUpMessage("");

      console.log(
        "AI check-up message sent:",
        activeConversation._id
      );

    } catch (error) {

      console.error(
        "Unable to send check-up message",
        error
      );

    } finally {

      setSendingCheckUp(false);

    }

  };

  /*
  ==========================================================
  OPEN FOLLOW-UP MANAGER
  ==========================================================
  */

  const openFollowUpManager = () => {

    if (!activeConversation) {
      return;
    }

    const leadId =
      activeConversation.leadId ||
      activeConversation.lead?._id ||
      activeConversation.customerId;

    if (!leadId) {

      console.warn(
        "Unable to open follow-up manager: lead ID is missing."
      );

      return;

    }

    navigate(
      `/followup/${leadId}`
    );

  };

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {

    loadConversations();

  }, []);

  /*
  ==========================================================
  MESSAGE INPUT
  ==========================================================
  */

  const handleMessageChange = (
    event
  ) => {

    setMessage(
      event.target.value
    );

  };

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

    <section className="h-[calc(100vh-170px)]">

      <div
        className="
          grid
          h-full
          overflow-hidden
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          lg:grid-cols-[320px_1fr_340px]
        "
      >

        {/* ======================================================
            CONVERSATION LIST
        ====================================================== */}

        <aside className="border-r border-slate-800">

          <div className="border-b border-slate-800 p-5">

            <div className="flex items-center gap-3">

              <MessageSquare
                className="text-cyan-400"
                size={22}
              />

              <h2 className="text-xl font-semibold text-white">
                My Conversations
              </h2>

            </div>

            <p className="mt-2 text-sm text-slate-400">
              Customer conversations assigned to you.
            </p>

          </div>

          <div className="overflow-y-auto">

            {conversations.length === 0 ? (

              <p className="p-6 text-slate-400">
                No active conversations.
              </p>

            ) : (

              conversations.map(
                (conversation) => (

                  <button
                    key={conversation._id}
                    onClick={() =>
                      openConversation(
                        conversation
                      )
                    }
                    className={`
                      flex
                      w-full
                      items-start
                      gap-3
                      border-b
                      border-slate-800
                      p-4
                      text-left
                      transition
                      hover:bg-slate-800

                      ${
                        activeConversation?._id ===
                        conversation._id
                          ? "bg-slate-800"
                          : ""
                      }
                    `}
                  >

                    <User
                      className="mt-1 h-5 w-5 text-cyan-400"
                    />

                    <div className="flex-1">

                      <h3 className="font-medium text-white">
                        {conversation.customerName ||
                          "Customer"}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                        {conversation.lastMessage ||
                          "No messages yet"}
                      </p>

                      {conversation.score !==
                        undefined && (

                        <p className="mt-2 text-xs text-cyan-400">
                          AI Score:{" "}
                          {conversation.score}%
                        </p>

                      )}

                    </div>

                  </button>

                )
              )

            )}

          </div>

        </aside>

        {/* ======================================================
            CHAT WINDOW
        ====================================================== */}

        <main className="flex min-h-0 flex-col">

          {activeConversation ? (

            <>

              <div className="border-b border-slate-800 p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-xl font-semibold text-white">

                      {activeConversation.customerName ||
                        "Customer"}

                    </h2>

                    <p className="text-sm capitalize text-slate-400">

                      {activeConversation.status ||
                        "Active"}

                    </p>

                  </div>

                  <div className="rounded-lg bg-cyan-500/10 px-3 py-2">

                    <span className="text-sm font-semibold text-cyan-400">

                      AI Score{" "}

                      {activeConversation.score ??
                        activeConversation.lead?.score ??
                        0}%

                    </span>

                  </div>

                </div>

              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">

                {messages.length === 0 ? (

                  <div className="flex h-full items-center justify-center">

                    <p className="text-slate-500">
                      No messages yet.
                    </p>

                  </div>

                ) : (

                  messages.map((item) => (

                    <div
                      key={item._id}
                      className={`
                        flex
                        ${
                          item.sender === "agent"
                            ? "justify-end"
                            : "justify-start"
                        }
                      `}
                    >

                      <div
                        className={`
                          max-w-md
                          rounded-xl
                          px-4
                          py-3

                          ${
                            item.sender === "agent"
                              ? "bg-cyan-500 text-slate-950"
                              : "bg-slate-800 text-slate-200"
                          }
                        `}
                      >

                        {item.message}

                      </div>

                    </div>

                  ))

                )}

              </div>

              {/* Message Input */}

              <div className="border-t border-slate-800 p-5">

                <div className="flex gap-3">

                  <input
                    value={message}
                    onChange={
                      handleMessageChange
                    }
                    onKeyDown={(event) => {

                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {

                        event.preventDefault();

                        handleSendMessage();

                      }

                    }}
                    placeholder="Type your reply..."
                    className="
                      flex-1
                      rounded-lg
                      border
                      border-slate-700
                      bg-slate-950
                      px-4
                      py-3
                      text-white
                      outline-none
                      focus:border-cyan-500
                    "
                  />

                  <button
                    onClick={
                      handleSendMessage
                    }
                    disabled={
                      sending ||
                      !message.trim()
                    }
                    className="
                      rounded-lg
                      bg-cyan-500
                      px-5
                      text-slate-950
                      transition
                      hover:bg-cyan-400
                      disabled:opacity-50
                    "
                  >

                    <Send size={18} />

                  </button>

                </div>

              </div>

            </>

          ) : (

            <div className="flex h-full items-center justify-center">

              <p className="text-slate-400">
                Select a conversation to begin.
              </p>

            </div>

          )}

        </main>

        {/* ======================================================
            AGENT / PROPERTY / AI CONTEXT
        ====================================================== */}

        <aside className="overflow-y-auto border-l border-slate-800 p-6">

          {activeConversation ? (

            <div className="space-y-6">

              {/* Property Context */}

              <section>

                <h2 className="text-xl font-semibold text-white">
                  Property Context
                </h2>

                <div className="mt-5 flex items-center gap-3">

                  <Home
                    className="h-5 w-5 text-cyan-400"
                  />

                  <span className="font-medium text-white">

                    {activeConversation.propertyTitle ||
                      activeConversation.property?.title ||
                      "No property selected"}

                  </span>

                </div>

              </section>

              {/* Customer */}

              <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                <p className="text-sm text-slate-500">
                  Customer
                </p>

                <p className="mt-1 text-white">
                  {activeConversation.customerName ||
                    "Customer"}
                </p>

                {activeConversation.customerPhone && (

                  <p className="mt-2 text-sm text-slate-400">
                    {activeConversation.customerPhone}
                  </p>

                )}

              </section>

              {/* AI Context */}

              <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">

                <div className="flex items-center gap-2">

                  <Brain
                    size={19}
                    className="text-cyan-400"
                  />

                  <h3 className="font-semibold text-white">
                    AI Qualification
                  </h3>

                </div>

                <div className="mt-4 space-y-3">

                  <div className="flex justify-between">

                    <span className="text-sm text-slate-400">
                      Score
                    </span>

                    <span className="font-semibold text-cyan-400">
                      {activeConversation.score ??
                        activeConversation.lead?.score ??
                        0}%
                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-sm text-slate-400">
                      Status
                    </span>

                    <span className="capitalize text-white">
                      {activeConversation.lead?.status ||
                        activeConversation.status ||
                        "Pending"}
                    </span>

                  </div>

                  <div>

                    <p className="text-sm text-slate-400">
                      Recommended Action
                    </p>

                    <p className="mt-1 font-medium text-cyan-400">

                      {activeConversation.nextAction ||
                        activeConversation.lead?.nextAction ||
                        "Continue customer engagement"}

                    </p>

                  </div>

                </div>

              </section>

              {/* AI Check-up */}

              <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <Sparkles
                      size={18}
                      className="text-cyan-400"
                    />

                    <h3 className="font-semibold text-white">
                      AI Check-up
                    </h3>

                  </div>

                  {checkUpSent && (

                    <CheckCircle2
                      size={18}
                      className="text-emerald-400"
                    />

                  )}

                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  AI prepares the message; the agent
                  reviews it before sending.
                </p>

                <textarea
                  rows={5}
                  value={checkUpMessage}
                  onChange={(event) =>
                    setCheckUpMessage(
                      event.target.value
                    )
                  }
                  placeholder="Generate a check-up message..."
                  className="
                    mt-4
                    w-full
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-900
                    p-3
                    text-sm
                    text-white
                    outline-none
                    focus:border-cyan-500
                  "
                />

                <div className="mt-3 grid gap-2">

                  <button
                    onClick={
                      generateCheckUpMessage
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-lg
                      border
                      border-cyan-500/40
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      text-cyan-400
                      hover:bg-cyan-500/10
                    "
                  >

                    <Brain size={16} />

                    Generate

                  </button>

                  <button
                    onClick={
                      handleSendCheckUp
                    }
                    disabled={
                      sendingCheckUp ||
                      !checkUpMessage.trim() ||
                      checkUpSent
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-lg
                      bg-cyan-500
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      text-slate-950
                      hover:bg-cyan-400
                      disabled:opacity-50
                    "
                  >

                    <Send size={16} />

                    {sendingCheckUp
                      ? "Sending..."
                      : checkUpSent
                      ? "Check-up Sent"
                      : "Send Check-up"}

                  </button>

                </div>

              </section>

              {/* Follow-up */}

              <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">

                <div className="flex items-center gap-2">

                  <CalendarClock
                    size={19}
                    className="text-emerald-400"
                  />

                  <h3 className="font-semibold text-white">
                    Next Agent Action
                  </h3>

                </div>

                <p className="mt-3 text-sm leading-6 text-slate-400">

                  After the customer interaction,
                  schedule the next follow-up and record
                  the outcome.

                </p>

                <button
                  onClick={
                    openFollowUpManager
                  }
                  className="
                    mt-4
                    inline-flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-emerald-500
                    px-4
                    py-3
                    font-semibold
                    text-slate-950
                    transition
                    hover:bg-emerald-400
                  "
                >

                  Open Follow-up Manager

                  <ArrowRight size={17} />

                </button>

              </section>

            </div>

          ) : (

            <div className="flex h-full items-center justify-center text-center">

              <p className="text-slate-400">
                Customer, property and AI information
                will appear here.
              </p>

            </div>

          )}

        </aside>

      </div>

    </section>

  );

};

export default AgentConversationCenter;