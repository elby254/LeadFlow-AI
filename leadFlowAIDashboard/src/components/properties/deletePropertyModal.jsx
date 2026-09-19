/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Confirmation dialog before permanently deleting
 * a property.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Properties
 * • Property Details
 * • Property Table
 *
 * ==========================================================
 */

import {

  Trash2,

  X,

} from "lucide-react";

const DeletePropertyModal = ({

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

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between border-b p-5">

          <div className="flex items-center gap-3">

            <Trash2 className="h-6 w-6 text-red-500" />

            <h2 className="text-lg font-semibold">

              Delete Property

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

        {/* ======================================================
            BODY
        ====================================================== */}

        <div className="space-y-4 p-6">

          <p className="text-sm text-muted-foreground">

            You are about to permanently delete
            this property.

          </p>

          <div className="rounded-lg border bg-muted/40 p-4">

            <p className="font-medium">

              {property?.title || "Property"}

            </p>

            <p className="text-sm text-muted-foreground">

              {property?.location}

            </p>

          </div>

          <div className="rounded-lg border border-red-300 bg-red-50 p-4">

            <p className="text-sm text-red-700">

              This action cannot be undone.
              The property, images, pricing,
              features and related records may
              also be removed permanently.

            </p>

          </div>

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

            className="rounded-lg bg-red-600 px-5 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"

          >

            {

              loading

                ? "Deleting..."

                : "Delete Property"

            }

          </button>

        </div>

      </div>

    </div>

  );

};

export default DeletePropertyModal;