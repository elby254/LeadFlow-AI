/**
 * ==========================================================
 *
 * Search bar for the Conversation Center.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Search by customer name
 * ✓ Search by phone number
 * ✓ Search by property
 * ✓ Search by location
 * ✓ Live search
 * ✓ Clear search
 * ✓ Refresh search
 * ✓ Keyboard shortcut
 *
 * Used By
 * ----------------------------------------------------------
 * ConversationCenter.jsx
 *
 * ==========================================================
 */

import { useState } from "react";

import {
  Search,
  X,
  RefreshCw,
} from "lucide-react";

/* ==========================================================
   COMPONENT
========================================================== */

const ConversationSearch = ({
  value = "",
  placeholder = "Search conversations...",
  loading = false,
  onSearch,
  onClear,
  onRefresh,
}) => {
  const [query, setQuery] =
    useState(value);

  /* ========================================================
     SEARCH
  ======================================================== */

  const handleSearch = (
    event
  ) => {
    const searchText =
      event.target.value;

    setQuery(searchText);

    onSearch?.(searchText);
  };

  /* ========================================================
     CLEAR
  ======================================================== */

  const handleClear = () => {
    setQuery("");

    onClear?.();

    onSearch?.("");
  };

  /* ========================================================
     ENTER SEARCH
  ======================================================== */

  const handleKeyDown = (
    event
  ) => {
    if (event.key === "Enter") {
      onSearch?.(query);
    }
  };

  /* ========================================================
     UI
  ======================================================== */

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
      {/* Search Icon */}

      <Search
        size={20}
        className="text-gray-400"
      />

      {/* Input */}

      <input
        type="text"
        value={query}
        onChange={handleSearch}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 border-none bg-transparent outline-none"
      />

      {/* Loading */}

      {loading && (
        <RefreshCw
          size={18}
          className="animate-spin text-emerald-600"
        />
      )}

      {/* Clear */}

      {!!query && (
        <button
          onClick={handleClear}
          className="rounded-lg p-2 transition hover:bg-gray-100"
          title="Clear Search"
        >
          <X size={18} />
        </button>
      )}

      {/* Refresh */}

      <button
        onClick={onRefresh}
        className="rounded-lg p-2 transition hover:bg-gray-100"
        title="Refresh"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};

export default ConversationSearch;