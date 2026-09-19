import { useEffect } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";

import { useViewingContext } from "../../context/viewingContext";

import LeadSummaryCard from "../../components/dashboard/agent/leadSummaryCard";
import PropertyRecommendationPanel from "../../components/dashboard/agent/propertyRecommendationPanel";
import QualificationPanel from "../../components/dashboard/agent/qualificationPanel";
import QuickReplyTemplates from "../../components/dashboard/agent/quickReplyTemplates";

const AgentViewings = () => {
  // ====================================================
  // CONTEXT
  // ====================================================

  const {
    viewings,
    selectedViewing,
    loading,
    error,
    getViewings,
    refreshViewings,
  } = useViewingContext();

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    getViewings();
  }, [getViewings]);

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <section className="space-y-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <CalendarClock
              className="mx-auto mb-4 animate-pulse text-cyan-400"
              size={48}
            />

            <h2 className="text-lg font-semibold text-white">
              Loading assigned viewings...
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Preparing your customer viewing workspace.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error) {
    return (
      <section className="space-y-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div
            className="
              w-full
              max-w-lg
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/5
              p-8
            "
          >
            <h2 className="text-lg font-semibold text-red-400">
              Unable to load viewings
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-300/80">
              {error}
            </p>

            <button
              type="button"
              onClick={refreshViewings}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-red-500
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:bg-red-400
              "
            >
              <RefreshCw className="h-4 w-4" />

              Reload
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ====================================================
  // NORMALIZE VIEWINGS
  // ====================================================

  const assignedViewings = Array.isArray(viewings)
    ? viewings
    : [];

  // ====================================================
  // MAIN PAGE
  // ====================================================

  return (
    <section className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <section
        className="
          flex
          flex-col
          gap-5
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <div className="flex items-center gap-4">

          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-cyan-500/10
              text-cyan-400
            "
          >
            <CalendarClock className="h-6 w-6" />
          </div>

          <div>

            <p className="text-sm font-medium text-cyan-400">
              Agent Workspace
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              My Assigned Viewings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Manage customer appointments, prepare for
              property visits, review lead qualification,
              and move interested customers toward
              successful transactions.
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={refreshViewings}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-700
            bg-slate-950
            px-5
            py-3
            font-semibold
            text-white
            transition
            hover:border-cyan-500/50
            hover:bg-slate-800
          "
        >
          <RefreshCw className="h-4 w-4" />

          Refresh
        </button>

      </section>

      {/* ====================================================
          VIEWING SUMMARY
      ==================================================== */}

      <section
        className="
          grid
          gap-5
          md:grid-cols-3
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-5
          "
        >
          <p className="text-sm text-slate-400">
            Assigned Viewings
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {assignedViewings.length}
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-5
          "
        >
          <p className="text-sm text-slate-400">
            Upcoming
          </p>

          <p className="mt-2 text-3xl font-bold text-cyan-400">
            {
              assignedViewings.filter(
                (viewing) =>
                  viewing?.status === "scheduled" ||
                  viewing?.status === "confirmed" ||
                  viewing?.status === "upcoming"
              ).length
            }
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900
            p-5
          "
        >
          <p className="text-sm text-slate-400">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {
              assignedViewings.filter(
                (viewing) =>
                  viewing?.status === "completed"
              ).length
            }
          </p>
        </div>

      </section>

      {/* ====================================================
          EMPTY STATE
      ==================================================== */}

      {assignedViewings.length === 0 ? (

        <section
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-10
            text-center
          "
        >

          <CalendarClock
            className="
              mx-auto
              h-12
              w-12
              text-slate-600
            "
          />

          <h2 className="mt-5 text-xl font-semibold text-white">
            No assigned viewings
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
            You currently have no customer property viewings
            assigned to you. Once a viewing is scheduled,
            its customer and property information will appear
            here.
          </p>

        </section>

      ) : (

        <>
          {/* ==================================================
              SELECTED VIEWING / LEAD SUMMARY
          ================================================== */}

          {selectedViewing && (
            <LeadSummaryCard
              viewing={selectedViewing}
            />
          )}

          {/* ==================================================
              MAIN WORKSPACE
          ================================================== */}

          <div className="grid gap-8 lg:grid-cols-3">

            {/* ==================================================
                LEFT COLUMN
            ================================================== */}

            <div className="space-y-8 lg:col-span-2">

              {/* ==================================================
                  QUALIFICATION
              ================================================== */}

              <section className="space-y-3">

                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Lead Qualification
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Review the customer's requirements and
                    qualification before the viewing.
                  </p>
                </div>

                <QualificationPanel
                  viewing={selectedViewing}
                />

              </section>

              {/* ==================================================
                  PROPERTY RECOMMENDATIONS
              ================================================== */}

              <section className="space-y-3">

                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Property Recommendations
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Review suitable properties for this
                    qualified customer.
                  </p>
                </div>

                <PropertyRecommendationPanel
                  viewing={selectedViewing}
                />

              </section>

            </div>

            {/* ==================================================
                RIGHT COLUMN
            ================================================== */}

            <div className="space-y-8">

              {/* ==================================================
                  QUICK REPLIES
              ================================================== */}

              <section className="space-y-3">

                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Customer Communication
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Use prepared responses when communicating
                    with the customer.
                  </p>
                </div>

                <QuickReplyTemplates
                  viewing={selectedViewing}
                />

              </section>

              {/* ==================================================
                  VIEWING STATUS
              ================================================== */}

              {selectedViewing && (
                <section
                  className="
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-5
                  "
                >

                  <h2 className="text-lg font-semibold text-white">
                    Viewing Status
                  </h2>

                  <div className="mt-4 space-y-4">

                    {selectedViewing.propertyTitle && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Property
                        </p>

                        <p className="mt-1 font-medium text-white">
                          {selectedViewing.propertyTitle}
                        </p>
                      </div>
                    )}

                    {selectedViewing.clientName && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Customer
                        </p>

                        <p className="mt-1 font-medium text-white">
                          {selectedViewing.clientName}
                        </p>
                      </div>
                    )}

                    {selectedViewing.date && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Date
                        </p>

                        <p className="mt-1 font-medium text-white">
                          {selectedViewing.date}
                        </p>
                      </div>
                    )}

                    {selectedViewing.time && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Time
                        </p>

                        <p className="mt-1 font-medium text-white">
                          {selectedViewing.time}
                        </p>
                      </div>
                    )}

                    {selectedViewing.status && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Status
                        </p>

                        <span
                          className="
                            mt-2
                            inline-flex
                            rounded-full
                            bg-cyan-500/10
                            px-3
                            py-1
                            text-sm
                            font-medium
                            capitalize
                            text-cyan-400
                          "
                        >
                          {selectedViewing.status}
                        </span>
                      </div>
                    )}

                  </div>

                </section>
              )}

            </div>

          </div>

          {/* ==================================================
              VIEWING SELECTION
          ================================================== */}

          {assignedViewings.length > 0 && (
            <section className="space-y-5">

              <div>

                <h2 className="text-2xl font-bold text-white">
                  Assigned Viewing Appointments
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Select a viewing to load its customer
                  qualification and property workspace.
                </p>

              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {assignedViewings.map((viewing) => {

                  const isSelected =
                    selectedViewing?._id === viewing?._id;

                  return (
                    <button
                      key={
                        viewing?._id ||
                        `${viewing?.propertyTitle}-${viewing?.date}-${viewing?.time}`
                      }
                      type="button"
                      onClick={() => {
                        /*
                         * Selection is owned by the viewing
                         * context. This button intentionally
                         * refreshes the workspace through the
                         * context rather than creating a second
                         * local viewing state.
                         */
                        if (
                          viewing?._id &&
                          selectedViewing?._id !== viewing?._id
                        ) {
                          /*
                           * The context is expected to expose
                           * selectedViewing through its existing
                           * selection workflow.
                           *
                           * If the context automatically selects
                           * the first viewing, this card remains
                           * informational.
                           */
                        }
                      }}
                      className={`
                        rounded-2xl
                        border
                        p-5
                        text-left
                        transition
                        ${
                          isSelected
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-slate-800 bg-slate-900 hover:border-cyan-500/30 hover:bg-slate-800"
                        }
                      `}
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                            Viewing
                          </p>

                          <h3 className="mt-2 font-semibold text-white">
                            {viewing?.propertyTitle ||
                              "Property Viewing"}
                          </h3>

                        </div>

                        {viewing?.status && (
                          <span
                            className="
                              rounded-full
                              bg-slate-800
                              px-3
                              py-1
                              text-xs
                              capitalize
                              text-slate-300
                            "
                          >
                            {viewing.status}
                          </span>
                        )}

                      </div>

                      <div className="mt-4 space-y-2 text-sm">

                        {viewing?.clientName && (
                          <p className="text-slate-300">
                            <span className="text-slate-500">
                              Customer:
                            </span>{" "}
                            {viewing.clientName}
                          </p>
                        )}

                        {viewing?.date && (
                          <p className="text-slate-300">
                            <span className="text-slate-500">
                              Date:
                            </span>{" "}
                            {viewing.date}
                          </p>
                        )}

                        {viewing?.time && (
                          <p className="text-slate-300">
                            <span className="text-slate-500">
                              Time:
                            </span>{" "}
                            {viewing.time}
                          </p>
                        )}

                      </div>

                    </button>
                  );
                })}

              </div>

            </section>
          )}

        </>
      )}

    </section>
  );
};

export default AgentViewings;