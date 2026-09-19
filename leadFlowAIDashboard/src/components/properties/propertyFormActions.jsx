/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Reusable action buttons for PropertyForm.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyForm
 *
 * ==========================================================
 */

import {

  Loader2,

  Save,

  X,

} from "lucide-react";

const PropertyFormActions = ({

  loading = false,

  mode = "create",

  onCancel,

}) => {

  return (

    <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

      {/* Cancel */}

      <button

        type="button"

        onClick={onCancel}

        disabled={loading}

        className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"

      >

        <X size={18} />

        Cancel

      </button>

      {/* Submit */}

      <button

        type="submit"

        disabled={loading}

        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"

      >

        {loading ? (

          <>

            <Loader2

              size={18}

              className="animate-spin"

            />

            Saving...

          </>

        ) : (

          <>

            <Save size={18} />

            {

              mode === "create"

                ? "Create Property"

                : "Update Property"

            }

          </>

        )}

      </button>

    </div>

  );

};

export default PropertyFormActions;