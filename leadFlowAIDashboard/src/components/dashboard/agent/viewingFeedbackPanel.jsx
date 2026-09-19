// ======================================================
// Agent Dashboard
// Viewing Feedback Panel
// ======================================================

import {

  CheckCircle2,
  MessageSquare,
  Star,

} from "lucide-react";

const ViewingFeedbackPanel = ({

  feedback,

  loading = false,

  onInterestedChange,

  onFollowUpChange,

  onRatingChange,

  onNotesChange,

  onSubmit,

}) => {

  return (

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="border-b px-6 py-5">

        <h2 className="text-lg font-semibold text-gray-900">

          Viewing Feedback

        </h2>

        <p className="mt-1 text-sm text-gray-500">

          Record the customer's response after completing the viewing.

        </p>

      </div>

      {/* ============================================== */}
      {/* BODY */}
      {/* ============================================== */}

      <div className="space-y-6 p-6">

        {/* ========================================== */}
        {/* CUSTOMER INTEREST */}
        {/* ========================================== */}

        <div>

          <label className="mb-3 block text-sm font-medium text-gray-700">

            Is the customer interested?

          </label>

          <div className="flex gap-4">

            <button

              type="button"

              onClick={() => onInterestedChange(true)}

              className={`rounded-lg border px-5 py-3 font-medium transition

                ${
                  feedback.interested
                    ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }

              `}

            >

              Yes

            </button>

            <button

              type="button"

              onClick={() => onInterestedChange(false)}

              className={`rounded-lg border px-5 py-3 font-medium transition

                ${
                  feedback.interested === false
                    ? "border-red-500 bg-red-100 text-red-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }

              `}

            >

              No

            </button>

          </div>

        </div>

        {/* ========================================== */}
        {/* FOLLOW UP */}
        {/* ========================================== */}

        <div>

          <label className="mb-3 block text-sm font-medium text-gray-700">

            Follow-up Required?

          </label>

          <div className="flex gap-4">

            <button

              type="button"

              onClick={() => onFollowUpChange(true)}

              className={`rounded-lg border px-5 py-3 font-medium transition

                ${
                  feedback.followUpRequired
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }

              `}

            >

              Required

            </button>

            <button

              type="button"

              onClick={() => onFollowUpChange(false)}

              className={`rounded-lg border px-5 py-3 font-medium transition

                ${
                  feedback.followUpRequired === false
                    ? "border-gray-500 bg-gray-200 text-gray-800"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }

              `}

            >

              Not Required

            </button>

          </div>

        </div>

        {/* ========================================== */}
        {/* PROPERTY RATING */}
        {/* ========================================== */}

        <div>

          <label className="mb-3 block text-sm font-medium text-gray-700">

            Customer Interest Rating

          </label>

          <div className="flex items-center gap-2">

            {[1, 2, 3, 4, 5].map((rating) => (

              <button

                key={rating}

                type="button"

                onClick={() => onRatingChange(rating)}

                className="transition"

              >

                <Star

                  size={28}

                  className={`

                    ${
                      feedback.rating >= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }

                  `}

                />

              </button>

            ))}

          </div>

        </div>

        {/* ========================================== */}
        {/* NOTES */}
        {/* ========================================== */}

        <div>

          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">

            <MessageSquare

              size={16}

            />

            Viewing Notes

          </label>

          <textarea

            rows={5}

            value={feedback.notes}

            onChange={(e) =>

              onNotesChange(e.target.value)

            }

            placeholder="Record customer reactions, objections, requested changes, pricing feedback, next steps..."

            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500"

          />

        </div>

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-5">

        <div className="flex items-center gap-2 text-sm text-gray-500">

          <CheckCircle2

            size={18}

            className="text-emerald-500"

          />

          <span>

            Feedback improves future AI lead qualification.

          </span>

        </div>

        <button

          type="button"

          onClick={onSubmit}

          disabled={loading}

          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

        >

          {loading

            ? "Saving..."

            : "Submit Feedback"}

        </button>

      </div>

    </div>

  );

};

export default ViewingFeedbackPanel;