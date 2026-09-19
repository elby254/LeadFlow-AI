// ======================================================
// Admin Dashboard
// Viewing Management Panel
// ======================================================

import {

  Filter,
  RefreshCcw,
  ShieldCheck,

} from "lucide-react";

import ViewingCard from "../../common/ViewingCard";

const FILTERS = [

  "All",

  "Pending",

  "Approved",

  "Rejected",

  "Completed",

  "Cancelled",

];

const ViewingManagementPanel = ({

  viewings = [],

  selectedViewing,

  activeFilter = "All",

  loading = false,

  onFilterChange,

  onRefresh,

  onSelectViewing,

}) => {

  // ====================================================
  // FILTER VIEWINGS
  // ====================================================

  const filteredViewings =

    activeFilter === "All"

      ? viewings

      : viewings.filter(

          (viewing) =>

            viewing.status === activeFilter

        );

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">

            Viewing Management

          </h2>

          <p className="mt-1 text-sm text-gray-500">

            Manage every property viewing across the agency.

          </p>

        </div>

        <button

          type="button"

          onClick={onRefresh}

          disabled={loading}

          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"

        >

          <RefreshCcw size={16} />

          Refresh

        </button>

      </div>

      {/* ============================================== */}
      {/* FILTER BAR */}
      {/* ============================================== */}

      <div className="flex flex-wrap items-center gap-3 border-b bg-gray-50 px-6 py-4">

        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">

          <Filter size={16} />

          Filter

        </div>

        {FILTERS.map((filter) => (

          <button

            key={filter}

            type="button"

            onClick={() => onFilterChange(filter)}

            className={`rounded-full px-4 py-2 text-sm font-medium transition

              ${
                activeFilter === filter

                  ? "bg-blue-600 text-white"

                  : "bg-white text-gray-700 hover:bg-blue-50"

              }

            `}

          >

            {filter}

          </button>

        ))}

      </div>

      {/* ============================================== */}
      {/* CONTENT */}
      {/* ============================================== */}

      <div className="space-y-4 p-6">

        {loading ? (

          <div className="space-y-4">

            {[...Array(5)].map((_, index) => (

              <div

                key={index}

                className="h-44 animate-pulse rounded-xl bg-gray-200"

              />

            ))}

          </div>

        ) : filteredViewings.length === 0 ? (

          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-14 text-center">

            <ShieldCheck

              size={46}

              className="mx-auto mb-4 text-gray-300"

            />

            <h3 className="text-lg font-semibold text-gray-700">

              No Viewings Found

            </h3>

            <p className="mt-2 text-sm text-gray-500">

              There are no viewing requests matching the selected filter.

            </p>

          </div>

        ) : (

          <>

            {/* ====================================== */}
            {/* SUMMARY */}
            {/* ====================================== */}

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">

                Showing

                {" "}

                <span className="font-semibold text-gray-900">

                  {filteredViewings.length}

                </span>

                {" "}

                viewing request

                {filteredViewings.length !== 1 && "s"}

              </p>

            </div>

            {/* ====================================== */}
            {/* VIEWING LIST */}
            {/* ====================================== */}

            <div className="space-y-4">

              {filteredViewings.map((viewing) => (

                <ViewingCard

                  key={viewing._id}

                  viewing={viewing}

                  selected={

                    selectedViewing?._id ===

                    viewing._id

                  }

                  onClick={onSelectViewing}

                />

              ))}

            </div>

          </>

        )}

      </div>

      {/* ============================================== */}
      {/* ADMIN ACTION BAR */}
      {/* ============================================== */}

      {selectedViewing && (

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 px-6 py-5">

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Selected Viewing

            </p>

            <p className="font-semibold text-gray-900">

              {selectedViewing.customerName}

              {" • "}

              {selectedViewing.propertyTitle}

            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <button

              type="button"

              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"

            >

              Assign Agent

            </button>

            <button

              type="button"

              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"

            >

              Cancel Viewing

            </button>

            <button

              type="button"

              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"

            >

              Override Status

            </button>

          </div>

        </div>

      )}
      
      </div>
  );

};

export default ViewingManagementPanel;