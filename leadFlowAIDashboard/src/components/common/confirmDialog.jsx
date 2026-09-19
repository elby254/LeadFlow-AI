/**
 * ==========================================================
 * Reusable confirmation modal.
 *
 * Used before destructive or important actions.
 *
 * Examples
 * --------
 * • Delete Lead
 * • Delete Property
 * • Delete Conversation
 * • Delete Follow-up
 * • Mark Property Sold
 * • Archive Lead
 * • Logout
 *
 * ==========================================================
 */

import {
  AlertTriangle,
  X,
} from "lucide-react";

const ConfirmDialog = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {

  if (!isOpen) return null;

  const buttonStyle =
    confirmVariant === "primary"
      ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
      : confirmVariant === "success"
      ? "bg-emerald-500 hover:bg-emerald-400 text-white"
      : "bg-red-500 hover:bg-red-400 text-white";

  return (

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/70
        backdrop-blur-sm
        p-6
      "
    >

      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          shadow-2xl
        "
      >

        {/* ========================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-800
            p-6
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-red-500/20
              "
            >

              <AlertTriangle
                size={24}
                className="text-red-400"
              />

            </div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >

              {title}

            </h2>

          </div>

          <button
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-slate-800
              hover:text-white
            "
          >

            <X size={20} />

          </button>

        </div>

        {/* ========================================= */}

        <div className="p-6">

          <p
            className="
              leading-7
              text-slate-300
            "
          >

            {message}

          </p>

        </div>

        {/* ========================================= */}

        <div
          className="
            flex
            justify-end
            gap-3
            border-t
            border-slate-800
            p-6
          "
        >

          <button

            onClick={onCancel}

            disabled={loading}

            className="
              rounded-xl
              border
              border-slate-700
              bg-slate-800
              px-5
              py-3
              font-semibold
              text-white
              transition
              hover:border-slate-600
            "

          >

            {cancelText}

          </button>

          <button

            onClick={onConfirm}

            disabled={loading}

            className={`
              rounded-xl
              px-5
              py-3
              font-semibold
              transition
              disabled:opacity-60
              ${buttonStyle}
            `}

          >

            {loading
              ? "Processing..."
              : confirmText}

          </button>

        </div>

      </div>

    </div>

  );

};

export default ConfirmDialog;

