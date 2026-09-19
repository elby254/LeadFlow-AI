/**
 * ==========================================================
 *
 * ADD PROPERTY
 *
 * Route
 * -----
 * /admin/properties/add
 *
 * BACKEND
 * -------
 * POST /api/properties
 * POST /api/properties/:propertyId/images
 *
 * IMAGE CREATION FLOW
 * -------------------
 *
 * 1. Create Property
 * 2. Upload browser File
 * 3. Backend creates PropertyImage
 * 4. Backend assigns Property.coverImage
 * 5. Frontend re-fetches Property
 * 6. Frontend verifies coverImage
 *
 * IMPORTANT
 * ----------
 * The frontend NEVER creates a PropertyImage object.
 *
 * The frontend only sends the browser File using FormData.
 *
 * ==========================================================
 */

import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import axiosClient from "../../api/axiosClient";


/* ==========================================================
   BACKEND STATUS VALUES
========================================================== */

const PROPERTY_STATUSES = [
  "available",
  "reserved",
  "sold",
  "occupied",
  "inactive",
];


/* ==========================================================
   PROPERTY TYPES
========================================================== */

const PROPERTY_TYPES = [
  "apartment",
  "bedsitter",
  "studio",
  "maisonette",
  "house",
  "villa",
  "commercial",
  "office",
  "land",
];


/* ==========================================================
   NORMALIZATION HELPERS
========================================================== */

/**
 * Normalize arbitrary text.
 */
const normalizeText = (
  value
) => {

  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

};


/**
 * Normalize status.
 */
const normalizeStatus = (
  value
) => {

  const normalized =
    normalizeText(value);

  if (
    PROPERTY_STATUSES.includes(
      normalized
    )
  ) {
    return normalized;
  }

  return "available";

};


/**
 * Normalize property type.
 */
const normalizePropertyType = (
  value
) => {

  const normalized =
    normalizeText(value);

  if (
    PROPERTY_TYPES.includes(
      normalized
    )
  ) {
    return normalized;
  }

  return "apartment";

};


/* ==========================================================
   NUMBER NORMALIZATION
========================================================== */

/**
 * Convert optional numeric input safely.
 *
 * Empty values become undefined.
 */
const normalizeOptionalNumber = (
  value
) => {

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return undefined;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return undefined;
  }

  return number;

};


/* ==========================================================
   IMAGE RESPONSE NORMALIZATION
========================================================== */


/* ========================================================
   EXTRACT UPLOADED PROPERTY IMAGE
======================================================== */

/**
 * Extract the PropertyImage object returned by:
 *
 * POST /properties/:propertyId/images
 *
 * Backend response:
 *
 * {
 *   success: true,
 *   count: 1,
 *   data: [
 *     {
 *       _id: "...",
 *       property: "...",
 *       url: "...",
 *       isCover: true,
 *       ...
 *     }
 *   ],
 *   coverImage: "..."
 * }
 *
 * IMPORTANT:
 *
 * The backend returns `data` as an ARRAY because the
 * controller supports multiple uploaded images.
 *
 * Therefore:
 *
 * response.data.data
 *
 * may be:
 *
 * [
 *   PropertyImage
 * ]
 *
 * and NOT:
 *
 * PropertyImage
 *
 * This extractor supports both forms so that the
 * frontend remains compatible with the backend.
 */
const extractUploadedPropertyImage = (
  response
) => {

  /* ------------------------------------------------------
     DEBUG
  ------------------------------------------------------ */

  console.log(
    "ADD PROPERTY - EXTRACTING PROPERTY IMAGE:"
  );

  console.log(
    "Axios response:",
    response
  );

  console.log(
    "Axios response.data:",
    response?.data
  );


  /* ------------------------------------------------------
     NORMALIZE AXIOS RESPONSE
  ------------------------------------------------------ */

  const body =
    response?.data ?? response;


  console.log(
    "ADD PROPERTY - IMAGE RESPONSE BODY:",
    body
  );


  /* ------------------------------------------------------
     HELPER
  ------------------------------------------------------ */

  const isPropertyImage =
    (value) => {

      return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        (
          value._id ||
          value.id
        )
      );

    };


  /* ------------------------------------------------------
     1. STANDARD BACKEND RESPONSE
     *
     * {
     *   success: true,
     *   data: [PropertyImage]
     * }
     ------------------------------------------------------ */

  const data =
    body?.data;


  if (
    Array.isArray(data)
  ) {

    console.log(
      "ADD PROPERTY - IMAGE DATA ARRAY:",
      data
    );


    /* -----------------------------------------------
       First PropertyImage in array
    ----------------------------------------------- */

    const firstImage =
      data.find(
        isPropertyImage
      );


    if (
      firstImage
    ) {

      console.log(
        "ADD PROPERTY - PROPERTY IMAGE FOUND IN data[]:",
        firstImage
      );


      return firstImage;

    }

  }


  /* ------------------------------------------------------
     2. data IS ALREADY A PropertyImage OBJECT
     ------------------------------------------------------ */

  if (
    isPropertyImage(data)
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND IN data:",
      data
    );


    return data;

  }


  /* ------------------------------------------------------
     3. data.image
     ------------------------------------------------------ */

  if (
    isPropertyImage(
      data?.image
    )
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND IN data.image:",
      data.image
    );


    return data.image;

  }


  /* ------------------------------------------------------
     4. data.propertyImage
     ------------------------------------------------------ */

  if (
    isPropertyImage(
      data?.propertyImage
    )
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND IN data.propertyImage:",
      data.propertyImage
    );


    return data.propertyImage;

  }


  /* ------------------------------------------------------
     5. TOP-LEVEL image
     ------------------------------------------------------ */

  if (
    isPropertyImage(
      body?.image
    )
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND IN body.image:",
      body.image
    );


    return body.image;

  }


  /* ------------------------------------------------------
     6. TOP-LEVEL propertyImage
     ------------------------------------------------------ */

  if (
    isPropertyImage(
      body?.propertyImage
    )
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND IN body.propertyImage:",
      body.propertyImage
    );


    return body.propertyImage;

  }


  /* ------------------------------------------------------
     7. createdImage
     ------------------------------------------------------ */

  if (
    isPropertyImage(
      body?.createdImage
    )
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND IN body.createdImage:",
      body.createdImage
    );


    return body.createdImage;

  }


  /* ------------------------------------------------------
     8. createdPropertyImage
     ------------------------------------------------------ */

  if (
    isPropertyImage(
      body?.createdPropertyImage
    )
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND IN body.createdPropertyImage:",
      body.createdPropertyImage
    );


    return body.createdPropertyImage;

  }


  /* ------------------------------------------------------
     9. DIRECT RESPONSE
     ------------------------------------------------------ */

  if (
    isPropertyImage(body)
  ) {

    console.log(
      "ADD PROPERTY - PROPERTY IMAGE FOUND DIRECTLY:",
      body
    );


    return body;

  }


  /* ------------------------------------------------------
     10. RESPONSE COULD ITSELF BE AN ARRAY
     ------------------------------------------------------ */

  if (
    Array.isArray(body)
  ) {

    const firstImage =
      body.find(
        isPropertyImage
      );


    if (
      firstImage
    ) {

      console.log(
        "ADD PROPERTY - PROPERTY IMAGE FOUND IN DIRECT ARRAY:",
        firstImage
      );


      return firstImage;

    }

  }


  /* ------------------------------------------------------
     NOT FOUND
  ------------------------------------------------------ */

  console.error(
    "ADD PROPERTY - UNABLE TO EXTRACT PROPERTY IMAGE:",
    {
      response,
      body,
      data,
    }
  );


  return null;

};


/**
 * ==========================================================
 * EXTRACT PROPERTY ID
 * ==========================================================
 */
const extractPropertyId = (
  response
) => {

  const body =
    response?.data;


  const property =
    body?.data ||
    body?.property ||
    body;


  return (
    property?._id ||
    property?.id ||
    body?._id ||
    body?.id ||
    null
  );

};


/* ==========================================================
   COMPONENT
========================================================== */

const AddProperty = () => {

  const navigate =
    useNavigate();


  /* ========================================================
     STATE
  ======================================================== */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [imagePreview, setImagePreview] =
    useState(null);


  const [formData, setFormData] =
    useState({

      title: "",

      propertyType:
        "apartment",

      location: "",

      price: "",

      bedrooms: "",

      bathrooms: "",

      status:
        "available",

      description: "",

      /**
       * Browser File only.
       *
       * This is NOT a PropertyImage document.
       */
      coverImage: null,

    });


  /* ========================================================
     CLEAN UP IMAGE PREVIEW
  ======================================================== */

  useEffect(() => {

    return () => {

      if (
        imagePreview
      ) {

        URL.revokeObjectURL(
          imagePreview
        );

      }

    };

  }, [imagePreview]);


  /* ========================================================
     HANDLE INPUT
  ======================================================== */

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setError("");

    setSuccess("");


    setFormData(
      (previousData) => ({

        ...previousData,

        [name]:
          value,

      })
    );

  };


  /* ========================================================
     HANDLE COVER IMAGE
  ======================================================== */

  const handleCoverImageChange = (
    event
  ) => {

    const file =
      event.target.files?.[0] ||
      null;


    /* ------------------------------------------------------
       Revoke previous preview
    ------------------------------------------------------ */

    if (
      imagePreview
    ) {

      URL.revokeObjectURL(
        imagePreview
      );

      setImagePreview(null);

    }


    /* ------------------------------------------------------
       No file selected
    ------------------------------------------------------ */

    if (
      !file
    ) {

      setFormData(
        (previousData) => ({

          ...previousData,

          coverImage: null,

        })
      );

      return;

    }


    /* ------------------------------------------------------
       File validation
    ------------------------------------------------------ */

    if (
      !(file instanceof File)
    ) {

      setError(
        "The selected cover image could not be processed."
      );

      setFormData(
        (previousData) => ({

          ...previousData,

          coverImage: null,

        })
      );

      return;

    }


    /* ------------------------------------------------------
       MIME validation
    ------------------------------------------------------ */

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      setError(
        "Please select a valid image file."
      );

      setFormData(
        (previousData) => ({

          ...previousData,

          coverImage: null,

        })
      );

      return;

    }


    /* ------------------------------------------------------
       File size validation
    ------------------------------------------------------ */

    const MAX_IMAGE_SIZE =
      10 * 1024 * 1024;


    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {

      setError(
        "Cover image must be smaller than 10 MB."
      );

      setFormData(
        (previousData) => ({

          ...previousData,

          coverImage: null,

        })
      );

      return;

    }


    /* ------------------------------------------------------
       Store browser File
    ------------------------------------------------------ */

    setError("");

    setSuccess("");


    setFormData(
      (previousData) => ({

        ...previousData,

        coverImage:
          file,

      })
    );


    /* ------------------------------------------------------
       Create local preview
    ------------------------------------------------------ */

    const previewUrl =
      URL.createObjectURL(
        file
      );


    setImagePreview(
      previewUrl
    );

  };


  /* ========================================================
     VALIDATE FORM
  ======================================================== */

  const validateForm = () => {

    const title =
      String(
        formData.title || ""
      ).trim();


    const location =
      String(
        formData.location || ""
      ).trim();


    const price =
      normalizeOptionalNumber(
        formData.price
      );


    const bedrooms =
      normalizeOptionalNumber(
        formData.bedrooms
      );


    const bathrooms =
      normalizeOptionalNumber(
        formData.bathrooms
      );


    /* ------------------------------------------------------
       TITLE
    ------------------------------------------------------ */

    if (
      !title
    ) {

      return {

        valid: false,

        message:
          "Please enter a property title.",

      };

    }


    /* ------------------------------------------------------
       LOCATION
    ------------------------------------------------------ */

    if (
      !location
    ) {

      return {

        valid: false,

        message:
          "Please enter the property location.",

      };

    }


    /* ------------------------------------------------------
       PRICE
    ------------------------------------------------------ */

    if (
      price === undefined ||
      price < 0
    ) {

      return {

        valid: false,

        message:
          "Please enter a valid property price.",

      };

    }


    /* ------------------------------------------------------
       BEDROOMS
    ------------------------------------------------------ */

    if (
      bedrooms !== undefined &&
      bedrooms < 0
    ) {

      return {

        valid: false,

        message:
          "Please enter a valid number of bedrooms.",

      };

    }


    /* ------------------------------------------------------
       BATHROOMS
    ------------------------------------------------------ */

    if (
      bathrooms !== undefined &&
      bathrooms < 0
    ) {

      return {

        valid: false,

        message:
          "Please enter a valid number of bathrooms.",

      };

    }


    /* ------------------------------------------------------
       COVER IMAGE
    ------------------------------------------------------ */

    if (
      !(formData.coverImage instanceof File)
    ) {

      return {

        valid: false,

        message:
          "Please select a cover image for the property.",

      };

    }


    return {

      valid: true,

      message: "",

    };

  };


  /* ========================================================
     BUILD PROPERTY PAYLOAD
  ======================================================== */

  const buildPropertyPayload = () => {

    const payload = {

      title:
        String(
          formData.title || ""
        ).trim(),


      propertyType:
        normalizePropertyType(
          formData.propertyType
        ),


      location:
        String(
          formData.location || ""
        ).trim(),


      price:
        normalizeOptionalNumber(
          formData.price
        ),


      bedrooms:
        normalizeOptionalNumber(
          formData.bedrooms
        ),


      bathrooms:
        normalizeOptionalNumber(
          formData.bathrooms
        ),


      status:
        normalizeStatus(
          formData.status
        ),


      description:
        String(
          formData.description || ""
        ).trim(),

    };


    /* ------------------------------------------------------
       Remove undefined fields
    ------------------------------------------------------ */

    Object.keys(
      payload
    ).forEach(
      (key) => {

        if (
          payload[key] ===
          undefined
        ) {

          delete payload[key];

        }

      }
    );


    return payload;

  };


  /* ========================================================
     UPLOAD COVER IMAGE
  ======================================================== */

  const uploadCoverImage = async (
    propertyId,
    file
  ) => {

    if (
      !propertyId
    ) {

      throw new Error(
        "Property ID was not returned after property creation."
      );

    }


    if (
      !(file instanceof File)
    ) {

      throw new Error(
        "A valid cover image file is required."
      );

    }


    /* ------------------------------------------------------
       FormData
    ------------------------------------------------------ */

    const imagePayload =
      new FormData();


    /**
     * IMPORTANT
     *
     * This field name must match multer:
     *
     *     upload.single("coverImage")
     *
     * on the backend.
     */
    imagePayload.append(
      "coverImage",
      file,
      file.name
    );


    /* ------------------------------------------------------
       Optional metadata
    ------------------------------------------------------ */

    imagePayload.append(
      "caption",
      String(
        formData.title || ""
      ).trim()
    );


    imagePayload.append(
      "altText",
      `${String(
        formData.title || "Property"
      ).trim()} cover image`
    );


    imagePayload.append(
      "isCover",
      "true"
    );


    console.log(
      "ADD PROPERTY - UPLOADING IMAGE:",
      {

        propertyId,

        fieldName:
          "coverImage",

        fileName:
          file.name,

        fileType:
          file.type,

        fileSize:
          file.size,

      }
    );


    /* ------------------------------------------------------
       POST image
    ------------------------------------------------------ */

    const response =
      await axiosClient.post(
        `/properties/${propertyId}/images`,
        imagePayload
      );


    console.log(
      "ADD PROPERTY - IMAGE UPLOAD RESPONSE:",
      response?.data
    );


    /* ------------------------------------------------------
       Extract image regardless of response wrapper
    ------------------------------------------------------ */

    const imageData =
      extractUploadedPropertyImage(
        response
      );


    if (
      !imageData
    ) {

      /**
       * IMPORTANT:
       *
       * Do NOT immediately assume that the upload failed.
       *
       * The backend may have successfully created the image
       * but returned a response shape we did not recognize.
       */
      console.error(
        "ADD PROPERTY - UNRECOGNIZED IMAGE RESPONSE:",
        response?.data
      );


      throw new Error(
        "The image upload request succeeded, but the backend response did not contain a recognizable PropertyImage ID."
      );

    }


    const imageId =
      imageData?._id ||
      imageData?.id;


    if (
      !imageId
    ) {

      throw new Error(
        "The backend returned an image response, but no PropertyImage ID was found."
      );

    }


    return {

      ...imageData,

      _id:
        imageId,

    };

  };


  /* ========================================================
     VERIFY PROPERTY COVER IMAGE
  ======================================================== */

  const verifyPropertyCoverImage = async (
    propertyId,
    imageId
  ) => {

    if (
      !propertyId
    ) {

      throw new Error(
        "Property ID is required for cover image verification."
      );

    }


    console.log(
      "ADD PROPERTY - VERIFYING PROPERTY:",
      propertyId
    );


    const response =
      await axiosClient.get(
        `/properties/${propertyId}`
      );


    console.log(
      "ADD PROPERTY - VERIFIED PROPERTY RESPONSE:",
      response?.data
    );


    const property =
      response?.data?.data ||
      response?.data?.property ||
      response?.data;


    if (
      !property
    ) {

      throw new Error(
        "The property was created, but it could not be retrieved for image verification."
      );

    }


    const coverImage =
      property?.coverImage;


    /**
     * coverImage may be:
     *
     * ObjectId string
     *
     * OR
     *
     * populated PropertyImage object.
     */
    const coverImageId =
      typeof coverImage === "object"
        ? (
            coverImage?._id ||
            coverImage?.id
          )
        : coverImage;


    if (
      !coverImageId
    ) {

      throw new Error(
        "The PropertyImage was uploaded, but the property does not have a coverImage assigned."
      );

    }


    /**
     * If we received the image ID from the upload endpoint,
     * verify that the property's coverImage points to it.
     */
    if (
      imageId &&
      String(
        coverImageId
      ) !== String(
        imageId
      )
    ) {

      console.warn(
        "ADD PROPERTY - COVER IMAGE ID DIFFERENCE:",
        {

          uploadedImageId:
            imageId,

          propertyCoverImageId:
            coverImageId,

        }
      );

    }


    return {

      property,

      coverImage,

      coverImageId,

    };

  };


  /* ========================================================
     SUBMIT
  ======================================================== */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    if (
      loading
    ) {

      return;

    }


    setLoading(true);

    setError("");

    setSuccess("");


    let createdPropertyId =
      null;


    try {

      /* ====================================================
         STEP 1 — VALIDATE
      ==================================================== */

      const validation =
        validateForm();


      if (
        !validation.valid
      ) {

        setError(
          validation.message
        );

        setLoading(false);

        return;

      }


      /* ====================================================
         STEP 2 — BUILD PAYLOAD
      ==================================================== */

      const propertyPayload =
        buildPropertyPayload();


      console.log(
        "ADD PROPERTY - NORMALIZED PAYLOAD:",
        propertyPayload
      );


      console.log(
        "ADD PROPERTY - NORMALIZED STATUS:",
        propertyPayload.status
      );


      console.log(
        "ADD PROPERTY - STATUS IS VALID:",
        PROPERTY_STATUSES.includes(
          propertyPayload.status
        )
      );


      console.log(
        "ADD PROPERTY - COVER IMAGE:",
        {

          isFile:
            formData.coverImage instanceof File,

          name:
            formData.coverImage?.name,

          type:
            formData.coverImage?.type,

          size:
            formData.coverImage?.size,

        }
      );


      /* ====================================================
         STEP 3 — CREATE PROPERTY
      ==================================================== */

      const propertyResponse =
        await axiosClient.post(
          "/properties",
          propertyPayload
        );


      console.log(
        "ADD PROPERTY - CREATE PROPERTY RESPONSE:",
        propertyResponse?.data
      );


      createdPropertyId =
        extractPropertyId(
          propertyResponse
        );


      console.log(
        "ADD PROPERTY - CREATED PROPERTY ID:",
        createdPropertyId
      );


      if (
        !createdPropertyId
      ) {

        throw new Error(
          "Property was created, but the backend did not return its ID."
        );

      }


      /* ====================================================
         STEP 4 — UPLOAD COVER IMAGE
      ==================================================== */

      const uploadedImage =
        await uploadCoverImage(
          createdPropertyId,
          formData.coverImage
        );


      console.log(
        "ADD PROPERTY - PROPERTY IMAGE CREATED:",
        uploadedImage
      );


      const uploadedImageId =
        uploadedImage?._id ||
        uploadedImage?.id;


      if (
        !uploadedImageId
      ) {

        throw new Error(
          "The backend returned an image response without a PropertyImage ID."
        );

      }


      /* ====================================================
         STEP 5 — VERIFY PROPERTY COVER IMAGE
      ==================================================== */

      const verification =
        await verifyPropertyCoverImage(
          createdPropertyId,
          uploadedImageId
        );


      console.log(
        "ADD PROPERTY - COVER IMAGE VERIFIED:",
        verification
      );


      /* ====================================================
         STEP 6 — SUCCESS
      ==================================================== */

      setSuccess(
        "Property and cover image added successfully."
      );


      /* ----------------------------------------------------
         Clear browser File
      ---------------------------------------------------- */

      setFormData(
        (previousData) => ({

          ...previousData,

          coverImage: null,

        })
      );


      /* ----------------------------------------------------
         Clear file input
      ---------------------------------------------------- */

      const fileInput =
        document.getElementById(
          "coverImage"
        );


      if (
        fileInput
      ) {

        fileInput.value = "";

      }


      /* ----------------------------------------------------
         Clear preview
      ---------------------------------------------------- */

      if (
        imagePreview
      ) {

        URL.revokeObjectURL(
          imagePreview
        );

        setImagePreview(null);

      }


      /* ====================================================
         STEP 7 — NAVIGATE
      ==================================================== */

      setTimeout(
        () => {

          navigate(
            "/admin/properties/listings",
            {
              replace: true,
            }
          );

        },
        700
      );


    } catch (err) {

      console.error(
        "ADD PROPERTY ERROR:",
        err
      );


      console.error(
        "ADD PROPERTY RESPONSE:",
        err?.response?.data
      );


      console.error(
        "ADD PROPERTY STATUS:",
        err?.response?.status
      );


      console.error(
        "ADD PROPERTY CREATED PROPERTY ID:",
        createdPropertyId
      );


      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error;


      const message =
        backendMessage ||
        err?.message ||
        "Unable to save property.";


      /* ----------------------------------------------------
         Property exists but image stage failed
      ---------------------------------------------------- */

      if (
        createdPropertyId
      ) {

        setError(
          `Property was created, but the cover image could not be completed. Property ID: ${createdPropertyId}. ${message}`
        );

      } else {

        setError(
          message
        );

      }

    } finally {

      setLoading(false);

    }

  };


  /* ========================================================
     PAGE
  ======================================================== */

  return (

    <section className="space-y-8">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div>

        <h1 className="text-3xl font-bold text-white">
          Add Property
        </h1>

        <p className="mt-2 text-slate-400">
          Register a new property and its cover image
          into LeadFlow AI.
        </p>

      </div>


      {/* ==================================================
          FORM
      ================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-xl
        "
      >


        {/* =================================================
            BASIC PROPERTY INFORMATION
        ================================================= */}

        <div className="grid gap-6 md:grid-cols-2">


          {/* =================================================
              TITLE
          ================================================= */}

          <div>

            <label
              htmlFor="title"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >
              Property Title
            </label>


            <input
              id="title"
              name="title"
              type="text"
              value={
                formData.title
              }
              onChange={
                handleChange
              }
              required
              placeholder="e.g. 3 Bedroom Apartment in Kilimani"
              disabled={loading}
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />

          </div>


          {/* =================================================
              PROPERTY TYPE
          ================================================= */}

          <div>

            <label
              htmlFor="propertyType"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >
              Property Type
            </label>


            <select
              id="propertyType"
              name="propertyType"
              value={
                formData.propertyType
              }
              onChange={
                handleChange
              }
              disabled={loading}
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <option value="apartment">
                Apartment
              </option>

              <option value="bedsitter">
                Bedsitter
              </option>

              <option value="studio">
                Studio
              </option>

              <option value="maisonette">
                Maisonette
              </option>

              <option value="house">
                House
              </option>

              <option value="villa">
                Villa
              </option>

              <option value="commercial">
                Commercial
              </option>

              <option value="office">
                Office
              </option>

              <option value="land">
                Land
              </option>

            </select>

          </div>


          {/* =================================================
              LOCATION
          ================================================= */}

          <div>

            <label
              htmlFor="location"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >
              Location
            </label>


            <input
              id="location"
              name="location"
              type="text"
              value={
                formData.location
              }
              onChange={
                handleChange
              }
              required
              placeholder="e.g. Kilimani, Nairobi"
              disabled={loading}
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />

          </div>


          {/* =================================================
              PRICE
          ================================================= */}

          <div>

            <label
              htmlFor="price"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >
              Price (KES)
            </label>


            <input
              id="price"
              type="number"
              name="price"
              value={
                formData.price
              }
              onChange={
                handleChange
              }
              required
              min="0"
              step="1"
              placeholder="e.g. 15000000"
              disabled={loading}
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />

          </div>


          {/* =================================================
              BEDROOMS
          ================================================= */}

          <div>

            <label
              htmlFor="bedrooms"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >
              Bedrooms
            </label>


            <input
              id="bedrooms"
              type="number"
              name="bedrooms"
              value={
                formData.bedrooms
              }
              onChange={
                handleChange
              }
              min="0"
              step="1"
              placeholder="e.g. 3"
              disabled={loading}
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />

          </div>


          {/* =================================================
              BATHROOMS
          ================================================= */}

          <div>

            <label
              htmlFor="bathrooms"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >
              Bathrooms
            </label>


            <input
              id="bathrooms"
              type="number"
              name="bathrooms"
              value={
                formData.bathrooms
              }
              onChange={
                handleChange
              }
              min="0"
              step="1"
              placeholder="e.g. 2"
              disabled={loading}
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                transition
                placeholder:text-slate-600
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />

          </div>


          {/* =================================================
              STATUS
          ================================================= */}

          <div>

            <label
              htmlFor="status"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-slate-300
              "
            >
              Status
            </label>


            <select
              id="status"
              name="status"
              value={
                formData.status
              }
              onChange={
                handleChange
              }
              disabled={loading}
              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <option value="available">
                Available
              </option>

              <option value="reserved">
                Reserved
              </option>

              <option value="sold">
                Sold
              </option>

              <option value="occupied">
                Occupied
              </option>

              <option value="inactive">
                Inactive
              </option>

            </select>


            <p className="mt-2 text-xs text-slate-500">
              Saved using the backend-compatible lowercase
              status value.
            </p>

          </div>

        </div>


        {/* ==================================================
            COVER IMAGE
        ================================================== */}

        <div className="mt-6">

          <label
            htmlFor="coverImage"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-300
            "
          >

            Cover Image

            <span className="ml-1 text-red-400">
              *
            </span>

          </label>


          <input
            id="coverImage"
            name="coverImage"
            type="file"
            accept="image/*"
            onChange={
              handleCoverImageChange
            }
            disabled={loading}
            required
            className="
              block
              w-full
              cursor-pointer
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              p-3
              text-sm
              text-slate-300
              file:mr-4
              file:rounded-lg
              file:border-0
              file:bg-cyan-500
              file:px-4
              file:py-2
              file:font-semibold
              file:text-slate-950
              hover:file:bg-cyan-400
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          />


          {/* =================================================
              IMAGE PREVIEW
          ================================================= */}

          {imagePreview && (

            <div
              className="
                mt-4
                overflow-hidden
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
              "
            >

              <img
                src={imagePreview}
                alt="Selected property cover preview"
                className="
                  h-64
                  w-full
                  object-cover
                "
              />

            </div>

          )}


          {/* =================================================
              FILE INFORMATION
          ================================================= */}

          {formData.coverImage && (

            <div
              className="
                mt-3
                rounded-xl
                border
                border-slate-800
                bg-slate-950
                p-3
              "
            >

              <p className="text-sm text-slate-300">

                Selected:{" "}

                <span className="font-medium text-white">

                  {
                    formData.coverImage.name
                  }

                </span>

              </p>


              <p className="mt-1 text-xs text-slate-500">

                {(
                  formData.coverImage.size /
                  (1024 * 1024)
                ).toFixed(2)}{" "}
                MB

              </p>

            </div>

          )}

        </div>


        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        <div className="mt-6">

          <label
            htmlFor="description"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-300
            "
          >
            Description
          </label>


          <textarea
            id="description"
            rows={6}
            name="description"
            value={
              formData.description
            }
            onChange={
              handleChange
            }
            placeholder="Describe the property..."
            disabled={loading}
            className="
              w-full
              rounded-xl
              border
              border-slate-700
              bg-slate-950
              p-3
              text-white
              outline-none
              transition
              placeholder:text-slate-600
              focus:border-cyan-500
              focus:ring-1
              focus:ring-cyan-500
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          />

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div
            role="alert"
            className="
              mt-6
              rounded-xl
              border
              border-red-500/20
              bg-red-500/10
              p-4
              text-red-400
            "
          >

            {error}

          </div>

        )}


        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (

          <div
            role="status"
            className="
              mt-6
              rounded-xl
              border
              border-emerald-500/20
              bg-emerald-500/10
              p-4
              text-emerald-400
            "
          >

            {success}

          </div>

        )}


        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div className="mt-8 flex flex-wrap gap-4">


          {/* =================================================
              SAVE
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            className="
              rounded-xl
              bg-cyan-500
              px-6
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            {loading
              ? "Saving Property..."
              : "Save Property"}

          </button>


          {/* =================================================
              CANCEL
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            disabled={loading}
            className="
              rounded-xl
              border
              border-slate-700
              px-6
              py-3
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            Cancel

          </button>

        </div>

      </form>

    </section>

  );
};

export default AddProperty;

