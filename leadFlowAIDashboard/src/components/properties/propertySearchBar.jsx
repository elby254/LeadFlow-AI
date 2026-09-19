/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Collect property search filters.
 *
 * Used By
 * ----------------------------------------------------------
 * • Property Listings
 * • Property Inventory
 * • Recommendation Dashboard
 *
 * Backend
 * ----------------------------------------------------------
 * propertySearchService
 *
 * ==========================================================
 */

import {

  Search,

} from "lucide-react";

const PropertySearchBar = ({

  filters,

  onChange,

  onSearch,

}) => {

  return (

    <div className="rounded-xl border bg-card p-5 space-y-5">

      <div>

        <h3 className="text-lg font-semibold">

          Search Properties

        </h3>

        <p className="text-sm text-muted-foreground">

          Find properties using multiple filters.

        </p>

      </div>

      {/* Search */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Search

        </label>

        <div className="relative">

          <Search

            size={18}

            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"

          />

          <input

            type="text"

            name="search"

            value={filters.search}

            onChange={onChange}

            placeholder="Property title, location..."

            className="w-full rounded-lg border py-2 pl-10 pr-3"

          />

        </div>

      </div>

      {/* Status + Type */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Status

          </label>

          <select

            name="status"

            value={filters.status}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          >

            <option value="">

              All Statuses

            </option>

            <option value="available">

              Available

            </option>

            <option value="reserved">

              Reserved

            </option>

            <option value="sold">

              Sold

            </option>

            <option value="inactive">

              Inactive

            </option>

          </select>

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Property Type

          </label>

          <select

            name="propertyType"

            value={filters.propertyType}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          >

            <option value="">

              All Types

            </option>

            <option value="apartment">

              Apartment

            </option>

            <option value="house">

              House

            </option>

            <option value="villa">

              Villa

            </option>

            <option value="commercial">

              Commercial

            </option>

            <option value="land">

              Land

            </option>

          </select>

        </div>

      </div>

      {/* ======================================================
          PRICE RANGE + BEDROOMS
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Minimum Price

          </label>

          <input

            type="number"

            min="0"

            name="minPrice"

            value={filters.minPrice}

            onChange={onChange}

            placeholder="0"

            className="w-full rounded-lg border px-3 py-2"

          />

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Maximum Price

          </label>

          <input

            type="number"

            min="0"

            name="maxPrice"

            value={filters.maxPrice}

            onChange={onChange}

            placeholder="100000000"

            className="w-full rounded-lg border px-3 py-2"

          />

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">

            Bedrooms

          </label>

          <select

            name="bedrooms"

            value={filters.bedrooms}

            onChange={onChange}

            className="w-full rounded-lg border px-3 py-2"

          >

            <option value="">

              Any

            </option>

            <option value="1">1+</option>

            <option value="2">2+</option>

            <option value="3">3+</option>

            <option value="4">4+</option>

            <option value="5">5+</option>

          </select>

        </div>

      </div>

      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-wrap justify-end gap-3">

        <button

          type="button"

          onClick={() =>

            onChange({

              target: {

                name: "reset",

                value: true,

              },

            })

          }

          className="rounded-lg border px-5 py-2 transition hover:bg-muted"

        >

          Reset

        </button>

        <button

          type="button"

          onClick={onSearch}

          className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground transition hover:opacity-90"

        >

          Search Properties

        </button>

      </div>

    </div>

  );

};

export default PropertySearchBar;