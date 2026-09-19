/**
 * ==========================================================
 * Displays customer-related tasks that are overdue.
 *
 * Future Backend
 * --------------
 * GET /api/agent/overdue-tasks
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  Clock3,
  User,
  PhoneCall,
} from "lucide-react";

const OverdueTasks = () => {

  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);

  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data

    setTasks([

      {
        id: "lead001",

        customer: "John Mwangi",

        task: "Follow-up Call",

        overdue: "2 hrs",

      },

      {
        id: "lead002",

        customer: "Grace Wanjiku",

        task: "Send Property Brochure",

        overdue: "5 hrs",

      },

      {
        id: "lead003",

        customer: "Brian Otieno",

        task: "Schedule Property Viewing",

        overdue: "1 day",

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
              Overdue Tasks
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Customer actions requiring immediate attention.
            </p>

          </div>

          <AlertTriangle
            size={28}
            className="text-red-400"
          />

        </div>

      </div>

      {/* Tasks */}

      <div className="divide-y divide-slate-800">

        {tasks.length === 0 ? (

          <div className="p-8 text-center">

            <p className="text-emerald-400 font-medium">
              🎉 No overdue tasks.
            </p>

          </div>

        ) : (

          tasks.map((task) => (

            <div
              key={task.id}
              className="p-5"
            >

              <div className="flex items-start justify-between">

                <div className="flex gap-4">

                  <div
                    className="
                      rounded-xl
                      bg-red-500/20
                      p-3
                    "
                  >
                    <User
                      size={20}
                      className="text-red-400"
                    />
                  </div>

                  <div>

                    <h3 className="text-lg font-semibold text-white">
                      {task.customer}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      {task.task}
                    </p>

                    <div className="mt-3 flex items-center gap-2">

                      <Clock3
                        size={15}
                        className="text-orange-400"
                      />

                      <span className="text-sm text-orange-300">
                        Overdue by {task.overdue}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      navigate(`/lead/${task.id}`)
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
                      navigate(`/contact/${task.id}`)
                    }
                    className="
                      rounded-xl
                      bg-red-500
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-white
                      hover:bg-red-400
                    "
                  >
                    <PhoneCall
                      size={15}
                      className="mr-2 inline"
                    />
                    Complete
                  </button>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </section>

  );

};

export default OverdueTasks;