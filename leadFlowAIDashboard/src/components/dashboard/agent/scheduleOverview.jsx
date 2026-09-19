/**
 * ==========================================================
 * Daily execution schedule for a sales agent.
 *
 * Displays today's:
 *
 * • Follow-up calls
 * • Property viewings
 * • Client meetings
 * • Site visits
 * • Overdue activities
 *
 * Used By
 * ----------------------------------------------------------
 * AgentDashboard.jsx
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/agent/schedule/today
 *
 * Future Integrations
 * ----------------------------------------------------------
 * • Google Calendar
 * • Outlook Calendar
 * • SMS Reminders
 * • WhatsApp Notifications
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  PhoneCall,
  House,
  Users,
  AlertCircle,
} from "lucide-react";

const ScheduleOverview = () => {

  const navigate = useNavigate();

  //----------------------------------------------------------
  // STATE
  //----------------------------------------------------------

  const [schedule, setSchedule] = useState([]);

  //----------------------------------------------------------
  // MOCK DATA
  //----------------------------------------------------------

  useEffect(() => {

    setSchedule([

      {
        id: 1,

        time: "09:00 AM",

        type: "Follow-up Call",

        icon: PhoneCall,

        title: "Call James Mwangi",

        description: "Discuss financing options.",

        leadId: "L001",

        priority: "High",

      },

      {
        id: 2,

        time: "11:00 AM",

        type: "Property Viewing",

        icon: House,

        title: "Westlands Executive Apartment",

        description: "Site visit with prospective buyer.",

        propertyId: "P101",

        priority: "Medium",

      },

      {
        id: 3,

        time: "02:00 PM",

        type: "Client Meeting",

        icon: Users,

        title: "Meeting with Sarah Achieng",

        description: "Review shortlisted properties.",

        leadId: "L002",

        priority: "Medium",

      },

      {
        id: 4,

        time: "04:30 PM",

        type: "Follow-up Call",

        icon: PhoneCall,

        title: "Karen Maisonette Discussion",

        description: "Confirm viewing appointment.",

        leadId: "L003",

        priority: "Low",

      },

    ]);

  }, []);

  //----------------------------------------------------------
  // SUMMARY
  //----------------------------------------------------------

  const totalAppointments = schedule.length;

  const highPriority = schedule.filter(
    (task) => task.priority === "High"
  ).length;

  const mediumPriority = schedule.filter(
    (task) => task.priority === "Medium"
  ).length;

  const lowPriority = schedule.filter(
    (task) => task.priority === "Low"
  ).length;

  //----------------------------------------------------------
  // PRIORITY COLORS
  //----------------------------------------------------------

  const priorityStyles = (priority) => {

    switch (priority) {

      case "High":
        return "bg-red-500/10 border-red-500/20 text-red-400";

      case "Medium":
        return "bg-orange-500/10 border-orange-500/20 text-orange-400";

      default:
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";

    }

  };

  //----------------------------------------------------------
  // RENDER
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

      {/*======================================================
        HEADER
      ======================================================*/}

      <div className="border-b border-slate-800 p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">

              <CalendarDays className="text-cyan-400" />

              Today's Schedule

            </h2>

            <p className="mt-2 text-sm text-slate-400">

              Your appointments, property viewings and follow-ups for today.

            </p>

          </div>

          <button
            onClick={() => navigate("/agent/schedule")}
            className="
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            Open Full Schedule
          </button>

        </div>

      </div>

      {/*======================================================
        SUMMARY CARDS
      ======================================================*/}

      <div
        className="
          grid
          gap-5
          p-6
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        {/* Total */}

        <div
          className="
            rounded-2xl
            border
            border-slate-700
            bg-slate-950
            p-5
          "
        >

          <p className="text-sm text-slate-400">

            Today's Appointments

          </p>

          <h3 className="mt-3 text-4xl font-bold text-white">

            {totalAppointments}

          </h3>

        </div>

        {/* High Priority */}

        <div
          className="
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            p-5
          "
        >

          <div className="flex items-center gap-2">

            <AlertCircle
              size={18}
              className="text-red-400"
            />

            <p className="text-sm text-red-300">

              High Priority

            </p>

          </div>

          <h3 className="mt-3 text-4xl font-bold text-white">

            {highPriority}

          </h3>

        </div>

        {/* Medium */}

        <div
          className="
            rounded-2xl
            border
            border-orange-500/20
            bg-orange-500/10
            p-5
          "
        >

          <p className="text-sm text-orange-300">

            Medium Priority

          </p>

          <h3 className="mt-3 text-4xl font-bold text-white">

            {mediumPriority}

          </h3>

        </div>

        {/* Low */}

        <div
          className="
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            p-5
          "
        >

          <p className="text-sm text-cyan-300">

            Low Priority

          </p>

          <h3 className="mt-3 text-4xl font-bold text-white">

            {lowPriority}

          </h3>

        </div>

      </div>

      {/*======================================================
        TODAY'S TIMELINE
      ======================================================*/}

      <div className="px-6 pb-6">

        <h3 className="mb-5 text-lg font-semibold text-white">

          Timeline

        </h3>

        <div className="space-y-4">
          {schedule.length === 0 ? (
            <div className="bg-slate-800 p-6 text-center text-slate-400">
              No activities scheduled for today.
            </div>
          ) : (
            schedule.map((activity) => {

              const Icon = activity.icon;

              return (

                <div
                  key={activity.id}
                  className="
                    flex
                    flex-col
                    gap-5
                    rounded-2xl
                    border
                    border-slate-700
                    bg-slate-800
                    p-5
                    transition
                    hover:border-cyan-500/30
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                  "
                >

                  {/* Left */}

                  <div className="flex items-start gap-5">

                    <div
                      className="
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-cyan-500/10
                      "
                    >

                      <Icon
                        size={24}
                        className="text-cyan-400"
                      />

                    </div>

                    <div>

                      <div className="flex items-center gap-3">

                        <span
                          className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-slate-400
                          "
                        >

                          <Clock3 size={15} />

                          {activity.time}

                        </span>

                        <span
                          className={`
                            rounded-full
                            border
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            ${priorityStyles(activity.priority)}
                          `}
                        >

                          {activity.priority}

                        </span>

                      </div>

                      <h4
                        className="
                          mt-3
                          text-lg
                          font-semibold
                          text-white
                        "
                      >

                        {activity.title}

                      </h4>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-slate-400
                        "
                      >

                        {activity.description}

                      </p>

                      <p
                        className="
                          mt-2
                          text-xs
                          uppercase
                          tracking-wide
                          text-cyan-400
                        "
                      >

                        {activity.type}

                      </p>

                    </div>

                  </div>

                  {/* Right */}

                  <div
                    className="
                      flex
                      flex-wrap
                      gap-3
                    "
                  >

                    {(activity.leadId || activity.propertyId) && (

                      <button
                        onClick={() => {

                          if (activity.leadId) {
                            navigate(
                              `/agent/leads/${activity.leadId}`
                            );
                          } else {
                            navigate(
                              `/agent/properties/${activity.propertyId}`
                            );
                          }

                        }}
                        className="
                          rounded-xl
                          border
                          border-slate-600
                          bg-slate-900
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-white
                          transition
                          hover:border-cyan-500
                        "
                      >

                        View Details

                      </button>

                    )}

                    <button
                      className="
                        rounded-xl
                        bg-emerald-500
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-slate-950
                        transition
                        hover:bg-emerald-400
                      "
                    >

                      Mark Complete

                    </button>

                  </div>

                </div>

              );

            })

          )}

        </div>

      </div>

    </section>

  );

};

export default ScheduleOverview;