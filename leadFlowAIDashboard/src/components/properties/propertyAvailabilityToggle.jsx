/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Quickly toggle whether a property is available.
 *
 * Used By
 * ----------------------------------------------------------
 * • Property Table
 * • Admin Dashboard
 * • Agent Dashboard
 * • Property Details
 *
 * ==========================================================
 */

const PropertyAvailabilityToggle = ({

  checked = false,

  disabled = false,

  onChange,

}) => {

  return (

    <label className="inline-flex items-center gap-3 cursor-pointer">

      <span

        className={`

          text-sm
          font-medium

          ${

            checked

              ? "text-emerald-600"

              : "text-slate-500"

          }

        `}

      >

        {checked

          ? "Available"

          : "Unavailable"}

      </span>

      <input

        type="checkbox"

        checked={checked}

        disabled={disabled}

        onChange={(event) =>

          onChange?.(

            event.target.checked

          )

        }

        className="h-5 w-5 rounded border"

      />

    </label>

  );

};

export default PropertyAvailabilityToggle;