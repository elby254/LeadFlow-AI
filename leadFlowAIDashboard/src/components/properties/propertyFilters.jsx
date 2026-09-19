/**
 * ==========================================================
 * Reusable property filtering component.
 *
 * Used By
 * -------
 * • Listings.jsx
 * • AvailableProperties.jsx
 * • SoldProperties.jsx
 * • Recommendations.jsx
 *
 * Emits filter values back to parent.
 *
 * ==========================================================
 */

import { Filter, Search } from "lucide-react";
import { useState } from "react";

const PropertyFilters = ({ onFilterChange }) => {

  const [filters, setFilters] = useState({

    search: "",

    location: "",

    propertyType: "",

    status: "",

    bedrooms: "",

    minPrice: "",

    maxPrice: "",

  });

  //----------------------------------------------------------

  const updateFilter = (field, value) => {

    const updated = {

      ...filters,

      [field]: value,

    };

    setFilters(updated);

    onFilterChange(updated);

  };

  //----------------------------------------------------------

  const clearFilters = () => {

    const cleared = {

      search: "",

      location: "",

      propertyType: "",

      status: "",

      bedrooms: "",

      minPrice: "",

      maxPrice: "",

    };

    setFilters(cleared);

    onFilterChange(cleared);

  };

  //----------------------------------------------------------

  return (

    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-xl
      "
    >

      {/* Header */}

      <div className="mb-6 flex items-center gap-3">

        <Filter className="text-cyan-400" />

        <h2 className="text-xl font-bold text-white">

          Property Filters

        </h2>

      </div>

      {/* Search */}

      <div className="relative mb-6">

        <Search
          size={18}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-slate-500
          "
        />

        <input

          type="text"

          placeholder="Search property..."

          value={filters.search}

          onChange={(e) =>

            updateFilter("search", e.target.value)

          }

          className="
            w-full
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            py-3
            pl-12
            pr-4
            text-white
            outline-none
            focus:border-cyan-500
          "

        />

      </div>

      {/* Grid */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* Location */}

        <input

          type="text"

          placeholder="Location"

          value={filters.location}

          onChange={(e) =>

            updateFilter("location", e.target.value)

          }

          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            p-3
            text-white
          "

        />

        {/* Property Type */}

        <select

          value={filters.propertyType}

          onChange={(e) =>

            updateFilter("propertyType", e.target.value)

          }

          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            p-3
            text-white
          "

        >

          <option value="">

            All Types

          </option>

          <option>

            Apartment

          </option>

          <option>

            House

          </option>

          <option>

            Commercial

          </option>

          <option>

            Land

          </option>

        </select>

        {/* Status */}

        <select

          value={filters.status}

          onChange={(e) =>

            updateFilter("status", e.target.value)

          }

          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            p-3
            text-white
          "

        >

          <option value="">

            All Status

          </option>

          <option>

            Available

          </option>

          <option>

            Reserved

          </option>

          <option>

            Sold

          </option>

        </select>

        {/* Bedrooms */}

        <select

          value={filters.bedrooms}

          onChange={(e) =>

            updateFilter("bedrooms", e.target.value)

          }

          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            p-3
            text-white
          "

        >

          <option value="">

            Bedrooms

          </option>

          <option value="1">1+</option>

          <option value="2">2+</option>

          <option value="3">3+</option>

          <option value="4">4+</option>

          <option value="5">5+</option>

        </select>

      </div>

      {/* Price */}

      <div className="mt-5 grid gap-4 md:grid-cols-2">

        <input

          type="number"

          placeholder="Minimum Price"

          value={filters.minPrice}

          onChange={(e) =>

            updateFilter("minPrice", e.target.value)

          }

          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            p-3
            text-white
          "

        />

        <input

          type="number"

          placeholder="Maximum Price"

          value={filters.maxPrice}

          onChange={(e) =>

            updateFilter("maxPrice", e.target.value)

          }

          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            p-3
            text-white
          "

        />

      </div>

      {/* Footer */}

      <div className="mt-6 flex justify-end">

        <button

          onClick={clearFilters}

          className="
            rounded-xl
            border
            border-slate-700
            px-5
            py-3
            text-white
            transition
            hover:bg-slate-800
          "

        >

          Clear Filters

        </button>

      </div>

    </section>

  );

};

export default PropertyFilters;

