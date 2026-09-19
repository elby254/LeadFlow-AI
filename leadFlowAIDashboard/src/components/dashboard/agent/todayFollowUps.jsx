/**
 * ==========================================================
 * Displays all follow-ups scheduled for today.
 *
 * Future Backend
 * --------------
 * GET /api/agent/todays-followups
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarClock,
  Clock3,
  PhoneCall,
  MessageCircle,
  User,
} from "lucide-react";

const TodaysFollowUps = () => {

  const navigate = useNavigate();

  const [followUps, setFollowUps] = useState([]);

  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setFollowUps([

      {
        id: "lead001",

        customer: "John Mwangi",

        time: "09:30 AM",

        action: "Confirm Property Viewing",

        priority: "High",

      },

      {
        id: "lead002",

        customer: "Grace Wanjiku",

        time: "11:00 AM",

        action: "Discuss Financing Options",

        priority: "Medium",

      },

      {
        id: "lead003",

        customer: "Brian Otieno",

        time: "02:00 PM",

        action: "Follow-up after AI Qualification",

        priority: "High",

      },

      {
        id: "lead004",

        customer: "Sarah Njeri",

        time: "04:30 PM",

        action: "Send Updated Listings",

        priority: "Low",

      },

    ]);

  }, []);

  //----------------------------------------------------------

  const priorityColor = (priority) => {

    switch (priority) {

      case "High":
        return "bg-red-500/20 text-red-400";

      case "Medium":
        return "bg-yellow-500/20 text-yellow-400";

      default:
        return "bg-emerald-500/20 text-emerald-400";

    }

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
              Today's Follow-ups
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Customer activities scheduled for today.
            </p>

          </div>

          <CalendarClock
            size={28}
            className="text-cyan-400"
          />

        </div>

      </div>

      {/* Follow-up List */}

      <div className="divide-y divide-slate-800">

        {followUps.length === 0 ? (

          <div className="p-8 text-center">

            <p className="text-slate-400">
              No follow-ups scheduled today.
            </p>

          </div>

        ) : (

          followUps.map((item) => (

            <div
              key={item.id}
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
                      {item.customer}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      {item.action}
                    </p>

                    <div className="mt-3 flex items-center gap-2">

                      <Clock3
                        size={15}
                        className="text-cyan-400"
                      />

                      <span className="text-sm text-slate-300">
                        {item.time}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="flex flex-col items-end gap-3">

                  <span
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      ${priorityColor(item.priority)}
                    `}
                  >
                    {item.priority}
                  </span>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        navigate(`/conversation/${item.id}`)
                      }
                      className="
                        rounded-xl
                        border
                        border-slate-700
                        px-3
                        py-2
                        text-white
                        hover:bg-slate-800
                      "
                    >
                      <MessageCircle size={16} />
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/contact/${item.id}`)
                      }
                      className="
                        rounded-xl
                        bg-cyan-500
                        px-3
                        py-2
                        text-slate-950
                        hover:bg-cyan-400
                      "
                    >
                      <PhoneCall size={16} />
                    </button>

                  </div>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </section>

  );

};

export default TodaysFollowUps;