/**
 * ==========================================================
 * Shared search component used across the CRM.
 *
 * Used In
 * -------
 * • Leads
 * • Properties
 * • Conversations
 * • Follow-ups
 * • Reports
 * • Settings
 *
 * Features
 * --------
 * ✓ Controlled input
 * ✓ Instant search
 * ✓ Clear button
 * ✓ Optional placeholder
 * ✓ Optional submit callback
 *
 * ==========================================================
 */

import { Search, X } from "lucide-react";

const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "",
  disabled = false,
}) => {

  const handleSubmit = (e) => {

    e.preventDefault();

    if (onSearch) {

      onSearch(value);

    }

  };

  const clearSearch = () => {

    if (onChange) {

      onChange("");

    }

  };

  return (

    <form
      onSubmit={handleSubmit}
      className={`relative w-full ${className}`}
    >

      {/* ========================================= */}

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

      {/* ========================================= */}

      <input

        type="text"

        value={value}

        disabled={disabled}

        onChange={(e) => onChange?.(e.target.value)}

        placeholder={placeholder}

        className="
          w-full
          rounded-xl
          border
          border-slate-700
          bg-slate-900
          py-3
          pl-11
          pr-12
          text-white
          outline-none
          transition
          placeholder:text-slate-500
          focus:border-cyan-500
          disabled:cursor-not-allowed
          disabled:opacity-60
        "

      />

      {/* ========================================= */}

      {value && (

        <button

          type="button"

          onClick={clearSearch}

          className="
            absolute
            right-3
            top-1/2
            flex
            -translate-y-1/2
            items-center
            justify-center
            rounded-lg
            p-1
            text-slate-500
            transition
            hover:bg-slate-800
            hover:text-white
          "

        >

          <X size={16} />

        </button>

      )}

    </form>

  );

};

export default SearchBar;

