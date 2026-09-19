/**
 * ==========================================================
 *
 * ----------------------------------------------------------
 * Reusable table for displaying property listings.
 *
 * Used By
 * -------
 * • Listings.jsx
 * • AvailableProperties.jsx
 * • SoldProperties.jsx
 * • PropertiesDashboard.jsx
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ------------------
 *
 * All property image resolution is handled by the shared
 * helper:
 *
 *   getPropertyImageUrl(property)
 *
 * This component MUST NOT independently construct image URLs.
 *
 * DO NOT use:
 *
 *   property.coverImage.url
 *   property.coverImage
 *   property.images
 *   property.image
 *   /uploads/...
 *   API_BASE_URL
 *
 * Image flow:
 *
 *   property
 *      ↓
 *   getPropertyImageUrl(property)
 *      ↓
 *   browser-ready image URL
 *      ↓
 *   <img />
 *
 * This keeps image behavior consistent across the entire
 * property management interface.
 *
 * ==========================================================
 */

import {
  Eye,
  Pencil,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import PropertyStatusBadge from "./propertyStatusBadge";

import getPropertyImageUrl from "../../utils/propertyImage";

/* ==========================================================
   PROPERTY TABLE
========================================================== */

const PropertyTable = ({
  properties = [],
  showActions = true,
  onDelete,
}) => {
  const navigate = useNavigate();

  /* ========================================================
     SAFE PROPERTY DATA

     Never allow null / undefined / non-array values to
     reach .length or .map().
  ======================================================== */

  const safeProperties = Array.isArray(properties)
    ? properties
    : [];

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  if (!safeProperties.length) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-slate-800
          bg-slate-900
          p-12
          text-center
        "
      >
        <p className="text-slate-400">
          No properties found.
        </p>
      </div>
    );
  }

  /* ========================================================
     TABLE
  ======================================================== */

  return (
    <div
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >
      <div className="overflow-x-auto">

        <table className="min-w-full">

          {/* ==================================================
              HEADER
          ================================================== */}

          <thead
            className="
              border-b
              border-slate-800
              bg-slate-950
            "
          >
            <tr>

              {/* Property */}

              <th
                className="
                  px-6
                  py-4
                  text-left
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >
                Property
              </th>

              {/* Location */}

              <th
                className="
                  px-6
                  py-4
                  text-left
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >
                Location
              </th>

              {/* Type */}

              <th
                className="
                  px-6
                  py-4
                  text-left
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >
                Type
              </th>

              {/* Price */}

              <th
                className="
                  px-6
                  py-4
                  text-left
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >
                Price
              </th>

              {/* Bedrooms */}

              <th
                className="
                  px-6
                  py-4
                  text-left
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >
                Bedrooms
              </th>

              {/* Status */}

              <th
                className="
                  px-6
                  py-4
                  text-left
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >
                Status
              </th>

              {/* Actions */}

              {showActions && (
                <th
                  className="
                    px-6
                    py-4
                    text-center
                    text-sm
                    font-semibold
                    text-slate-300
                  "
                >
                  Actions
                </th>
              )}

            </tr>
          </thead>

          {/* ==================================================
              BODY
          ================================================== */}

          <tbody>

            {safeProperties.map((property, index) => {

              /* ==================================================
                 PROPERTY ID
              ================================================== */

              const propertyId =
                property?._id ||
                property?.id;

              /* ==================================================
                 SHARED IMAGE RESOLUTION
                 --------------------------------------------------
                 IMPORTANT:

                 This is the ONLY image-resolution logic in this
                 component.

                 The component does not know whether the image
                 comes from:

                   • coverImage.url
                   • PropertyImage
                   • images[]
                   • legacy image
                   • another supported source

                 getPropertyImageUrl() owns that responsibility.
              ================================================== */

              const coverImageUrl =
                getPropertyImageUrl(property);

              /* ==================================================
                 DISPLAY DATA
              ================================================== */

              const title =
                property?.title ||
                property?.name ||
                "Untitled Property";

              const propertyCode =
                property?.propertyCode ||
                propertyId ||
                "—";

              const location =
                property?.location ||
                property?.address ||
                "—";

              const propertyType =
                property?.propertyType ||
                property?.type ||
                "—";

              const currency =
                property?.currency ||
                "KES";

              const price =
                Number(property?.price || 0);

              const bedrooms =
                property?.bedrooms ??
                property?.beds ??
                "—";

              return (
                <tr
                  key={
                    propertyId ||
                    `property-${index}`
                  }
                  className="
                    border-b
                    border-slate-800
                    transition
                    hover:bg-slate-800
                  "
                >

                  {/* ==================================================
                      PROPERTY
                  ================================================== */}

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-4">

                      {/* ==================================================
                          COVER IMAGE

                          Image URL comes exclusively from:

                            getPropertyImageUrl(property)
                      ================================================== */}

                      <div
                        className="
                          h-14
                          w-20
                          shrink-0
                          overflow-hidden
                          rounded-lg
                          border
                          border-slate-800
                          bg-slate-950
                        "
                      >

                        {coverImageUrl ? (

                          <img
                            src={coverImageUrl}
                            alt={
                              `${title} cover image`
                            }
                            className="
                              h-full
                              w-full
                              object-cover
                            "
                            loading="lazy"
                            onError={(event) => {
                              console.error(
                                "PROPERTY TABLE - Failed to load property image:",
                                coverImageUrl
                              );

                              /*
                               * Do not construct another image URL.
                               *
                               * The shared helper owns image resolution
                               * and fallback behavior.
                               *
                               * Simply replace the failed image with
                               * the local visual fallback.
                               */

                              event.currentTarget.style.display =
                                "none";

                              const fallback =
                                event.currentTarget
                                  .nextElementSibling;

                              if (fallback) {
                                fallback.classList.remove(
                                  "hidden"
                                );
                              }
                            }}
                          />

                        ) : null}

                        {/* ==================================================
                            IMAGE FALLBACK

                            This is only a visual placeholder.

                            It does NOT generate or resolve another
                            property image URL.
                        ================================================== */}

                        <div
                          className={`
                            flex
                            h-full
                            w-full
                            items-center
                            justify-center
                            ${
                              coverImageUrl
                                ? "hidden"
                                : ""
                            }
                          `}
                        >
                          <ImageIcon
                            size={22}
                            className="
                              text-slate-600
                            "
                          />
                        </div>

                      </div>

                      {/* ==================================================
                          PROPERTY INFORMATION
                      ================================================== */}

                      <div className="min-w-0">

                        <h3
                          className="
                            truncate
                            font-semibold
                            text-white
                          "
                        >
                          {title}
                        </h3>

                        <p
                          className="
                            mt-1
                            truncate
                            text-sm
                            text-slate-400
                          "
                        >
                          #{propertyCode}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* ==================================================
                      LOCATION
                  ================================================== */}

                  <td
                    className="
                      px-6
                      py-5
                      text-slate-300
                    "
                  >
                    {location}
                  </td>

                  {/* ==================================================
                      PROPERTY TYPE
                  ================================================== */}

                  <td
                    className="
                      px-6
                      py-5
                      capitalize
                      text-slate-300
                    "
                  >
                    {propertyType}
                  </td>

                  {/* ==================================================
                      PRICE
                  ================================================== */}

                  <td
                    className="
                      px-6
                      py-5
                      font-semibold
                      text-cyan-400
                    "
                  >
                    {currency}{" "}
                    {price.toLocaleString()}
                  </td>

                  {/* ==================================================
                      BEDROOMS
                  ================================================== */}

                  <td
                    className="
                      px-6
                      py-5
                      text-slate-300
                    "
                  >
                    {bedrooms}
                  </td>

                  {/* ==================================================
                      STATUS
                  ================================================== */}

                  <td className="px-6 py-5">

                    <PropertyStatusBadge
                      status={
                        property?.status ||
                        "unknown"
                      }
                    />

                  </td>

                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  {showActions && (
                    <td className="px-6 py-5">

                      <div
                        className="
                          flex
                          justify-center
                          gap-3
                        "
                      >

                        {/* ==================================================
                            VIEW
                        ================================================== */}

                        <button
                          type="button"
                          title="View property"
                          aria-label={`View ${title}`}
                          disabled={!propertyId}
                          onClick={() => {
                            if (!propertyId) {
                              return;
                            }

                            navigate(
                              `/admin/properties/${encodeURIComponent(
                                String(propertyId)
                              )}`
                            );
                          }}
                          className="
                            rounded-lg
                            bg-cyan-500/20
                            p-2
                            text-cyan-400
                            transition
                            hover:bg-cyan-500/30
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                          "
                        >
                          <Eye size={18} />
                        </button>

                        {/* ==================================================
                            EDIT
                        ================================================== */}

                        <button
                          type="button"
                          title="Edit property"
                          aria-label={`Edit ${title}`}
                          disabled={!propertyId}
                          onClick={() => {
                            if (!propertyId) {
                              return;
                            }

                            navigate(
                              `/admin/properties/edit/${encodeURIComponent(
                                String(propertyId)
                              )}`
                            );
                          }}
                          className="
                            rounded-lg
                            bg-yellow-500/20
                            p-2
                            text-yellow-400
                            transition
                            hover:bg-yellow-500/30
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                          "
                        >
                          <Pencil size={18} />
                        </button>

                        {/* ==================================================
                            DELETE
                        ================================================== */}

                        <button
                          type="button"
                          title="Delete property"
                          aria-label={`Delete ${title}`}
                          disabled={!propertyId}
                          onClick={() => {
                            if (!propertyId) {
                              return;
                            }

                            onDelete?.(
                              propertyId
                            );
                          }}
                          className="
                            rounded-lg
                            bg-red-500/20
                            p-2
                            text-red-400
                            transition
                            hover:bg-red-500/30
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                          "
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </td>
                  )}

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>
    </div>
  );
};

export default PropertyTable;