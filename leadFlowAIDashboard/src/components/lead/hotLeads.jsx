// AI answers question:("Who should I call first?")
// Displays AI-scored hot leads that deserve immediate attention from the real estate agent.
//
// This component uses the shared useLeads hook instead of
// fetching data directly.

import { useNavigate } from "react-router-dom";
import useLeads from "../../hooks/useLeads";

const HotLeads = () => {
  const { hotLeads, loading } = useLeads();
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm text-slate-400">
          Loading hot leads...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      {/* HEADER */}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            🔥 Hot Leads
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            AI-ranked prospects requiring immediate attention.
          </p>
        </div>

        <span
          className="
            rounded-full
            border
            border-orange-500/30
            bg-orange-500/15
            px-3
            py-1
            text-sm
            font-medium
            text-orange-400
          "
        >
          {hotLeads.length} Hot Leads
        </span>
      </div>

      {/* HOT LEADS LIST */}

      <div className="space-y-3">
          {hotLeads.map((lead) => (
            <div
              key={lead._id}
              className="
                rounded-xl
                border
                border-orange-500/20
                bg-orange-500/10
                p-4
              "
            >
              <div
                onClick={() => navigate(`/lead/${lead._id}`)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{lead.name}</p>

                    <p className="mt-2 text-sm text-slate-300">Budget: KES {lead.budget}</p>

                    <p className="text-sm text-slate-400">Location: {lead.location}</p>
                  </div>

                  <div
                    className="
                      rounded-full
                      border
                      border-orange-500/30
                      bg-orange-500/20
                      px-3
                      py-1
                      text-sm
                      font-bold
                      text-orange-400
                    "
                  >
                    {lead.score}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(`/contact/${lead._id}`)}
                  className="
                    rounded-lg
                    bg-cyan-500
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-slate-950
                    hover:bg-cyan-400
                  "
                >
                  Contact Lead
                </button>

                <button
                  onClick={() => navigate(`/insights/${lead._id}`)}
                  className="
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-800
                    px-4
                    py-2
                    text-sm
                    text-white
                    hover:bg-slate-700
                  "
                >
                  AI Insights
                </button>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

export default HotLeads;