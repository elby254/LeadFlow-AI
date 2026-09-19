/**
 * Displays a ranked leaderboard of sales agents based on
 * their current performance.
 *
 * This component gives administrators a quick overview of:
 *
 * • Total assigned leads
 * • Qualified leads
 * • Hot leads
 * • Closed deals
 * • Conversion rate
 *
 * FEATURES
 * --------
 * ✓ Automatic ranking
 * ✓ Medal indicators (Top 3)
 * ✓ Conversion percentage
 * ✓ Responsive layout
 * ✓ Empty state
 *
 * EXPECTED DATA
 * -------------
 * [
 *   {
 *     _id,
 *     name,
 *     email,
 *     assignedLeads,
 *     closedDeals,
 *     conversionRate
 *   }
 * ]
 *
 * USED BY
 * -------
 * AdminDashboard.jsx
 *
 * ==========================================================
 */

const AgentLeaderboard = ({ agents = [] }) => {
  /**
   * ---------------------------------------
   * SORT BY BEST PERFORMANCE
   * ---------------------------------------
   */
  const rankedAgents = [...agents].sort(
    (a, b) =>
      (b.conversionRate || 0) -
      (a.conversionRate || 0)
  );

  /**
   * ---------------------------------------
   * MEDALS
   * ---------------------------------------
   */
  const getMedal = (index) => {
    switch (index) {
      case 0:
        return "🥇";

      case 1:
        return "🥈";

      case 2:
        return "🥉";

      default:
        return `#${index + 1}`;
    }
  };

  /**
   * ---------------------------------------
   * EMPTY STATE
   * ---------------------------------------
   */
  if (!rankedAgents.length) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-bold text-white">
          🏆 Agent Leaderboard
        </h2>

        <div className="mt-8 text-center">
          <p className="text-slate-400">
            No agent performance data available.
          </p>
        </div>
      </section>
    );
  }

  /**
   * ---------------------------------------
   * RENDER
   * ---------------------------------------
   */
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold text-white">
            🏆 Agent Leaderboard
          </h2>

          <p className="mt-1 text-slate-400">
            Ranked by conversion rate
          </p>
        </div>

      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead>

            <tr className="border-b border-slate-800 text-left text-sm uppercase tracking-wide text-slate-400">

              <th className="py-3">Rank</th>

              <th>Name</th>

              <th>Assigned</th>

              <th>Closed</th>

              <th>Conversion</th>

            </tr>

          </thead>

           <tbody>

  {rankedAgents.map((agent, index) => (

    <tr
      key={agent._id}
      className="border-b border-slate-800 transition hover:bg-slate-800/60"
    >

      <td className="py-5 text-xl font-bold">
        {getMedal(index)}
      </td>

      <td>

        <div>

          <p className="font-semibold text-white">
            {agent.name}
          </p>

          <p className="text-sm text-slate-400">
            {agent.email}
          </p>

        </div>

      </td>

      <td className="font-semibold text-white">
        {agent.assignedLeadCount ?? 0}
      </td>

      <td className="text-green-400 font-semibold">
        {agent.closedLeadCount ?? 0}
      </td>

      <td>

        <span
          className="
            rounded-full
            bg-cyan-500/20
            px-3
            py-1
            text-sm
            font-semibold
            text-cyan-300
          "
        >
          {agent.conversionRate ?? 0}%
        </span>

      </td>

    </tr>

  ))}

</tbody>

        </table>

      </div>

    </section>
  );
};

export default AgentLeaderboard;