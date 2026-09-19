// Immediately show new leads captured by AI("What just arrived?")
// Immediately displays newly captured leads entering LeadFlow AI from WhatsApp, SMS, or website inquiries.
// This component now uses the shared useNewLeads hook instead of local mock data.

import { useNavigate } from "react-router-dom";
import useNewLeads from "../../hooks/useNewLeads";

const NewLeadAlerts = () => {
  // --------------------------------------------------
  // LOAD NEW LEADS FROM CUSTOM HOOK
  // --------------------------------------------------

  const { newLeads, loading } = useNewLeads();
  const navigate = useNavigate();

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  // Loading State
  if (loading) {
    return (
      <section
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-6
          shadow-xl
        "
      >
        <p className="text-sm text-slate-400">
          Loading new lead alerts...
        </p>
      </section>
    );
  }

  return (
    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >
      {/* HEADER */}

      <div
        className="
          border-b
          border-slate-800
          p-6
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              New Lead Alerts
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Recently captured leads awaiting action.
            </p>
          </div>

          <span
            className="
              rounded-full
              border
              border-emerald-500/30
              bg-emerald-500/15
              px-3
              py-1
              text-sm
              font-medium
              text-emerald-400
            "
          >
            {newLeads?.length || 0} New Leads
          </span>
        </div>
      </div>

      {/* LEADS LIST */}

      <div className="divide-y divide-slate-800">
        {!newLeads || newLeads.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            No new leads available.
          </div>
        ) : (
          newLeads.map((lead) => (
            <div
              key={lead._id}
              onClick={() => navigate(`/lead/${lead._id}`)}
              className="
                flex
                cursor-pointer
                flex-col
                gap-4
                p-6
                transition
                hover:bg-slate-800/50
                md:flex-row
                md:items-center
                md:justify-between
              "
            >
              {/* Lead Details */}

              <div>
                <h3
                  className="
                    font-semibold
                    text-white
                  "
                >
                  {lead.name}
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-400
                  "
                >
                  Location: {lead.location}
                </p>

                <p
                  className="
                    text-sm
                    text-slate-400
                  "
                >
                  Budget: {lead.budget}
                </p>
              </div>

              {/* Right Side */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <span
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  {lead.receivedAt ?? lead.time}
                </span>

                <button
                  onClick={(e) => {
                   e.stopPropagation();
                   navigate(`/lead/${lead._id}`);
                 }}
               className="
                rounded-xl
                bg-cyan-500
                px-4
                py-2
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
               "
              >
                View Lead
            </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default NewLeadAlerts;