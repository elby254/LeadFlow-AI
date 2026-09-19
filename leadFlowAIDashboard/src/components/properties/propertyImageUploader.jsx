/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Reusable image uploader with preview.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyImages
 * • PropertyForm
 * • Edit Property
 *
 * Backend
 * ----------------------------------------------------------
 * propertyImageService
 *
 * ==========================================================
 */

import {

  ImagePlus,

  Upload,

} from "lucide-react";

const PropertyImageUploader = ({

  multiple = false,

  files = [],

  onFilesChange,

  label = "Upload Images",

}) => {

  /*
  ==========================================================
  SELECT FILES
  ==========================================================
  */

  const handleFiles = (event) => {

    const selectedFiles = Array.from(

      event.target.files || []

    );

    onFilesChange?.(

      multiple

        ? selectedFiles

        : selectedFiles[0] || null

    );

  };

  return (

    <div className="space-y-4">

      <label className="text-sm font-medium">

        {label}

      </label>

      <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-8 transition hover:border-primary">

        <div className="space-y-3 text-center">

          <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground" />

          <div>

            <p className="font-medium">

              Select Images

            </p>

            <p className="text-xs text-muted-foreground">

              JPG, PNG or WEBP

            </p>

          </div>

          <div className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">

            <Upload size={16} />

            Browse

          </div>

        </div>

        <input

          type="file"

          accept="image/*"

          multiple={multiple}

          className="hidden"

          onChange={handleFiles}

        />

      </label>

      {/* ======================================================
          IMAGE PREVIEW
      ====================================================== */}

      {files &&

        (

          Array.isArray(files)

            ? files.length > 0

            : true

        ) && (

        <div className="space-y-4">

          <h4 className="font-medium">

            Selected Images

          </h4>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {(

              Array.isArray(files)

                ? files

                : [files]

            ).map((file, index) => (

              <div

                key={index}

                className="overflow-hidden rounded-lg border"

              >

                <img

                  src={URL.createObjectURL(file)}

                  alt={`Preview ${index + 1}`}

                  className="h-40 w-full object-cover"

                />

                <div className="border-t p-2">

                  <p

                    className="truncate text-xs text-muted-foreground"

                  >

                    {file.name}

                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

      {/* ======================================================
          HELPER
      ====================================================== */}

      <div className="rounded-lg border bg-muted/40 p-4">

        <p className="text-sm text-muted-foreground">

          LeadFlow AI recommends uploading
          high-resolution property images.
          Better images improve search quality,
          recommendations, and lead conversion.

        </p>

      </div>

    </div>

  );

};

export default PropertyImageUploader;