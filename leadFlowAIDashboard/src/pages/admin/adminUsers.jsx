/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Manage all platform users.
 *
 * Features
 * ----------------------------------------------------------
 * • User search
 * • Role filter
 * • Status filter
 * • Pagination
 * • User statistics
 * • User management
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {

  Users,

  UserCheck,

  Shield,

  UserX,

} from "lucide-react";

import userService from "../../services/userService";

const DEFAULT_FILTERS = {

  search: "",

  role: "",

  status: "",

};

const AdminUsers = () => {

  /*
  ==========================================================
  USERS
  ==========================================================
  */

  const [

    users,

    setUsers,

  ] = useState([]);

  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [

    filters,

    setFilters,

  ] = useState(

    DEFAULT_FILTERS

  );

  /*
  ==========================================================
  PAGINATION
  ==========================================================
  */

  const [

    currentPage,

    setCurrentPage,

  ] = useState(1);

  const [

    totalPages,

    setTotalPages,

  ] = useState(1);

  /*
  ==========================================================
  SELECTED USER
  ==========================================================
  */

  const [

    selectedUser,

    setSelectedUser,

  ] = useState(null);

  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const [

    summary,

    setSummary,

  ] = useState({

    totalUsers: 0,

    activeUsers: 0,

    admins: 0,

    suspended: 0,

  });

  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [

    loading,

    setLoading,

  ] = useState(true);

/*
==========================================================
LOAD USERS
==========================================================
*/

const loadUsers = async (

  page = currentPage

) => {

  try {

    setLoading(true);

    const response =

      await userService.getUsers({

        page,

        search: filters.search,

        role: filters.role,

        status: filters.status,

      });

    /*
    Expected Backend

    {
      data:[],
      pagination:{
        totalPages
      }
    }
    */

    const userData =

      response?.data || [];

    setUsers(userData);

    setTotalPages(

      response?.pagination?.totalPages ||

      1

    );

    /*
    ======================================================
    SUMMARY
    ======================================================
    */

    setSummary({

      totalUsers:

        userData.length,

      activeUsers:

        userData.filter(

          (user) =>

            user.status === "active"

        ).length,

      admins:

        userData.filter(

          (user) =>

            user.role === "admin"

        ).length,

      suspended:

        userData.filter(

          (user) =>

            user.status === "suspended"

        ).length,

    });

  } catch (error) {

    console.error(

      "Unable to load users",

      error

    );

  } finally {

    setLoading(false);

  }

};

/*
==========================================================
INITIAL LOAD
==========================================================
*/

useEffect(() => {

  loadUsers(currentPage);

}, [

  currentPage,

  filters.role,

  filters.status,

]);

/*
==========================================================
SEARCH
==========================================================
*/

const handleSearch = async () => {

  setCurrentPage(1);

  await loadUsers(1);

};

/*
==========================================================
FILTER CHANGE
==========================================================
*/

const handleFilterChange = (

  event

) => {

  const {

    name,

    value,

  } = event.target;

  setFilters((previous) => ({

    ...previous,

    [name]: value,

  }));

};

/*
==========================================================
RESET FILTERS
==========================================================
*/

const handleResetFilters = () => {

  setFilters(

    DEFAULT_FILTERS

  );

  setCurrentPage(1);

};

/*
==========================================================
SELECT USER
==========================================================
*/

const handleSelectUser = (

  user

) => {

  setSelectedUser(user);

};

/*
==========================================================
CLEAR USER
==========================================================
*/

const clearSelectedUser = () => {

  setSelectedUser(null);

};

/*
==========================================================
SUMMARY CARDS
==========================================================
*/

const dashboardCards = [

  {

    title: "Users",

    value: summary.totalUsers,

    icon: Users,

  },

  {

    title: "Active",

    value: summary.activeUsers,

    icon: UserCheck,

  },

  {

    title: "Admins",

    value: summary.admins,

    icon: Shield,

  },

  {

    title: "Suspended",

    value: summary.suspended,

    icon: UserX,

  },

];

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Loading users...

        </p>

      </div>

    );

  }

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (

    <section className="space-y-10">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>

        <h1 className="text-3xl font-bold">

          Platform Users

        </h1>

        <p className="text-muted-foreground">

          Manage all registered users across
          LeadFlow AI.

        </p>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {dashboardCards.map((card) => {

          const Icon = card.icon;

          return (

            <div

              key={card.title}

              className="rounded-xl border bg-card p-6"

            >

              <div className="mb-4 flex items-center justify-between">

                <Icon className="h-7 w-7 text-primary" />

                <span className="text-3xl font-bold">

                  {card.value}

                </span>

              </div>

              <h3 className="font-semibold">

                {card.title}

              </h3>

            </div>

          );

        })}

      </div>

      {/* ======================================================
          SEARCH + FILTERS
      ====================================================== */}

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 md:flex-row">

        <input

          type="text"

          name="search"

          value={filters.search}

          onChange={handleFilterChange}

          placeholder="Search users..."

          className="flex-1 rounded-lg border bg-background px-4 py-3"

        />

        <select

          name="role"

          value={filters.role}

          onChange={handleFilterChange}

          className="rounded-lg border bg-background px-4 py-3"

        >

          <option value="">

            All Roles

          </option>

          <option value="viewer">

            Viewer

          </option>

          <option value="agent">

            Agent

          </option>

          <option value="admin">

            Admin

          </option>

        </select>

        <select

          name="status"

          value={filters.status}

          onChange={handleFilterChange}

          className="rounded-lg border bg-background px-4 py-3"

        >

          <option value="">

            All Status

          </option>

          <option value="active">

            Active

          </option>

          <option value="inactive">

            Inactive

          </option>

          <option value="suspended">

            Suspended

          </option>

        </select>

        <button

          onClick={handleSearch}

          className="rounded-lg bg-primary px-5 py-3 text-primary-foreground"

        >

          Search

        </button>

        <button

          onClick={handleResetFilters}

          className="rounded-lg border px-5 py-3"

        >

          Reset

        </button>

      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="grid gap-8 lg:grid-cols-2">

        {/* ==================================================
            USERS LIST
        ================================================== */}

        <div className="rounded-xl border bg-card">

          <div className="border-b p-5">

            <h2 className="text-xl font-semibold">

              Registered Users

            </h2>

          </div>

          {users.length === 0 ? (

            <p className="p-6 text-muted-foreground">

              No users found.

            </p>

          ) : (

            <div className="divide-y">

              {users.map((user) => (

                <button

                  key={user._id}

                  onClick={() =>

                    handleSelectUser(user)

                  }

                  className="flex w-full items-center justify-between p-5 text-left transition hover:bg-muted"

                >

                  <div>

                    <h3 className="font-medium">

                      {user.firstName} {user.lastName}

                    </h3>

                    <p className="text-sm text-muted-foreground">

                      {user.email}

                    </p>

                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">

                    {user.role}

                  </span>

                </button>

              ))}

            </div>

          )}

        </div>

        {/* ==================================================
            USER DETAILS
        ================================================== */}

        <div className="rounded-xl border bg-card p-6">

          {selectedUser ? (

            <div className="space-y-5">

              <h2 className="text-2xl font-semibold">

                User Details

              </h2>

              <div>

                <p className="text-sm text-muted-foreground">

                  Name

                </p>

                <p className="font-medium">

                  {selectedUser.firstName}{" "}

                  {selectedUser.lastName}

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Email

                </p>

                <p className="font-medium">

                  {selectedUser.email}

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Phone

                </p>

                <p className="font-medium">

                  {selectedUser.phone || "-"}

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Role

                </p>

                <p className="font-medium capitalize">

                  {selectedUser.role}

                </p>

              </div>

              <div>

                <p className="text-sm text-muted-foreground">

                  Status

                </p>

                <p className="font-medium capitalize">

                  {selectedUser.status}

                </p>

              </div>

              <button

                onClick={clearSelectedUser}

                className="rounded-lg border px-4 py-2 hover:bg-muted"

              >

                Close

              </button>

            </div>

          ) : (

            <div className="flex h-full items-center justify-center text-center">

              <p className="text-muted-foreground">

                Select a user to view their
                details.

              </p>

            </div>

          )}

        </div>

      </div>

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {totalPages > 1 && (

        <div className="flex items-center justify-center gap-3">

          <button

            disabled={currentPage === 1}

            onClick={() =>

              setCurrentPage((page) => page - 1)

            }

            className="rounded-lg border px-4 py-2 disabled:opacity-50"

          >

            Previous

          </button>

          <span className="text-sm text-muted-foreground">

            Page {currentPage} of {totalPages}

          </span>

          <button

            disabled={currentPage === totalPages}

            onClick={() =>

              setCurrentPage((page) => page + 1)

            }

            className="rounded-lg border px-4 py-2 disabled:opacity-50"

          >

            Next

          </button>

        </div>

      )}

    </section>

  );

};

export default AdminUsers;