/**
 * ==========================================================
 * Displays all CRM roles and their permissions.
 *
 * This is an ADMIN SETTINGS component.
 *
 * Current Roles
 * -------------
 * • Admin
 * • Agent
 * • Viewer
 *
 * Future
 * ------
 * Later this table can support:
 * • Add Role
 * • Edit Permissions
 * • Delete Role
 *
 * Backend
 * -------
 * GET /settings/roles
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Shield,
  UserCheck,
  Eye,
} from "lucide-react";

import settingsService from "../../services/settingsService";

const RoleTable = () => {

  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadRoles();

  }, []);

  const loadRoles = async () => {

    try {

      setLoading(true);

      const response =
        await settingsService.getRoles();

      setRoles(response || []);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  /* ===================================================== */

  const roleIcon = (role) => {

    switch (role.toLowerCase()) {

      case "admin":

        return (
          <Shield
            size={18}
            className="text-red-400"
          />
        );

      case "agent":

        return (
          <UserCheck
            size={18}
            className="text-cyan-400"
          />
        );

      case "viewer":

        return (
          <Eye
            size={18}
            className="text-emerald-400"
          />
        );

      default:

        return (
          <Shield
            size={18}
            className="text-slate-400"
          />
        );

    }

  };

  /* ===================================================== */

  return (

    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-lg
      "
    >

      {/* ========================================= */}

      <div
        className="
          border-b
          border-slate-800
          p-6
        "
      >

        <h2
          className="
            text-2xl
            font-bold
            text-white
          "
        >

          User Roles

        </h2>

        <p
          className="
            mt-2
            text-slate-400
          "
        >

          Current CRM access roles and permissions.

        </p>

      </div>

      {/* ========================================= */}

      {loading ? (

        <div
          className="
            p-10
            text-center
            text-slate-400
          "
        >

          Loading roles...

        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr
                className="
                  border-b
                  border-slate-800
                  text-left
                "
              >

                <th className="px-6 py-4 text-slate-400">

                  Role

                </th>

                <th className="px-6 py-4 text-slate-400">

                  Dashboard

                </th>

                <th className="px-6 py-4 text-slate-400">

                  Permissions

                </th>

                <th className="px-6 py-4 text-slate-400">

                  Users

                </th>

              </tr>

            </thead>

            <tbody>

              {roles.map((role) => (

                <tr
                  key={role._id || role.name}
                  className="
                    border-b
                    border-slate-800
                    transition
                    hover:bg-slate-800/40
                  "
                >

                  {/* ROLE */}

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      {roleIcon(role.name)}

                      <span
                        className="
                          font-semibold
                          text-white
                        "
                      >

                        {role.name}

                      </span>

                    </div>

                  </td>

                  {/* DASHBOARD */}

                  <td
                    className="
                      px-6
                      py-5
                      text-slate-300
                    "
                  >

                    {role.dashboard}

                  </td>

                  {/* PERMISSIONS */}

                  <td className="px-6 py-5">

                    <div className="flex flex-wrap gap-2">

                      {role.permissions?.map(
                        (permission) => (

                          <span

                            key={permission}

                            className="
                              rounded-full
                              border
                              border-cyan-500/20
                              bg-cyan-500/10
                              px-3
                              py-1
                              text-xs
                              text-cyan-300
                            "

                          >

                            {permission}

                          </span>

                        )
                      )}

                    </div>

                  </td>

                  {/* USERS */}

                  <td
                    className="
                      px-6
                      py-5
                      font-semibold
                      text-white
                    "
                  >

                    {role.userCount ?? 0}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </section>

  );

};

export default RoleTable;

