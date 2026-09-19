/**
 * ==========================================================
 * Reusable property card for LeadFlow AI.
 *
 * Used by:
 * • Listings
 * • Available Properties
 * • Sold Properties
 * • Recommendations
 * • Property Matches
 * • Dashboard widgets
 *
 * Image structure:
 * Property.coverImage -> PropertyImage
 * PropertyImage.url    -> actual image URL
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import {
  MapPin,
  BedDouble,
  Bath,
  Building2,
  BadgeCheck,
  ImageOff,
} from "lucide-react";

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();

  /* ========================================================
     IMAGE URL
  ======================================================== */

  const getImageUrl = () => {
    /*
     * Supported structures:
     *
     * 1. Populated backend:
     *    coverImage: {
     *      _id: "...",
     *      url: "/uploads/properties/..."
     *    }
     *
     * 2. Normalized frontend:
     *    image: "..."
     *
     * 3. No image:
     *    fallback placeholder
     */

    if (
      property?.coverImage &&
      typeof property.coverImage === "object" &&
      property.coverImage.url
    ) {
      const url = property.coverImage.url;

      if (url.startsWith("http")) {
        return url;
      }

      return `${import.meta.env.VITE_API_BASE_URL}${url}`;
    }

    if (
      property?.image &&
      typeof property.image === "string"
    ) {
      if (property.image.startsWith("http")) {
        return property.image;
      }

      return `${import.meta.env.VITE_API_BASE_URL}${property.image}`;
    }

    return null;
  };

  const imageUrl = getImageUrl();

  /* ========================================================
     STATUS COLOR
  ======================================================== */

  const statusColor = () => {
    switch (property?.status?.toLowerCase()) {
      case "available":
        return "bg-emerald-500/20 text-emerald-400";

      case "reserved":
        return "bg-yellow-500/20 text-yellow-400";

      case "sold":
        return "bg-red-500/20 text-red-400";

      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  /* ========================================================
     VIEW PROPERTY
  ======================================================== */

  const handleViewProperty = () => {
    if (!property?._id) {
      console.error(
        "PropertyCard: property ID is missing.",
        property
      );

      return;
    }

    navigate(`/properties/${property._id}`);
  };

  /* ========================================================
     EDIT PROPERTY
  ======================================================== */

  const handleEditProperty = () => {
    if (!property?._id) {
      console.error(
        "PropertyCard: property ID is missing.",
        property
      );

      return;
    }

    navigate(`/properties/edit/${property._id}`);
  };

  /* ========================================================
     CARD
  ======================================================== */

  return (
    <article
      className="
        overflow-hidden
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-cyan-500/30
      "
    >

      {/* ==================================================
          PROPERTY IMAGE
      ================================================== */}

      <div className="h-60 w-full overflow-hidden bg-slate-950">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={
              property?.coverImage?.altText ||
              property?.title ||
              "Property image"
            }
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-300
              hover:scale-105
            "
            onError={(event) => {
              event.currentTarget.style.display = "none";

              const fallback =
                event.currentTarget.parentElement
                  ?.querySelector(
                    "[data-image-fallback]"
                  );

              if (fallback) {
                fallback.classList.remove("hidden");
              }
            }}
          />
        ) : null}

        {/* ==================================================
            IMAGE FALLBACK
        ================================================== */}

        <div
          data-image-fallback
          className={`
            h-full
            w-full
            items-center
            justify-center
            text-slate-600
            ${imageUrl ? "hidden" : "flex"}
          `}
        >
          <div className="text-center">

            <ImageOff
              size={42}
              className="mx-auto"
            />

            <p className="mt-2 text-sm">
              No image available
            </p>

          </div>
        </div>

      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="space-y-5 p-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <h2 className="truncate text-xl font-bold text-white">
              {property?.title || "Untitled Property"}
            </h2>

            <div className="mt-2 flex items-center gap-2 text-slate-400">

              <MapPin size={16} />

              <span>
                {property?.location || "Location unavailable"}
              </span>

            </div>

          </div>

          <span
            className={`
              shrink-0
              rounded-full
              px-3
              py-1
              text-xs
              font-semibold
              ${statusColor()}
            `}
          >
            {property?.status || "Unknown"}
          </span>

        </div>

        {/* ==================================================
            PRICE
        ================================================== */}

        <div>

          <p className="text-2xl font-bold text-cyan-400">
            {property?.currency || "KES"}{" "}
            {Number(property?.price || 0).toLocaleString()}
          </p>

        </div>

        {/* ==================================================
            PROPERTY INFO
        ================================================== */}

        <div className="grid grid-cols-3 gap-4">

          <div className="rounded-xl bg-slate-950 p-3 text-center">

            <BedDouble
              size={18}
              className="mx-auto text-cyan-400"
            />

            <p className="mt-2 text-sm text-white">
              {property?.bedrooms ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Beds
            </p>

          </div>

          <div className="rounded-xl bg-slate-950 p-3 text-center">

            <Bath
              size={18}
              className="mx-auto text-cyan-400"
            />

            <p className="mt-2 text-sm text-white">
              {property?.bathrooms ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Baths
            </p>

          </div>

          <div className="rounded-xl bg-slate-950 p-3 text-center">

            <Building2
              size={18}
              className="mx-auto text-cyan-400"
            />

            <p className="mt-2 text-sm text-white">
              {property?.propertyType || "Property"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Type
            </p>

          </div>

        </div>

        {/* ==================================================
            AI MATCH
        ================================================== */}

        {property?.score !== undefined &&
          property?.score !== null && (
            <div
              className="
                rounded-2xl
                bg-cyan-500/10
                p-4
              "
            >

              <div className="flex items-center gap-2">

                <BadgeCheck
                  size={18}
                  className="text-cyan-400"
                />

                <span className="font-semibold text-cyan-400">
                  AI Match
                </span>

              </div>

              <p className="mt-2 text-lg font-bold text-white">
                {property.score}% Match
              </p>

              {property.reason && (
                <p className="mt-2 text-sm text-slate-300">
                  {property.reason}
                </p>
              )}

            </div>
          )}

        {/* ==================================================
            BUTTONS
        ================================================== */}

        <div className="flex gap-3">

          <button
            type="button"
            onClick={handleViewProperty}
            className="
              flex-1
              rounded-xl
              bg-cyan-500
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            View Property
          </button>

          <button
            type="button"
            onClick={handleEditProperty}
            className="
              rounded-xl
              border
              border-slate-700
              px-5
              py-3
              text-white
              transition
              hover:bg-slate-800
            "
          >
            Edit
          </button>

        </div>

      </div>

    </article>
  );
};

export default PropertyCard;