/**
 * 
 * Displays leads recently assigned to the logged-in agent.
 *
 * Each card shows:
 * • Customer Name
 * • Qualification Score
 * • Property Interest
 * • Budget
 * • Assigned Time
 * • Current Status
 *
 * Future Backend
 * --------------
 * GET /api/agent/new-assigned-leads
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  User,
  Clock3,
  MapPin,
  BadgeDollarSign,
} from "lucide-react";

const NewAssignedLeads = () => {

  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);

  //----------------------------------------------------------

  useEffect(() => {

    /**
     * Temporary mock data.
     * Replace with backend request.
     */

    setLeads([

      {
        _id: "lead001",
        customer: "John Mwangi",
        property: "3 Bedroom Apartment",
        budget: "KES 9M",
        location: "Westlands",
        score: 96,
        assigned: "15 mins ago",
        status: "Hot Lead",
      },

      {
        _id: "lead002",
        customer: "Grace Wanjiku",
        property: "Maisonette",
        budget: "KES 18M",
        location: "Karen",
        score: 88,
        assigned: "42 mins ago",
        status: "Qualified",
      },

      {
        _id: "lead003",
        customer: "Brian Otieno",
        property: "Studio Apartment",
        budget: "KES 4.5M",
        location: "Kilimani",
        score: 82,
        assigned: "1 hour ago",
        status: "Qualified",
      },

    ]);

  }, []);

  //----------------------------------------------------------

  const scoreColor = (score) => {

    if (score >= 90)
      return "text-emerald-400";

    if (score >= 75)
      return "text-cyan-400";

    return "text-orange-400";

  };

  //----------------------------------------------------------

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

      {/* Header */}

      <div className="border-b border-slate-800 p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold text-white">
              New Assigned Leads
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Customers recently assigned to you.
            </p>

          </div>

          <span
            className="
              rounded-full
              border
              border-cyan-500/30
              bg-cyan-500/10
              px-4
              py-2
              text-sm
              font-semibold
              text-cyan-300
            "
          >
            {leads.length} New
          </span>

        </div>

      </div>

      {/* Cards */}

      <div className="space-y-5 p-6">

        {leads.map((lead) => (

          <div
            key={lead._id}
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-6
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <User
                    size={18}
                    className="text-cyan-400"
                  />

                  <h3 className="text-xl font-semibold text-white">
                    {lead.customer}
                  </h3>

                </div>

                <p className="mt-3 text-slate-300">
                  {lead.property}
                </p>

              </div>

              <div className="text-right">

                <p
                  className={`text-3xl font-bold ${scoreColor(
                    lead.score
                  )}`}
                >
                  {lead.score}%
                </p>

                <p className="text-xs text-slate-400">
                  AI Score
                </p>

              </div>

            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <div className="flex items-center gap-2">

                <BadgeDollarSign
                  size={18}
                  className="text-emerald-400"
                />

                <span className="text-sm text-slate-300">
                  {lead.budget}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <MapPin
                  size={18}
                  className="text-orange-400"
                />

                <span className="text-sm text-slate-300">
                  {lead.location}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <Clock3
                  size={18}
                  className="text-cyan-400"
                />

                <span className="text-sm text-slate-300">
                  {lead.assigned}
                </span>

              </div>

            </div>

            <div className="mt-6 flex items-center justify-between">

              <span
                className="
                  rounded-full
                  bg-cyan-500/10
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-cyan-300
                "
              >
                {lead.status}
              </span>

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    navigate(`/lead/${lead._id}`)
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-700
                    px-4
                    py-2
                    text-sm
                    text-white
                    hover:bg-slate-800
                  "
                >
                  View Lead
                </button>

                <button
                  onClick={() =>
                    navigate(`/contact/${lead._id}`)
                  }
                  className="
                    rounded-xl
                    bg-cyan-500
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-slate-950
                    hover:bg-cyan-400
                  "
                >
                  Contact
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

};

export default NewAssignedLeads;