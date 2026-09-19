/**
 * Overview of follow-up workload 
 * (Overdue, Due Today, Upcoming) with "View Follow-ups"
 */
import { useNavigate } from "react-router-dom";
import useFollowUps from "../../../hooks/useFollowUps";

const FollowUpOversight = () => {
  const navigate = useNavigate();

  const {
    followUps = [],
    loading,
  } = useFollowUps();

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm text-slate-400">
          Loading follow-up overview...
        </p>
      </section>
    );
  }

  /* =====================================================
      METRICS
  ===================================================== */

  const overdue = followUps.filter(
    (item) => item.status === "Overdue"
  );

  const dueToday = followUps.filter(
    (item) => item.status === "Due Today"
  );

  const upcoming = followUps.filter(
    (item) => item.status === "Upcoming"
  );

  const completed = followUps.filter(
    (item) => item.status === "Completed"
  );

  const recentFollowUps = [...followUps]
    .sort(
      (a, b) =>
        new Date(a.followUpDate) -
        new Date(b.followUpDate)
    )
    .slice(0, 5);

  /* =====================================================
      HELPERS
  ===================================================== */

  const getStatusColor = (status) => {
    switch (status) {
      case "Overdue":
        return "text-red-400 bg-red-500/10 border-red-500/20";

      case "Due Today":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";

      case "Upcoming":
        return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";

      case "Completed":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

      default:
        return "text-slate-300 bg-slate-700 border-slate-600";
    }
  };

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
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-slate-800 p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-white">
              📅 Follow-up Oversight
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Monitor agency-wide follow-up performance.
            </p>

          </div>

          <div
            className="
              rounded-full
              border
              border-cyan-500/20
              bg-cyan-500/10
              px-4
              py-2
            "
          >
            <p className="text-xs text-cyan-300">
              Total Follow-ups
            </p>

            <p className="text-lg font-bold text-white">
              {followUps.length}
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          KPI SUMMARY
      ===================================================== */}

      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">

          <p className="text-sm text-slate-400">
            Overdue
          </p>

          <h3 className="mt-2 text-3xl font-bold text-red-400">
            {overdue.length}
          </h3>

        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">

          <p className="text-sm text-slate-400">
            Due Today
          </p>

          <h3 className="mt-2 text-3xl font-bold text-yellow-400">
            {dueToday.length}
          </h3>

        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">

          <p className="text-sm text-slate-400">
            Upcoming
          </p>

          <h3 className="mt-2 text-3xl font-bold text-cyan-400">
            {upcoming.length}
          </h3>

        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">

          <p className="text-sm text-slate-400">
            Completed
          </p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-400">
            {completed.length}
          </h3>

        </div>

      </div>

      {/* =====================================================
          UPCOMING FOLLOW-UPS
      ===================================================== */}

      <div className="px-6">

        <h3 className="mb-4 text-lg font-semibold text-white">
          Next Follow-ups
        </h3>

        {recentFollowUps.length === 0 ? (

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 text-sm text-slate-400">
            No scheduled follow-ups.
          </div>

        ) : (

          <div className="space-y-3">

            {recentFollowUps.map((item) => (

              <div
                key={item._id}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  p-4
                "
              >

                <div>

                  <h4 className="font-semibold text-white">
                    {item.customerName}
                  </h4>

                  <p className="mt-1 text-sm text-slate-400">
                    Agent: {item.agentName || "Unassigned"}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-sm text-slate-300">
                    {item.followUpDate
                      ? new Date(
                          item.followUpDate
                        ).toLocaleString()
                      : "-"}
                  </p>

                  <span
                    className={`
                      mt-2
                      inline-flex
                      rounded-full
                      border
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      ${getStatusColor(item.status)}
                    `}
                  >
                    {item.status}
                  </span>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =====================================================
          ADMIN ALERTS
      ===================================================== */}

      <div className="p-6">

        <div
          className="
            rounded-2xl
            border
            border-yellow-500/20
            bg-yellow-500/10
            p-5
          "
        >

          <h3 className="font-semibold text-yellow-300">
            Oversight Alerts
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-slate-300">

            <li>
              🚨 {overdue.length} overdue follow-ups require immediate attention.
            </li>

            <li>
              📞 {dueToday.length} follow-ups scheduled for today.
            </li>

            <li>
              📅 {upcoming.length} upcoming customer engagements.
            </li>

          </ul>

        </div>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-t
          border-slate-800
          p-6
        "
      >

        <p className="text-sm text-slate-400">
          Monitor and manage agency-wide follow-up performance.
        </p>

        <button
          onClick={() => navigate("/followups")}
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
          View Follow-ups →
        </button>

      </div>

    </section>
  );
};

export default FollowUpOversight;