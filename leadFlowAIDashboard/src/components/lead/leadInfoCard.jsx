/**
 * ==========================================================
 * This gives the assigned agent an immediate overview of
 * what the customer is looking for before making contact.
 *
 * Information displayed:
 * • Budget
 * • Bedrooms
 * • Preferred Location
 * • Move Date
 *
 * This card represents the AI-extracted property profile.
 * ==========================================================
 */

const LeadInfoCard = ({ lead }) => {
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
          🏡 Property Requirements
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          AI-extracted customer preferences.
        </p>
      </div>

      {/* Information Grid */}

      <div className="grid gap-4 md:grid-cols-2">

        {/* Budget */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Budget
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {lead.budget
              ? `KES ${Number(lead.budget).toLocaleString()}`
              : "Not provided"}
          </p>
        </div>

        {/* Bedrooms */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Bedrooms
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {lead.bedrooms || "Not specified"}
          </p>
        </div>

        {/* Location */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Preferred Location
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {lead.location || "Not specified"}
          </p>
        </div>

        {/* Move Date */}

        <div
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            p-4
          "
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Move Date
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {lead.moveDate || "Not provided"}
          </p>
        </div>

      </div>
    </section>
  );
};

export default LeadInfoCard;