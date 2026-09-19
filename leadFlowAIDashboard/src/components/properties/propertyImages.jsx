/**
 * ==========================================================
 *
 * Purpose
 * ----------------------------------------------------------
 * Collects property images for PropertyForm.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyForm
 *
 * Backend
 * ----------------------------------------------------------
 * PropertyImageController
 * PropertyImageService
 * uploadPropertyImages middleware
 *
 * IMPORTANT IMAGE RULE
 * ----------------------------------------------------------
 * This component does NOT generate or replace property images.
 *
 * Images selected here are the actual images supplied by the
 * administrator/agent and are passed to the parent through
 * onChange().
 *
 * The shared image helper is used for image URL handling so
 * image behavior remains consistent across LeadFlow AI.
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { getPropertyImage } from "../../utils/propertyImageHelper";

const PropertyImages = ({
  coverImage = null,
  galleryImages = [],
  onChange,
}) => {
  /*
  ==========================================================
  LOCAL PREVIEW URLS
  ==========================================================
  */

  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  /*
  ==========================================================
  CREATE PREVIEWS
  ----------------------------------------------------------
  The shared image helper is responsible for resolving
  existing image URLs.

  Newly selected File objects still require temporary browser
  preview URLs because they have not yet been uploaded.
  ==========================================================
  */

  useEffect(() => {
    let coverObjectUrl = null;

    /*
    ----------------------------------------------------------
    COVER IMAGE
    ----------------------------------------------------------
    */

    if (coverImage instanceof File) {
      coverObjectUrl = URL.createObjectURL(coverImage);
      setCoverPreview(coverObjectUrl);
    } else if (coverImage) {
      setCoverPreview(getPropertyImage(coverImage));
    } else {
      setCoverPreview(null);
    }

    /*
    ----------------------------------------------------------
    GALLERY IMAGES
    ----------------------------------------------------------
    */

    const objectUrls = [];

    const resolvedGallery = Array.isArray(galleryImages)
      ? galleryImages.map((image) => {
          if (image instanceof File) {
            const objectUrl = URL.createObjectURL(image);

            objectUrls.push(objectUrl);

            return objectUrl;
          }

          return getPropertyImage(image);
        })
      : [];

    setGalleryPreviews(resolvedGallery);

    /*
    ----------------------------------------------------------
    CLEANUP
    ----------------------------------------------------------
    */

    return () => {
      if (coverObjectUrl) {
        URL.revokeObjectURL(coverObjectUrl);
      }

      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [coverImage, galleryImages]);

  /*
  ==========================================================
  COVER IMAGE
  ==========================================================
  */

  const handleCoverImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    onChange?.({
      coverImage: file,
      galleryImages,
    });

    /*
    Allow selecting the same file again.
    */
    event.target.value = "";
  };

  /*
  ==========================================================
  GALLERY IMAGES
  ==========================================================
  */

  const handleGalleryImages = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    onChange?.({
      coverImage,
      galleryImages: files,
    });

    /*
    Allow selecting the same files again.
    */
    event.target.value = "";
  };

  /*
  ==========================================================
  REMOVE COVER IMAGE
  ==========================================================
  */

  const handleRemoveCover = () => {
    onChange?.({
      coverImage: null,
      galleryImages,
    });
  };

  /*
  ==========================================================
  REMOVE GALLERY IMAGE
  ==========================================================
  */

  const handleRemoveGalleryImage = (index) => {
    const updatedGallery = galleryImages.filter(
      (_, imageIndex) => imageIndex !== index
    );

    onChange?.({
      coverImage,
      galleryImages: updatedGallery,
    });
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="space-y-6 rounded-xl border bg-card p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h3 className="text-lg font-semibold">
          Property Images
        </h3>

        <p className="text-sm text-muted-foreground">
          Upload one cover image and optional gallery images.
        </p>
      </div>

      {/* ======================================================
          COVER IMAGE
      ====================================================== */}

      <div className="space-y-3">
        <label className="text-sm font-medium">
          Cover Image
        </label>

        <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-8 transition hover:border-primary">
          <div className="text-center">
            <ImagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

            <p className="font-medium">
              Click to upload cover image
            </p>

            <p className="text-xs text-muted-foreground">
              JPG, PNG or WEBP
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverImage}
          />
        </label>

        {/* ====================================================
            COVER PREVIEW
        ==================================================== */}

        {coverPreview && (
          <div className="relative overflow-hidden rounded-xl border">
            <img
              src={coverPreview}
              alt="Property cover"
              className="h-64 w-full object-cover"
            />

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-slate-950/80 px-4 py-3 backdrop-blur">
              <span className="text-sm font-medium text-white">
                Cover Image
              </span>

              <button
                type="button"
                onClick={handleRemoveCover}
                className="
                  inline-flex
                  items-center
                  gap-1
                  rounded-lg
                  bg-red-500/20
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-red-300
                  transition
                  hover:bg-red-500/30
                "
              >
                <X size={16} />

                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          GALLERY IMAGES
      ====================================================== */}

      <div className="space-y-3">
        <label className="text-sm font-medium">
          Gallery Images
        </label>

        <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-8 transition hover:border-primary">
          <div className="text-center">
            <ImagePlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

            <p className="font-medium">
              Upload Gallery Images
            </p>

            <p className="text-xs text-muted-foreground">
              Multiple images supported
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleGalleryImages}
          />
        </label>
      </div>

      {/* ======================================================
          GALLERY PREVIEW
      ====================================================== */}

      {galleryPreviews.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">
            Gallery Images
          </h4>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {galleryPreviews.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="
                  relative
                  overflow-hidden
                  rounded-lg
                  border
                  bg-slate-900
                "
              >
                <img
                  src={imageUrl}
                  alt={`Property gallery ${index + 1}`}
                  className="h-40 w-full object-cover"
                />

                <div className="flex items-center justify-between border-t bg-slate-950 p-2">
                  <span className="text-xs text-slate-400">
                    Gallery {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveGalleryImage(index)
                    }
                    className="
                      rounded-md
                      p-1
                      text-red-400
                      transition
                      hover:bg-red-500/10
                      hover:text-red-300
                    "
                    aria-label={`Remove gallery image ${
                      index + 1
                    }`}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================
          IMAGE RULE
      ====================================================== */}

      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="text-sm leading-6 text-muted-foreground">
          High-quality images improve LeadFlow AI property
          recommendations, increase lead engagement, and
          produce richer property listings across the platform.
          The property's existing images are reused throughout
          the system rather than generating new images for
          recommendations.
        </p>
      </div>
    </section>
  );
};

export default PropertyImages;