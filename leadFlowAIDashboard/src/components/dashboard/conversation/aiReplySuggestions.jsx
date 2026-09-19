/**
 * ==========================================================
 *
 * AI-generated smart reply suggestions shown above the
 * message composer.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Display AI-generated replies
 * ✓ One-click insert into composer
 * ✓ Refresh suggestions
 * ✓ Copy suggestion
 * ✓ Loading state
 * ✓ Empty state
 *
 * Used By
 * ----------------------------------------------------------
 * ChatWindow.jsx
 *
 * ==========================================================
 */

import { useState } from "react";

import {
  Bot,
  RefreshCw,
  Copy,
  Sparkles,
} from "lucide-react";

/* ==========================================================
   COMPONENT
========================================================== */

const AIReplySuggestions = ({
  suggestions = [],
  loading = false,
  onSelectSuggestion,
  onRefresh,
}) => {
  const [copiedIndex, setCopiedIndex] =
    useState(null);

  /* ========================================================
     COPY
  ======================================================== */

  const handleCopy = async (
    suggestion,
    index
  ) => {
    try {
      await navigator.clipboard.writeText(
        suggestion
      );

      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy suggestion",
        error
      );
    }
  };

  /* ========================================================
     EMPTY
  ======================================================== */

  if (
    !loading &&
    suggestions.length === 0
  ) {
    return null;
  }

  /* ========================================================
     UI
  ======================================================== */

  return (
    <div className="border-t border-b bg-emerald-50 px-5 py-4">
      {/* ===============================================
          HEADER
      ================================================ */}

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot
            size={18}
            className="text-emerald-600"
          />

          <h3 className="font-semibold text-emerald-700">
            AI Reply Suggestions
          </h3>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-lg p-2 transition hover:bg-emerald-100"
          title="Refresh Suggestions"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* ===============================================
          LOADING
      ================================================ */}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-xl bg-emerald-100"
            />
          ))}
        </div>
      )}

      {/* ===============================================
          SUGGESTIONS
      ================================================ */}

      {!loading && (
        <div className="space-y-3">
          {suggestions.map(
            (suggestion, index) => (
              <div
                key={index}
                className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 gap-3">
                    <Sparkles
                      size={18}
                      className="mt-1 shrink-0 text-emerald-600"
                    />

                    <p className="text-sm leading-relaxed text-gray-700">
                      {suggestion}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(
                        suggestion,
                        index
                      )
                    }
                    className="rounded-lg p-2 hover:bg-gray-100"
                    title="Copy"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                {/* ACTIONS */}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {copiedIndex === index
                      ? "Copied"
                      : "AI Generated"}
                  </span>

                  <button
                    onClick={() =>
                      onSelectSuggestion?.(
                        suggestion
                      )
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    Use Reply
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default AIReplySuggestions;