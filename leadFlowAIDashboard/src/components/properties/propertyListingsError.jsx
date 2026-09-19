const PropertyListingsError = ({
error,
onRetry,
}) => {
if (!error) {
return null;
}

return ( <div
   className="
     flex
     flex-col
     gap-3
     rounded-xl
     border
     border-red-500/30
     bg-red-500/10
     p-5
     text-red-400
     md:flex-row
     md:items-center
     md:justify-between
   "
 > <div> <h2 className="font-semibold">
Unable to load properties </h2>


    <p className="mt-1 text-sm text-red-400/80">
      {error}
    </p>
  </div>

  <button
    type="button"
    onClick={onRetry}
    className="
      rounded-lg
      border
      border-red-500/30
      px-4
      py-2
      text-sm
      font-medium
      transition
      hover:bg-red-500/10
    "
  >
    Try Again
  </button>
</div>


);
};

export default PropertyListingsError;
