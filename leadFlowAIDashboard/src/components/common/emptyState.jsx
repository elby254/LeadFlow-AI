/**
 * ==========================================================
 * Shared empty-state component displayed whenever
 * a module has no data to display.
 *
 * Used In
 * -------
 * • Leads
 * • Properties
 * • Follow-ups
 * • Conversations
 * • Reports
 * • Dashboard widgets
 * • Search results
 *
 * Examples
 * --------
 * <EmptyState
 *    icon={<Users />}
 *    title="No Leads Found"
 *    description="New leads will appear here."
 * />
 *
 * ==========================================================
 */

import { Search } from "lucide-react";

const EmptyState = ({
  icon,
  title = "Nothing Found",
  description = "There is currently no data to display.",
  action = null,
}) => {

  return (

    <div
      className="
        rounded-3xl
        border
        border-dashed
        border-slate-700
        bg-slate-900
        px-8
        py-16
        text-center
      "
    >

      {/* ========================================= */}

      <div
        className="
          mx-auto
          flex
          h-20
          w-20
          items-center
          justify-center
          rounded-full
          bg-slate-800
        "
      >

        {icon || (

          <Search
            size={40}
            className="text-slate-500"
          />

        )}

      </div>

      {/* ========================================= */}

      <h2
        className="
          mt-6
          text-2xl
          font-bold
          text-white
        "
      >

        {title}

      </h2>

      {/* ========================================= */}

      <p
        className="
          mx-auto
          mt-4
          max-w-lg
          leading-7
          text-slate-400
        "
      >

        {description}

      </p>

      {/* ========================================= */}

      {action && (

        <div className="mt-8">

          {action}

        </div>

      )}

    </div>

  );

};

export default EmptyState;

