/**
 * ==========================================================
 *
 * Displays scheduled property viewings for the
 * currently authenticated agent.
 *
 * Features
 * ----------------------------------------------------------
 * • Agent-specific viewings
 * • Upcoming viewings
 * • Today's schedule
 * • Monthly viewing list
 * • Month navigation
 * • Viewing details
 * • Safe API response normalization
 * • Safe date handling
 *
 * ==========================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Home,
} from "lucide-react";

import viewingService from "../../services/viewingService";

/*
==========================================================
DEFAULT STATE
==========================================================
*/

const EMPTY_VIEWINGS = [];

/*
==========================================================
DATE HELPERS
==========================================================
*/

/**
 * Converts a date-like value into YYYY-MM-DD.
 *
 * Supports:
 * • YYYY-MM-DD
 * • ISO date strings
 * • Date objects
 */
const normalizeDate = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const dateOnlyMatch = value.match(/^\d{4}-\d{2}-\d{2}/);

    if (dateOnlyMatch) {
      return dateOnlyMatch[0];
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
};

/**
 * Returns today's date without depending on
 * the browser's UTC conversion.
 */
const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Extracts the viewing date from possible backend
 * field names.
 */
const getViewingDate = (viewing) => {
  return normalizeDate(
    viewing?.date ||
      viewing?.viewingDate ||
      viewing?.scheduledDate ||
      viewing?.scheduledAt ||
      viewing?.startTime ||
      viewing?.startAt
  );
};

/**
 * Extracts a readable property title.
 */
const getPropertyTitle = (viewing) => {
  return (
    viewing?.propertyTitle ||
    viewing?.property?.title ||
    viewing?.property?.name ||
    "Property viewing"
  );
};

/**
 * Extracts a readable client name.
 */
const getClientName = (viewing) => {
  return (
    viewing?.clientName ||
    viewing?.leadName ||
    viewing?.customerName ||
    viewing?.lead?.name ||
    viewing?.customer?.name ||
    "Client"
  );
};

/**
 * Extracts viewing time from supported fields.
 */
const getViewingTime = (viewing) => {
  if (viewing?.time) {
    return viewing.time;
  }

  const dateValue =
    viewing?.scheduledAt ||
    viewing?.startTime ||
    viewing?.startAt;

  if (!dateValue) {
    return "Time not specified";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Time not specified";
  }

  return date.toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  });
};

/**
 * Extracts property location.
 */
const getPropertyLocation = (viewing) => {
  return (
    viewing?.propertyLocation ||
    viewing?.location ||
    viewing?.property?.location ||
    viewing?.property?.address ||
    ""
  );
};

/**
 * Extracts viewing status.
 */
const getViewingStatus = (viewing) => {
  return (
    viewing?.status ||
    viewing?.viewingStatus ||
    "scheduled"
  );
};

/*
==========================================================
COMPONENT
==========================================================
*/

const AgentCalendar = () => {
  /*
  ==========================================================
  VIEWINGS
  ==========================================================
  */

  const [viewings, setViewings] = useState(
    EMPTY_VIEWINGS
  );

  /*
  ==========================================================
  CALENDAR
  ==========================================================
  */

  const [currentDate, setCurrentDate] = useState(
    new Date()
  );

  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedViewing, setSelectedViewing] =
    useState(null);

  /*
  ==========================================================
  LOAD VIEWINGS
  ==========================================================
  */

  const loadViewings = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      const month =
        currentDate.getMonth() + 1;

      const year =
        currentDate.getFullYear();

      console.log(
        "[AgentCalendar] Loading agent viewings:",
        {
          month,
          year,
        }
      );

      const response =
        await viewingService.getMyViewings({
          month,
          year,
        });

      console.log(
        "[AgentCalendar] Raw viewing response:",
        response
      );

      /*
      ======================================================
      RESPONSE NORMALIZATION
      ======================================================
      Supports:

      [
        ...
      ]

      {
        data: [...]
      }

      {
        data: {
          data: [...]
        }
      }
      ======================================================
      */

      let viewingData = [];

      if (Array.isArray(response)) {
        viewingData = response;
      } else if (
        Array.isArray(response?.data)
      ) {
        viewingData = response.data;
      } else if (
        Array.isArray(response?.data?.data)
      ) {
        viewingData = response.data.data;
      }

      /*
      ======================================================
      NORMALIZE VIEWINGS
      ======================================================
      */

      const normalizedViewings =
        viewingData.map((viewing) => ({
          ...viewing,

          _id:
            viewing?._id ||
            viewing?.id,

          displayDate:
            getViewingDate(viewing),

          displayProperty:
            getPropertyTitle(viewing),

          displayClient:
            getClientName(viewing),

          displayTime:
            getViewingTime(viewing),

          displayLocation:
            getPropertyLocation(viewing),

          displayStatus:
            getViewingStatus(viewing),
        }));

      console.log(
        "[AgentCalendar] Normalized viewings:",
        normalizedViewings
      );

      setViewings(normalizedViewings);
    } catch (requestError) {
      console.error(
        "[AgentCalendar] Unable to load calendar:",
        requestError
      );

      setViewings([]);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load your viewing calendar."
      );
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  /*
  ==========================================================
  LOAD WHEN MONTH CHANGES
  ==========================================================
  */

  useEffect(() => {
    loadViewings();
  }, [loadViewings]);

  /*
  ==========================================================
  MONTH NAVIGATION
  ==========================================================
  */

  const previousMonth = () => {
    setSelectedViewing(null);

    setCurrentDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() - 1,
          1
        )
    );
  };

  const nextMonth = () => {
    setSelectedViewing(null);

    setCurrentDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + 1,
          1
        )
    );
  };

  /*
  ==========================================================
  GO TO CURRENT MONTH
  ==========================================================
  */

  const goToToday = () => {
    setSelectedViewing(null);

    setCurrentDate(new Date());
  };

  /*
  ==========================================================
  SELECT VIEWING
  ==========================================================
  */

  const handleSelectViewing = (viewing) => {
    setSelectedViewing(viewing);
  };

  /*
  ==========================================================
  CLEAR SELECTION
  ==========================================================
  */

  const clearSelection = () => {
    setSelectedViewing(null);
  };

  /*
  ==========================================================
  TODAY'S VIEWINGS
  ==========================================================
  */

  const today = getToday();

  const todaysViewings = useMemo(
    () =>
      viewings
        .filter(
          (viewing) =>
            viewing.displayDate === today
        )
        .sort((a, b) =>
          String(a.displayTime).localeCompare(
            String(b.displayTime)
          )
        ),
    [viewings, today]
  );

  /*
  ==========================================================
  UPCOMING VIEWINGS
  ==========================================================
  */

  const upcomingViewings = useMemo(
    () =>
      viewings
        .filter(
          (viewing) =>
            viewing.displayDate &&
            viewing.displayDate >= today
        )
        .sort((a, b) =>
          `${a.displayDate} ${a.displayTime}`.localeCompare(
            `${b.displayDate} ${b.displayTime}`
          )
        ),
    [viewings, today]
  );

  /*
  ==========================================================
  MONTH LABEL
  ==========================================================
  */

  const monthLabel =
    currentDate.toLocaleDateString(
      "en-KE",
      {
        month: "long",
        year: "numeric",
      }
    );

  /*
  ==========================================================
  FORMAT DISPLAY DATE
  ==========================================================
  */

  const formatDisplayDate = (dateValue) => {
    if (!dateValue) {
      return "Date not specified";
    }

    const date = new Date(
      `${dateValue}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-KE",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
  ==========================================================
  STATUS CLASS
  ==========================================================
  */

  const getStatusClass = (status) => {
    switch (
      String(status || "")
        .toLowerCase()
        .replace(/\s+/g, "_")
    ) {
      case "confirmed":
        return "bg-emerald-500/10 text-emerald-500";

      case "completed":
        return "bg-blue-500/10 text-blue-500";

      case "cancelled":
      case "canceled":
        return "bg-red-500/10 text-red-500";

      case "rescheduled":
        return "bg-amber-500/10 text-amber-500";

      default:
        return "bg-primary/10 text-primary";
    }
  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">
            Viewing Calendar
          </h1>

          <p className="text-muted-foreground">
            Loading your scheduled property
            viewings...
          </p>
        </div>

        <div className="flex items-center justify-center rounded-xl border bg-card py-32">
          <p className="text-muted-foreground">
            Loading calendar...
          </p>
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (
    <section className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Viewing Calendar
          </h1>

          <p className="text-muted-foreground">
            Manage your scheduled property
            viewings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            Today
          </button>

          <button
            type="button"
            onClick={previousMonth}
            aria-label="Previous month"
            className="rounded-lg border p-2 hover:bg-muted"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 rounded-lg border px-5 py-2">
            <Calendar size={18} />

            <span className="font-medium">
              {monthLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="rounded-lg border p-2 hover:bg-muted"
          >
            <ChevronRight size={18} />
          </button>

        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}

          <button
            type="button"
            onClick={loadViewings}
            className="ml-3 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            This Month
          </p>

          <p className="mt-2 text-3xl font-bold">
            {viewings.length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Today
          </p>

          <p className="mt-2 text-3xl font-bold">
            {todaysViewings.length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Upcoming
          </p>

          <p className="mt-2 text-3xl font-bold">
            {upcomingViewings.length}
          </p>
        </div>

      </div>

      {/* ======================================================
          TODAY'S VIEWINGS
      ====================================================== */}

      <section className="space-y-4">

        <h2 className="text-xl font-semibold">
          Today's Viewings
        </h2>

        <div className="rounded-xl border bg-card">

          {todaysViewings.length === 0 ? (
            <p className="p-6 text-muted-foreground">
              No viewings scheduled today.
            </p>
          ) : (
            <div className="divide-y">

              {todaysViewings.map(
                (viewing, index) => (

                  <button
                    type="button"
                    key={
                      viewing._id ||
                      `today-${index}`
                    }
                    onClick={() =>
                      handleSelectViewing(
                        viewing
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-muted"
                  >

                    <div className="min-w-0">

                      <h3 className="truncate font-medium">
                        {viewing.displayProperty}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {viewing.displayClient}
                      </p>

                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-sm font-medium">
                      <Clock size={16} />

                      {viewing.displayTime}
                    </div>

                  </button>
                )
              )}

            </div>
          )}

        </div>
      </section>

      {/* ======================================================
          MONTHLY VIEWINGS
      ====================================================== */}

      <section className="grid gap-8 lg:grid-cols-2">

        {/* ==================================================
            VIEWING LIST
        ================================================== */}

        <div className="rounded-xl border bg-card">

          <div className="border-b p-5">

            <h2 className="text-xl font-semibold">
              All Scheduled Viewings
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Viewings assigned to you for{" "}
              {monthLabel}.
            </p>

          </div>

          {viewings.length === 0 ? (

            <p className="p-6 text-muted-foreground">
              No viewings scheduled this month.
            </p>

          ) : (

            <div className="divide-y">

              {viewings.map(
                (viewing, index) => (

                  <button
                    type="button"
                    key={
                      viewing._id ||
                      `viewing-${index}`
                    }
                    onClick={() =>
                      handleSelectViewing(
                        viewing
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-muted"
                  >

                    <div className="min-w-0">

                      <h3 className="truncate font-medium">
                        {viewing.displayProperty}
                      </h3>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">

                        <span>
                          {formatDisplayDate(
                            viewing.displayDate
                          )}
                        </span>

                        <span>
                          {viewing.displayTime}
                        </span>

                      </div>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm ${getStatusClass(
                        viewing.displayStatus
                      )}`}
                    >
                      {viewing.displayStatus}
                    </span>

                  </button>
                )
              )}

            </div>

          )}

        </div>

        {/* ==================================================
            DETAILS
        ================================================== */}

        <div className="rounded-xl border bg-card p-6">

          {selectedViewing ? (

            <div className="space-y-5">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <h2 className="text-2xl font-semibold">
                    Viewing Details
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Scheduled property appointment
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm ${getStatusClass(
                    selectedViewing.displayStatus
                  )}`}
                >
                  {selectedViewing.displayStatus}
                </span>

              </div>

              <div className="space-y-4">

                <div className="flex gap-3">

                  <Home className="mt-1 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Property
                    </p>

                    <p className="font-medium">
                      {
                        selectedViewing.displayProperty
                      }
                    </p>
                  </div>

                </div>

                <div className="flex gap-3">

                  <User className="mt-1 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Client
                    </p>

                    <p className="font-medium">
                      {
                        selectedViewing.displayClient
                      }
                    </p>
                  </div>

                </div>

                <div className="flex gap-3">

                  <Calendar className="mt-1 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Date
                    </p>

                    <p className="font-medium">
                      {formatDisplayDate(
                        selectedViewing.displayDate
                      )}
                    </p>
                  </div>

                </div>

                <div className="flex gap-3">

                  <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Time
                    </p>

                    <p className="font-medium">
                      {
                        selectedViewing.displayTime
                      }
                    </p>
                  </div>

                </div>

                {selectedViewing.displayLocation && (
                  <div className="flex gap-3">

                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Location
                      </p>

                      <p className="font-medium">
                        {
                          selectedViewing.displayLocation
                        }
                      </p>
                    </div>

                  </div>
                )}

              </div>

              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border px-4 py-2 hover:bg-muted"
              >
                Close
              </button>

            </div>

          ) : (

            <div className="flex h-full min-h-[300px] items-center justify-center text-center">

              <div>

                <Calendar className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

                <p className="text-muted-foreground">
                  Select a viewing to see its
                  details.
                </p>

              </div>

            </div>

          )}

        </div>

      </section>

    </section>
  );
};

export default AgentCalendar;