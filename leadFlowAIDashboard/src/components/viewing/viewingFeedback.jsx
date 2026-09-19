// ======================================================
// Property Viewing Feedback
// ======================================================

import { useState } from "react";

import {
  Star,
  Send,
  X,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

import useViewings from "../../hooks/useViewings";

// ======================================================
// COMPONENT
// ======================================================

const ViewingFeedback = ({
  viewing,
  open = false,
  onClose,
  onSubmitted,
}) => {

  // ====================================================
  // STATE
  // ====================================================

  const [interest, setInterest] = useState("");

  const [rating, setRating] = useState(0);

  const [hoverRating, setHoverRating] = useState(0);

  const [comments, setComments] = useState("");

  // ====================================================
  // VIEWING HOOK
  // ====================================================

  const {
    submitFeedback,
    loading,
    error,
    success,
    clearMessages,
  } = useViewings();

  // ====================================================
  // VALIDATION
  // ====================================================

  const isCompleted =
    viewing?.status?.toLowerCase() === "completed";

  const canSubmit =
    Boolean(viewing?._id) &&
    isCompleted &&
    Boolean(interest) &&
    rating >= 1;

  // ====================================================
  // CLOSE
  // ====================================================

  const handleClose = () => {

    if (loading) return;

    clearMessages();

    setInterest("");
    setRating(0);
    setHoverRating(0);
    setComments("");

    onClose?.();

  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    clearMessages();

    if (!viewing?._id) {
      return;
    }

    if (!isCompleted) {
      return;
    }

    if (!interest || rating < 1) {
      return;
    }

    const payload = {

      interest,

      rating,

      comments:
        comments.trim(),

    };

    const result =
      await submitFeedback(
        viewing._id,
        payload
      );

    if (result) {

      onSubmitted?.(result);

    }

  };

  // ====================================================
  // DON'T RENDER WHEN CLOSED
  // ====================================================

  if (!open || !viewing) {
    return null;
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (

    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewing-feedback-title"
    >

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ==================================================
            HEADER
        =================================================== */}

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

          <div>

            <div className="flex items-center gap-2">

              <MessageSquare
                size={20}
                className="text-emerald-600"
              />

              <h2
                id="viewing-feedback-title"
                className="text-lg font-bold text-gray-900"
              >
                Viewing Feedback
              </h2>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              Help us understand the customer's experience.
            </p>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close feedback"
          >

            <X size={20} />

          </button>

        </div>

        {/* ==================================================
            VIEWING INFORMATION
        =================================================== */}

        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">

          <div className="grid grid-cols-2 gap-4">

            <InfoItem
              label="Property"
              value={
                viewing.propertyName ||
                viewing.property?.name ||
                "-"
              }
            />

            <InfoItem
              label="Agent"
              value={
                viewing.agentName ||
                viewing.agent?.name ||
                "Assigned agent"
              }
            />

            <InfoItem
              label="Status"
              value={
                viewing.status ||
                "Completed"
              }
            />

            <InfoItem
              label="Viewing ID"
              value={
                viewing._id
              }
            />

          </div>

        </div>

        {/* ==================================================
            FORM
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >

          {/* ==================================================
              INTEREST
          =================================================== */}

          <section>

            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Is the customer interested?
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <InterestOption
                value="interested"
                label="Interested"
                selected={
                  interest === "interested"
                }
                onSelect={setInterest}
              />

              <InterestOption
                value="maybe"
                label="Maybe"
                selected={
                  interest === "maybe"
                }
                onSelect={setInterest}
              />

              <InterestOption
                value="not_interested"
                label="Not Interested"
                selected={
                  interest === "not_interested"
                }
                onSelect={setInterest}
              />

            </div>

          </section>

          {/* ==================================================
              RATING
          =================================================== */}

          <section>

            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Viewing experience
            </h3>

            <div className="flex items-center gap-2">

              {[1, 2, 3, 4, 5].map(
                (value) => {

                  const active =
                    value <=
                    (hoverRating || rating);

                  return (

                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setRating(value)
                      }
                      onMouseEnter={() =>
                        setHoverRating(value)
                      }
                      onMouseLeave={() =>
                        setHoverRating(0)
                      }
                      className="rounded-lg p-1 transition hover:scale-105"
                      aria-label={`Rate ${value} out of 5`}
                    >

                      <Star
                        size={30}
                        fill={
                          active
                            ? "currentColor"
                            : "none"
                        }
                        className={
                          active
                            ? "text-amber-500"
                            : "text-gray-300"
                        }
                      />

                    </button>

                  );

                }
              )}

            </div>

            {rating > 0 && (

              <p className="mt-2 text-xs text-gray-500">
                Rating: {rating}/5
              </p>

            )}

          </section>

          {/* ==================================================
              COMMENTS
          =================================================== */}

          <section>

            <label
              htmlFor="viewing-feedback-comments"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              Comments
            </label>

            <textarea
              id="viewing-feedback-comments"
              value={comments}
              onChange={(event) =>
                setComments(event.target.value)
              }
              maxLength={1000}
              rows={4}
              placeholder="Add feedback about the property or viewing experience..."
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <div className="mt-1 flex justify-end">

              <span className="text-xs text-gray-400">
                {comments.length}/1000
              </span>

            </div>

          </section>

          {/* ==================================================
              ERROR
          =================================================== */}

          {error && (

            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>

          )}

          {/* ==================================================
              SUCCESS
          =================================================== */}

          {success && (

            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

              <CheckCircle2 size={18} />

              <span>
                {success}
              </span>

            </div>

          )}

          {/* ==================================================
              ACTIONS
          =================================================== */}

          <div className="flex gap-3 pt-2">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                !canSubmit ||
                loading
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Send size={17} />

              {loading
                ? "Submitting..."
                : "Submit Feedback"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

};

// ======================================================
// INFO ITEM
// ======================================================

const InfoItem = ({
  label,
  value,
}) => {

  return (

    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-gray-800">
        {value || "-"}
      </p>

    </div>

  );

};

// ======================================================
// INTEREST OPTION
// ======================================================

const InterestOption = ({
  value,
  label,
  selected,
  onSelect,
}) => {

  return (

    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
        selected
          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >

      {label}

    </button>

  );

};

export default ViewingFeedback;