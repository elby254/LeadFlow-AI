/**
 * ==========================================================
 * Displays the viewer's upcoming property viewing appointments.
 *
 * Allows viewers to quickly track scheduled visits,
 * view property information and contact the assigned agent.
 *
 * Used by:
 * • Viewer Dashboard
 *
 * Future Backend
 * ----------------------------------------------------------
 * GET /api/viewer/viewing-appointments
 *
 * Future Enhancements
 * ----------------------------------------------------------
 * • Google Maps integration
 * • AI reminders
 * • Calendar synchronization
 * • Travel time estimation
 * • Weather forecast
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  MapPin,
  User,
  Phone,
} from "lucide-react";

const ViewingAppointments = () => {

  //----------------------------------------------------------
  // Navigation
  //----------------------------------------------------------

  const navigate = useNavigate();

  //----------------------------------------------------------
  // State
  //----------------------------------------------------------

  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);

  //----------------------------------------------------------
  // Mock Data
  //----------------------------------------------------------

  useEffect(() => {

    // Temporary mock data
    // Replace with:
    // GET /api/viewer/viewing-appointments

    setTimeout(() => {

      setAppointments([

        {
          _id: "appointment001",

          propertyId: "property001",

          propertyName: "Luxury 4 Bedroom Villa",

          propertyImage:
            "https://images.unsplash.com/photo-1568605114967-8130f3a36994",

          location: "Karen",

          meetingPoint: "Karen Shopping Centre Gate",

          date: "2026-07-25",

          time: "10:00 AM",

          status: "Confirmed",

          agentId: "agent001",

          agentName: "Grace Wanjiru",

          agentPhone: "+254712345678",
        },

        {
          _id: "appointment002",

          propertyId: "property002",

          propertyName: "Modern Apartment",

          propertyImage:
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",

          location: "Westlands",

          meetingPoint: "Westlands Mall Entrance",

          date: "2026-07-27",

          time: "2:30 PM",

          status: "Pending",

          agentId: "agent002",

          agentName: "David Mwangi",

          agentPhone: "+254723456789",
        },

      ]);

      setLoading(false);

    }, 700);

  }, []);

  //----------------------------------------------------------
  // Navigation Helpers
  //----------------------------------------------------------

  const viewProperty = (propertyId) => {
    navigate(`/viewer/properties/${propertyId}`);
  };

  const contactAgent = (agentId) => {
    navigate(`/viewer/agents/${agentId}`);
  };

  //----------------------------------------------------------
  // Loading State
  //----------------------------------------------------------

  if (loading) {

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

        <p className="text-sm text-slate-400">
          Loading viewing appointments...
        </p>

      </section>

    );

  }

  //----------------------------------------------------------
  // Status Badge Styles
  //----------------------------------------------------------

  const getStatusStyles = (status) => {

    switch (status) {

      case "Confirmed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";

      case "Pending":
        return "bg-orange-500/20 text-orange-400 border-orange-500/20";

      case "Completed":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/20";

      case "Cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/20";

      default:
        return "bg-slate-700 text-slate-300 border-slate-600";

    }

  };

  //----------------------------------------------------------
  // Component
  //----------------------------------------------------------

  return (

    <section
      className="
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
          flex
          items-center
          justify-between
          border-b
          border-slate-800
          p-6
        "
      >

        <div>

          <h2
            className="
              flex
              items-center
              gap-2
              text-2xl
              font-bold
              text-white
            "
          >

            <CalendarDays
              size={24}
              className="text-cyan-400"
            />

            Viewing Appointments

          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-400
            "
          >

            Track your upcoming property viewing schedule.

          </p>

        </div>

        <div
          className="
            rounded-full
            border
            border-cyan-500/20
            bg-cyan-500/10
            px-5
            py-3
          "
        >

          <p className="text-xs text-cyan-300">

            Upcoming

          </p>

          <p
            className="
              text-2xl
              font-bold
              text-white
            "
          >

            {appointments.length}

          </p>

        </div>

      </div>

      {/*======================================================
        APPOINTMENT LIST
      ======================================================*/}

      <div className="space-y-6 p-6">

        {appointments.map((appointment) => (

          <article
            key={appointment._id}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              transition-all
              duration-300
              hover:border-cyan-500/40
              hover:shadow-lg
              hover:shadow-cyan-900/20
            "
          >

            {/* Image */}

            <img
              src={appointment.propertyImage}
              alt={appointment.propertyName}
              className="
                h-56
                w-full
                object-cover
              "
            />

            <div className="space-y-5 p-6">

              {/* Property */}

              <div>

                <div
                  className="
                    flex
                    items-start
                    justify-between
                  "
                >

                  <div>

                    <h3
                      className="
                        text-xl
                        font-bold
                        text-white
                      "
                    >

                      {appointment.propertyName}

                    </h3>

                    <p
                      className="
                        mt-2
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-slate-400
                      "
                    >

                      <MapPin size={16} />

                      {appointment.location}

                    </p>

                  </div>

                  <span
                    className={`
                      rounded-full
                      border
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      ${getStatusStyles(
                        appointment.status
                      )}
                    `}
                  >

                    {appointment.status}

                  </span>

                </div>

              </div>

              {/* Date & Time */}

              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-2
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-4
                  "
                >

                  <CalendarDays
                    size={18}
                    className="text-cyan-400"
                  />

                  <div>

                    <p className="text-xs text-slate-500">

                      Date

                    </p>

                    <p className="font-medium text-white">

                      {appointment.date}

                    </p>

                  </div>

                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-4
                  "
                >

                  <Clock3
                    size={18}
                    className="text-cyan-400"
                  />

                  <div>

                    <p className="text-xs text-slate-500">

                      Time

                    </p>

                    <p className="font-medium text-white">

                      {appointment.time}

                    </p>

                  </div>

                </div>

              </div>

              {/*======================================================
                MEETING DETAILS
              ======================================================*/}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-800
                  bg-slate-900
                  p-4
                "
              >

                <p className="text-xs text-slate-500">
                  Meeting Point
                </p>

                <p
                  className="
                    mt-1
                    font-medium
                    text-white
                  "
                >
                  {appointment.meetingPoint}
                </p>

              </div>

              {/*======================================================
                AGENT INFORMATION
              ======================================================*/}

              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-2
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-4
                  "
                >

                  <User
                    size={18}
                    className="text-cyan-400"
                  />

                  <div>

                    <p className="text-xs text-slate-500">
                      Assigned Agent
                    </p>

                    <p className="font-medium text-white">
                      {appointment.agentName}
                    </p>

                  </div>

                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-4
                  "
                >

                  <Phone
                    size={18}
                    className="text-cyan-400"
                  />

                  <div>

                    <p className="text-xs text-slate-500">
                      Agent Contact
                    </p>

                    <p className="font-medium text-white">
                      {appointment.agentPhone}
                    </p>

                  </div>

                </div>

              </div>

              {/*======================================================
                ACTION BUTTONS
              ======================================================*/}

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    viewProperty(
                      appointment.propertyId
                    )
                  }
                  className="
                    flex-1
                    rounded-xl
                    bg-cyan-500
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-slate-950
                    transition
                    hover:bg-cyan-400
                  "
                >

                  View Property

                </button>

                <button
                  onClick={() =>
                    contactAgent(
                      appointment.agentId
                    )
                  }
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-800
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:border-cyan-500/40
                    hover:bg-slate-700
                  "
                >

                  Contact Agent

                </button>

              </div>

            </div>

          </article>

        ))}

        {/*======================================================
          EMPTY STATE
        ======================================================*/}

        {appointments.length === 0 && (

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              p-10
              text-center
            "
          >

            <CalendarDays
              size={42}
              className="
                mx-auto
                text-slate-600
              "
            />

            <h3
              className="
                mt-4
                text-xl
                font-semibold
                text-white
              "
            >

              No Viewing Appointments

            </h3>

            <p
              className="
                mt-2
                text-sm
                text-slate-400
              "
            >

              You haven't scheduled any property
              viewings yet.

            </p>

          </div>

        )}

      </div>

      {/*======================================================
        FOOTER
      ======================================================*/}

      <div
        className="
          flex
          items-center
          justify-between
          border-t
          border-slate-800
          p-6
        "
      >

        <p
          className="
            text-sm
            text-slate-400
          "
        >

          Stay organized by tracking all your upcoming
          property viewings in one place.

        </p>

        <button
          onClick={() =>
            navigate("/viewer/viewing-appointments")
          }
          className="
            rounded-xl
            border
            border-cyan-500/30
            bg-cyan-500/10
            px-5
            py-3
            text-sm
            font-semibold
            text-cyan-300
            transition
            hover:bg-cyan-500
            hover:text-slate-950
          "
        >

          View All Appointments →

        </button>

      </div>

    </section>

  );

};

export default ViewingAppointments;