/**
 * ==========================================================
 * Securely signs the user out of LeadFlow AI.
 *
 * Responsibilities
 * ----------------
 * ✓ Invalidate server session
 * ✓ Clear JWT
 * ✓ Clear Refresh Token
 * ✓ Remove cached user profile
 * ✓ Remove agency information
 * ✓ Remove permissions
 * ✓ Reset AuthContext
 * ✓ Reset AgencyContext
 * ✓ Redirect user to Login
 *
 * Future
 * ------
 * • Disconnect Socket.io
 * • Stop background sync
 * • Clear IndexedDB offline cache
 * • Remove push notification subscription
 *
 * ==========================================================
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Loader2 } from "lucide-react";

import authService from "../services/auth/authService";
import sessionService from "../services/auth/sessionService";

import { useAuth } from "../hooks/useAuth";

import { useAgency } from "../context/AgencyContext";

const Logout = () => {

  /* ======================================================
     NAVIGATION
  ====================================================== */

  const navigate = useNavigate();

  /* ======================================================
     GLOBAL CONTEXT
  ====================================================== */

  const {

    logout,

  } = useAuth();

  const {

    clearAgency,

  } = useAgency();

  /* ======================================================
     LOGOUT WORKFLOW
  ====================================================== */

  useEffect(() => {

    const performLogout = async () => {

      try {

        /**
         * ----------------------------------------------
         * Notify backend (optional)
         * ----------------------------------------------
         */

        await authService.logout();

      } catch (error) {

        /**
         * Backend may already invalidate tokens.
         * Client cleanup must always continue.
         */

        console.warn(
          "Logout request failed:",
          error
        );

      }

      /**
       * ----------------------------------------------
       * Clear browser session
       * ----------------------------------------------
       */

      sessionService.clearSession();

      /**
       * ----------------------------------------------
       * Reset authentication context
       * ----------------------------------------------
       */

      logout();

      /**
       * ----------------------------------------------
       * Reset agency context
       * ----------------------------------------------
       */

      clearAgency();

      /**
       * ----------------------------------------------
       * Future cleanup
       * ----------------------------------------------
       */

      /**
       * Socket.io
       *
       * socket.disconnect();
       */

      /**
       * IndexedDB
       *
       * indexedDB.deleteDatabase("leadflowai");
       */

      /**
       * Workbox
       *
       * Clear offline cache if required.
       */

      /**
       * Push Notifications
       *
       * unregister service worker subscriptions.
       */

      /**
       * ----------------------------------------------
       * Redirect to Login
       * ----------------------------------------------
       */

      navigate("/login", {

        replace: true,

      });

    };

    performLogout();

  }, [

    navigate,

    logout,

    clearAgency,

  ]);

  /* ======================================================
     UI
  ====================================================== */

  return (

    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-950
        px-6
      "
    >

      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-10
          text-center
          shadow-2xl
        "
      >

        <div
          className="
            mx-auto
            mb-6
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-cyan-500
          "
        >

          <Loader2

            size={34}

            className="
              animate-spin
              text-slate-950
            "

          />

        </div>

        <h1
          className="
            text-2xl
            font-bold
            text-white
          "
        >

          Signing you out...

        </h1>

        <p
          className="
            mt-4
            text-sm
            leading-relaxed
            text-slate-400
          "
        >

          Closing your LeadFlow AI session securely.

        </p>

        <p
          className="
            mt-2
            text-xs
            text-slate-500
          "
        >

          Please wait while we clear your session.

        </p>

      </div>

    </main>

  );

};

export default Logout;