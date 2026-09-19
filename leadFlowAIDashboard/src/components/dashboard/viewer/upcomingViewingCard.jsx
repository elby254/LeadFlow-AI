// ======================================================
// Viewer Dashboard
// Upcoming Viewing Widget
// ======================================================

import {

  CalendarDays,
  Clock3,
  Building2,
  MapPin,

} from "lucide-react";

import StatusBadge from "../../common/statusBadge";

const UpcomingViewingCard = ({

  viewing,

}) => {

  // ====================================================
  // EMPTY STATE
  // ====================================================

  if (!viewing) {

    return (

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold text-gray-900">

          Upcoming Viewing

        </h2>

        <div className="py-8 text-center">

          <CalendarDays

            size={42}

            className="mx-auto mb-3 text-gray-300"

          />

          <p className="text-gray-500">

            You have no upcoming property viewings.

          </p>

        </div>

      </div>

    );

  }

  // ====================================================
  // DATE LABEL
  // ====================================================

  const viewingDate = new Date(viewing.date);

  const today = new Date();

  const tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  let dateLabel = viewingDate.toLocaleDateString();

  if (

    viewingDate.toDateString() ===

    today.toDateString()

  ) {

    dateLabel = "Today";

  } else if (

    viewingDate.toDateString() ===

    tomorrow.toDateString()

  ) {

    dateLabel = "Tomorrow";

  }

  // ====================================================
  // COMPONENT
  // ====================================================

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="flex items-center justify-between border-b px-6 py-5">

        <div>

          <h2 className="text-lg font-semibold text-gray-900">

            Upcoming Viewing

          </h2>

          <p className="mt-1 text-sm text-gray-500">

            Your next scheduled property visit.

          </p>

        </div>

        <StatusBadge

          status={viewing.status}

        />

      </div>

      {/* ============================================== */}
      {/* VIEWING SUMMARY */}
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

            <p className="font-semibold text-gray-900">

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

          <CalendarDays

            size={18}

            className="text-indigo-600"

          />

          <div>

            <p className="text-xs uppercase tracking-wide text-gray-500">

              Viewing Date

            </p>

            <p className="font-medium text-gray-900">

              {dateLabel}

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

        {/* ============================================== */}
        {/* AGENT */}
        {/* ============================================== */}

        <div className="rounded-lg bg-blue-50 p-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">

            Assigned Agent

          </p>

          <p className="mt-1 font-medium text-gray-900">

            {viewing.agentName || "Awaiting Assignment"}

          </p>

        </div>

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

            Office

          </p>

          <p className="font-medium text-gray-900">

            {viewing.office || "Main Office"}

          </p>

        </div>

      </div>

    </div>

  );

};

export default UpcomingViewingCard;