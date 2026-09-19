/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Collects the property's location information.
 *
 * Fields
 * ----------------------------------------------------------
 * • Location
 * • County
 * • City
 * • Estate
 * • Coordinates
 *
 * ==========================================================
 */

const PropertyLocation = ({

  formData,

  errors,

  onChange,

  onNestedChange,

}) => {

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Property Location

        </h3>

        <p className="text-sm text-muted-foreground">

          Specify where the property is located.

        </p>

      </div>

      {/* Main Location */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Location

        </label>

        <input

          type="text"

          name="location"

          value={formData.location}

          onChange={onChange}

          placeholder="e.g. Westlands"

          className="w-full rounded-lg border px-3 py-2"

        />

        {errors?.location && (

          <p className="text-sm text-red-500">

            {errors.location}

          </p>

        )}

      </div>

      {/* County + City */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="space-y-2">

          <label className="text-sm font-medium">

            County

          </label>

          <input

            type="text"

            name="county"

            value={formData.county}

            onChange={onChange}

            placeholder="Nairobi"

            className="w-full rounded-lg border px-3 py-2"

          />

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">

            City

          </label>

          <input

            type="text"

            name="city"

            value={formData.city}

            onChange={onChange}

            placeholder="Nairobi"

            className="w-full rounded-lg border px-3 py-2"

          />

        </div>

      </div>

      {/* Estate */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Estate / Neighborhood

        </label>

        <input

          type="text"

          name="estate"

          value={formData.estate}

          onChange={onChange}

          placeholder="Kilimani"

          className="w-full rounded-lg border px-3 py-2"

        />

      </div>

      {/* Coordinates */}

      <div>

        <h4 className="text-sm font-semibold mb-4">

          GPS Coordinates

        </h4>

        <div className="grid gap-4 md:grid-cols-2">

          <div className="space-y-2">

            <label className="text-sm font-medium">

              Latitude

            </label>

            <input

              type="number"

              step="any"

              value={
                formData.coordinates.latitude
              }

              onChange={(event) =>

                onNestedChange(

                  "coordinates",

                  "latitude",

                  event.target.value

                )

              }

              placeholder="-1.286389"

              className="w-full rounded-lg border px-3 py-2"

            />

          </div>

          <div className="space-y-2">

            <label className="text-sm font-medium">

              Longitude

            </label>

            <input

              type="number"

              step="any"

              value={
                formData.coordinates.longitude
              }

              onChange={(event) =>

                onNestedChange(

                  "coordinates",

                  "longitude",

                  event.target.value

                )

              }

              placeholder="36.817223"

              className="w-full rounded-lg border px-3 py-2"

            />

          </div>

        </div>

        <p className="mt-2 text-xs text-muted-foreground">

          Coordinates improve map accuracy,
          nearby property recommendations,
          and location-based search.

        </p>

      </div>

    </section>

  );

};

export default PropertyLocation;