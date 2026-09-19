// ======================================================
// Viewer Dashboard
// Viewing Request Widget
// ======================================================

import {

  CalendarPlus,
  Building2,
  MapPin,
  Clock3,

} from "lucide-react";

import StatusBadge from "../../common/statusBadge";

const ViewingRequestCard = ({

  property,

  viewing,

  loading = false,

  onRequestViewing,

}) => {

  // ====================================================
  // EMPTY PROPERTY
  // ====================================================

  if (!property) {

    return (

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold text-gray-900">

          Request Property Viewing

        </h2>

        <div className="py-8 text-center">

          <Building2

            size={42}

            className="mx-auto mb-3 text-gray-300"

          />

          <p className="text-gray-500">

            Select a property to request a viewing.

          </p>

        </div>

      </div>

    );

  }

  // ====================================================
  // COMPONENT
  // ====================================================

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="border-b px-6 py-5">

        <h2 className="text-lg font-semibold text-gray-900">

          Viewing Request

        </h2>

        <p className="mt-1 text-sm text-gray-500">

          Book a viewing for your selected property.

        </p>

      </div>

      {/* ============================================== */}
      {/* PROPERTY DETAILS */}
      {/* ============================================== */}

      <div className="space-y-4 p-6">

        <div>

          <h3 className="text-base font-semibold text-gray-900">

            {property.title}

          </h3>

          <p className="mt-1 text-sm text-gray-500">

            {property.type}

          </p>

        </div>

        <div className="flex items-center gap-3">

          <MapPin

            size={18}

            className="text-red-500"

          />

          <span className="text-sm text-gray-700">

            {property.location}

          </span>

        </div>

        {/* ============================================== */}
        {/* VIEWING STATUS */}
        {/* ============================================== */}

        {viewing ? (

          <>

            <div className="flex items-center justify-between">

              <span className="text-sm font-medium text-gray-600">

                Current Status

              </span>

              <StatusBadge

                status={viewing.status}

              />

            </div>

            <div className="flex items-center gap-3">

              <CalendarPlus

                size={18}

                className="text-blue-600"

              />

              <span className="text-sm text-gray-700">

                {new Date(viewing.date).toLocaleDateString()}

              </span>

            </div>

            <div className="flex items-center gap-3">

              <Clock3

                size={18}

                className="text-amber-600"

              />

              <span className="text-sm text-gray-700">

                {viewing.startTime}

                {" - "}

                {viewing.endTime}

              </span>

            </div>

          </>

        ) : (

          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">

            <p className="text-center text-sm text-gray-500">

              No viewing has been requested for this property yet.

            </p>

          </div>

        )}

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="border-t bg-gray-50 px-6 py-5">

        <button

          type="button"

          onClick={() => onRequestViewing?.(property)}

          disabled={loading}

          className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

        >

          {loading

            ? "Processing..."

            : viewing

            ? "Manage Viewing"

            : "Book Viewing"}

        </button>

      </div>

    </div>

  );

};

export default ViewingRequestCard;