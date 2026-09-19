/**
 * ==========================================================
 * ContactLead.jsx
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Dedicated calling workspace for real estate agents.
 *
 * Unlike LeadDetails, this page is action-oriented rather
 * than information-oriented.
 *
 * Agents use this page while actively speaking to the
 * customer.
 *
 * This page provides only the information needed during
 * the call together with call logging tools.
 *
 * ==========================================================
 */

import axiosClient from "../../api/axiosClient";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

import useLeadDetails from "../../hooks/useLeadDetails";

const ContactLead = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const { lead, loading, error } = useLeadDetails(id);

  const [notes, setNotes] = useState("");

  const [callOutcome, setCallOutcome] = useState("");

  const [nextFollowUpDate, setnextFollowUpDate] = useState("");

  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="p-10 text-white">
        Loading Contact Workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-400">
        {error}
      </div>
    );
  }

   const handleSave = async () => {
  try {
    setSaving(true);

    await axiosClient.post(
      `/lead/${lead._id}/call-history`,
      {
        outcome: callOutcome,
        notes,
        nextFollowUpDate,
      }
    );

    alert("Call saved successfully.");

    navigate(`/lead/${lead._id}`);

  } catch (error) {
    console.error(error);

    alert(
      error.response?.data?.message ||
      "Failed to save call."
    );

  } finally {
    setSaving(false);
  }
};

  // TODO
  // Save call outcome endpoint

  return (
    <main className="min-h-screen bg-slate-950 p-8">

      <div className="mx-auto max-w-5xl space-y-6">

        {/* ===========================================
            BACK BUTTON
        =========================================== */}

        <button
          onClick={() => navigate(-1)}
          className="
            rounded-lg
            border
            border-slate-700
            px-4
            py-2
            text-white
            hover:bg-slate-800
          "
        >
          ← Back
        </button>

        {/* ===========================================
            PAGE TITLE
        =========================================== */}

        <div>

          <h1 className="text-3xl font-bold text-white">
            📞 Contact Lead
          </h1>

          <p className="mt-2 text-slate-400">
            Actively engage the customer and record the
            outcome of the call.
          </p>

        </div>

        {/* ===========================================
            CUSTOMER DETAILS
        =========================================== */}

        <section className="rounded-2xl bg-slate-900 p-6">

          <h2 className="mb-4 text-xl font-semibold text-white">
            Customer
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <div>

              <p className="text-sm text-slate-400">
                Name
              </p>

              <p className="text-white font-medium">
                {lead.name}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Phone
              </p>

              <p className="text-white font-medium">
                {lead.phone}
              </p>

            </div>

          </div>

          <div className="mt-6 flex gap-4">

            <a
              href={`tel:${lead.phone}`}
              className="
                rounded-lg
                bg-emerald-500
                px-5
                py-3
                font-semibold
                text-slate-950
              "
            >
              📞 Call
            </a>

            <a
              href={`https://wa.me/${lead.phone}`}
              target="_blank"
              rel="noreferrer"
              className="
                rounded-lg
                bg-green-600
                px-5
                py-3
                font-semibold
                text-white
              "
            >
              WhatsApp
            </a>

          </div>

        </section>

        {/* ===========================================
            QUALIFICATION SUMMARY
        =========================================== */}

        <section className="rounded-2xl bg-slate-900 p-6">

          <h2 className="mb-4 text-xl font-semibold text-white">
            Qualification Summary
          </h2>

          <div className="grid gap-4 md:grid-cols-3">

            <div>

              <p className="text-sm text-slate-400">
                Budget
              </p>

              <p className="text-white">
                {lead.budget || "-"}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Location
              </p>

              <p className="text-white">
                {lead.location || "-"}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Bedrooms
              </p>

              <p className="text-white">
                {lead.bedrooms || "-"}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Move Date
              </p>

              <p className="text-white">
                {lead.moveDate || "-"}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Lead Score
              </p>

              <p className="text-cyan-400 font-bold">
                {lead.score}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Status
              </p>

              <p className="text-emerald-400">
                {lead.status}
              </p>

            </div>

          </div>

        </section>

        {/* ===========================================
            QUICK CALL NOTES
        =========================================== */}

        <section className="rounded-2xl bg-slate-900 p-6">

          <h2 className="mb-4 text-xl font-semibold text-white">
            Quick Call Notes
          </h2>

          <textarea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write notes during the call..."
            className="
              w-full
              rounded-lg
              border
              border-slate-700
              bg-slate-950
              p-4
              text-white
            "
          />

        </section>

        {/* ===========================================
            CALL OUTCOME
        =========================================== */}

        <section className="rounded-2xl bg-slate-900 p-6">

          <h2 className="mb-4 text-xl font-semibold text-white">
            Call Outcome
          </h2>

          <div className="space-y-3">

            {[
              "No Answer",
              "Interested",
              "Viewing Scheduled",
              "Not Interested",
            ].map((option) => (

              <label
                key={option}
                className="flex items-center gap-3 text-white"
              >

                <input
                  type="radio"
                  value={option}
                  checked={callOutcome === option}
                  onChange={(e) =>
                    setCallOutcome(e.target.value)
                  }
                />

                {option}

              </label>

            ))}

          </div>

        </section>

        {/* ===========================================
            FOLLOW-UP DATE
        =========================================== */}

        <section className="rounded-2xl bg-slate-900 p-6">

          <h2 className="mb-4 text-xl font-semibold text-white">
            Next Follow-up Date
          </h2>

          <input
            type="date"
            value={nextFollowUpDate}
            onChange={(e) =>
              setnextFollowUpDate(e.target.value)
            }
            className="
              rounded-lg
              border
              border-slate-700
              bg-slate-950
              p-3
              text-white
            "
          />

        </section>

        {/* ===========================================
            SAVE BUTTON
        =========================================== */}

        <button
  onClick={handleSave}
  disabled={saving}
  className="
    w-full
    rounded-xl
    bg-cyan-500
    py-4
    text-lg
    font-bold
    text-slate-950
    hover:bg-cyan-400
    disabled:opacity-60
    disabled:cursor-not-allowed
  "
>
  {saving ? "Saving..." : "Save Call"}
</button>

      </div>

    </main>
  );
};

export default ContactLead;

