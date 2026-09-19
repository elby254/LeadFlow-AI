/**
 * ============================================================
 *
 * PROPERTY STATISTICS
 *
 * Route
 * ------------------------------------------------------------
 * Admin:
 * /admin/properties/statistics
 *
 * Agent:
 * /agent/properties/statistics
 *
 * Backend
 * ------------------------------------------------------------
 * GET /api/properties/statistics
 *
 * Purpose
 * ------------------------------------------------------------
 * Displays organization-level property statistics.
 *
 * Access
 * ------------------------------------------------------------
 * • Admin
 * • Agent
 *
 * IMPORTANT
 * ------------------------------------------------------------
 * This page MUST NOT render MainLayout.
 *
 * MainLayout is already provided by App.jsx.
 *
 * ============================================================
 *
 * FRONTEND DATA CONTRACT
 * ------------------------------------------------------------
 *
 * This page consumes PROPERTY statistics only.
 *
 * Expected examples:
 *
 * statistics.totalProperties
 * statistics.availableProperties
 * statistics.soldProperties
 * statistics.reservedProperties
 * statistics.archivedProperties
 *
 * Supported fallback names:
 *
 * statistics.total
 * statistics.available
 * statistics.sold
 * statistics.reserved
 * statistics.archived
 *
 * IMPORTANT
 * ------------------------------------------------------------
 * Lead intent analytics are NOT property statistics.
 *
 * Do NOT treat:
 *
 * analytics.intent
 *
 * as:
 *
 * lead.intent
 *
 * If analytics are returned by the backend, the correct
 * analytics contract is:
 *
 * analytics.intentDistribution
 *
 * and:
 *
 * analytics.averageBuyingIntent
 *
 * is a numeric AI insight metric.
 *
 * Neither value is used as lead.intent on this page.
 *
 * ============================================================
 */

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import propertyService from "../../services/propertyService";

/* ==========================================================
   SAFE NUMBER HELPER
========================================================== */

/**
 * Converts a possible backend value into a safe number.
 *
 * This prevents invalid/null/undefined statistics from
 * breaking the UI or producing NaN.
 */
const toSafeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

/* ==========================================================
   PROPERTY STATISTICS
========================================================== */

const PropertyStatistics = () => {

  console.log(
    "PROPERTY STATISTICS PAGE MOUNTED"
  );

  /* ========================================================
     STATE
  ======================================================== */

  const [
    statistics,
    setStatistics,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================================
     FETCH PROPERTY STATISTICS

     Backend:
     GET /api/properties/statistics
  ======================================================== */

  const fetchStatistics = useCallback(
    async () => {

      console.log(
        "PROPERTY STATISTICS FETCH STARTED"
      );

      try {

        setLoading(true);

        setError("");

        const data =
          await propertyService
            .getPropertyStatistics();

        console.log(
          "PROPERTY STATISTICS RESPONSE:",
          data
        );

        /**
         * ----------------------------------------------------
         * PROPERTY STATISTICS CONTRACT
         * ----------------------------------------------------
         *
         * The service should return the property statistics
         * object.
         *
         * Some service implementations may return:
         *
         * {
         *   data: {...}
         * }
         *
         * while others return the object directly.
         *
         * Support both without changing the service contract.
         */
        const normalizedData =
          data?.data &&
          typeof data.data === "object"
            ? data.data
            : data;

        setStatistics(
          normalizedData || {}
        );

      } catch (requestError) {

        console.error(
          "PROPERTY STATISTICS ERROR:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load property statistics."
        );

        setStatistics(null);

      } finally {

        setLoading(false);

      }

    },
    []
  );

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    fetchStatistics();

  }, [fetchStatistics]);

  /* ========================================================
     SAFE PROPERTY STATISTICS VALUES
     
     Property status is the single source of truth.
     
     Supported statistics:
     • Total
     • Available
     • Sold
     • Reserved
     • Archived
  ======================================================== */

  const totalProperties =
    toSafeNumber(
      statistics?.totalProperties ??
      statistics?.total
    );

  const availableProperties =
    toSafeNumber(
      statistics?.availableProperties ??
      statistics?.available
    );

  const soldProperties =
    toSafeNumber(
      statistics?.soldProperties ??
      statistics?.sold
    );

  const reservedProperties =
    toSafeNumber(
      statistics?.reservedProperties ??
      statistics?.reserved
    );

  const archivedProperties =
    toSafeNumber(
      statistics?.archivedProperties ??
      statistics?.archived
    );

  /* ========================================================
     IMPORTANT ANALYTICS SEPARATION
     
     This page intentionally does NOT map analytics to
     lead.intent.
     
     Lead intent belongs to:
     
     • lead.intent
     
     Canonical values:
     
     • rent
     • buy
     • property_search
     
     Aggregate lead analytics belong to:
     
     • analytics.intentDistribution
     • analytics.averageBuyingIntent
     
     Those values are intentionally not used as property
     inventory statistics on this page.
  ======================================================== */

  /* ========================================================
     CALCULATED VALUES
  ======================================================== */

  const availablePercentage =
    totalProperties > 0
      ? Math.round(
          (
            availableProperties /
            totalProperties
          ) * 100
        )
      : 0;

  const soldPercentage =
    totalProperties > 0
      ? Math.round(
          (
            soldProperties /
            totalProperties
          ) * 100
        )
      : 0;

  const reservedPercentage =
    totalProperties > 0
      ? Math.round(
          (
            reservedProperties /
            totalProperties
          ) * 100
        )
      : 0;

  const archivedPercentage =
    totalProperties > 0
      ? Math.round(
          (
            archivedProperties /
            totalProperties
          ) * 100
        )
      : 0;

  /* ========================================================
     STATISTICS CARD COMPONENT
  ======================================================== */

  const StatisticsCard = ({
    title,
    value,
    description,
    icon,
    percentage,
  }) => {

    const safeValue =
      toSafeNumber(value);

    return (
      <div
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-6
          transition
          duration-200
          hover:border-slate-700
        "
      >

        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >

          <div>

            <p
              className="
                text-sm
                font-medium
                text-slate-400
              "
            >
              {title}
            </p>

            <p
              className="
                mt-3
                text-3xl
                font-bold
                tracking-tight
                text-white
              "
            >
              {safeValue.toLocaleString()}
            </p>

            {description && (
              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                {description}
              </p>
            )}

          </div>

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-slate-700
              bg-slate-800
              text-2xl
            "
          >
            {icon}
          </div>

        </div>

        {typeof percentage === "number" && (
          <div className="mt-5">

            <div
              className="
                mb-2
                flex
                items-center
                justify-between
              "
            >

              <span
                className="
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                Portfolio share
              </span>

              <span
                className="
                  text-xs
                  font-semibold
                  text-slate-300
                "
              >
                {percentage}%
              </span>

            </div>

            <div
              className="
                h-2
                overflow-hidden
                rounded-full
                bg-slate-800
              "
            >

              <div
                className="
                  h-full
                  rounded-full
                  bg-cyan-500
                  transition-all
                  duration-500
                "
                style={{
                  width: `${Math.min(
                    Math.max(
                      percentage,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>
        )}

      </div>
    );
  };

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {

    return (
      <div className="space-y-8">

        {/* HEADER SKELETON */}

        <div className="space-y-3">

          <div
            className="
              h-10
              w-72
              animate-pulse
              rounded-xl
              bg-slate-800
            "
          />

          <div
            className="
              h-5
              w-96
              max-w-full
              animate-pulse
              rounded-lg
              bg-slate-800
            "
          />

        </div>

        {/* CARDS SKELETON */}

        <div
          className="
            grid
            gap-6
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="
                  h-48
                  animate-pulse
                  rounded-3xl
                  border
                  border-slate-800
                  bg-slate-900
                "
              />
            )
          )}

        </div>

        {/* LOWER SKELETON */}

        <div
          className="
            grid
            gap-6
            lg:grid-cols-2
          "
        >

          <div
            className="
              h-72
              animate-pulse
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
            "
          />

          <div
            className="
              h-72
              animate-pulse
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
            "
          />

        </div>

      </div>
    );
  }

  /* ========================================================
     ERROR STATE
  ======================================================== */

  if (error) {

    return (
      <div className="space-y-6">

        <div>

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-white
            "
          >
            Property Statistics
          </h1>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            Overview of your organization's
            property portfolio.
          </p>

        </div>

        <div
          className="
            rounded-3xl
            border
            border-red-500/20
            bg-red-500/10
            p-8
          "
        >

          <div className="text-4xl">
            ⚠️
          </div>

          <h2
            className="
              mt-4
              text-xl
              font-bold
              text-white
            "
          >
            Unable to load property statistics
          </h2>

          <p
            className="
              mt-2
              leading-6
              text-red-300
            "
          >
            {error}
          </p>

          <button
            type="button"
            onClick={fetchStatistics}
            className="
              mt-6
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
              focus:outline-none
              focus:ring-2
              focus:ring-cyan-500
              focus:ring-offset-2
              focus:ring-offset-slate-950
            "
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <div className="space-y-8">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-white
              sm:text-4xl
            "
          >
            Property Statistics
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              text-slate-400
            "
          >
            Monitor your property inventory,
            availability, sales, and portfolio
            performance.
          </p>

        </div>

        <button
          type="button"
          onClick={fetchStatistics}
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            rounded-xl
            border
            border-slate-700
            bg-slate-900
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:opacity-50
            focus:outline-none
            focus:ring-2
            focus:ring-cyan-500
          "
        >
          ↻ Refresh
        </button>

      </div>

      {/* ==================================================
          PRIMARY STATISTICS
      ================================================== */}

      <div
        className="
          grid
          gap-6
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        <StatisticsCard
          title="Total Properties"
          value={totalProperties}
          description="Total properties in your portfolio."
          icon="🏠"
        />

        <StatisticsCard
          title="Available Properties"
          value={availableProperties}
          description="Properties currently available."
          icon="✅"
          percentage={availablePercentage}
        />

        <StatisticsCard
          title="Sold Properties"
          value={soldProperties}
          description="Properties successfully sold."
          icon="💰"
          percentage={soldPercentage}
        />

        <StatisticsCard
          title="Reserved Properties"
          value={reservedProperties}
          description="Properties currently reserved."
          icon="📌"
          percentage={reservedPercentage}
        />

      </div>

      {/* ==================================================
          INVENTORY OVERVIEW
      ================================================== */}

      <div
        className="
          grid
          gap-6
          lg:grid-cols-2
        "
      >

        {/* ==================================================
            INVENTORY STATUS
        ================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              Inventory Overview
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Current distribution of your
              property inventory.
            </p>

          </div>

          <div className="mt-6 space-y-5">

            {/* AVAILABLE */}

            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >

                <span className="text-slate-300">
                  Available
                </span>

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >
                  {availableProperties.toLocaleString()}
                </span>

              </div>

              <div
                className="
                  mt-2
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-emerald-500
                  "
                  style={{
                    width: `${Math.min(
                      availablePercentage,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            {/* SOLD */}

            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >

                <span className="text-slate-300">
                  Sold
                </span>

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >
                  {soldProperties.toLocaleString()}
                </span>

              </div>

              <div
                className="
                  mt-2
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-cyan-500
                  "
                  style={{
                    width: `${Math.min(
                      soldPercentage,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            {/* RESERVED */}

            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >

                <span className="text-slate-300">
                  Reserved
                </span>

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >
                  {reservedProperties.toLocaleString()}
                </span>

              </div>

              <div
                className="
                  mt-2
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-amber-500
                  "
                  style={{
                    width: `${Math.min(
                      reservedPercentage,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            {/* ARCHIVED */}

            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >

                <span className="text-slate-300">
                  Archived
                </span>

                <span
                  className="
                    font-semibold
                    text-white
                  "
                >
                  {archivedProperties.toLocaleString()}
                </span>

              </div>

              <div
                className="
                  mt-2
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-slate-800
                "
              >

                <div
                  className="
                    h-full
                    rounded-full
                    bg-slate-500
                  "
                  style={{
                    width: `${Math.min(
                      archivedPercentage,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            PORTFOLIO SUMMARY
        ================================================== */}

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-6
          "
        >

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              Portfolio Summary
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              High-level view of the property
              portfolio.
            </p>

          </div>

          <div className="mt-6 space-y-4">

            {/* TOTAL INVENTORY */}

            <div
              className="
                flex
                items-center
                justify-between
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <span className="text-2xl">
                  🏠
                </span>

                <div>

                  <p
                    className="
                      font-medium
                      text-white
                    "
                  >
                    Total Inventory
                  </p>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    All properties
                  </p>

                </div>

              </div>

              <span
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                {totalProperties.toLocaleString()}
              </span>

            </div>

            {/* AVAILABLE */}

            <div
              className="
                flex
                items-center
                justify-between
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <span className="text-2xl">
                  ✅
                </span>

                <div>

                  <p
                    className="
                      font-medium
                      text-white
                    "
                  >
                    Available
                  </p>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Ready for customers
                  </p>

                </div>

              </div>

              <span
                className="
                  text-xl
                  font-bold
                  text-emerald-400
                "
              >
                {availableProperties.toLocaleString()}
              </span>

            </div>

            {/* SOLD */}

            <div
              className="
                flex
                items-center
                justify-between
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <span className="text-2xl">
                  💰
                </span>

                <div>

                  <p
                    className="
                      font-medium
                      text-white
                    "
                  >
                    Sold
                  </p>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Completed transactions
                  </p>

                </div>

              </div>

              <span
                className="
                  text-xl
                  font-bold
                  text-cyan-400
                "
              >
                {soldProperties.toLocaleString()}
              </span>

            </div>

            {/* RESERVED */}

            <div
              className="
                flex
                items-center
                justify-between
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <span className="text-2xl">
                  📌
                </span>

                <div>

                  <p
                    className="
                      font-medium
                      text-white
                    "
                  >
                    Reserved
                  </p>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Currently reserved
                  </p>

                </div>

              </div>

              <span
                className="
                  text-xl
                  font-bold
                  text-amber-400
                "
              >
                {reservedProperties.toLocaleString()}
              </span>

            </div>

          </div>

        </section>

      </div>

      {/* ==================================================
          EMPTY STATE
      ================================================== */}

      {totalProperties === 0 && (
        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-10
            text-center
          "
        >

          <div className="text-5xl">
            🏠
          </div>

          <h2
            className="
              mt-4
              text-xl
              font-bold
              text-white
            "
          >
            No properties available
          </h2>

          <p
            className="
              mx-auto
              mt-2
              max-w-xl
              text-slate-400
            "
          >
            There are currently no properties
            in your organization's portfolio,
            so statistics are not available yet.
          </p>

        </section>
      )}

    </div>
  );
};

export default PropertyStatistics;