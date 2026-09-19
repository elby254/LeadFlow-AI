/**
 * ==========================================================
 *
 * Handles real-time typing indicators for LeadFlow AI.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Detect local typing
 * ✓ Receive remote typing events
 * ✓ Auto-stop typing after inactivity
 * ✓ Track multiple users typing
 * ✓ Socket.io synchronization
 *
 * Used By
 * ----------------------------------------------------------
 * • ConversationCenter
 * • MessageComposer
 * • Admin Conversation Monitor
 * • Agent Conversation Center
 * • Viewer Conversation Center
 *
 * Socket Events
 * ----------------------------------------------------------
 * typing_start
 * typing_stop
 * connect
 * disconnect
 *
 * ==========================================================
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import useAuth from "./useAuth";

/* ==========================================================
   CONSTANTS
========================================================== */

const TYPING_TIMEOUT = 3000;

/* ==========================================================
   HOOK
========================================================== */

const useTypingIndicator = (
  conversationId,
  socket
) => {

  /* ========================================================
     AUTH
  ======================================================== */

  const {
    user,
    hasRole,
  } = useAuth();

  /* ========================================================
     CONNECTION STATE
  ======================================================== */

  const [
    isConnected,
    setIsConnected,
  ] = useState(false);

  /* ========================================================
     LOCAL USER
  ======================================================== */

  const [
    isTyping,
    setIsTyping,
  ] = useState(false);

  /* ========================================================
     REMOTE USERS
  ======================================================== */

  const [
    typingUsers,
    setTypingUsers,
  ] = useState([]);

  const [
    activeTyper,
    setActiveTyper,
  ] = useState(null);

  /* ========================================================
     INTERNAL REFS
  ======================================================== */

  const typingTimer = useRef(null);

  const isBroadcasting = useRef(false);

  const typingStartedAt = useRef(null);

  /* ========================================================
     RESET INACTIVITY TIMER
  ======================================================== */

  const resetTypingTimer = useCallback(() => {

    if (typingTimer.current) {

      clearTimeout(typingTimer.current);

    }

  }, []);

  /* ========================================================
     SOCKET CONNECTION LISTENERS
  ======================================================== */

  useEffect(() => {

    if (!socket) return;

    const handleConnect = () => {

      setIsConnected(true);

    };

    const handleDisconnect = () => {

      setIsConnected(false);

      setIsTyping(false);

      isBroadcasting.current = false;

    };

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    setIsConnected(socket.connected);

    return () => {

      socket.off("connect", handleConnect);

      socket.off("disconnect", handleDisconnect);

    };

  }, [socket]);

  /* ========================================================
     STOP TYPING
  ======================================================== */

  const stopTyping = useCallback(() => {

    if (!conversationId) return;

    if (!socket?.connected) return;

    resetTypingTimer();

    if (isBroadcasting.current) {

      socket.emit("typing_stop", {

        conversationId,

        userId: user?._id || user?.id,

      });

    }

    isBroadcasting.current = false;

    typingStartedAt.current = null;

    setIsTyping(false);

  }, [

    conversationId,

    socket,

    user,

    resetTypingTimer,

  ]);

  /* ========================================================
     START TYPING
  ======================================================== */

  const startTyping = useCallback(() => {

    if (!conversationId) return;

    if (!socket?.connected) return;

    if (!isBroadcasting.current) {

      typingStartedAt.current = Date.now();

      isBroadcasting.current = true;

      setIsTyping(true);

      socket.emit("typing_start", {

        conversationId,

        userId: user?._id || user?.id,

        userName: user?.fullName || user?.name,

        role: user?.role,

      });

    }

    resetTypingTimer();

    typingTimer.current = setTimeout(() => {

      stopTyping();

    }, TYPING_TIMEOUT);

  }, [

    conversationId,

    socket,

    user,

    stopTyping,

    resetTypingTimer,

  ]);

  /* ========================================================
     REMOTE USER STARTED TYPING
  ======================================================== */

  const handleTypingStart = useCallback(

    (payload) => {

      if (
        payload.conversationId !== conversationId
      ) {
        return;
      }

      /* Ignore own typing events */

      if (
        payload.userId === (user?._id || user?.id)
      ) {
        return;
      }

      setActiveTyper(payload);

      setTypingUsers((previous) => {

        const exists = previous.some(

          (typingUser) =>

            typingUser.userId === payload.userId

        );

        if (exists) {

          return previous;

        }

        return [

          ...previous,

          payload,

        ];

      });

    },

    [

      conversationId,

      user,

    ]

  );

  /* ========================================================
     REMOTE USER STOPPED TYPING
  ======================================================== */

  const handleTypingStop = useCallback(

    (payload) => {

      if (
        payload.conversationId !== conversationId
      ) {
        return;
      }

      setTypingUsers((previous) =>

        previous.filter(

          (typingUser) =>

            typingUser.userId !== payload.userId

        )

      );

      setActiveTyper((current) =>

        current?.userId === payload.userId

          ? null

          : current

      );

    },

    [

      conversationId,

    ]

  );

  /* ========================================================
     SOCKET TYPING LISTENERS
  ======================================================== */

  useEffect(() => {

    if (!socket) return;

    socket.on(
      "typing_start",
      handleTypingStart
    );

    socket.on(
      "typing_stop",
      handleTypingStop
    );

    return () => {

      socket.off(
        "typing_start",
        handleTypingStart
      );

      socket.off(
        "typing_stop",
        handleTypingStop
      );

    };

  }, [

    socket,

    conversationId,

    handleTypingStart,

    handleTypingStop,

  ]);

  /* ========================================================
     CLEAR REMOTE TYPING USERS
  ======================================================== */

  const clearTypingUsers = useCallback(() => {

    setTypingUsers([]);

    setActiveTyper(null);

  }, []);

  /* ========================================================
     CHECK IF A SPECIFIC USER IS TYPING
  ======================================================== */

  const isUserTyping = useCallback(

    (userId) => {

      return typingUsers.some(

        (typingUser) =>

          typingUser.userId === userId

      );

    },

    [typingUsers]

  );

  /* ========================================================
     CLEANUP
  ======================================================== */

  useEffect(() => {

    return () => {

      if (typingTimer.current) {

        clearTimeout(typingTimer.current);

      }

      isBroadcasting.current = false;

      typingStartedAt.current = null;

    };

  }, []);

  /* ========================================================
     PUBLIC API
  ======================================================== */

  return {

    /* Authentication */

    user,

    hasRole,

    /* Connection */

    isConnected,

    /* Typing State */

    isTyping,

    typingUsers,

    activeTyper,

    /* Actions */

    startTyping,

    stopTyping,

    clearTypingUsers,

    isUserTyping,

  };

};

export default useTyping;