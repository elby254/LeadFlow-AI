/**
 * ==========================================================
 * Purpose
 * ----------------------------------------------------------
 * Provides a dashboard card for accessing the centralized
 * LeadFlow AI Property Settings page.
 *
 * Route
 * ----------------------------------------------------------
 * /admin/properties/settings
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This card MUST navigate through React Router.
 *
 * Do NOT manually redirect to /login.
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";


/* ==========================================================
   PROPERTY SETTINGS CARD
========================================================== */

const PropertySettingsCard = () => {

  const navigate = useNavigate();


  /* ========================================================
     OPEN PROPERTY SETTINGS
  ======================================================== */

  const handleOpenSettings = () => {

    navigate("/admin/properties/settings");

  };


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <button
      type="button"
      onClick={handleOpenSettings}
      className="
        w-full
        group
        rounded-xl
        border
        bg-background
        p-6
        text-left
        transition
        hover:bg-muted/50
        hover:shadow-sm
        focus:outline-none
        focus:ring-2
        focus:ring-ring
        focus:ring-offset-2
      "
    >

      {/* ==================================================
          CARD HEADER
      ================================================== */}

      <div className="flex items-start justify-between gap-4">

        <div>

          <h3 className="text-base font-semibold">
            Property Settings
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure property workflow, agent assignment,
            enquiries, AI matching and notifications.
          </p>

        </div>


        {/* ==================================================
            SETTINGS ICON
        ================================================== */}

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-muted
            text-muted-foreground
          "
          aria-hidden="true"
        >

          {/* Simple settings icon */}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="
                M12 15.5
                a3.5 3.5 0 1 0 0-7
                3.5 3.5 0 0 0 0 7Z
              "
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="
                M19.4 15
                a1.7 1.7 0 0 0 .34 1.88
                l.06.06
                -1.7 1.7
                -.06-.06
                a1.7 1.7 0 0 0-1.88-.34
                1.7 1.7 0 0 0-1.03 1.55
                V20
                h-2.4
                v-.09
                a1.7 1.7 0 0 0-1.03-1.55
                1.7 1.7 0 0 0-1.88.34
                l-.06.06
                -1.7-1.7
                .06-.06
                A1.7 1.7 0 0 0 8.4 15
                1.7 1.7 0 0 0 6.85 14H6.75
                v-2.4h.1
                A1.7 1.7 0 0 0 8.4 10
                1.7 1.7 0 0 0 8.06 8.12
                L8 8.06
                l1.7-1.7
                .06.06
                A1.7 1.7 0 0 0 11.64 6
                1.7 1.7 0 0 0 12.67 4.45V4.4
                h2.4v.05
                A1.7 1.7 0 0 0 16.1 6
                1.7 1.7 0 0 0 17.98 6.34
                l.06-.06
                1.7 1.7
                -.06.06
                A1.7 1.7 0 0 0 19.34 10
                1.7 1.7 0 0 0 20.9 11.55H21v2.4h-.1
                A1.7 1.7 0 0 0 19.4 15Z
              "
            />

          </svg>

        </div>

      </div>


      {/* ==================================================
          ACTION
      ================================================== */}

      <div className="mt-5 flex items-center justify-between">

        <span className="text-sm font-medium">
          Manage settings
        </span>

        <span
          className="
            text-sm
            text-muted-foreground
            transition-transform
            group-hover:translate-x-1
          "
          aria-hidden="true"
        >
          →
        </span>

      </div>

    </button>

  );

};


export default PropertySettingsCard;