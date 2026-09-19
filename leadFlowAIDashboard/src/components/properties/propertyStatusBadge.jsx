/**
 * ==========================================================
 * Reusable badge displaying a property's status.
 *
 * Used By
 * -------
 * • PropertyCard
 * • Listings
 * • Available Properties
 * • Sold Properties
 * • Recommendations
 * • Property Details
 *
 * Supported Statuses
 * ------------------
 * • Available
 * • Reserved
 * • Sold
 * • Inactive
 *
 * ==========================================================
 */

import {
  CheckCircle2,
  Clock3,
  XCircle,
  PauseCircle,
} from "lucide-react";

const PropertyStatusBadge = ({ status }) => {

  //----------------------------------------------------------

  const normalized = (status || "").toLowerCase();

  //----------------------------------------------------------

  const config = {

    available: {

      label: "Available",

      icon: CheckCircle2,

      classes:
        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",

    },

    reserved: {

      label: "Reserved",

      icon: Clock3,

      classes:
        "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",

    },

    sold: {

      label: "Sold",

      icon: XCircle,

      classes:
        "bg-red-500/20 text-red-400 border border-red-500/30",

    },

    inactive: {

      label: "Inactive",

      icon: PauseCircle,

      classes:
        "bg-slate-600/20 text-slate-300 border border-slate-600/30",

    },

  };

  //----------------------------------------------------------

  const current =

    config[normalized] ||

    {

      label: status || "Unknown",

      icon: PauseCircle,

      classes:
        "bg-slate-700/20 text-slate-300 border border-slate-700/30",

    };

  //----------------------------------------------------------

  const Icon = current.icon;

  //----------------------------------------------------------

  return (

    <span

      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        px-3
        py-1
        text-sm
        font-semibold
        ${current.classes}
      `}

    >

      <Icon size={16} />

      {current.label}

    </span>

  );

};

export default PropertyStatusBadge;

