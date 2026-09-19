/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles pricing information for a property.
 *
 * Fields
 * ----------------------------------------------------------
 * • Price
 * • Currency
 * • Payment Type
 * • Negotiable
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyForm
 *
 * ==========================================================
 */

const PAYMENT_TYPES = [

  {

    value: "sale",

    label: "For Sale",

  },

  {

    value: "rent",

    label: "For Rent",

  },

];

const CURRENCIES = [

  "KES",

  "USD",

  "EUR",

  "GBP",

];

const PropertyPricing = ({

  formData,

  errors,

  onChange,

}) => {

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Pricing

        </h3>

        <p className="text-sm text-muted-foreground">

          Configure the property's pricing information.

        </p>

      </div>

      {/* Price */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Price

        </label>

        <input

          type="number"

          min="0"

          name="price"

          value={formData.price}

          onChange={onChange}

          placeholder="8500000"

          className="w-full rounded-lg border px-3 py-2"

        />

        {errors?.price && (

          <p className="text-sm text-red-500">

            {errors.price}

          </p>

        )}

      </div>

      {/* Currency + Payment Type */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Currency

          </label>

          <select

            name="currency"

            value={formData.currency}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          >

            {CURRENCIES.map((currency) => (

              <option

                key={currency}

                value={currency}

              >

                {currency}

              </option>

            ))}

          </select>

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Payment Type

          </label>

          <select

            name="paymentType"

            value={formData.paymentType}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          >

            {PAYMENT_TYPES.map((type) => (

              <option

                key={type.value}

                value={type.value}

              >

                {type.label}

              </option>

            ))}

          </select>

        </div>

      </div>

      {/* Negotiable */}

      <div className="flex items-center justify-between rounded-lg border p-4">

        <div>

          <h4 className="font-medium">

            Negotiable Price

          </h4>

          <p className="text-sm text-muted-foreground">

            Allow agents to negotiate the listed
            price with potential buyers or tenants.

          </p>

        </div>

        <label className="inline-flex items-center cursor-pointer">

          <input

            type="checkbox"

            name="negotiable"

            checked={formData.negotiable}

            onChange={onChange}

            className="h-4 w-4"

          />

        </label>

      </div>

      {/* Pricing Tips */}

      <div className="rounded-lg border bg-muted/40 p-4">

        <h4 className="mb-2 text-sm font-semibold">

          Pricing Tips

        </h4>

        <ul className="space-y-1 text-sm text-muted-foreground">

          <li>

            • Use realistic market prices to improve
            AI recommendations.

          </li>

          <li>

            • Accurate pricing increases lead quality
            and conversion rates.

          </li>

          <li>

            • Keep pricing updated to maintain
            customer trust.

          </li>

        </ul>

      </div>

    </section>

  );

};

export default PropertyPricing;