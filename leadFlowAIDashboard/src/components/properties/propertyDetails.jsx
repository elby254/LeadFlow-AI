/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Captures the property's physical details.
 *
 * Fields
 * ----------------------------------------------------------
 * • Bedrooms
 * • Bathrooms
 * • Parking
 * • Square Feet
 * • Assigned Agent
 *
 * ==========================================================
 */

const PropertyDetails = ({

  formData,

  errors,

  agents,

  onChange,

}) => {

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Property Details

        </h3>

        <p className="text-sm text-muted-foreground">

          Enter the property's physical specifications.

        </p>

      </div>

      {/* Bedrooms + Bathrooms */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Bedrooms

          </label>

          <input

            type="number"

            min="0"

            name="bedrooms"

            value={formData.bedrooms}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          />

          {errors?.bedrooms && (

            <p className="text-sm text-red-500">

              {errors.bedrooms}

            </p>

          )}

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Bathrooms

          </label>

          <input

            type="number"

            min="0"

            name="bathrooms"

            value={formData.bathrooms}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          />

        </div>

      </div>

      {/* Parking + Square Feet */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Parking Spaces

          </label>

          <input

            type="number"

            min="0"

            name="parking"

            value={formData.parking}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          />

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Square Feet

          </label>

          <input

            type="number"

            min="0"

            name="squareFeet"

            value={formData.squareFeet}

            onChange={onChange}

            placeholder="1500"

            className="w-full rounded-lg border px-3 py-2"

          />

        </div>

      </div>

      {/* ======================================================
    ASSIGNED AGENT
====================================================== */}

<div className="space-y-2">

  <label className="text-sm font-medium">
    Assigned Agent
  </label>

  <select
    name="assignedAgent"
    value={formData.assignedAgent || ""}
    onChange={onChange}
    className="w-full rounded-lg border px-3 py-2"
  >

    <option value="">
      Select Agent
    </option>

    {(agents || [])
      .filter((agent) => agent && agent._id)
      .map((agent) => (

        <option
          key={agent._id}
          value={agent._id}
        >
          {agent.name || "Unnamed Agent"}
        </option>

      ))}

  </select>

  <p className="text-xs text-muted-foreground">
    Assigning an agent allows LeadFlow AI
    to automatically route enquiries,
    appointments and follow-ups.
  </p>

</div>

      {/* ======================================================
          PROPERTY ATTRIBUTES
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-2">

        {/* Furnished */}

        <div className="flex items-center justify-between rounded-lg border p-4">

          <div>

            <h4 className="font-medium">

              Furnished

            </h4>

            <p className="text-sm text-muted-foreground">

              Property comes fully or partially furnished.

            </p>

          </div>

          <input

            type="checkbox"

            name="furnished"

            checked={formData.furnished}

            onChange={onChange}

            className="h-4 w-4"

          />

        </div>

        {/* Pets */}

        <div className="flex items-center justify-between rounded-lg border p-4">

          <div>

            <h4 className="font-medium">

              Pets Allowed

            </h4>

            <p className="text-sm text-muted-foreground">

              Indicates whether tenants may keep pets.

            </p>

          </div>

          <input

            type="checkbox"

            name="petsAllowed"

            checked={formData.petsAllowed}

            onChange={onChange}

            className="h-4 w-4"

          />

        </div>

      </div>

    </section>

  );

};

export default PropertyDetails;