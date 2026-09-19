/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * One-click shortcuts for the daily sales workflow.
 *
 * Used By
 * ----------------------------------------------------------
 * • Agent Dashboard
 *
 * SALES EXECUTION ACTIONS
 * ----------------------------------------------------------
 * 📞 Call Lead
 * 📅 Schedule Viewing
 * 💬 Continue Conversation
 * 🏠 Find Matching Property
 * ➕ Add New Lead
 * 📍 View Today's Schedule
 * 📝 Log Interaction
 * ⭐ Mark Lead as Hot
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import {
  PhoneCall,
  CalendarDays,
  MessageSquare,
  Search,
  UserPlus,
  MapPinned,
  ClipboardPen,
  Star,
} from "lucide-react";

const QuickActions = () => {

  const navigate = useNavigate();

  //----------------------------------------------------------

  const actions = [

    {
      title: "Call Lead",

      description:
        "Contact assigned prospects and continue qualification.",

      icon: PhoneCall,

      color: "bg-emerald-500",

      route: "/agent/leads",
    },

    {
      title: "Schedule Viewing",

      description:
        "Book property viewing appointments with customers.",

      icon: CalendarDays,

      color: "bg-orange-500",

      route: "/agent/schedule",
    },

    {
      title: "Continue Conversation",

      description:
        "Resume WhatsApp and AI conversations with clients.",

      icon: MessageSquare,

      color: "bg-cyan-500",

      route: "/agent/conversations",
    },

    {
      title: "Find Matching Property",

      description:
        "Search listings that match customer requirements.",

      icon: Search,

      color: "bg-violet-500",

      route: "/properties",
    },

    {
      title: "Add New Lead",

      description:
        "Capture a walk-in, referral or direct inquiry.",

      icon: UserPlus,

      color: "bg-blue-500",

      route: "/agent/leads/new",
    },

    {
      title: "Today's Schedule",

      description:
        "View meetings, property visits and follow-ups.",

      icon: MapPinned,

      color: "bg-teal-500",

      route: "/agent/schedule",
    },

    {
      title: "Log Interaction",

      description:
        "Record customer calls, meetings and activity notes.",

      icon: ClipboardPen,

      color: "bg-indigo-500",

      route: "/agent/interactions/new",
    },

    {
      title: "Mark Lead as Hot",

      description:
        "Promote a promising prospect for immediate attention.",

      icon: Star,

      color: "bg-red-500",

      route: "/agent/leads",
    },

  ];

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

      <div
        className="
          border-b
          border-slate-800
          p-6
        "
      >

        <h2
          className="
            text-2xl
            font-bold
            text-white
          "
        >
          ⚡ Quick Actions
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-slate-400
          "
        >
          Frequently used shortcuts for your daily sales workflow.
        </p>

      </div>

      {/* Actions */}

      <div
        className="
          grid
          gap-6
          p-6
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        {actions.map((action) => {

          const Icon = action.icon;

          return (

            <button
              key={action.title}
              onClick={() => navigate(action.route)}
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-6
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-cyan-500/40
                hover:shadow-lg
                hover:shadow-cyan-900/20
              "
            >

              <div
                className={`
                  ${action.color}
                  mb-5
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                `}
              >

                <Icon
                  size={22}
                  className="text-white"
                />

              </div>

              <h3
                className="
                  text-lg
                  font-semibold
                  text-white
                "
              >
                {action.title}
              </h3>

              <p
                className="
                  mt-3
                  text-sm
                  leading-relaxed
                  text-slate-400
                "
              >
                {action.description}
              </p>

            </button>

          );

        })}

      </div>

    </section>

  );

};

export default QuickActions;