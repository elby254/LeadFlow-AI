// ======================================================
// Viewer Dashboard
// Viewing Details
// ======================================================

import {

  Calendar,
  Clock3,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,

} from "lucide-react";

import StatusBadge from "../../common/statusBadge";

const ViewingDetailsCard = ({

  viewing,

}) => {

  // ====================================================
  // EMPTY STATE
  // ====================================================

  if (!viewing) {

    return (

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold text-gray-900">

          Viewing Details

        </h2>

        <div className="py-10 text-center">

          <Calendar

            size={44}

            className="mx-auto mb-3 text-gray-300"

          />

          <p className="text-gray-500">

            Select a viewing to see its details.

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

      <div className="flex items-start justify-between border-b px-6 py-5">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">

            Viewing Details

          </h2>

          <p className="mt-1 text-sm text-gray-500">

            Complete information about your scheduled viewing.

          </p>

        </div>

        <StatusBadge

          status={viewing.status}

        />

      </div>

      {/* ============================================== */}
      {/* DETAILS */}
      {/* ============================================== */}

      <div className="space-y-5 p-6">

        <div className="flex items-center gap-3">

          <Building2

            size={18}

            className="text-blue-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Property

            </p>

            <p className="font-medium text-gray-900">

              {viewing.propertyTitle}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <MapPin

            size={18}

            className="text-red-500"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Location

            </p>

            <p className="font-medium text-gray-900">

              {viewing.location}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <Calendar

            size={18}

            className="text-indigo-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Viewing Date

            </p>

            <p className="font-medium text-gray-900">

              {new Date(viewing.date).toLocaleDateString()}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <Clock3

            size={18}

            className="text-amber-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Viewing Time

            </p>

            <p className="font-medium text-gray-900">

              {viewing.startTime}

              {" - "}

              {viewing.endTime}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <User

            size={18}

            className="text-emerald-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Assigned Agent

            </p>

            <p className="font-medium text-gray-900">

              {viewing.agentName || "Not Assigned"}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <Building2

            size={18}

            className="text-cyan-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Office / Branch

            </p>

            <p className="font-medium text-gray-900">

              {viewing.office || "Main Office"}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <Phone

            size={18}

            className="text-green-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Agent Phone

            </p>

            <p className="font-medium text-gray-900">

              {viewing.agentPhone || "Not Available"}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <Mail

            size={18}

            className="text-purple-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Agent Email

            </p>

            <p className="font-medium text-gray-900">

              {viewing.agentEmail || "Not Available"}

            </p>

          </div>

        </div>

        {/* ============================================== */}
        {/* NOTES */}
        {/* ============================================== */}

        {viewing.notes && (

          <div className="rounded-lg bg-gray-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">

              Viewing Notes

            </p>

            <p className="mt-2 text-sm text-gray-700">

              {viewing.notes}

            </p>

          </div>

        )}

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">

        <div>

          <p className="text-xs uppercase tracking-wide text-gray-500">

            Viewing Reference

          </p>

          <p className="font-medium text-gray-900">

            {viewing.referenceNumber || viewing._id}

          </p>

        </div>

        <div className="text-right">

          <p className="text-xs uppercase tracking-wide text-gray-500">

            Last Updated

          </p>

          <p className="font-medium text-gray-900">

            {viewing.updatedAt

              ? new Date(viewing.updatedAt).toLocaleDateString()

              : "N/A"}

          </p>

        </div>

      </div>

    </div>

  );

};

export default ViewingDetailsCard;