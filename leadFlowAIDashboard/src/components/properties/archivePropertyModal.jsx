/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Confirmation dialog before archiving
 * a property.
 *
 * Used By
 * ----------------------------------------------------------
 * • Property Details
 * • Property Table
 * • Admin Dashboard
 * • Agent Dashboard
 *
 * ==========================================================
 */

import {

  Archive,

  X,

} from "lucide-react";

const ArchivePropertyModal = ({

  open,

  property,

  loading = false,

  onConfirm,

  onClose,

}) => {

  if (!open) return null;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-md rounded-xl bg-background shadow-xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b p-5">

          <div className="flex items-center gap-3">

            <Archive className="h-6 w-6 text-amber-500" />

            <h2 className="text-lg font-semibold">

              Archive Property

            </h2>

          </div>

          <button

            type="button"

            onClick={onClose}

            className="rounded-lg p-2 hover:bg-muted"

          >

            <X size={18} />

          </button>

        </div>

        {/* Body */}

        <div className="space-y-4 p-6">

          <p className="text-sm text-muted-foreground">

            You're about to archive this
            property.

          </p>

          <div className="rounded-lg border bg-muted/40 p-4">

            <p className="font-medium">

              {property?.title || "Property"}

            </p>

            <p className="text-sm text-muted-foreground">

              {property?.location}

            </p>

          </div>

          <p className="text-sm">

            Archived properties will no longer
            appear in active listings, search
            results, or AI recommendations.

          </p>

        </div>

        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <div className="flex justify-end gap-3 border-t p-5">

          <button

            type="button"

            onClick={onClose}

            disabled={loading}

            className="rounded-lg border px-5 py-2 transition hover:bg-muted disabled:opacity-60"

          >

            Cancel

          </button>

          <button

            type="button"

            onClick={onConfirm}

            disabled={loading}

            className="rounded-lg bg-amber-600 px-5 py-2 font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"

          >

            {

              loading

                ? "Archiving..."

                : "Archive Property"

            }

          </button>

        </div>

      </div>

    </div>

  );

};

export default ArchivePropertyModal;