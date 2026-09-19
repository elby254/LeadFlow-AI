/**
 * ----------------------------------------------------------
 * Central action panel for LeadFlow AI.
 *
 * Purpose:
 * • Call Lead
 * • WhatsApp Lead
 * • SMS Lead
 * • Schedule Viewing
 * • Move Lead Pipeline
 *
 * Business Goal:
 * Keep every primary agent action in one reusable component.
 * Backend integrations can be added later without changing
 * the Lead Details page.
 * ==========================================================
 */

const PIPELINE_STAGES = [
  "new",
  "qualified",
  "hot",
  "follow_up",
  "viewing_scheduled",
  "closed",
];

const LeadActions = ({
  lead,
  onCall,
  onWhatsApp,
  onSMS,
  onScheduleViewing,
  onMoveStage,
}) => {
  if (!lead) return null;

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
          ⚡ Lead Actions
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Perform immediate actions for this lead.
        </p>
      </div>

      {/* Communication */}

      <div className="grid gap-3 md:grid-cols-3">

        <button
          onClick={() => onCall?.(lead)}
          className="
            rounded-xl
            bg-emerald-600
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-emerald-500
          "
        >
          📞 Call Lead
        </button>

        <button
          onClick={() => onWhatsApp?.(lead)}
          className="
            rounded-xl
            bg-green-600
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-green-500
          "
        >
          💬 WhatsApp Lead
        </button>

        <button
          onClick={() => onSMS?.(lead)}
          className="
            rounded-xl
            bg-cyan-600
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-cyan-500
          "
        >
          ✉️ SMS Lead
        </button>

      </div>

      {/* Schedule Viewing */}

      <div className="mt-6">

        <button
          onClick={() => onScheduleViewing?.(lead)}
          className="
            w-full
            rounded-xl
            bg-indigo-600
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-indigo-500
          "
        >
          📅 Schedule Viewing
        </button>

      </div>

      {/* Pipeline */}

      <div className="mt-8">

        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Move Pipeline Stage
        </h3>

        <div className="grid gap-2 md:grid-cols-3">

          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => onMoveStage?.(stage)}
              disabled={lead.status === stage}
              className={`
                rounded-lg
                px-4
                py-2
                text-sm
                font-medium
                transition

                ${
                  lead.status === stage
                    ? "cursor-not-allowed bg-orange-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }
              `}
            >
              {stage.replace(/_/g, " ")}
            </button>
          ))}

        </div>

      </div>
    </section>
  );
};

export default LeadActions;
