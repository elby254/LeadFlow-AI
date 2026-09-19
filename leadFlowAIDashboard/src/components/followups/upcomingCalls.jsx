/**
 * ==========================================================
 * Displays today's scheduled customer calls.
 *
 * Future Backend
 * --------------
 * GET /api/agent/upcoming-calls
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Phone,
  Clock3,
  CalendarDays,
  User,
} from "lucide-react";

const UpcomingCalls = () => {

  const navigate = useNavigate();

  const [calls, setCalls] = useState([]);

  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setCalls([

      {
        id: "lead001",

        customer: "John Mwangi",

        time: "10:00 AM",

        phone: "+254 712 345 678",

        purpose: "Property Viewing Confirmation",

      },

      {
        id: "lead002",

        customer: "Grace Wanjiku",

        time: "11:30 AM",

        phone: "+254 733 222 444",

        purpose: "Budget Discussion",

      },

      {
        id: "lead003",

        customer: "Brian Otieno",

        time: "2:00 PM",

        phone: "+254 701 555 888",

        purpose: "Mortgage Consultation",

      },

      {
        id: "lead004",

        customer: "Sarah Njeri",

        time: "4:30 PM",

        phone: "+254 722 888 999",

        purpose: "Follow-up Call",

      },

    ]);

  }, []);

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
              Upcoming Calls
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Scheduled customer calls for today.
            </p>

          </div>

          <CalendarDays
            size={28}
            className="text-cyan-400"
          />

        </div>

      </div>

      {/* Call List */}

      <div className="divide-y divide-slate-800">

        {calls.map((call) => (

          <div
            key={call.id}
            className="p-5"
          >

            <div className="flex items-start justify-between">

              <div className="flex gap-4">

                <div
                  className="
                    rounded-xl
                    bg-cyan-500/20
                    p-3
                  "
                >
                  <User
                    size={20}
                    className="text-cyan-400"
                  />
                </div>

                <div>

                  <h3 className="text-lg font-semibold text-white">
                    {call.customer}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {call.purpose}
                  </p>

                  <div className="mt-3 flex items-center gap-2">

                    <Clock3
                      size={15}
                      className="text-orange-400"
                    />

                    <span className="text-sm text-slate-300">
                      {call.time}
                    </span>

                  </div>

                  <div className="mt-2 flex items-center gap-2">

                    <Phone
                      size={15}
                      className="text-emerald-400"
                    />

                    <span className="text-sm text-slate-300">
                      {call.phone}
                    </span>

                  </div>

                </div>

              </div>

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    navigate(`/lead/${call.id}`)
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
                    navigate(`/contact/${call.id}`)
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
                  Call Now
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

};

export default UpcomingCalls;