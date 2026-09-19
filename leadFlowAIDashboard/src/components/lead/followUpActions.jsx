/**
 * Central action panel for LeadFlow AI CRM.
 *
 * Allows agents to:
 *
 * • Move a lead through the sales pipeline
 * • Schedule a property viewing
 * • Prepare future CRM actions
 *
 * Future Enhancements
 * ----------------------------------------------------------
 * ✓ Persist pipeline updates to backend
 * ✓ Schedule calendar integration
 * ✓ Assign agent
 * ✓ Close lead
 * ✓ Reschedule viewing
 * ✓ AI recommended next action
 * ==========================================================
 */

import { useState } from "react";

const PIPELINE = [
  "new",
  "qualified",
  "hot",
  "follow_up",
  "viewing_scheduled",
  "closed",
];

const FollowUpActions = ({ lead }) => {
  if (!lead) return null;

  const [status, setStatus] = useState(lead.status || "new");

  const [viewing, setViewing] = useState({
    date: lead.viewingSchedule?.date || "",
    time: lead.viewingSchedule?.time || "",
    property: lead.viewingSchedule?.property || "",
  });

  const handlePipelineUpdate = () => {
    // TODO
    // PATCH /api/lead/:id/status
    console.log("Update Pipeline:", status);
  };

  const handleScheduleViewing = () => {
    // TODO
    // PATCH /api/lead/:id/viewing
    console.log("Viewing Schedule:", viewing);
  };

  return (
    <section
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-xl
      "
    >
      {/* Header */}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          ⚙️ Follow-up Actions
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage lead progress and schedule property viewings.
        </p>
      </div>

      <div className="space-y-8">

        {/* ================================================= */}
        {/* Lead Pipeline */}
        {/* ================================================= */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-5
          "
        >
          <h3
            className="
              mb-4
              font-semibold
              text-white
            "
          >
            Move Lead Pipeline
          </h3>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="
              w-full
              rounded-lg
              border
              border-slate-700
              bg-slate-900
              px-4
              py-3
              text-white
              focus:border-cyan-500
              focus:outline-none
            "
          >
            {PIPELINE.map((stage) => (
              <option
                key={stage}
                value={stage}
              >
                {stage
                  .replaceAll("_", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>

          <button
            onClick={handlePipelineUpdate}
            className="
              mt-4
              rounded-lg
              bg-cyan-500
              px-5
              py-2
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            Update Pipeline
          </button>
        </div>

        {/* ================================================= */}
        {/* Viewing Schedule */}
        {/* ================================================= */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-5
          "
        >
          <h3
            className="
              mb-4
              font-semibold
              text-white
            "
          >
            Schedule Viewing
          </h3>

          <div className="space-y-4">

            <input
              type="date"
              value={viewing.date}
              onChange={(e) =>
                setViewing({
                  ...viewing,
                  date: e.target.value,
                })
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-700
                bg-slate-900
                px-4
                py-3
                text-white
                focus:border-cyan-500
                focus:outline-none
              "
            />

            <input
              type="time"
              value={viewing.time}
              onChange={(e) =>
                setViewing({
                  ...viewing,
                  time: e.target.value,
                })
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-700
                bg-slate-900
                px-4
                py-3
                text-white
                focus:border-cyan-500
                focus:outline-none
              "
            />

            <input
              type="text"
              placeholder="Property Name / Unit"
              value={viewing.property}
              onChange={(e) =>
                setViewing({
                  ...viewing,
                  property: e.target.value,
                })
              }
              className="
                w-full
                rounded-lg
                border
                border-slate-700
                bg-slate-900
                px-4
                py-3
                text-white
                placeholder:text-slate-500
                focus:border-cyan-500
                focus:outline-none
              "
            />

            <button
              onClick={handleScheduleViewing}
              className="
                rounded-lg
                bg-emerald-500
                px-5
                py-2
                text-sm
                font-semibold
                text-slate-950
                transition
                hover:bg-emerald-400
              "
            >
              Schedule Viewing
            </button>

          </div>
        </div>

        {/* ================================================= */}
        {/* Future CRM Actions */}
        {/* ================================================= */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-5
          "
        >
          <h3
            className="
              mb-4
              font-semibold
              text-white
            "
          >
            Upcoming CRM Actions
          </h3>

          <div className="flex flex-wrap gap-3">

            <button
              disabled
              className="
                rounded-lg
                border
                border-slate-700
                bg-slate-900
                px-4
                py-2
                text-sm
                text-slate-400
                cursor-not-allowed
              "
            >
              Assign Agent
            </button>

            <button
              disabled
              className="
                rounded-lg
                border
                border-slate-700
                bg-slate-900
                px-4
                py-2
                text-sm
                text-slate-400
                cursor-not-allowed
              "
            >
              Close Lead
            </button>

            <button
              disabled
              className="
                rounded-lg
                border
                border-slate-700
                bg-slate-900
                px-4
                py-2
                text-sm
                text-slate-400
                cursor-not-allowed
              "
            >
              Reschedule Viewing
            </button>

            <button
              disabled
              className="
                rounded-lg
                border
                border-slate-700
                bg-slate-900
                px-4
                py-2
                text-sm
                text-slate-400
                cursor-not-allowed
              "
            >
              AI Recommendation
            </button>

          </div>
        </div>

      </div>
    </section>
  );
};

export default FollowUpActions;

