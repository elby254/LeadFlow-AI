// ======================================================
// Reusable Viewing Card
// ======================================================

import {

  Calendar,

  Clock3,

  MapPin,

  User,

  Building2,

} from "lucide-react";

import StatusBadge from "./StatusBadge";

const ViewingCard = ({

  viewing,

  onClick,

  selected = false,

}) => {

  if (!viewing) return null;

  return (

    <button

      type="button"

      onClick={() => onClick?.(viewing)}

      className={`

        w-full

        rounded-xl

        border

        bg-white

        p-5

        text-left

        shadow-sm

        transition

        hover:border-blue-500

        hover:shadow-md

        ${

          selected

            ? "border-blue-600 ring-2 ring-blue-200"

            : "border-gray-200"

        }

      `}

    >

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="mb-4 flex items-start justify-between">

        <div>

          <h3 className="text-lg font-semibold text-gray-900">

            {viewing.propertyTitle}

          </h3>

          <p className="mt-1 text-sm text-gray-500">

            {viewing.propertyType}

          </p>

        </div>

        <StatusBadge

          status={viewing.status}

        />

      </div>

      {/* ============================================== */}
      {/* PROPERTY */}
      {/* ============================================== */}

      <div className="space-y-3">

        <div className="flex items-center gap-3">

          <Building2

            size={18}

            className="text-blue-600"

          />

          <span className="text-sm text-gray-700">

            {viewing.propertyTitle}

          </span>

        </div>

        <div className="flex items-center gap-3">

          <MapPin

            size={18}

            className="text-red-500"

          />

          <span className="text-sm text-gray-700">

            {viewing.location}

          </span>

        </div>

        <div className="flex items-center gap-3">

          <User

            size={18}

            className="text-emerald-600"

          />

          <span className="text-sm text-gray-700">

            {viewing.customerName}

          </span>

        </div>

        <div className="flex items-center gap-3">

          <Calendar

            size={18}

            className="text-indigo-600"

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

      </div>

      {/* ============================================== */}
      {/* NOTES */}
      {/* ============================================== */}

      {viewing.notes && (

        <div className="mt-5 rounded-lg bg-gray-50 p-3">

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">

            Notes

          </p>

          <p className="mt-1 text-sm text-gray-700">

            {viewing.notes}

          </p>

        </div>

      )}

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="mt-5 flex items-center justify-between border-t pt-4">

        <div>

          <p className="text-xs uppercase tracking-wide text-gray-500">

            Assigned Agent

          </p>

          <p className="text-sm font-medium text-gray-800">

            {viewing.agentName || "Unassigned"}

          </p>

        </div>

        <div className="text-right">

          <p className="text-xs uppercase tracking-wide text-gray-500">

            Viewing ID

          </p>

          <p className="text-sm font-medium text-gray-800">

            {viewing.referenceNumber || viewing._id}

          </p>

        </div>

      </div>

    </button>

  );

};

export default ViewingCard;