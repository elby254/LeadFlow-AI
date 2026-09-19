/**
 * Displays outstanding operational tasks assigned to agents.
 *
 * Helps admins monitor:
 *
 * • Which agent owns the task
 * • What action is pending
 * • Deadline
 * • Priority
 *
 * Future Backend Source
 *
 * useAdminDashboard()
 *
 * dashboard.pendingTasks
 *
 * ===============================================================
 */

const PendingAgentTasks = ({ tasks = [] }) => {

  //------------------------------------------------------------

  const priorityStyle = (priority) => {

    switch (priority) {

      case "HIGH":
        return "bg-red-500/20 text-red-400";

      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-300";

      default:
        return "bg-emerald-500/20 text-emerald-300";

    }

  };

  //------------------------------------------------------------

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

        <div className="flex items-center justify-between">

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              Pending Agent Tasks
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Tasks awaiting action from your sales team.
            </p>

          </div>

          <span
            className="
              rounded-full
              bg-cyan-500/20
              px-3
              py-1
              text-sm
              font-medium
              text-cyan-300
            "
          >
            {tasks.length} Open
          </span>

        </div>

      </div>

      {/* Empty */}

      {tasks.length === 0 && (

        <div className="p-8 text-center">

          <p className="text-lg text-emerald-400">

            ✅ No pending tasks.

          </p>

          <p className="mt-2 text-sm text-slate-500">

            Your agents are fully up to date.

          </p>

        </div>

      )}

      {/* Tasks */}

      <div className="divide-y divide-slate-800">

        {tasks.map((task) => (

          <div
            key={task.id}
            className="
              flex
              items-center
              justify-between
              p-5
              transition
              hover:bg-slate-800/40
            "
          >

            {/* Left */}

            <div>

              <h3
                className="
                  text-white
                  font-semibold
                "
              >
                {task.agent}
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-300
                "
              >
                {task.action}
              </p>

              <p
                className="
                  mt-2
                  text-xs
                  text-slate-500
                "
              >
                Deadline:

                {" "}

                {task.deadline}

              </p>

            </div>

            {/* Right */}

            <div className="text-right">

              <span
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${priorityStyle(task.priority)}
                `}
              >
                {task.priority}
              </span>

            </div>

          </div>

        ))}

      </div>

    </section>

  );

};

export default PendingAgentTasks;