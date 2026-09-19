// ======================================================
// Viewer Dashboard
// Viewing Journey Timeline
// ======================================================

import {

  CalendarPlus,
  CheckCircle2,
  Bell,
  Home,
  XCircle,
  Circle,

} from "lucide-react";

const TIMELINE_CONFIG = {

  Requested: {
    icon: CalendarPlus,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },

  Approved: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },

  "Reminder Sent": {
    icon: Bell,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },

  Completed: {
    icon: Home,
    color: "text-cyan-600",
    bg: "bg-cyan-100",
  },

  Cancelled: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
  },

};

const DEFAULT_STEPS = [

  "Requested",

  "Approved",

  "Reminder Sent",

  "Completed",

];

const ViewingTimeline = ({

  currentStatus,

  timeline = DEFAULT_STEPS,

}) => {

  const currentIndex = timeline.indexOf(currentStatus);

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="border-b px-6 py-5">

        <h2 className="text-lg font-semibold text-gray-900">

          Viewing Journey

        </h2>

        <p className="mt-1 text-sm text-gray-500">

          Track your viewing request from booking to completion.

        </p>

      </div>

      {/* ============================================== */}
      {/* TIMELINE */}
      {/* ============================================== */}

      <div className="space-y-6 p-6">

        {timeline.map((step, index) => {

          const config =
            TIMELINE_CONFIG[step];

          const Icon =
            config?.icon || Circle;

          const completed =
            index <= currentIndex;

          const active =
            index === currentIndex;

          return (

            <div

              key={step}

              className="flex gap-4"

            >

              {/* ====================================== */}
              {/* ICON */}
              {/* ====================================== */}

              <div className="flex flex-col items-center">

                <div

                  className={`flex h-11 w-11 items-center justify-center rounded-full

                    ${
                      completed
                        ? config?.bg
                        : "bg-gray-100"
                    }

                  `}

                >

                  <Icon

                    size={20}

                    className={

                      completed
                        ? config?.color
                        : "text-gray-400"

                    }

                  />

                </div>

                {index !== timeline.length - 1 && (

                  <div

                    className={`mt-1 h-10 w-0.5

                      ${
                        completed
                          ? "bg-blue-500"
                          : "bg-gray-200"
                      }

                    `}

                  />

                )}

              </div>

              {/* ====================================== */}
              {/* CONTENT */}
              {/* ====================================== */}

              <div className="flex-1 pb-6">

                <h3

                  className={`font-semibold

                    ${
                      active
                        ? "text-blue-600"
                        : completed
                        ? "text-gray-900"
                        : "text-gray-400"
                    }

                  `}

                >

                  {step}

                </h3>

                <p className="mt-1 text-sm text-gray-500">

                  {active
                    ? "Current stage"
                    : completed
                    ? "Completed"
                    : "Pending"}

                </p>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

};

export default ViewingTimeline;