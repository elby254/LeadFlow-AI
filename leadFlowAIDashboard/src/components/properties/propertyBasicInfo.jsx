/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Collects the core property details.
 *
 * Fields
 * ----------------------------------------------------------
 * • Title
 * • Property Code
 * • Property Type
 * • Description
 *
 * ==========================================================
 */

const PROPERTY_TYPES = [

  {
    value: "bedsitter",
    label: "Bedsitter",
  },

  {
    value: "studio",
    label: "Studio",
  },

  {
    value: "apartment",
    label: "Apartment",
  },

  {
    value: "maisonette",
    label: "Maisonette",
  },

  {
    value: "house",
    label: "House",
  },

  {
    value: "villa",
    label: "Villa",
  },

  {
    value: "commercial",
    label: "Commercial",
  },

  {
    value: "office",
    label: "Office",
  },

  {
    value: "land",
    label: "Land",
  },

];

const PropertyBasicInfo = ({

  formData,

  errors,

  onChange,

}) => {

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Basic Information

        </h3>

        <p className="text-sm text-muted-foreground">

          Enter the property's core details.

        </p>

      </div>

      {/* Property Title */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Property Title

        </label>

        <input

          type="text"

          name="title"

          value={formData.title}

          onChange={onChange}

          placeholder="e.g. Luxury 3 Bedroom Apartment"

          className="w-full rounded-lg border px-3 py-2"

        />

        {errors?.title && (

          <p className="text-sm text-red-500">

            {errors.title}

          </p>

        )}

      </div>

      {/* Property Code */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Property Code

        </label>

        <input

          type="text"

          name="propertyCode"

          value={formData.propertyCode}

          onChange={onChange}

          placeholder="PROP-001"

          className="w-full rounded-lg border px-3 py-2"

        />

      </div>

      {/* Property Type */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Property Type

        </label>

        <select

          name="propertyType"

          value={formData.propertyType}

          onChange={onChange}

          className="w-full rounded-lg border px-3 py-2"

        >

          {PROPERTY_TYPES.map((type) => (

            <option

              key={type.value}

              value={type.value}

            >

              {type.label}

            </option>

          ))}

        </select>

      </div>

      {/* Description */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Description

        </label>

        <textarea

          name="description"

          value={formData.description}

          onChange={onChange}

          rows={6}

          placeholder="Describe the property's key features, nearby amenities, condition, accessibility, and any additional selling points."

          className="w-full rounded-lg border px-3 py-2 resize-none"

        />

      </div>

    </section>

  );

};

export default PropertyBasicInfo;