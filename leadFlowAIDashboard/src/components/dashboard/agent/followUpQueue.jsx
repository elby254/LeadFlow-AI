// Displays leads that require agent follow-up.
//
// Uses the shared useLeads hook to retrieve follow-up data

import { useNavigate } from "react-router-dom";
import useLeads from "../../../hooks/useLeads";

const FollowUpQueue = () => {
  // Retrieve follow-up data from shared hook
  const { followUpLeads, loading } = useLeads();
  const navigate = useNavigate();
  
  // Loading state
  if (loading) {
    return (
      <section
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-6
          shadow-lg
        "
      >
        <p className="text-sm text-slate-400">
          Loading follow-up queue...
        </p>
      </section>
    );
  }

  return (
    <section
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-lg
      "
    >
      {/* Header */}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          📞 Follow-Up Queue
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Leads requiring agent action to keep deals moving.
        </p>
      </div>

      {/* Lead List */}

      <div className="space-y-4">
        {followUpLeads.map((lead) => (
          <div
            key={lead._id}
             onClick={() => navigate(`/lead/${lead._id}`)}
             className="
              cursor-pointer
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              p-4
              transition-all
              duration-300
              hover:border-blue-500/40
              hover:bg-slate-800/90
              "
           >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-white">
                  {lead.name}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Last Contact: {lead.lastContact}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Next Action: {lead.nextAction}
                </p>
              </div>

              <button
                onClick={(e) => {
                e.stopPropagation();
                 navigate(`/followup/${lead._id}`);
               }}
              className="
               rounded-lg
               bg-blue-500
               px-4
               py-2
               text-sm
               font-semibold
               text-white
               transition
               hover:bg-blue-400
              "
            >
               Follow Up
            </button>
            </div>
          </div>
        ))}

        {followUpLeads.length === 0 && (
          <div
            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              p-6
              text-center
            "
          >
            <p className="text-sm text-slate-400">
              No follow-up tasks at the moment.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FollowUpQueue;