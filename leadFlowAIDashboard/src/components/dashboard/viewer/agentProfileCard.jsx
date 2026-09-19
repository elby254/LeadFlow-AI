/**
 * ==========================================================
 *
 * Customer-facing profile card showing the assigned
 * real estate agent.
 *
 * Viewer Permissions
 * ----------------------------------------------------------
 * ✓ View assigned agent
 * ✓ Call agent
 * ✓ WhatsApp agent
 * ✓ Email agent
 * ✓ View public profile
 *
 * Viewer Cannot
 * ----------------------------------------------------------
 * ✗ View CRM metrics
 * ✗ View internal notes
 * ✗ View lead scores
 * ✗ View conversion statistics
 *
 * Backend
 * ----------------------------------------------------------
 * GET /api/viewer/assigned-agent
 *
 * ==========================================================
 */

import {
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";

const AgentProfileCard = ({

  agent,

  onCall,

  onWhatsApp,

  onEmail,

  onViewProfile,

}) => {

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (!agent) {

    return (

      <section
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

          <div
            className="
              mx-auto
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-slate-800
            "
          >

            <Circle
              className="
                h-10
                w-10
                text-slate-600
              "
            />

          </div>

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >

            No Assigned Agent

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            An agent will be assigned after your
            inquiry has been reviewed.

          </p>

        </div>

      </section>

    );

  }

  /* ========================================================
     HELPERS
  ======================================================== */

  const availabilityColor = {

    online: "bg-emerald-500",

    busy: "bg-amber-500",

    offline: "bg-slate-500",

  };

  const availabilityLabel = {

    online: "Online",

    busy: "Busy",

    offline: "Offline",

  };

  const status =

    agent.availability || "offline";

  /* ========================================================
     COMPONENT
  ======================================================== */

  return (

    <section
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

          <img
            src={
              agent.avatar ||

              "/images/default-agent.png"
            }
            alt={agent.fullName}
            className="
              h-28
              w-28
              rounded-full
              border-4
              border-cyan-500
              object-cover
              shadow-lg
            "
          />

          {/* Agent Info */}

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

                {agent.fullName}

              </h2>

              {agent.verified && (

                <span
                  className="
                    flex
                    items-center
                    gap-1
                    rounded-full
                    bg-emerald-500/15
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-emerald-300
                  "
                >

                  <CheckCircle2 className="h-4 w-4" />

                  Verified Agent

                </span>

              )}

            </div>

            <p
              className="
                mt-2
                text-lg
                text-cyan-300
              "
            >

              {agent.title || "Property Consultant"}

            </p>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >

              {agent.agencyName}

            </p>

            {/* Availability */}

            <div
              className="
                mt-5
                flex
                items-center
                gap-3
              "
            >

              <span
                className={`
                  h-3
                  w-3
                  rounded-full
                  ${availabilityColor[status]}
                `}
              />

              <span
                className="
                  text-sm
                  font-medium
                  text-slate-300
                "
              >

                {availabilityLabel[status]}

              </span>

            </div>

          </div>

        </div>

      </div>

      {/*======================================================
        CONTACT DETAILS
      ======================================================*/}

      <div
        className="
          grid
          gap-6
          p-8
          md:grid-cols-3
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

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <Phone
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

            <span
              className="
                text-sm
                text-slate-400
              "
            >

              Phone

            </span>

          </div>

          <p
            className="
              mt-3
              font-semibold
              text-white
            "
          >

            {agent.phone || "Not Available"}

          </p>

        </div>

        {/* WhatsApp */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-5
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <MessageCircle
              className="
                h-5
                w-5
                text-emerald-400
              "
            />

            <span
              className="
                text-sm
                text-slate-400
              "
            >

              WhatsApp

            </span>

          </div>

          <p
            className="
              mt-3
              font-semibold
              text-white
            "
          >

            {agent.whatsApp || agent.phone}

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

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <Mail
              className="
                h-5
                w-5
                text-amber-400
              "
            />

            <span
              className="
                text-sm
                text-slate-400
              "
            >

              Email

            </span>

          </div>

          <p
            className="
              mt-3
              break-all
              font-semibold
              text-white
            "
          >

            {agent.email}

          </p>

        </div>

      </div>

      {/*======================================================
        PROFESSIONAL DETAILS
      ======================================================*/}

      <div
        className="
          grid
          gap-6
          border-t
          border-slate-800
          p-8
          lg:grid-cols-2
        "
      >

        {/* Experience */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-6
          "
        >

          <h3
            className="
              text-lg
              font-semibold
              text-white
            "
          >

            Experience

          </h3>

          <p
            className="
              mt-4
              text-3xl
              font-bold
              text-cyan-300
            "
          >

            {agent.experience || 0} Years

          </p>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Helping clients buy, rent and invest
            in property across Kenya.

          </p>

        </div>

        {/* Customer Rating */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-6
          "
        >

          <h3
            className="
              text-lg
              font-semibold
              text-white
            "
          >

            Customer Rating

          </h3>

          <div
            className="
              mt-4
              flex
              items-center
              gap-4
            "
          >

            <span
              className="
                text-4xl
                font-bold
                text-amber-400
              "
            >

              {agent.rating || "5.0"}

            </span>

            <div>

              <p
                className="
                  text-white
                  font-semibold
                "
              >

                ⭐⭐⭐⭐⭐

              </p>

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >

                {agent.reviewCount || 0} verified reviews

              </p>

            </div>

          </div>

        </div>

      </div>

      {/*======================================================
        SPECIALIZATIONS
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

          Property Specialties

        </h3>

        <div
          className="
            mt-5
            flex
            flex-wrap
            gap-3
          "
        >

          {(agent.specialties || []).map(

            (specialty) => (

              <span
                key={specialty}
                className="
                  rounded-full
                  bg-cyan-500/10
                  border
                  border-cyan-500/20
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-cyan-300
                "
              >

                {specialty}

              </span>

            )

          )}

        </div>

      </div>

      {/*======================================================
        AREAS SERVED
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

          Areas Served

        </h3>

        <div
          className="
            mt-5
            flex
            flex-wrap
            gap-3
          "
        >

          {(agent.serviceAreas || []).map(

            (area) => (

              <span
                key={area}
                className="
                  rounded-full
                  border
                  border-slate-700
                  bg-slate-800
                  px-4
                  py-2
                  text-sm
                  text-slate-300
                "
              >

                📍 {area}

              </span>

            )

          )}

        </div>

      </div>

      {/*======================================================
        LANGUAGES
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

          Languages Spoken

        </h3>

        <div
          className="
            mt-5
            flex
            flex-wrap
            gap-3
          "
        >

          {(agent.languages || []).map(

            (language) => (

              <span
                key={language}
                className="
                  rounded-full
                  bg-emerald-500/10
                  border
                  border-emerald-500/20
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-emerald-300
                "
              >

                {language}

              </span>

            )

          )}

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

        <div
          className="
            flex
            flex-wrap
            gap-4
          "
        >

          <button
            onClick={() => onCall && onCall(agent)}
            className="
              rounded-xl
              bg-cyan-500
              px-6
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >

            📞 Call Agent

          </button>

          <button
            onClick={() => onWhatsApp && onWhatsApp(agent)}
            className="
              rounded-xl
              bg-emerald-500
              px-6
              py-3
              font-semibold
              text-white
              transition
              hover:bg-emerald-400
            "
          >

            💬 WhatsApp

          </button>

          <button
            onClick={() => onEmail && onEmail(agent)}
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              px-6
              py-3
              font-semibold
              text-white
              transition
              hover:bg-slate-700
            "
          >

            ✉ Email

          </button>

          <button
            onClick={() => onViewProfile && onViewProfile(agent)}
            className="
              rounded-xl
              border
              border-cyan-500/30
              bg-cyan-500/10
              px-6
              py-3
              font-semibold
              text-cyan-300
              transition
              hover:bg-cyan-500
              hover:text-slate-950
            "
          >

            View Full Profile

          </button>

        </div>

      </div>

      {/*======================================================
        CUSTOMER SUPPORT NOTE
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          bg-slate-950/40
          p-8
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/5
            p-6
          "
        >

          <h3
            className="
              text-lg
              font-semibold
              text-cyan-300
            "
          >

            Need Help?

          </h3>

          <p
            className="
              mt-3
              max-w-3xl
              text-sm
              leading-7
              text-slate-400
            "
          >

            Your assigned property consultant is here to help you
            find the right property, answer your questions,
            schedule viewings and guide you throughout your
            property journey.

            If your agent is temporarily unavailable,
            your conversation will remain safely stored and
            they will respond as soon as possible.

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
          p-8
          text-sm
          text-slate-500
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <p>

          Powered securely by{" "}
          <span
            className="
              font-semibold
              text-cyan-400
            "
          >

            LeadFlow AI

          </span>

          {" "}• Connecting you with verified real estate professionals.

        </p>

        <p>

          Last profile update{" "}

          {agent.updatedAt
            ? new Date(agent.updatedAt).toLocaleDateString()
            : "Recently"}

        </p>

      </div>

    </section>

  );

};

export default AgentProfileCard;