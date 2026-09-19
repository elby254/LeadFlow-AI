/**
 * ==========================================================
 * Shared loading component used throughout the application.
 *
 * Used In
 * -------
 * • Dashboard pages
 * • Leads
 * • Properties
 * • Conversations
 * • Follow-ups
 * • Reports
 * • Authentication
 * • API requests
 *
 * Features
 * --------
 * ✓ Full-page loading
 * ✓ Inline loading
 * ✓ Optional message
 * ✓ Consistent branding
 *
 * ==========================================================
 */

import { LoaderCircle } from "lucide-react";

const LoadingSpinner = ({
  message = "Loading...",
  fullScreen = false,
  size = 48,
}) => {

  const wrapperClass = fullScreen
    ? `
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-slate-950
    `
    : `
      flex
      items-center
      justify-center
      py-20
    `;

  return (

    <div className={wrapperClass}>

      <div className="text-center">

        {/* ========================================= */}

        <LoaderCircle
          size={size}
          className="
            mx-auto
            animate-spin
            text-cyan-400
          "
        />

        {/* ========================================= */}

        <h3
          className="
            mt-6
            text-xl
            font-semibold
            text-white
          "
        >

          {message}

        </h3>

        {/* ========================================= */}

        <p
          className="
            mt-2
            text-sm
            text-slate-400
          "
        >

          Please wait while LeadFlow AI prepares your workspace.

        </p>

      </div>

    </div>

  );

};

export default LoadingSpinner;

