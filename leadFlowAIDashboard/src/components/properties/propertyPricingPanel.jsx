/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Displays property pricing information.
 *
 * Used By
 * ----------------------------------------------------------
 * • Property Details
 * • Property Card
 * • Viewer Dashboard
 * • Agent Dashboard
 * • Admin Dashboard
 *
 * ==========================================================
 */

import {

  BadgeDollarSign,

  HandCoins,

  Home,

} from "lucide-react";

const formatCurrency = (

  amount,

  currency = "KES"

) => {

  if (!amount) return `${currency} 0`;

  return new Intl.NumberFormat(

    "en-KE",

    {

      style: "currency",

      currency,

      maximumFractionDigits: 0,

    }

  ).format(amount);

};

const PropertyPricingPanel = ({

  property,

}) => {

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Pricing

        </h3>

        <p className="text-sm text-muted-foreground">

          Current pricing information for this property.

        </p>

      </div>

      {/* Price */}

      <div className="flex items-center gap-3">

        <BadgeDollarSign

          className="h-8 w-8 text-primary"

        />

        <div>

          <p className="text-3xl font-bold">

            {formatCurrency(

              property.price,

              property.currency

            )}

          </p>

          <p className="text-sm text-muted-foreground">

            Listed Price

          </p>

        </div>

      </div>

      {/* Pricing Details */}

      <div className="grid gap-4 md:grid-cols-2">

        {/* Payment Type */}

        <div className="rounded-lg border p-4">

          <div className="flex items-center gap-2 mb-2">

            <Home
              className="h-5 w-5 text-primary"
            />

            <span className="font-medium">

              Payment Type

            </span>

          </div>

          <p className="text-muted-foreground">

            {property.paymentType === "rent"

              ? "For Rent"

              : "For Sale"}

          </p>

        </div>

        {/* Negotiable */}

        <div className="rounded-lg border p-4">

          <div className="flex items-center gap-2 mb-2">

            <HandCoins
              className="h-5 w-5 text-primary"
            />

            <span className="font-medium">

              Negotiable

            </span>

          </div>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              property.negotiable
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {property.negotiable ? "Yes" : "No"}
          </span>

        </div>

      </div>

      {/* Footer */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">

        <div>

          <p className="text-xs text-muted-foreground">

            Last Updated

          </p>

          <p className="text-sm font-medium">

            {property.updatedAt
              ? new Date(
                  property.updatedAt
                ).toLocaleDateString()
              : "-"}

          </p>

        </div>

        {property.featured && (

          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">

            Featured Property

          </span>

        )}

      </div>

    </section>

  );

};

export default PropertyPricingPanel;