import { RefreshCw, Plus } from "lucide-react";

const PropertyListingsHeader = ({
onRefresh,
onAddProperty,
loading = false,
}) => {
return ( <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"> <div> <h1 className="text-3xl font-bold text-white">
Property Listings </h1>


    <p className="mt-2 text-slate-400">
      All properties currently managed by LeadFlow AI.
    </p>
  </div>

  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-slate-700
        px-5
        py-3
        text-white
        transition
        hover:bg-slate-800
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <RefreshCw
        size={18}
        className={loading ? "animate-spin" : ""}
      />

      {loading ? "Refreshing..." : "Refresh"}
    </button>

    <button
      type="button"
      onClick={onAddProperty}
      className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        bg-cyan-500
        px-5
        py-3
        font-semibold
        text-slate-950
        transition
        hover:bg-cyan-400
      "
    >
      <Plus size={18} />

      Add Property
    </button>
  </div>
</div>


);
};

export default PropertyListingsHeader;
