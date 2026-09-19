// ======================================================
// Agent Dashboard
// Viewing Requests Queue
// ======================================================

import {

  CalendarClock,
  Filter,
  RefreshCcw,

} from "lucide-react";

import ViewingCard from "../../common/ViewingCard";

const STATUS_FILTERS = [

  "All",

  "Pending",

  "Approved",

  "Rejected",

  "Completed",

];

const ViewingRequestsPanel = ({

  viewings = [],

  selectedViewing,

  activeFilter = "All",

  loading = false,

  onSelectViewing,

  onFilterChange,

  onRefresh,

}) => {

  // ====================================================
  // FILTER
  // ====================================================

  const filteredViewings =

    activeFilter === "All"

      ? viewings

      : viewings.filter(

          (viewing) =>

            viewing.status === activeFilter

        );

  // ====================================================
  // COMPONENT
  // ====================================================

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">

            Viewing Requests

          </h2>

          <p className="mt-1 text-sm text-gray-500">

            Review and manage customer viewing requests.

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
      {/* FILTERS */}
      {/* ============================================== */}

      <div className="flex flex-wrap items-center gap-3 border-b bg-gray-50 px-6 py-4">

        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">

          <Filter size={16} />

          Status

        </div>

        {STATUS_FILTERS.map((status) => (

          <button

            key={status}

            type="button"

            onClick={() => onFilterChange(status)}

            className={`rounded-full px-4 py-2 text-sm font-medium transition

              ${
                activeFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-50"
              }

            `}

          >

            {status}

          </button>

        ))}

      </div>

      {/* ============================================== */}
      {/* CONTENT */}
      {/* ============================================== */}

      <div className="space-y-4 p-6">

        {loading ? (

          <div className="space-y-4">

            {[...Array(4)].map((_, index) => (

              <div

                key={index}

                className="h-44 animate-pulse rounded-xl bg-gray-100"

              />

            ))}

          </div>

        ) : filteredViewings.length === 0 ? (

          <div className="py-12 text-center">

            <CalendarClock

              size={48}

              className="mx-auto mb-4 text-gray-300"

            />

            <h3 className="text-lg font-semibold text-gray-700">

              No Viewing Requests

            </h3>

            <p className="mt-2 text-sm text-gray-500">

              There are currently no

              {" "}

              <span className="font-medium">

                {activeFilter}

              </span>

              {" "}

              viewing requests.

            </p>

          </div>

        ) : (

          <>

            {/* ====================================== */}
            {/* REQUEST COUNT */}
            {/* ====================================== */}

            <div className="flex items-center justify-between">

              <p className="text-sm text-gray-500">

                Showing

                {" "}

                <span className="font-semibold text-gray-800">

                  {filteredViewings.length}

                </span>

                {" "}

                viewing request

                {filteredViewings.length !== 1 && "s"}

              </p>

            </div>

            {/* ====================================== */}
            {/* VIEWINGS */}
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

    </div>

  );

};

export default ViewingRequestsPanel;