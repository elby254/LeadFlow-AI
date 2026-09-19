/**
 * Displays the agent's follow-up information for a lead.
 *
 * This component helps agents quickly understand:
 *
 * • Previous notes
 * • Last contact date
 * • Next planned action
 *
 * Future Enhancements:
 * --------------------
 * • Add Note
 * • Edit Notes
 * • Mark Follow-up Complete
 * • Schedule Next Follow-up
 * • Sync with AI recommendations
 * ==========================================================
 */

import { useState } from "react";
import axiosClient from "../../api/axiosClient";

const FollowUpNotes = ({ lead, refreshLead }) => {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  if (!lead) return null;

  const handleSave = async () => {
    if (!text.trim()) return;

    try {
      setSaving(true);

      await axiosClient.post(
        `/lead/${lead._id}/notes`,
        {
          text,
        }
      );

      setText("");

      if (refreshLead) {
        await refreshLead();
      }

    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-6
        shadow-xl
      "
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          📝 Agent Notes
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Internal notes for this customer.
        </p>
      </div>

      {/* Last Contact */}

      <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4">

        <p className="text-xs uppercase text-slate-500">
          Last Contact
        </p>

        <p className="mt-2 text-white">
          {lead.lastContact
            ? new Date(lead.lastContact).toLocaleString()
            : "No contact recorded"}
        </p>

      </div>

      {/* Next Action */}

      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4">

        <p className="text-xs uppercase text-slate-500">
          Next Action
        </p>

        <p className="mt-2 text-white">
          {lead.nextAction || "No follow-up scheduled"}
        </p>

      </div>

      {/* Existing Notes */}

      <div className="space-y-3">

        <h3 className="font-semibold text-white">
          Previous Notes
        </h3>

        {!lead.notes || lead.notes.length === 0 ? (

          <p className="text-slate-400">
            No notes yet.
          </p>

        ) : (

          lead.notes
            .slice()
            .reverse()
            .map((note, index) => (

              <div
                key={index}
                className="
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  p-4
                "
              >
                <p className="whitespace-pre-wrap text-white">
                  {note.text}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {new Date(note.createdAt).toLocaleString()}
                </p>

              </div>

            ))

        )}

      </div>

      {/* Add New Note */}

      <div className="mt-8">

        <h3 className="mb-3 font-semibold text-white">
          Add Note
        </h3>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write an internal note..."
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

        <button
          onClick={handleSave}
          disabled={saving}
          className="
            mt-4
            rounded-lg
            bg-cyan-500
            px-5
            py-3
            font-semibold
            text-slate-950
            hover:bg-cyan-400
            disabled:opacity-60
          "
        >
          {saving ? "Saving..." : "+ Save Note"}
        </button>

      </div>

    </section>
  );
};

export default FollowUpNotes;