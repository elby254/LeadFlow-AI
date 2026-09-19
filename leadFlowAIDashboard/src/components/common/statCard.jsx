/**
 * ==========================================================
 * Shared KPI / Statistics card used throughout LeadFlow AI.
 *
 * Used In
 * -------
 * • Dashboard
 * • Viewer Dashboard
 * • Reports
 * • Properties
 * • Leads
 * • Follow-ups
 *
 * Displays
 * --------
 * ✓ Icon
 * ✓ Metric
 * ✓ Label
 * ✓ Optional trend
 * ✓ Optional percentage change
 *
 * Example
 * -------
 * <StatCard
 *    title="Today's Leads"
 *    value={125}
 *    icon={<Users />}
 *    trend="+12%"
 * />
 *
 * ==========================================================
 */

import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendDirection = "up", // up | down | neutral
  description,
  loading = false,
}) => {

  const trendColor =

    trendDirection === "up"

      ? "text-emerald-400"

      : trendDirection === "down"

      ? "text-red-400"

      : "text-slate-400";

  return (

    <div
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-lg
        transition
        hover:border-cyan-500/40
      "
    >

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="flex items-center justify-between">

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

        </div>

        {icon && (

          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-cyan-500/10
              text-cyan-400
            "
          >

            {icon}

          </div>

        )}

      </div>

      {/* =========================================
          VALUE
      ========================================= */}

      <div className="mt-6">

        {loading ? (

          <div
            className="
              h-10
              w-24
              animate-pulse
              rounded-xl
              bg-slate-800
            "
          />

        ) : (

          <h2
            className="
              text-4xl
              font-black
              tracking-tight
              text-white
            "
          >

            {value}

          </h2>

        )}

      </div>

      {/* =========================================
          DESCRIPTION
      ========================================= */}

      {description && (

        <p
          className="
            mt-3
            text-sm
            leading-6
            text-slate-400
          "
        >

          {description}

        </p>

      )}

      {/* =========================================
          TREND
      ========================================= */}

      {trend && (

        <div
          className={`
            mt-5
            flex
            items-center
            gap-2
            text-sm
            font-semibold
            ${trendColor}
          `}
        >

          {trendDirection === "up" && (

            <TrendingUp size={16} />

          )}

          {trendDirection === "down" && (

            <TrendingDown size={16} />

          )}

          <span>{trend}</span>

        </div>

      )}

    </div>

  );

};

export default StatCard;
