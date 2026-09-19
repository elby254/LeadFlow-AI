/**
 * ==========================================================
 * Standard page header used throughout the CRM.
 *
 * Used In
 * -------
 * • Dashboard
 * • Leads
 * • Properties
 * • Conversations
 * • Follow-ups
 * • Reports
 * • Settings
 *
 * Features
 * --------
 * ✓ Consistent page titles
 * ✓ Subtitle / description
 * ✓ Optional action buttons
 * ✓ Optional breadcrumbs
 * ✓ Optional refresh button
 *
 * ==========================================================
 */

import { RefreshCw } from "lucide-react";

const PageHeader = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  onRefresh,
  refreshing = false,
}) => {

  return (

    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-8
      "
    >

      {/* =========================================
          BREADCRUMBS
      ========================================= */}

      {breadcrumbs && (

        <div
          className="
            mb-4
            text-sm
            text-slate-400
          "
        >

          {breadcrumbs}

        </div>

      )}

      {/* ========================================= */}

      <div
        className="
          flex
          flex-col
          gap-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        {/* =====================================
            TITLE
        ===================================== */}

        <div>

          <h1
            className="
              text-4xl
              font-bold
              tracking-tight
              text-white
            "
          >

            {title}

          </h1>

          {subtitle && (

            <p
              className="
                mt-3
                max-w-3xl
                leading-7
                text-slate-400
              "
            >

              {subtitle}

            </p>

          )}

        </div>

        {/* =====================================
            ACTIONS
        ===================================== */}

        <div className="flex items-center gap-3">

          {onRefresh && (

            <button

              onClick={onRefresh}

              disabled={refreshing}

              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                px-5
                py-3
                font-medium
                text-white
                transition
                hover:border-cyan-500
                disabled:opacity-60
              "

            >

              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh

            </button>

          )}

          {actions}

        </div>

      </div>

    </section>

  );

};

export default PageHeader;

