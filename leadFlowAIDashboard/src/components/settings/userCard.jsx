/**
 * ==========================================================
 * Displays a CRM user in a clean reusable card.
 *
 * Used In
 * -------
 * • Settings
 * • User Management
 * • Admin Dashboard
 * • Team Management
 *
 * Displays
 * --------
 * ✓ Avatar
 * ✓ Name
 * ✓ Email
 * ✓ Role
 * ✓ Status
 * ✓ Assigned Leads
 * ✓ Last Active
 *
 * Future
 * ------
 * • Edit User
 * • Suspend User
 * • Reset Password
 * • View Profile
 *
 * ==========================================================
 */

import {
  Shield,
  UserCheck,
  Eye,
  Mail,
  Activity,
  Users,
} from "lucide-react";

import StatusBadge from "../common/statusBadge";

const UserCard = ({
  user,
  onClick,
}) => {

  if (!user) return null;

  /* ====================================================== */

  const roleIcon = () => {

    switch (user.role?.toLowerCase()) {

      case "admin":

        return (
          <Shield
            size={20}
            className="text-red-400"
          />
        );

      case "agent":

        return (
          <UserCheck
            size={20}
            className="text-cyan-400"
          />
        );

      case "viewer":

        return (
          <Eye
            size={20}
            className="text-emerald-400"
          />
        );

      default:

        return (
          <Users
            size={20}
            className="text-slate-400"
          />
        );

    }

  };

  /* ====================================================== */

  return (

    <div

      onClick={onClick}

      className="
        cursor-pointer
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-lg
        transition
        hover:border-cyan-500/40
        hover:bg-slate-800/40
      "

    >

      {/* ========================================= */}

      <div className="flex items-start gap-5">

        {/* Avatar */}

        <div
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            bg-cyan-500/10
            text-2xl
            font-bold
            text-cyan-400
          "
        >

          {user.name?.charAt(0)?.toUpperCase()}

        </div>

        {/* ===================================== */}

        <div className="flex-1">

          <div className="flex items-center gap-3">

            <h3
              className="
                text-xl
                font-bold
                text-white
              "
            >

              {user.name}

            </h3>

            {roleIcon()}

          </div>

          <div
            className="
              mt-2
              flex
              items-center
              gap-2
              text-sm
              text-slate-400
            "
          >

            <Mail size={15} />

            {user.email}

          </div>

        </div>

        <StatusBadge
          status={user.status || "Active"}
        />

      </div>

      {/* ========================================= */}

      <div
        className="
          mt-6
          grid
          gap-5
          md:grid-cols-3
        "
      >

        {/* ROLE */}

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">

            Role

          </p>

          <p
            className="
              mt-2
              font-semibold
              capitalize
              text-white
            "
          >

            {user.role}

          </p>

        </div>

        {/* LEADS */}

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">

            Assigned Leads

          </p>

          <p
            className="
              mt-2
              font-semibold
              text-white
            "
          >

            {user.assignedLeads ?? 0}

          </p>

        </div>

        {/* LAST ACTIVE */}

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">

            Last Active

          </p>

          <div
            className="
              mt-2
              flex
              items-center
              gap-2
              text-white
            "
          >

            <Activity
              size={15}
              className="text-emerald-400"
            />

            <span className="font-medium">

              {user.lastActive || "Just now"}

            </span>

          </div>

        </div>

      </div>

    </div>

  );

};

export default UserCard;

