/**
 * ==========================================================
 *
 * Customer-facing appointment panel.
 *
 * Allows a customer to:
 * • View appointment details
 * • Confirm viewing
 * • Request reschedule
 * • Cancel appointment
 * • Contact assigned agent
 *
 * This component NEVER exposes CRM information.
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/viewings/:id
 * POST   /api/viewings/request
 * PATCH  /api/viewings/:id/confirm
 * PATCH  /api/viewings/:id/reschedule
 * DELETE /api/viewings/:id
 *
 * ==========================================================
 */

import {
  CalendarDays,
  Clock3,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Hourglass,
} from "lucide-react";

const STATUS_STYLES = {

  pending: {
    icon: Hourglass,
    label: "Pending Approval",
    badge:
      "bg-amber-500/15 text-amber-300 border-amber-500/20",
  },

  scheduled: {
    icon: CalendarDays,
    label: "Scheduled",
    badge:
      "bg-blue-500/15 text-blue-300 border-blue-500/20",
  },

  confirmed: {
    icon: CheckCircle2,
    label: "Confirmed",
    badge:
      "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  },

  completed: {
    icon: CheckCircle2,
    label: "Completed",
    badge:
      "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  },

  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    badge:
      "bg-red-500/15 text-red-300 border-red-500/20",
  },

};

const AppointmentActions = ({

  appointment,

  onConfirm,

  onReschedule,

  onCancel,

  onCallAgent,

  onWhatsApp,

  onOpenMaps,

  onViewProperty,

  onLeaveReview,

  onBookAnother,

}) => {

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (!appointment) {

    return (

      <section
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >

        <div className="text-center">

          <AlertCircle
            className="
              mx-auto
              h-14
              w-14
              text-slate-600
            "
          />

          <h2
            className="
              mt-5
              text-xl
              font-bold
              text-white
            "
          >

            No Viewing Scheduled

          </h2>

          <p
            className="
              mt-3
              text-sm
              text-slate-400
            "
          >

            Once you request a property viewing,
            your appointment details will appear here.

          </p>

        </div>

      </section>

    );

  }

  /* ========================================================
     STATUS
  ======================================================== */

  const currentStatus =

    STATUS_STYLES[
      appointment.status
    ] || STATUS_STYLES.pending;

  const StatusIcon = currentStatus.icon;

  /* ========================================================
     COMPONENT
  ======================================================== */

  return (

    <section
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >

      {/*======================================================
        HEADER
      ======================================================*/}

      <div
        className="
          border-b
          border-slate-800
          bg-gradient-to-r
          from-cyan-600/10
          to-blue-600/10
          p-8
        "
      >

        <div
          className="
            flex
            flex-col
            gap-6
            lg:flex-row
          "
        >

          {/* Property */}

          <img
            src={
              appointment.propertyImage ||
              "/images/property-placeholder.jpg"
            }
            alt={appointment.propertyName}
            className="
              h-48
              w-full
              rounded-2xl
              object-cover
              lg:h-40
              lg:w-60
            "
          />

          {/* Appointment */}

          <div className="flex-1">

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >

              <h2
                className="
                  text-3xl
                  font-bold
                  text-white
                "
              >

                {appointment.propertyName}

              </h2>

              <span
                className={`
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  ${currentStatus.badge}
                `}
              >

                <StatusIcon className="h-4 w-4" />

                {currentStatus.label}

              </span>

            </div>

            <p
              className="
                mt-3
                text-sm
                text-slate-400
              "
            >

              Your scheduled property viewing
              appointment.

            </p>

          </div>

        </div>

      </div>

      {/*======================================================
        APPOINTMENT DETAILS
      ======================================================*/}

      <div
        className="
          grid
          gap-6
          p-8
          md:grid-cols-3
        "
      >

        {/* Date */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-5
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <CalendarDays
              className="
                h-5
                w-5
                text-cyan-400
              "
            />

            <span
              className="
                text-sm
                text-slate-400
              "
            >

              Date

            </span>

          </div>

          <p
            className="
              mt-3
              font-semibold
              text-white
            "
          >

            {appointment.appointmentDate}

          </p>

        </div>

        {/* Time */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-5
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <Clock3
              className="
                h-5
                w-5
                text-amber-400
              "
            />

            <span
              className="
                text-sm
                text-slate-400
              "
            >

              Time

            </span>

          </div>

          <p
            className="
              mt-3
              font-semibold
              text-white
            "
          >

            {appointment.appointmentTime}

          </p>

        </div>

        {/* Meeting Point */}

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-950/40
            p-5
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <MapPin
              className="
                h-5
                w-5
                text-emerald-400
              "
            />

            <span
              className="
                text-sm
                text-slate-400
              "
            >

              Meeting Point

            </span>

          </div>

          <p
            className="
              mt-3
              font-semibold
              text-white
            "
          >

            {appointment.meetingPoint}

          </p>

        </div>

      </div>

      {/*======================================================
        CUSTOMER ACTIONS
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            mb-6
            text-xl
            font-semibold
            text-white
          "
        >

          Appointment Actions

        </h3>

        {/*==================================================
          PENDING
        ==================================================*/}

        {appointment.status === "pending" && (

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() => onCancel?.(appointment)}
              className="
                rounded-xl
                bg-red-600
                px-6
                py-3
                font-semibold
                text-white
                transition
                hover:bg-red-500
              "
            >

              Cancel Request

            </button>

          </div>

        )}

        {/*==================================================
          SCHEDULED
        ==================================================*/}

        {appointment.status === "scheduled" && (

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() => onConfirm?.(appointment)}
              className="
                rounded-xl
                bg-emerald-500
                px-6
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-emerald-400
              "
            >

              Confirm Viewing

            </button>

            {appointment.canReschedule && (

              <button
                onClick={() =>
                  onReschedule?.(appointment)
                }
                className="
                  rounded-xl
                  border
                  border-cyan-500/30
                  bg-cyan-500/10
                  px-6
                  py-3
                  font-semibold
                  text-cyan-300
                  transition
                  hover:bg-cyan-500
                  hover:text-slate-950
                "
              >

                Request Reschedule

              </button>

            )}

            {appointment.canCancel && (

              <button
                onClick={() =>
                  onCancel?.(appointment)
                }
                className="
                  rounded-xl
                  bg-red-600
                  px-6
                  py-3
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-500
                "
              >

                Cancel Viewing

              </button>

            )}

          </div>

        )}

        {/*==================================================
          CONFIRMED
        ==================================================*/}

        {appointment.status === "confirmed" && (

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() =>
                onOpenMaps?.(appointment)
              }
              className="
                rounded-xl
                bg-cyan-500
                px-6
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >

              Open Maps

            </button>

            <button
              onClick={() =>
                onCallAgent?.(
                  appointment.agent
                )
              }
              className="
                rounded-xl
                border
                border-slate-700
                bg-slate-800
                px-6
                py-3
                font-semibold
                text-white
                transition
                hover:bg-slate-700
              "
            >

              Call Agent

            </button>

            <button
              onClick={() =>
                onWhatsApp?.(
                  appointment.agent
                )
              }
              className="
                rounded-xl
                bg-emerald-500
                px-6
                py-3
                font-semibold
                text-white
                transition
                hover:bg-emerald-400
              "
            >

              WhatsApp Agent

            </button>

            <button
              onClick={() =>
                onViewProperty?.(
                  appointment.propertyId
                )
              }
              className="
                rounded-xl
                border
                border-cyan-500/30
                bg-cyan-500/10
                px-6
                py-3
                font-semibold
                text-cyan-300
                transition
                hover:bg-cyan-500
                hover:text-slate-950
              "
            >

              View Property

            </button>

          </div>

        )}

        {/*==================================================
          COMPLETED
        ==================================================*/}

        {appointment.status === "completed" && (

          <div className="flex flex-wrap gap-4">

            <button
              onClick={() =>
                onLeaveReview?.(appointment)
              }
              className="
                rounded-xl
                bg-amber-500
                px-6
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-amber-400
              "
            >

              Leave Review

            </button>

            <button
              onClick={() =>
                onBookAnother?.()
              }
              className="
                rounded-xl
                bg-cyan-500
                px-6
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >

              Book Another Viewing

            </button>

          </div>

        )}

        {/*==================================================
          CANCELLED
        ==================================================*/}

        {appointment.status === "cancelled" && (

          <div
            className="
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/10
              p-5
            "
          >

            <p
              className="
                text-sm
                text-red-300
              "
            >

              This viewing appointment has been cancelled.
              You can schedule another viewing whenever you're ready.

            </p>

          </div>

        )}

      </div>

      {/*======================================================
        VIEWING COUNTDOWN
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/5
            p-6
          "
        >

          <h3
            className="
              text-lg
              font-semibold
              text-cyan-300
            "
          >

            Upcoming Viewing

          </h3>

          <p
            className="
              mt-3
              text-sm
              leading-7
              text-slate-400
            "
          >

            Please arrive at least
            <span className="font-semibold text-white">
              {" "}10 minutes early
            </span>
            {" "}for your scheduled property viewing.

            If you're delayed, kindly notify your assigned
            property consultant so they can assist you.

          </p>

        </div>

      </div>

      {/*======================================================
        VIEWING CHECKLIST
      ======================================================*/}

      <div
        className="
          border-t
          border-slate-800
          p-8
        "
      >

        <h3
          className="
            text-lg
            font-semibold
            text-white
          "
        >

          Before Your Viewing

        </h3>

        <ul
          className="
            mt-5
            space-y-3
            text-sm
            text-slate-400
          "
        >

          <li>
            ✓ Carry your identification document.
          </li>

          <li>
            ✓ Confirm the meeting location before travelling.
          </li>

          <li>
            ✓ Prepare any questions about the property.
          </li>

          <li>
            ✓ Notify your agent if your plans change.
          </li>

        </ul>

      </div>

      {/*======================================================
        FOOTER
      ======================================================*/}

      <div
        className="
          flex
          flex-col
          gap-4
          border-t
          border-slate-800
          bg-slate-950/40
          p-8
          text-sm
          text-slate-500
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <p>

          Powered by{" "}

          <span
            className="
              font-semibold
              text-cyan-400
            "
          >

            LeadFlow AI

          </span>

          {" "}• Helping you schedule property
          viewings faster and more efficiently.

        </p>

        <p>

          Appointment ID

          {" "}

          <span className="font-semibold">

            #{appointment.id}

          </span>

        </p>

      </div>

    </section>

  );

};

export default AppointmentActions;