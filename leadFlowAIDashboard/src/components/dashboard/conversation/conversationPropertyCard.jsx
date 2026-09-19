/**
 * =========================================================
 * CONVERSATION PROPERTY CARD
 * =========================================================
 *
 * Path
 * ----
 * src/components/dashboard/conversations/conversationPropertyCard.jsx
 *
 * Purpose
 * -------
 * Displays the property associated with the active viewer
 * conversation.
 *
 * Responsibilities
 * ----------------
 * ✓ Display property cover photo
 * ✓ Display property title
 * ✓ Display property location
 * ✓ Display property price
 * ✓ Display property type
 * ✓ Display bedrooms / bathrooms when available
 * ✓ Handle missing property information safely
 * ✓ Allow optional property selection/navigation
 *
 * IMPORTANT
 * ---------
 * This component is VIEWER-SCOPED.
 *
 * It does not:
 * ✓ Edit properties
 * ✓ Archive properties
 * ✓ Delete properties
 * ✓ Change property status
 *
 * MongoDB
 * -------
 * Property references may be stored as:
 *
 * property._id
 * property.id
 * propertyId
 *
 * Images may be stored as:
 *
 * property.coverPhoto
 * property.coverImage
 * property.image
 * property.images[]
 *
 * =========================================================
 */

import {
  Building2,
  MapPin,
  BedDouble,
  Bath,
  ExternalLink,
} from "lucide-react";

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Safely resolve a property ID.
 */
const getPropertyId = (property) => {
  if (!property) {
    return null;
  }

  if (typeof property === "string") {
    return property;
  }

  return (
    property?._id ||
    property?.id ||
    property?.propertyId ||
    null
  );
};

/**
 * Safely resolve the property object.
 *
 * Some APIs may return:
 *
 * property
 *
 * while others may return:
 *
 * conversation.property
 *
 * or:
 *
 * conversation.propertyId
 */
const resolveProperty = (conversation, property) => {
  if (property && typeof property === "object") {
    return property;
  }

  if (
    conversation?.property &&
    typeof conversation.property === "object"
  ) {
    return conversation.property;
  }

  return null;
};

/**
 * Resolve cover image.
 *
 * Supports both a single image and an images array.
 */
const getPropertyImage = (property) => {
  if (!property) {
    return null;
  }

  if (
    typeof property.coverPhoto === "string" &&
    property.coverPhoto.trim()
  ) {
    return property.coverPhoto;
  }

  if (
    typeof property.coverImage === "string" &&
    property.coverImage.trim()
  ) {
    return property.coverImage;
  }

  if (
    typeof property.image === "string" &&
    property.image.trim()
  ) {
    return property.image;
  }

  if (Array.isArray(property.images)) {
    const firstImage = property.images.find(
      (image) => {
        if (typeof image === "string") {
          return image.trim();
        }

        return (
          image?.url ||
          image?.secure_url ||
          image?.src
        );
      }
    );

    if (typeof firstImage === "string") {
      return firstImage;
    }

    if (firstImage) {
      return (
        firstImage.url ||
        firstImage.secure_url ||
        firstImage.src ||
        null
      );
    }
  }

  return null;
};

/**
 * Resolve property title.
 */
const getPropertyTitle = (
  property,
  conversation
) => {
  return (
    property?.title ||
    property?.name ||
    conversation?.propertyTitle ||
    conversation?.propertyName ||
    "Property"
  );
};

/**
 * Resolve property location.
 */
const getPropertyLocation = (
  property,
  conversation
) => {
  if (typeof property?.location === "string") {
    return property.location;
  }

  if (
    property?.location &&
    typeof property.location === "object"
  ) {
    return (
      property.location.name ||
      property.location.address ||
      property.location.area ||
      property.location.city ||
      "-"
    );
  }

  return (
    conversation?.propertyLocation ||
    conversation?.location ||
    "-"
  );
};

/**
 * Resolve property price.
 */
const getPropertyPrice = (
  property,
  conversation
) => {
  return (
    property?.price ??
    property?.rent ??
    property?.monthlyRent ??
    conversation?.propertyPrice ??
    conversation?.price ??
    null
  );
};

/**
 * Format price safely.
 */
const formatPrice = (price) => {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return null;
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return `KES ${numericPrice.toLocaleString()}`;
};

/**
 * Resolve property type.
 */
const getPropertyType = (property) => {
  return (
    property?.propertyType ||
    property?.type ||
    property?.category ||
    null
  );
};

/**
 * Resolve bedrooms.
 */
const getBedrooms = (property) => {
  return (
    property?.bedrooms ??
    property?.bedroomCount ??
    null
  );
};

/**
 * Resolve bathrooms.
 */
const getBathrooms = (property) => {
  return (
    property?.bathrooms ??
    property?.bathroomCount ??
    null
  );
};

/**
 * =========================================================
 * COMPONENT
 * =========================================================
 */

const ConversationPropertyCard = ({
  conversation = null,
  property = null,
  onPropertyClick,
}) => {
  /**
   * =======================================================
   * PROPERTY
   * =======================================================
   */

  const resolvedProperty = resolveProperty(
    conversation,
    property
  );

  /**
   * =======================================================
   * PROPERTY ID
   * =======================================================
   */

  const propertyId =
    getPropertyId(resolvedProperty) ||
    getPropertyId(conversation?.propertyId);

  /**
   * =======================================================
   * PROPERTY DATA
   * =======================================================
   */

  const propertyTitle = getPropertyTitle(
    resolvedProperty,
    conversation
  );

  const propertyLocation =
    getPropertyLocation(
      resolvedProperty,
      conversation
    );

  const propertyPrice = formatPrice(
    getPropertyPrice(
      resolvedProperty,
      conversation
    )
  );

  const propertyType =
    getPropertyType(resolvedProperty);

  const bedrooms =
    getBedrooms(resolvedProperty);

  const bathrooms =
    getBathrooms(resolvedProperty);

  const propertyImage =
    getPropertyImage(resolvedProperty);

  /**
   * =======================================================
   * PROPERTY CLICK
   * =======================================================
   */

  const handlePropertyClick = () => {
    if (!onPropertyClick) {
      return;
    }

    onPropertyClick(
      resolvedProperty || {
        _id: propertyId,
      }
    );
  };

  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ==================================================
          PROPERTY IMAGE
      ================================================== */}

      <button
        type="button"
        onClick={handlePropertyClick}
        disabled={!onPropertyClick}
        className={`group relative block h-48 w-full overflow-hidden bg-slate-100 text-left ${
          onPropertyClick
            ? "cursor-pointer"
            : "cursor-default"
        }`}
      >
        {propertyImage ? (
          <img
            src={propertyImage}
            alt={propertyTitle}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display =
                "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <Building2
              size={48}
              className="text-slate-300"
            />
          </div>
        )}

        {/* ==================================================
            IMAGE OVERLAY
        ================================================== */}

        {onPropertyClick && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/20">
            <div className="rounded-full bg-white/90 p-3 opacity-0 shadow-lg transition group-hover:opacity-100">
              <ExternalLink
                size={18}
                className="text-slate-700"
              />
            </div>
          </div>
        )}
      </button>

      {/* ==================================================
          PROPERTY INFORMATION
      ================================================== */}

      <div className="space-y-4 p-5">
        {/* ==================================================
            TITLE
        ================================================== */}

        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-900">
                {propertyTitle}
              </h3>

              {propertyType && (
                <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                  {String(propertyType).replace(
                    /_/g,
                    " "
                  )}
                </p>
              )}
            </div>

            {propertyId && (
              <Building2
                size={20}
                className="shrink-0 text-cyan-600"
              />
            )}
          </div>
        </div>

        {/* ==================================================
            LOCATION
        ================================================== */}

        {propertyLocation &&
          propertyLocation !== "-" && (
            <div className="flex items-start gap-2">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-slate-400"
              />

              <p className="text-sm leading-5 text-slate-600">
                {propertyLocation}
              </p>
            </div>
          )}

        {/* ==================================================
            PRICE
        ================================================== */}

        {propertyPrice && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Price
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {propertyPrice}
            </p>
          </div>
        )}

        {/* ==================================================
            PROPERTY FEATURES
        ================================================== */}

        {(bedrooms !== null ||
          bathrooms !== null) && (
          <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4">
            {bedrooms !== null &&
              bedrooms !== undefined && (
                <div className="flex items-center gap-2">
                  <BedDouble
                    size={17}
                    className="text-slate-400"
                  />

                  <span className="text-sm text-slate-600">
                    {bedrooms}{" "}
                    {Number(bedrooms) === 1
                      ? "Bedroom"
                      : "Bedrooms"}
                  </span>
                </div>
              )}

            {bathrooms !== null &&
              bathrooms !== undefined && (
                <div className="flex items-center gap-2">
                  <Bath
                    size={17}
                    className="text-slate-400"
                  />

                  <span className="text-sm text-slate-600">
                    {bathrooms}{" "}
                    {Number(bathrooms) === 1
                      ? "Bathroom"
                      : "Bathrooms"}
                  </span>
                </div>
              )}
          </div>
        )}

        {/* ==================================================
            PROPERTY ACTION
        ================================================== */}

        {onPropertyClick && propertyId && (
          <button
            type="button"
            onClick={handlePropertyClick}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-cyan-500
              px-4
              py-3
              text-sm
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
            "
          >
            <ExternalLink size={16} />

            View Property
          </button>
        )}
      </div>
    </section>
  );
};

export default ConversationPropertyCard;