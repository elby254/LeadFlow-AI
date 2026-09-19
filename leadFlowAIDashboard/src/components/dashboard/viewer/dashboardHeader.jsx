/**

* ==========================================================
*
* Viewer Dashboard Header
*
* Customer-facing dashboard header.
*
* Responsibilities
* ---
* ✓ Welcome viewer
* ✓ Search properties
* ✓ Browse listings
* ✓ Contact agent
* ✓ View upcoming viewing
* ✓ View pending viewing request
* ✓ Access viewing calendar
* ✓ Access conversations
*
* Viewer Workflow
* ---
* Property Interest
* ```
    ↓
  ```
* Contact Agent
* ```
    ↓
  ```
* Request Viewing
* ```
    ↓
  ```
* Viewing Scheduled
* ```
    ↓
  ```
* Viewing Completed
* ```
    ↓
  ```
* Feedback
*
* Used By
* ---
* ✓ ViewerDashboard.jsx
*
* ==========================================================
  */

import { useState } from "react";

import {
Search,
MessageCircle,
House,
CalendarDays,
Clock3,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

/* ==========================================================
COMPONENT
========================================================== */

const DashboardHeader = ({
title = "Property Portal",

subtitle =
"Browse available properties, connect with agents and manage your property viewings.",

// --------------------------------------------------------
// VIEWING DATA
// --------------------------------------------------------

upcomingViewings = 0,

pendingViewings = 0,

nextViewing = null,

// --------------------------------------------------------
// LISTING DATA
// --------------------------------------------------------

listingsAvailable = true,
}) => {

const navigate =
useNavigate();

const [search, setSearch] =
useState("");

/* ========================================================
SEARCH PROPERTIES
======================================================== */

const handleSearch = (event) => {


event?.preventDefault();

const query =
  search.trim();

if (query) {

  navigate(
    `/properties?search=${encodeURIComponent(query)}`
  );

  return;

}

navigate("/properties");


};

/* ========================================================
CONTACT AGENT
======================================================== */

const handleContactAgent = () => {


navigate("/conversations");


};

/* ========================================================
VIEWINGS
======================================================== */

const handleViewings = () => {


navigate("/viewings");


};

/* ========================================================
NEXT VIEWING
======================================================== */

const handleNextViewing = () => {


if (
  nextViewing?._id ||
  nextViewing?.id
) {

  const viewingId =
    nextViewing._id ||
    nextViewing.id;

  navigate(
    `/viewings/${viewingId}`
  );

  return;

}

navigate("/viewings");


};

/* ========================================================
RENDER
======================================================== */

return (


<header className="w-full">

  {/* ====================================================
      TOP SECTION
  ==================================================== */}

  <div
    className="
      flex
      flex-col
      gap-6
      xl:flex-row
      xl:items-center
      xl:justify-between
    "
  >

    {/* ==================================================
        WELCOME
    ================================================== */}

    <div>

      <h1
        className="
          text-3xl
          font-bold
          text-white
        "
      >
        {title}
      </h1>

      <p
        className="
          mt-3
          max-w-3xl
          text-slate-400
        "
      >
        {subtitle}
      </p>

    </div>

    {/* ==================================================
        PORTAL STATUS
    ================================================== */}

    <div className="flex flex-wrap gap-3">

      {/* LISTINGS */}

      <div
        className="
          flex
          items-center
          gap-2
          rounded-full
          border
          border-cyan-500/30
          bg-cyan-500/15
          px-4
          py-2
          text-sm
          font-medium
          text-cyan-400
        "
      >

        <House size={16} />

        {listingsAvailable
          ? "Listings Available"
          : "No Listings Available"}

      </div>

      {/* PENDING VIEWING */}

      {pendingViewings > 0 && (

        <button
          type="button"
          onClick={handleViewings}
          className="
            flex
            items-center
            gap-2
            rounded-full
            border
            border-amber-500/30
            bg-amber-500/15
            px-4
            py-2
            text-sm
            font-medium
            text-amber-400
            transition
            hover:bg-amber-500/20
          "
        >

          <CalendarDays size={16} />

          {pendingViewings} Viewing
          {pendingViewings !== 1
            ? "s"
            : ""}{" "}
          Pending

        </button>

      )}

    </div>

  </div>

  {/* ====================================================
      NEXT VIEWING
  ==================================================== */}

  {nextViewing && (

    <button
      type="button"
      onClick={handleNextViewing}
      className="
        mt-6
        flex
        w-full
        flex-col
        gap-3
        rounded-2xl
        border
        border-blue-500/20
        bg-blue-500/10
        p-4
        text-left
        transition
        hover:border-blue-500/40
        hover:bg-blue-500/15
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >

      <div className="flex items-center gap-3">

        <div
          className="
            flex
            h-10
            w-10
            flex-shrink-0
            items-center
            justify-center
            rounded-xl
            bg-blue-500/15
            text-blue-400
          "
        >

          <CalendarDays size={20} />

        </div>

        <div>

          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-blue-400
            "
          >
            Next Viewing
          </p>

          <p
            className="
              mt-1
              font-semibold
              text-white
            "
          >
            {nextViewing.propertyName ||
              "Property Viewing"}
          </p>

          <p
            className="
              mt-1
              text-sm
              text-slate-400
            "
          >
            {formatViewingDate(
              nextViewing.scheduledAt ||
              nextViewing.startTime ||
              nextViewing.date
            )}

          </p>

        </div>

      </div>

      <ViewingStatus
        status={
          nextViewing.status ||
          "Scheduled"
        }
      />

    </button>

  )}

  {/* ====================================================
      SEARCH + ACTIONS
  ==================================================== */}

  <div
    className="
      mt-8
      flex
      flex-col
      gap-4
      xl:flex-row
      xl:items-center
      xl:justify-between
    "
  >

    {/* ==================================================
        SEARCH
    ================================================== */}

    <form
      onSubmit={handleSearch}
      className="
        relative
        w-full
        xl:max-w-xl
      "
    >

      <Search
        size={18}
        className="
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-slate-500
        "
      />

      <input
        type="text"
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
        placeholder="
          Search by location, property
          type or budget...
        "
        className="
          w-full
          rounded-xl
          border
          border-slate-700
          bg-slate-800
          py-3
          pl-11
          pr-4
          text-white
          placeholder:text-slate-500
          outline-none
          transition
          focus:border-cyan-500
          focus:ring-2
          focus:ring-cyan-500/20
        "
      />

    </form>

    {/* ==================================================
        BUTTONS
    ================================================== */}

    <div className="flex flex-wrap gap-3">

      {/* BROWSE */}

      <button
        type="button"
        onClick={() =>
          navigate("/properties")
        }
        className="
          flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-700
          bg-slate-800
          px-5
          py-3
          text-sm
          font-medium
          text-slate-300
          transition
          hover:border-cyan-500/40
          hover:bg-slate-700
        "
      >

        <House size={17} />

        Browse Properties

      </button>

      {/* VIEWINGS */}

      <button
        type="button"
        onClick={handleViewings}
        className="
          flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-700
          bg-slate-800
          px-5
          py-3
          text-sm
          font-medium
          text-slate-300
          transition
          hover:border-blue-500/40
          hover:bg-slate-700
        "
      >

        <CalendarDays size={17} />

        My Viewings

        {upcomingViewings > 0 && (

          <span
            className="
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-blue-600
              px-1.5
              text-[10px]
              font-bold
              text-white
            "
          >
            {upcomingViewings}
          </span>

        )}

      </button>

      {/* CONTACT AGENT */}

      <button
        type="button"
        onClick={handleContactAgent}
        className="
          flex
          items-center
          gap-2
          rounded-xl
          bg-cyan-600
          px-5
          py-3
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-cyan-500
        "
      >

        <MessageCircle size={17} />

        Contact Agent

      </button>

    </div>

  </div>

</header>


);

};

/* ==========================================================
VIEWING STATUS
========================================================== */

const ViewingStatus = ({
status,
}) => {

const normalized =
String(status)
.toLowerCase()
.replace(/\s+/g, "_");

const styles = {


requested:
  "bg-amber-500/15 text-amber-400 border-amber-500/20",

approved:
  "bg-blue-500/15 text-blue-400 border-blue-500/20",

scheduled:
  "bg-blue-500/15 text-blue-400 border-blue-500/20",

rescheduled:
  "bg-purple-500/15 text-purple-400 border-purple-500/20",

completed:
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",

cancelled:
  "bg-red-500/15 text-red-400 border-red-500/20",


};

return (


<span
  className={`
    inline-flex
    items-center
    gap-2
    self-start
    rounded-full
    border
    px-3
    py-1.5
    text-xs
    font-semibold
    sm:self-auto
    ${styles[normalized] || styles.scheduled}
  `}
>

  <span className="h-1.5 w-1.5 rounded-full bg-current" />

  {status}

</span>


);

};

/* ==========================================================
FORMAT VIEWING DATE
========================================================== */

const formatViewingDate = (
value
) => {

if (!value) {

```
return "Date to be confirmed";
```

}

const date =
new Date(value);

if (
Number.isNaN(
date.getTime()
)
) {

```
return String(value);
```

}

return date.toLocaleString(
"en-KE",
{
weekday: "short",
day: "numeric",
month: "short",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
}
);

};

export default DashboardHeader;
