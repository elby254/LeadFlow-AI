/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Reusable table row for a single property.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyTable
 *
 * ==========================================================
 */

import {

  Eye,

  Pencil,

  Trash2,

} from "lucide-react";

import PropertyStatusBadge from "./propertyStatusBadge";

const PropertyTableRow = ({

  property,

  showActions = true,

  onView,

  onEdit,

  onDelete,

}) => {

  return (

    <tr

      className="
        border-b
        border-slate-800
        transition
        hover:bg-slate-800
      "

    >

      {/* Property */}

      <td className="px-6 py-5">

        <div className="flex items-center gap-4">

          <img

            src={

              property.coverImage ||

              property.image ||

              "/placeholder-property.jpg"

            }

            alt={property.title}

            className="
              h-14
              w-20
              rounded-lg
              object-cover
            "

          />

          <div>

            <h3 className="font-semibold text-white">

              {property.title}

            </h3>

            <p className="text-sm text-slate-400">

              #{property._id}

            </p>

          </div>

        </div>

      </td>

      {/* Location */}

      <td className="px-6 py-5 text-slate-300">

        {property.location}

      </td>

      {/* Property Type */}

      <td className="px-6 py-5 text-slate-300">

        {property.propertyType}

      </td>

      {/* Price */}

      <td className="px-6 py-5 font-semibold text-cyan-400">

        {property.currency || "KES"}{" "}

        {Number(

          property.price || 0

        ).toLocaleString()}

      </td>

      {/* Bedrooms */}

      <td className="px-6 py-5 text-slate-300">

        {property.bedrooms}

      </td>

      {/* Status */}

      <td className="px-6 py-5">

        <PropertyStatusBadge

          status={property.status}

        />

      </td>

      {/* Actions */}

      {showActions && (

        <td className="px-6 py-5">

          <div className="flex justify-center gap-3">

            <button

              onClick={() =>

                onView?.(property)

              }

              className="
                rounded-lg
                bg-cyan-500/20
                p-2
                text-cyan-400
                transition
                hover:bg-cyan-500/30
              "

            >

              <Eye size={18} />

            </button>

            <button

              onClick={() =>

                onEdit?.(property)

              }

              className="
                rounded-lg
                bg-yellow-500/20
                p-2
                text-yellow-400
                transition
                hover:bg-yellow-500/30
              "

            >

              <Pencil size={18} />

            </button>

            <button

              onClick={() =>

                onDelete?.(property)

              }

              className="
                rounded-lg
                bg-red-500/20
                p-2
                text-red-400
                transition
                hover:bg-red-500/30
              "

            >

              <Trash2 size={18} />

            </button>

          </div>

        </td>

      )}

    </tr>

  );

};

export default PropertyTableRow;