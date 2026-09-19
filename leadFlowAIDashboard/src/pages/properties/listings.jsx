/**
 * ==========================================================
 *
 * Route
 * ----------------------------------------------------------
 * Admin:
 * /admin/properties/listings
 *
 * Agent:
 * /agent/properties/listings
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Load properties through useProperties
 * ✓ Resolve every property image through the shared helper
 * ✓ Handle page-level loading state
 * ✓ Handle page-level error state
 * ✓ Provide property navigation
 * ✓ Pass normalized property data to reusable components
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This page MUST NOT render MainLayout.
 *
 * MainLayout is already provided by App.jsx:
 *
 * /admin
 *   └── MainLayout
 *        └── Listings
 *
 * /agent
 *   └── MainLayout
 *        └── Listings
 *
 * Rendering MainLayout here would create a nested layout.
 *
 * UI is delegated to:
 * ----------------------------------------------------------
 * ✓ PropertyListingsHeader
 * ✓ PropertyListingsError
 * ✓ PropertyTable
 *
 * IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 * All property images MUST be resolved through the shared
 * property image helper.
 *
 * Shared helper:
 *
 * getPropertyImageUrl(property)
 *
 * The helper is the SINGLE SOURCE OF TRUTH for resolving
 * the property's existing image.
 *
 * This component MUST NOT:
 *
 * ✗ Generate images
 * ✗ Construct image URLs
 * ✗ Search multiple image fields independently
 * ✗ Create another fallback image resolver
 *
 * Flow:
 *
 * Property
 *    ↓
 * getPropertyImageUrl(property)
 *    ↓
 * imageUrl
 *    ↓
 * PropertyTable
 *    ↓
 * Property Card
 *
 * ==========================================================
 */

import { useNavigate } from "react-router-dom";

import PropertyListingsHeader from "../../components/properties/propertyListingsHeader";
import PropertyListingsError from "../../components/properties/propertyListingsError";
import PropertyTable from "../../components/properties/propertyTable";

import useProperties from "../../hooks/useProperties";

/*
 * IMPORTANT
 * ----------------------------------------------------------
 * Adjust this import path only if your shared helper is stored
 * somewhere else.
 *
 * Example expected location:
 *
 * src/utils/propertyImage.js
 *
 * containing:
 *
 * export const getPropertyImageUrl = (property) => {
 *   ...
 * };
 */
import { getPropertyImageUrl } from "../../utils/propertyImage";

/* ==========================================================
   LISTINGS PAGE
========================================================== */

const Listings = () => {
  const navigate = useNavigate();

  /* ========================================================
     PROPERTY DATA
  ======================================================== */

  const {
    properties,
    loading,
    error,
    refreshProperties,
  } = useProperties();

  /* ========================================================
     SAFE PROPERTY DATA

     Always provide PropertyTable with an array.
  ======================================================== */

  const safeProperties = Array.isArray(properties)
    ? properties
    : [];

  /* ========================================================
     NORMALIZE PROPERTY IMAGES

     IMPORTANT
     --------------------------------------------------------
     Every property passes through the shared helper.

     We do NOT construct image URLs here.

     We do NOT generate another image.

     We do NOT inspect:
       property.images
       property.image
       property.coverImage.url
       etc.

     That responsibility belongs exclusively to:

       getPropertyImageUrl(property)

     The resolved image is exposed as:

       imageUrl

     PropertyTable can then use:

       property.imageUrl

     for the property card.

     This gives the Listings workflow one canonical image
     value without duplicating image-resolution logic.
  ======================================================== */

  const propertiesWithImages = safeProperties
    .filter(
      (property) =>
        property &&
        typeof property === "object"
    )
    .map((property) => ({
      ...property,

      /*
       * Canonical property image.
       *
       * This may be:
       *
       *   PropertyImage.url
       *
       * or:
       *
       *   coverImage string
       *
       * or:
       *
       *   null
       *
       * depending on the shared helper.
       */
      imageUrl: getPropertyImageUrl(property),
    }));

  /* ========================================================
     DELETE PROPERTY

     NOTE:
     The actual deletion should eventually be exposed by
     useProperties, for example:

     const {
       properties,
       loading,
       error,
       refreshProperties,
       deleteProperty,
     } = useProperties();

     Then:

     await deleteProperty(propertyId);

     For now we preserve the existing refresh behavior.
  ======================================================== */

  const handleDeleteProperty = async (propertyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmed) {
      return;
    }

    try {
      /*
       * Temporary deletion placeholder.
       *
       * Replace this with deleteProperty(propertyId)
       * once the hook/service exposes the operation.
       */

      console.log(
        "Delete property requested:",
        propertyId
      );

      await refreshProperties();
    } catch (deleteError) {
      console.error(
        "Unable to delete property:",
        deleteError
      );
    }
  };

  /* ========================================================
     PAGE
  ======================================================== */

  return (
    <div className="space-y-8">

      {/* ==================================================
          HEADER
      ================================================== */}

      <PropertyListingsHeader
        onRefresh={refreshProperties}
        onAddProperty={() =>
          navigate("/admin/properties/add")
        }
        loading={loading}
      />

      {/* ==================================================
          ERROR
      ================================================== */}

      <PropertyListingsError
        error={error}
        onRetry={refreshProperties}
      />

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading ? (
        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
          "
        >
          <div className="space-y-4 p-8">

            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="
                  h-16
                  animate-pulse
                  rounded-xl
                  bg-slate-800
                "
              />
            ))}

          </div>
        </div>
      ) : propertiesWithImages.length === 0 ? (

        /* ==================================================
           EMPTY STATE
        ================================================== */

        <div
          className="
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
            p-12
            text-center
          "
        >
          <h2
            className="
              text-xl
              font-semibold
              text-white
            "
          >
            No listings available
          </h2>

          <p
            className="
              mt-2
              text-slate-400
            "
          >
            There are currently no properties available
            in your listings.
          </p>
        </div>

      ) : (

        /* ==================================================
           PROPERTY TABLE
        ================================================== */

        <PropertyTable
          properties={propertiesWithImages}
          showActions={true}
          onDelete={handleDeleteProperty}
        />

      )}

    </div>
  );
};

export default Listings;