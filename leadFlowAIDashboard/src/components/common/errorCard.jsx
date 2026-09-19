/**
 * ==========================================================
 * Shared error component displayed whenever a page,
 * dashboard widget or API request fails.
 *
 * Used In
 * -------
 * • Dashboards
 * • Leads
 * • Properties
 * • Reports
 * • Conversations
 * • Follow-ups
 *
 * Features
 * --------
 * ✓ Friendly error message
 * ✓ Retry button
 * ✓ Optional custom title
 * ✓ Reusable across entire CRM
 *
 * ==========================================================
 */

import { AlertCircle, RefreshCw } from "lucide-react";

const ErrorCard = ({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this information.",
  onRetry,
  retryText = "Try Again",
}) => {

  return (

    <div
      className="
        rounded-3xl
        border
        border-red-900
        bg-red-950/20
        px-8
        py-14
        text-center
      "
    >

      {/* ========================================= */}

      <div
        className="
          mx-auto
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-full
          bg-red-500/20
        "
      >

        <AlertCircle
          size={42}
          className="text-red-400"
        />

      </div>

      {/* ========================================= */}

      <h2
        className="
          mt-6
          text-2xl
          font-bold
          text-white
        "
      >

        {title}

      </h2>

      {/* ========================================= */}

      <p
        className="
          mx-auto
          mt-4
          max-w-xl
          leading-7
          text-slate-300
        "
      >

        {message}

      </p>

      {/* ========================================= */}

      {onRetry && (

        <button

          onClick={onRetry}

          className="
            mt-8
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-red-500
            px-6
            py-3
            font-semibold
            text-white
            transition
            hover:bg-red-400
          "

        >

          <RefreshCw size={18} />

          {retryText}

        </button>

      )}

    </div>

  );

};

export default ErrorCard;

