/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Allows administrators and agents to control
 * the property's publication status.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyForm
 *
 * Display Component
 * ----------------------------------------------------------
 * PropertyStatusBadge.jsx
 *
 * ==========================================================
 */

const PROPERTY_STATUSES = [

  {

    value: "available",

    label: "Available",

  },

  {

    value: "reserved",

    label: "Reserved",

  },

  {

    value: "sold",

    label: "Sold",

  },

  {

    value: "inactive",

    label: "Inactive",

  },

];

const PropertyStatus = ({

  formData,

  onChange,

}) => {

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Property Status

        </h3>

        <p className="text-sm text-muted-foreground">

          Control how this property appears
          across LeadFlow AI.

        </p>

      </div>

      {/* Status */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Status

        </label>

        <select

          name="status"

          value={formData.status}

          onChange={onChange}

          className="w-full rounded-lg border px-3 py-2"

        >

          {PROPERTY_STATUSES.map((status) => (

            <option

              key={status.value}

              value={status.value}

            >

              {status.label}

            </option>

          ))}

        </select>

      </div>

      {/* ======================================================
          FEATURED PROPERTY
      ====================================================== */}

      <div className="flex items-center justify-between rounded-lg border p-4">

        <div>

          <h4 className="font-medium">

            Featured Property

          </h4>

          <p className="text-sm text-muted-foreground">

            Featured properties receive higher
            visibility across LeadFlow AI
            dashboards and recommendation lists.

          </p>

        </div>

        <input

          type="checkbox"

          name="featured"

          checked={formData.featured}

          onChange={onChange}

          className="h-4 w-4"

        />

      </div>

      {/* ======================================================
          ARCHIVED
      ====================================================== */}

      <div className="flex items-center justify-between rounded-lg border p-4">

        <div>

          <h4 className="font-medium">

            Archived

          </h4>

          <p className="text-sm text-muted-foreground">

            Archived properties remain in the
            database but are hidden from active
            listings and recommendations.

          </p>

        </div>

        <input

          type="checkbox"

          name="isArchived"

          checked={formData.isArchived}

          onChange={onChange}

          className="h-4 w-4"

        />

      </div>

      {/* ======================================================
          HELPER
      ====================================================== */}

      <div className="rounded-lg border bg-muted/40 p-4">

        <p className="text-sm text-muted-foreground">

          Property status controls visibility
          throughout LeadFlow AI. Available
          properties appear in searches and AI
          recommendations, while archived
          properties are retained for reporting
          and historical records.

        </p>

      </div>

    </section>

  );

};

export default PropertyStatus;