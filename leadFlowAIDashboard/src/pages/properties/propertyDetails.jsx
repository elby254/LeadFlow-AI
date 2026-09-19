/**
 * ==========================================================
 *
 * SHARED PROPERTY DETAILS
 *
 * Frontend Routes
 * ----------------------------------------------------------
 * Admin:
 * /admin/properties/:propertyId
 *
 * Agent:
 * /agent/properties/:propertyId
 *
 * Viewer:
 * /viewer/properties/:propertyId
 *
 * Backend API
 * ----------------------------------------------------------
 * Admin + Agent + Viewer:
 * GET /api/properties/:id
 *
 * Similar Properties API
 * ----------------------------------------------------------
 * GET /api/properties/recommendations
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * The backend currently exposes the shared property details
 * endpoint for Admin, Agent AND Viewer:
 *
 * GET /api/properties/:propertyId
 *
 * There is NO:
 *
 * GET /api/viewer/properties/:id
 *
 * Therefore Viewer uses the same canonical property endpoint.
 *
 * The backend also exposes:
 *
 * GET /api/properties/recommendations
 *
 * Therefore Similar Properties uses the existing
 * recommendations endpoint with the current property's
 * characteristics.
 *
 * Purpose
 * ----------------------------------------------------------
 * Shared 360° property workspace for:
 *
 * • Admin
 * • Agent
 * • Viewer
 *
 * SHARED DATA
 * ----------------------------------------------------------
 * • Property Profile
 * • Property Image
 * • Specifications
 * • Availability
 * • Similar Properties
 *
 * ADMIN-ONLY INFORMATION
 * ----------------------------------------------------------
 * • Interested Leads
 * • Viewing Schedule
 * • AI Recommendation History
 *
 * AGENT
 * ----------------------------------------------------------
 * Agents can view:
 * • Property image
 * • Property name
 * • Location
 * • Price
 * • Bedrooms
 * • Bathrooms
 * • Property type
 * • Status
 * • Description
 * • Similar properties
 *
 * VIEWER
 * ----------------------------------------------------------
 * Viewers can view:
 * • Property image
 * • Property name
 * • Location
 * • Price
 * • Bedrooms
 * • Bathrooms
 * • Property type
 * • Status
 * • Description
 * • Similar properties
 *
 * Viewer-only actions:
 * • Save Property
 * • Share Property
 * • Schedule Viewing
 * • Contact Agent
 * • Get Directions
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This component does NOT render MainLayout.
 *
 * MainLayout is provided by the parent application layout.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * This component does NOT use useProperties().
 *
 * Admin + Agent + Viewer:
 * GET /api/properties/:id
 *
 * Similar properties:
 * GET /api/properties/recommendations
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ==========================================================
 *
 * Property images are resolved ONLY through:
 *
 * getPropertyImageUrl(property)
 *
 * This component MUST NOT:
 *
 * • inspect property.images[]
 * • inspect property.image
 * • construct image URLs
 * • generate property images
 * • create duplicate image-resolution logic
 *
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Eye,
  Heart,
  Home,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Users,
} from "lucide-react";

import axiosClient from "../../api/axiosClient";

import {
  getPropertyImageUrl,
} from "../../utils/propertyImage";


/* ==========================================================
   CONSTANTS
========================================================== */

const PLACEHOLDER_IMAGE =
  "/placeholder-property.jpg";


/* ==========================================================
   HELPERS
========================================================== */

/**
 * Safely obtains property ID.
 */
const getPropertyId = (property) => {
  return (
    property?._id ||
    property?.id ||
    ""
  );
};


/**
 * Safely obtains property title.
 */
const getPropertyTitle = (property) => {
  return (
    property?.title ||
    property?.name ||
    "Untitled Property"
  );
};


/**
 * Safely obtains property location.
 *
 * Supports both:
 *
 * location: "Kilimani, Nairobi"
 *
 * and:
 *
 * location: {
 *   address,
 *   name,
 *   city
 * }
 */
const getPropertyLocation = (property) => {
  if (
    typeof property?.location === "string"
  ) {
    return property.location;
  }

  if (
    property?.location &&
    typeof property.location === "object"
  ) {
    return (
      property.location.address ||
      property.location.name ||
      property.location.city ||
      "Location not specified"
    );
  }

  const parts = [
    property?.estate,
    property?.address,
    property?.city,
    property?.county,
  ].filter(Boolean);

  if (parts.length > 0) {
    return [
      ...new Set(parts),
    ].join(", ");
  }

  return "Location not specified";
};


/**
 * Safely obtains property image.
 *
 * IMPORTANT:
 * ----------------------------------------------------------
 * getPropertyImageUrl() remains the ONLY image source.
 *
 * No local inspection of:
 *
 * • images[]
 * • image
 * • coverImage
 *
 * is performed here.
 */
const getPropertyImage = (property) => {
  return (
    getPropertyImageUrl(property) ||
    PLACEHOLDER_IMAGE
  );
};


/**
 * Safely formats property price.
 */
const formatPrice = (
  price,
  currency = "KES"
) => {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "Price not available";
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return String(price);
  }

  try {
    return new Intl.NumberFormat(
      "en-KE",
      {
        style: "currency",
        currency: currency || "KES",
        maximumFractionDigits: 0,
      }
    ).format(numericPrice);
  } catch {
    return `KES ${numericPrice.toLocaleString(
      "en-KE"
    )}`;
  }
};


/**
 * Safely normalizes property status.
 */
const normalizeStatus = (status) => {
  if (
    status === null ||
    status === undefined
  ) {
    return "unknown";
  }

  return String(status)
    .trim()
    .toLowerCase();
};


/**
 * Attempts to find an agent phone number.
 *
 * This helper does not affect Admin or Agent behavior.
 */
const getAgentPhone = (property) => {
  return (
    property?.agent?.phone ||
    property?.agent?.phoneNumber ||
    property?.agentPhone ||
    property?.agentPhoneNumber ||
    property?.contact?.phone ||
    property?.contactPhone ||
    property?.phone ||
    ""
  );
};


/**
 * Attempts to find an agent email.
 */
const getAgentEmail = (property) => {
  return (
    property?.agent?.email ||
    property?.agentEmail ||
    property?.contact?.email ||
    property?.contactEmail ||
    ""
  );
};


/**
 * Attempts to find coordinates.
 *
 * Supports common backend shapes:
 *
 * coordinates: {
 *   latitude,
 *   longitude
 * }
 *
 * location: {
 *   latitude,
 *   longitude
 * }
 *
 * location: {
 *   coordinates: [longitude, latitude]
 * }
 *
 * latitude / longitude directly on property.
 */
const getPropertyCoordinates = (property) => {
  const latitude =
    property?.latitude ??
    property?.lat ??
    property?.coordinates?.latitude ??
    property?.location?.latitude ??
    property?.location?.lat;

  const longitude =
    property?.longitude ??
    property?.lng ??
    property?.lon ??
    property?.coordinates?.longitude ??
    property?.location?.longitude ??
    property?.location?.lng ??
    property?.location?.lon;

  if (
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude))
  ) {
    return {
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  }

  const coordinateArray =
    property?.coordinates?.coordinates ||
    property?.location?.coordinates;

  if (
    Array.isArray(coordinateArray) &&
    coordinateArray.length >= 2
  ) {
    const longitudeFromArray =
      Number(coordinateArray[0]);

    const latitudeFromArray =
      Number(coordinateArray[1]);

    if (
      Number.isFinite(latitudeFromArray) &&
      Number.isFinite(longitudeFromArray)
    ) {
      return {
        latitude: latitudeFromArray,
        longitude: longitudeFromArray,
      };
    }
  }

  return null;
};


/* ==========================================================
   COMPONENT
========================================================== */

const PropertyDetails = () => {

  /* ========================================================
     ROUTE
  ======================================================== */

  const {
    propertyId,
  } = useParams();

  const navigate =
    useNavigate();


  /* ========================================================
     ROLE / WORKSPACE DETECTION
     --------------------------------------------------------
     This component is shared between:
     • Admin
     • Agent
     • Viewer
  ======================================================== */

  const currentPath =
    window.location.pathname;


  const isAgentRoute =
    currentPath.startsWith(
      "/agent/"
    );


  const isAdminRoute =
    currentPath.startsWith(
      "/admin/"
    );


  const isViewerRoute =
    currentPath.startsWith(
      "/viewer/"
    );


  /**
   * IMPORTANT
   * --------------------------------------------------------
   * Viewer actions are controlled ONLY by the viewer route.
   *
   * This prevents viewer actions from appearing in:
   *
   * /admin/*
   * /agent/*
   */
  const isViewer =
    isViewerRoute &&
    !isAdminRoute &&
    !isAgentRoute;


  /**
   * Existing Admin behavior remains untouched.
   */
  const isAdmin =
    isAdminRoute &&
    !isAgentRoute &&
    !isViewerRoute;


  /**
   * Existing Agent behavior remains untouched.
   */
  const isAgent =
    isAgentRoute &&
    !isAdminRoute &&
    !isViewerRoute;


  /* ========================================================
     STATE
  ======================================================== */

  const [
    property,
    setProperty,
  ] = useState(null);


  const [
    similarProperties,
    setSimilarProperties,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    recommendationsLoading,
    setRecommendationsLoading,
  ] = useState(false);


  /* ========================================================
     VIEWER ACTION STATE
     --------------------------------------------------------
     These states are only meaningful inside /viewer.
  ======================================================== */

  const [
    isSaved,
    setIsSaved,
  ] = useState(false);


  const [
    shareCopied,
    setShareCopied,
  ] = useState(false);


  /* ========================================================
     FETCH PROPERTY
     --------------------------------------------------------
     IMPORTANT API FIX
     --------------------------------------------------------
     ALL THREE WORKSPACES use:
     GET /api/properties/:id
     
     The backend explicitly supports:
     • Admin
     • Agent
     • Viewer
     
     There is NO:
     /api/viewer/properties/:id
  ======================================================== */

  const fetchProperty =
    useCallback(
      async (signal) => {

        /* ----------------------------------------------------
           Validate property ID
        ---------------------------------------------------- */

        if (
          !propertyId ||
          typeof propertyId !== "string" ||
          !propertyId.trim()
        ) {

          setProperty(null);

          setError(
            "Property ID is missing."
          );

          setLoading(false);

          return null;
        }


        try {

          setLoading(true);

          setError("");


          /* --------------------------------------------------
             CANONICAL PROPERTY API
             
             Admin:
             /api/properties/:id
             
             Agent:
             /api/properties/:id
             
             Viewer:
             /api/properties/:id
          -------------------------------------------------- */

          const propertyEndpoint =
            `/properties/${encodeURIComponent(
              propertyId.trim()
            )}`;


          console.log(
            "PROPERTY DETAILS WORKSPACE:",
            isViewer
              ? "VIEWER"
              : isAdmin
              ? "ADMIN"
              : isAgent
              ? "AGENT"
              : "SHARED"
          );


          console.log(
            "PROPERTY DETAILS ENDPOINT:",
            propertyEndpoint
          );


          /* --------------------------------------------------
             API request
          -------------------------------------------------- */

          const response =
            await axiosClient.get(
              propertyEndpoint,
              {
                signal,
              }
            );


          /* --------------------------------------------------
             Normalize backend response
          -------------------------------------------------- */

          const responseData =
            response?.data;


          const fetchedProperty =
            responseData?.data ||
            responseData?.property ||
            responseData;


          /* --------------------------------------------------
             Validate response
          -------------------------------------------------- */

          if (
            !fetchedProperty ||
            typeof fetchedProperty !==
              "object" ||
            Array.isArray(
              fetchedProperty
            )
          ) {

            throw new Error(
              "Invalid property response."
            );
          }


          /* --------------------------------------------------
             Store property
          -------------------------------------------------- */

          setProperty(
            fetchedProperty
          );


          console.log(
            "PROPERTY DETAILS LOADED:",
            fetchedProperty
          );


          return fetchedProperty;

        } catch (
          requestError
        ) {

          /* --------------------------------------------------
             Ignore cancelled requests
          -------------------------------------------------- */

          if (
            requestError?.name ===
              "CanceledError" ||
            requestError?.code ===
              "ERR_CANCELED"
          ) {
            return null;
          }


          console.error(
            "PROPERTY DETAILS ERROR:",
            requestError
          );


          console.error(
            "PROPERTY DETAILS RESPONSE:",
            requestError?.response?.data
          );


          setProperty(null);


          setError(
            requestError?.response?.data
              ?.message ||
              requestError?.message ||
              "Unable to load property details."
          );


          return null;

        } finally {

          if (
            signal?.aborted !== true
          ) {
            setLoading(false);
          }

        }
      },
      [
        propertyId,
        isViewer,
        isAdmin,
        isAgent,
      ]
    );


  /* ========================================================
     FETCH SIMILAR PROPERTIES
     --------------------------------------------------------
     IMPORTANT API FIX
     --------------------------------------------------------
     The backend DOES NOT expose:
     
     /api/property-recommendations/similar/:propertyId
     
     The existing backend endpoint is:
     
     GET /api/properties/recommendations
     
     It accepts:
     • propertyType
     • location
     • bedrooms
     • availability
     • minPrice
     * maxPrice
     *
     * We use the current property's characteristics to
     * retrieve similar available properties.
  ======================================================== */

  const fetchSimilarProperties =
    useCallback(
      async (
        signal,
        sourceProperty
      ) => {

        /* ----------------------------------------------------
           Validate route ID
        ---------------------------------------------------- */

        if (
          !propertyId ||
          typeof propertyId !== "string" ||
          !propertyId.trim()
        ) {

          setSimilarProperties([]);

          return;
        }


        try {

          setRecommendationsLoading(
            true
          );


          /* --------------------------------------------------
             EXISTING BACKEND RECOMMENDATIONS ENDPOINT
          -------------------------------------------------- */

          const recommendationParams = {
            limit: 10,
          };


          /* --------------------------------------------------
             PROPERTY TYPE
          -------------------------------------------------- */

          if (
            sourceProperty?.propertyType
          ) {
            recommendationParams.propertyType =
              sourceProperty.propertyType;
          }


          /* --------------------------------------------------
             LOCATION
          -------------------------------------------------- */

          const sourceLocation =
            sourceProperty?.location;


          if (
            typeof sourceLocation ===
            "string"
          ) {

            const trimmedLocation =
              sourceLocation.trim();

            if (
              trimmedLocation
            ) {
              recommendationParams.location =
                trimmedLocation;
            }

          } else if (
            sourceLocation &&
            typeof sourceLocation ===
              "object"
          ) {

            const recommendationLocation =
              sourceLocation.address ||
              sourceLocation.name ||
              sourceLocation.city ||
              "";

            if (
              recommendationLocation
            ) {
              recommendationParams.location =
                String(
                  recommendationLocation
                ).trim();
            }

          }


          /* --------------------------------------------------
             BEDROOMS
          -------------------------------------------------- */

          const sourceBedrooms =
            sourceProperty?.bedrooms ??
            sourceProperty?.beds;


          if (
            sourceBedrooms !== null &&
            sourceBedrooms !== undefined &&
            sourceBedrooms !== "" &&
            Number.isFinite(
              Number(sourceBedrooms)
            )
          ) {

            recommendationParams.bedrooms =
              Number(sourceBedrooms);

          }


          /* --------------------------------------------------
             AVAILABILITY
             
             IMPORTANT:
             We only pass availability when the property
             actually exposes it.
          -------------------------------------------------- */

          if (
            sourceProperty?.availability
          ) {

            recommendationParams.availability =
              sourceProperty.availability;

          }


          console.log(
            "PROPERTY RECOMMENDATIONS ENDPOINT:",
            "/properties/recommendations"
          );


          console.log(
            "PROPERTY RECOMMENDATIONS PARAMS:",
            recommendationParams
          );


          const response =
            await axiosClient.get(
              "/properties/recommendations",
              {
                params:
                  recommendationParams,
                signal,
              }
            );


          const responseData =
            response?.data;


          const recommendations =
            responseData?.data ||
            responseData?.properties ||
            responseData?.recommendations ||
            [];


          /* --------------------------------------------------
             Always normalize to array
          -------------------------------------------------- */

          if (
            Array.isArray(
              recommendations
            )
          ) {

            setSimilarProperties(
              recommendations
            );


            console.log(
              "PROPERTY RECOMMENDATIONS LOADED:",
              recommendations
            );

          } else {

            setSimilarProperties([]);

          }

        } catch (
          requestError
        ) {

          /* --------------------------------------------------
             Ignore cancelled requests
          -------------------------------------------------- */

          if (
            requestError?.name ===
              "CanceledError" ||
            requestError?.code ===
              "ERR_CANCELED"
          ) {
            return;
          }


          /* --------------------------------------------------
             Similar properties are optional.
             
             Failure must NOT destroy the main
             property details page.
          -------------------------------------------------- */

          console.error(
            "PROPERTY RECOMMENDATIONS ERROR:",
            requestError
          );


          console.error(
            "PROPERTY RECOMMENDATIONS RESPONSE:",
            requestError?.response?.data
          );


          setSimilarProperties([]);

        } finally {

          if (
            signal?.aborted !== true
          ) {

            setRecommendationsLoading(
              false
            );

          }

        }
      },
      [propertyId]
    );


  /* ========================================================
     INITIAL LOAD
     --------------------------------------------------------
     IMPORTANT:
     The property MUST be fetched first.
     
     Then the existing property data is used to build the
     recommendation query.
     
     NEVER:
     
     property._id
     
     before property exists.
  ======================================================== */

  useEffect(() => {

    const controller =
      new AbortController();


    const initialise =
      async () => {

        if (
          !propertyId ||
          typeof propertyId !== "string" ||
          !propertyId.trim()
        ) {

          setProperty(null);

          setSimilarProperties([]);

          setError(
            "Property ID is missing."
          );

          setLoading(false);

          return;
        }


        /* --------------------------------------------------
           Reset viewer-specific transient state when
           navigating between properties.
        -------------------------------------------------- */

        if (isViewer) {

          setIsSaved(false);

          setShareCopied(false);

        }


        /* --------------------------------------------------
           FIRST:
           Fetch property using route ID.
        -------------------------------------------------- */

        const loadedProperty =
          await fetchProperty(
            controller.signal
          );


        /* --------------------------------------------------
           SECOND:
           Fetch recommendations using the loaded property.
           
           This prevents:
           
           Cannot read properties of null
           
           because we NEVER access:
           
           property._id
           
           before property exists.
        -------------------------------------------------- */

        if (
          loadedProperty &&
          controller.signal.aborted !== true
        ) {

          await fetchSimilarProperties(
            controller.signal,
            loadedProperty
          );

        } else {

          setSimilarProperties([]);

        }

      };


    initialise();


    return () => {

      controller.abort();

    };

  }, [
    propertyId,
    isViewer,
    fetchProperty,
    fetchSimilarProperties,
  ]);


  /* ========================================================
     VIEWER ACTIONS
  ======================================================== */


  /**
   * SAVE PROPERTY
   *
   * Viewer-only.
   *
   * Uses localStorage so the action works immediately
   * without changing the existing Admin/Agent APIs.
   *
   * This can later be connected to:
   *
   * POST /api/viewer/properties/:propertyId/save
   *
   * without changing the UI architecture.
   */
  const handleSaveProperty =
    useCallback(() => {

      if (
        !isViewer ||
        !property
      ) {
        return;
      }


      const id =
        getPropertyId(
          property
        );


      if (!id) {
        return;
      }


      try {

        const storageKey =
          "leadflowai_saved_properties";


        const existing =
          JSON.parse(
            localStorage.getItem(
              storageKey
            ) || "[]"
          );


        const savedIds =
          Array.isArray(existing)
            ? existing.map(
                (item) =>
                  String(item)
              )
            : [];


        const normalizedId =
          String(id);


        if (
          savedIds.includes(
            normalizedId
          )
        ) {

          const updated =
            savedIds.filter(
              (savedId) =>
                savedId !==
                normalizedId
            );


          localStorage.setItem(
            storageKey,
            JSON.stringify(
              updated
            )
          );


          setIsSaved(false);


          console.log(
            "PROPERTY REMOVED FROM SAVED:",
            normalizedId
          );

        } else {

          savedIds.push(
            normalizedId
          );


          localStorage.setItem(
            storageKey,
            JSON.stringify(
              savedIds
            )
          );


          setIsSaved(true);


          console.log(
            "PROPERTY SAVED:",
            normalizedId
          );

        }

      } catch (
        storageError
      ) {

        console.error(
          "SAVE PROPERTY ERROR:",
          storageError
        );

      }

    }, [
      isViewer,
      property,
    ]);


  /**
   * SHARE PROPERTY
   *
   * Uses the native Web Share API where available.
   * Falls back to clipboard.
   */
  const handleShareProperty =
    useCallback(
      async () => {

        if (
          !isViewer ||
          !property
        ) {
          return;
        }


        const propertyTitle =
          getPropertyTitle(
            property
          );


        const shareUrl =
          window.location.href;


        const shareData = {
          title:
            propertyTitle,
          text:
            `Check out ${propertyTitle} on LeadFlow AI.`,
          url:
            shareUrl,
        };


        try {

          if (
            typeof navigator.share ===
              "function"
          ) {

            await navigator.share(
              shareData
            );


            console.log(
              "PROPERTY SHARED:",
              shareUrl
            );


            return;
          }


          if (
            navigator.clipboard &&
            typeof navigator.clipboard
              .writeText ===
              "function"
          ) {

            await navigator.clipboard.writeText(
              shareUrl
            );


            setShareCopied(true);


            window.setTimeout(
              () => {
                setShareCopied(false);
              },
              2500
            );


            console.log(
              "PROPERTY URL COPIED:",
              shareUrl
            );


            return;
          }


          /* ------------------------------------------------
             Last fallback for browsers without clipboard.
          ------------------------------------------------ */

          window.prompt(
            "Copy this property link:",
            shareUrl
          );

        } catch (
          shareError
        ) {

          /**
           * Browser cancellation of native share is
           * not a real application failure.
           */
          if (
            shareError?.name ===
            "AbortError"
          ) {
            return;
          }


          console.error(
            "SHARE PROPERTY ERROR:",
            shareError
          );

        }

      },
      [
        isViewer,
        property,
      ]
    );


  /**
   * SCHEDULE VIEWING
   *
   * Viewer-only.
   *
   * Navigates to a viewer scheduling workspace.
   */
  const handleScheduleViewing =
    useCallback(() => {

      if (
        !isViewer ||
        !property
      ) {
        return;
      }


      const id =
        getPropertyId(
          property
        );


      if (!id) {
        return;
      }


      navigate(
        `/viewer/properties/${encodeURIComponent(
          String(id)
        )}/schedule`
      );

    }, [
      isViewer,
      property,
      navigate,
    ]);


  /**
   * CONTACT AGENT
   *
   * Viewer-only.
   *
   * Uses a phone number if one exists.
   * Otherwise falls back to an email address.
   */
  const handleContactAgent =
    useCallback(() => {

      if (
        !isViewer ||
        !property
      ) {
        return;
      }


      const phone =
        getAgentPhone(
          property
        );


      const email =
        getAgentEmail(
          property
        );


      if (phone) {

        window.location.href =
          `tel:${String(
            phone
          )}`;


        return;
      }


      if (email) {

        const subject =
          encodeURIComponent(
            `Property enquiry: ${getPropertyTitle(
              property
            )}`
          );


        const body =
          encodeURIComponent(
            `Hello, I am interested in ${getPropertyTitle(
              property
            )}.`
          );


        window.location.href =
          `mailto:${email}?subject=${subject}&body=${body}`;


        return;
      }


      /**
       * If no contact information is exposed
       * by the backend, do not invent it.
       */
      console.warn(
        "CONTACT AGENT: No agent phone or email is available."
      );


      window.alert(
        "Agent contact information is not currently available."
      );

    }, [
      isViewer,
      property,
    ]);


  /**
   * GET DIRECTIONS
   *
   * Viewer-only.
   *
   * If coordinates exist:
   * Google Maps directions use the coordinates.
   *
   * Otherwise:
   * property location/address is used as the
   * search destination.
   */
  const handleGetDirections =
    useCallback(() => {

      if (
        !isViewer ||
        !property
      ) {
        return;
      }


      const coordinates =
        getPropertyCoordinates(
          property
        );


      if (coordinates) {

        const destination =
          `${coordinates.latitude},${coordinates.longitude}`;


        const directionsUrl =
          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            destination
          )}`;


        window.open(
          directionsUrl,
          "_blank",
          "noopener,noreferrer"
        );


        return;
      }


      const location =
        getPropertyLocation(
          property
        );


      if (
        location &&
        location !==
          "Location not specified"
      ) {

        const directionsUrl =
          `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            location
          )}`;


        window.open(
          directionsUrl,
          "_blank",
          "noopener,noreferrer"
        );


        return;
      }


      console.warn(
        "GET DIRECTIONS: No usable property location is available."
      );

    }, [
      isViewer,
      property,
    ]);


  /* ========================================================
     CHECK SAVED PROPERTY
  ======================================================== */

  useEffect(() => {

    if (
      !isViewer ||
      !property
    ) {
      return;
    }


    const id =
      getPropertyId(
        property
      );


    if (!id) {
      return;
    }


    try {

      const saved =
        JSON.parse(
          localStorage.getItem(
            "leadflowai_saved_properties"
          ) || "[]"
        );


      if (
        Array.isArray(saved)
      ) {

        setIsSaved(
          saved
            .map(
              (item) =>
                String(item)
            )
            .includes(
              String(id)
            )
        );

      }

    } catch (
      storageError
    ) {

      console.error(
        "CHECK SAVED PROPERTY ERROR:",
        storageError
      );

    }

  }, [
    isViewer,
    property,
  ]);


  /* ========================================================
     SAFE SIMILAR PROPERTIES
  ======================================================== */

  const safeSimilarProperties =
    useMemo(() => {

      if (
        !Array.isArray(
          similarProperties
        )
      ) {
        return [];
      }


      return similarProperties
        .filter(
          (item) =>
            item &&
            typeof item === "object"
        )
        .filter(
          (item) =>
            String(
              getPropertyId(item)
            ) !==
            String(
              getPropertyId(property)
            )
        )
        .filter(
          (item) =>
            getPropertyId(item)
        )
        .slice(0, 3);

    }, [
      similarProperties,
      property,
    ]);


  /* ========================================================
     PROPERTY IMAGE
     --------------------------------------------------------
     SHARED IMAGE ARCHITECTURE
  ======================================================== */

  const propertyImage =
    getPropertyImage(
      property
    );


  /* ========================================================
     PROPERTY STATUS
  ======================================================== */

  const propertyStatus =
    normalizeStatus(
      property?.status
    );


  /* ========================================================
     PROPERTY COORDINATES
  ======================================================== */

  const propertyCoordinates =
    useMemo(
      () =>
        getPropertyCoordinates(
          property
        ),
      [property]
    );


  /* ========================================================
     CAN GET DIRECTIONS
  ======================================================== */

  const canGetDirections =
    Boolean(
      propertyCoordinates ||
      (
        getPropertyLocation(
          property
        ) !==
        "Location not specified"
      )
    );


  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {

    return (

      <div className="space-y-8">

        {/* BACK BUTTON SKELETON */}

        <div
          className="
            h-10
            w-32
            animate-pulse
            rounded-xl
            bg-slate-800
          "
        />


        {/* HERO SKELETON */}

        <div
          className="
            grid
            gap-8
            lg:grid-cols-2
          "
        >

          {/* IMAGE */}

          <div
            className="
              h-[450px]
              animate-pulse
              rounded-3xl
              bg-slate-800
            "
          />


          {/* INFORMATION */}

          <div className="space-y-6">

            <div
              className="
                h-12
                animate-pulse
                rounded-xl
                bg-slate-800
              "
            />


            <div
              className="
                h-24
                animate-pulse
                rounded-2xl
                bg-slate-800
              "
            />


            <div
              className="
                h-40
                animate-pulse
                rounded-2xl
                bg-slate-800
              "
            />

          </div>

        </div>

      </div>

    );

  }


  /* ========================================================
     ERROR / NOT FOUND
  ======================================================== */

  if (
    error ||
    !property
  ) {

    return (

      <div className="space-y-6">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-700
            px-4
            py-2
            text-white
            transition
            hover:bg-slate-800
            focus:outline-none
            focus:ring-2
            focus:ring-cyan-500
          "
        >

          <ArrowLeft
            size={17}
          />

          Back

        </button>


        {/* ERROR */}

        <div
          className="
            rounded-3xl
            border
            border-red-500/20
            bg-red-500/10
            p-8
          "
        >

          <div className="text-4xl">
            ⚠️
          </div>


          <h1
            className="
              mt-4
              text-2xl
              font-bold
              text-white
            "
          >

            Property Not Found

          </h1>


          <p
            className="
              mt-2
              text-red-400
            "
          >

            {error ||
              "The requested property could not be found."}

          </p>


          <button
            type="button"
            onClick={() => {

              setError("");

              setLoading(true);

              fetchProperty();

            }}
            className="
              mt-6
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-semibold
              text-slate-950
              transition
              hover:bg-cyan-400
              focus:outline-none
              focus:ring-2
              focus:ring-cyan-500
            "
          >

            Try Again

          </button>

        </div>

      </div>

    );

  }


  /* ========================================================
     PAGE
  ======================================================== */

  return (

    <div
      className="
        mx-auto
        max-w-7xl
        space-y-8
      "
    >

      {/* ====================================================
          BACK BUTTON
      ==================================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(-1)
        }
        className="
          inline-flex
          items-center
          gap-2
          rounded-xl
          border
          border-slate-700
          px-4
          py-2
          text-sm
          font-medium
          text-white
          transition
          hover:bg-slate-800
          focus:outline-none
          focus:ring-2
          focus:ring-cyan-500
        "
      >

        <ArrowLeft
          size={17}
        />

        Back

      </button>


      {/* ====================================================
          PROPERTY HERO
      ==================================================== */}

      <div
        className="
          grid
          gap-8
          lg:grid-cols-2
        "
      >

        {/* ==================================================
            PROPERTY IMAGE
        ================================================== */}

        <div
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-800
            bg-slate-900
          "
        >

          <img
            src={propertyImage}
            alt={
              getPropertyTitle(
                property
              )
            }
            className="
              h-[450px]
              w-full
              object-cover
            "
            onError={(event) => {

              if (
                event.currentTarget.src !==
                window.location.origin +
                  PLACEHOLDER_IMAGE
              ) {

                event.currentTarget.src =
                  PLACEHOLDER_IMAGE;

              }

            }}
          />

        </div>


        {/* ==================================================
            PROPERTY SUMMARY
        ================================================== */}

        <div className="space-y-6">

          {/* TITLE */}

          <div>

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >

              <h1
                className="
                  text-3xl
                  font-bold
                  text-white
                  sm:text-4xl
                "
              >

                {getPropertyTitle(
                  property
                )}

              </h1>


              <span
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-sm
                  font-semibold
                  capitalize
                  ${
                    propertyStatus ===
                    "occupied"
                      ? "bg-amber-500/20 text-amber-400"
                      : propertyStatus ===
                        "available"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700 text-slate-300"
                  }
                `}
              >

                {property.status ||
                  "Unknown"}

              </span>

            </div>


            <div
              className="
                mt-3
                flex
                items-center
                gap-2
                text-lg
                text-slate-400
              "
            >

              <MapPin
                size={18}
                className="shrink-0"
              />

              <span>

                {getPropertyLocation(
                  property
                )}

              </span>

            </div>

          </div>


          {/* ==================================================
              VIEWER ACTIONS
              --------------------------------------------------
              These actions ONLY render inside:
              
              /viewer/*
              
              They do NOT affect Admin or Agent.
          ================================================== */}

          {isViewer && (

            <div
              className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-cyan-500/5
                p-4
              "
            >

              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                "
              >

                {/* SAVE PROPERTY */}

                <button
                  type="button"
                  onClick={
                    handleSaveProperty
                  }
                  className={`
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    transition
                    focus:outline-none
                    focus:ring-2
                    focus:ring-cyan-500
                    ${
                      isSaved
                        ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                        : "border border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
                    }
                  `}
                >

                  <Heart
                    size={17}
                    fill={
                      isSaved
                        ? "currentColor"
                        : "none"
                    }
                  />

                  {isSaved
                    ? "Saved"
                    : "Save Property"}

                </button>


                {/* SHARE PROPERTY */}

                <button
                  type="button"
                  onClick={
                    handleShareProperty
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-900
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-slate-800
                    focus:outline-none
                    focus:ring-2
                    focus:ring-cyan-500
                  "
                >

                  {shareCopied ? (
                    <Check
                      size={17}
                    />
                  ) : (
                    <Share2
                      size={17}
                    />
                  )}

                  {shareCopied
                    ? "Link Copied"
                    : "Share Property"}

                </button>


                {/* SCHEDULE VIEWING */}

                <button
                  type="button"
                  onClick={
                    handleScheduleViewing
                  }
                  className="
                    inline-flex
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
                    focus:outline-none
                    focus:ring-2
                    focus:ring-cyan-500
                  "
                >

                  <CalendarDays
                    size={17}
                  />

                  Schedule Viewing

                </button>


                {/* CONTACT AGENT */}

                <button
                  type="button"
                  onClick={
                    handleContactAgent
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-emerald-500/30
                    bg-emerald-500/10
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-emerald-400
                    transition
                    hover:bg-emerald-500/20
                    focus:outline-none
                    focus:ring-2
                    focus:ring-emerald-500
                  "
                >

                  <Phone
                    size={17}
                  />

                  Contact Agent

                </button>


                {/* GET DIRECTIONS */}

                {canGetDirections && (

                  <button
                    type="button"
                    onClick={
                      handleGetDirections
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-violet-500/30
                      bg-violet-500/10
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-violet-400
                      transition
                      hover:bg-violet-500/20
                      focus:outline-none
                      focus:ring-2
                      focus:ring-violet-500
                    "
                  >

                    <Navigation
                      size={17}
                    />

                    Get Directions

                  </button>

                )}

              </div>

            </div>

          )}


          {/* PRICE */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              Asking Price

            </p>


            <p
              className="
                mt-2
                text-3xl
                font-bold
                text-cyan-400
              "
            >

              {formatPrice(
                property.price,
                property.currency
              )}

            </p>

          </div>


          {/* SPECIFICATIONS */}

          <div
            className="
              grid
              grid-cols-2
              gap-4
            "
          >

            {/* BEDROOMS */}

            <div
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-900
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-slate-400
                "
              >

                <BedDouble
                  size={18}
                />

                <p className="text-sm">

                  Bedrooms

                </p>

              </div>


              <h2
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-white
                "
              >

                {property.bedrooms ??
                  property.beds ??
                  "-"}

              </h2>

            </div>


            {/* BATHROOMS */}

            <div
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-900
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-slate-400
                "
              >

                <Bath
                  size={18}
                />

                <p className="text-sm">

                  Bathrooms

                </p>

              </div>


              <h2
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-white
                "
              >

                {property.bathrooms ??
                  property.baths ??
                  "-"}

              </h2>

            </div>


            {/* PROPERTY TYPE */}

            <div
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-900
                p-5
              "
            >

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >

                Property Type

              </p>


              <h2
                className="
                  mt-2
                  text-xl
                  font-bold
                  capitalize
                  text-white
                "
              >

                {property.propertyType ||
                  "-"}

              </h2>

            </div>


            {/* STATUS */}

            <div
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-900
                p-5
              "
            >

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >

                Status

              </p>


              <span
                className="
                  mt-3
                  inline-block
                  rounded-full
                  bg-emerald-500/20
                  px-4
                  py-2
                  text-sm
                  font-medium
                  capitalize
                  text-emerald-400
                "
              >

                {property.status ||
                  "Unknown"}

              </span>

            </div>

          </div>


          {/* DESCRIPTION */}

          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >

            <h2
              className="
                mb-4
                text-xl
                font-semibold
                text-white
              "
            >

              Description

            </h2>


            <p
              className="
                leading-7
                text-slate-300
              "
            >

              {property.description ||
                "No description available."}

            </p>

          </div>

        </div>

      </div>


      {/* ====================================================
          ADMIN MANAGEMENT INFORMATION
          
          These sections remain hidden from agents AND viewers.
      ==================================================== */}

      {isAdmin && (

        <div
          className="
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {/* INTERESTED LEADS */}

          <section
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >

            <div className="text-3xl">
              👥
            </div>


            <h2
              className="
                mt-4
                text-xl
                font-bold
                text-white
              "
            >

              Interested Leads

            </h2>


            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-400
              "
            >

              Lead interest and qualification
              data will appear here.

            </p>

          </section>


          {/* VIEWING SCHEDULE */}

          <section
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
              p-6
            "
          >

            <div className="text-3xl">
              📅
            </div>


            <h2
              className="
                mt-4
                text-xl
                font-bold
                text-white
              "
            >

              Viewing Schedule

            </h2>


            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-400
              "
            >

              Scheduled property viewings will
              appear here.

            </p>

          </section>


          {/* AI HISTORY */}

          <section
            className="
              rounded-3xl
              border
              border-violet-500/20
              bg-violet-500/5
              p-6
            "
          >

            <div className="text-3xl">
              🤖
            </div>


            <h2
              className="
                mt-4
                text-xl
                font-bold
                text-white
              "
            >

              AI Recommendation History

            </h2>


            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-400
              "
            >

              {recommendationsLoading
                ? "Loading AI property matches..."
                : safeSimilarProperties.length >
                    0
                  ? `${safeSimilarProperties.length} similar properties found.`
                  : "No AI matching activity available yet."}

            </p>

          </section>

        </div>

      )}


      {/* ====================================================
          AGENT INFORMATION
          
          Existing Agent behavior remains untouched.
      ==================================================== */}

      {isAgent && (

        <section
          className="
            rounded-3xl
            border
            border-cyan-500/20
            bg-cyan-500/5
            p-6
          "
        >

          <div
            className="
              flex
              items-start
              gap-4
            "
          >

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-cyan-500/10
              "
            >

              <Building2
                size={22}
                className="text-cyan-400"
              />

            </div>


            <div>

              <h2
                className="
                  text-lg
                  font-semibold
                  text-white
                "
              >

                Property Information

              </h2>


              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-400
                "
              >

                You are viewing the current
                property information available
                to agents.

              </p>

            </div>

          </div>

        </section>

      )}


      {/* ====================================================
          VIEWER INFORMATION
          
          Optional viewer context section.
          
          This does NOT replace the action buttons.
      ==================================================== */}

      {isViewer && (

        <section
          className="
            rounded-3xl
            border
            border-cyan-500/20
            bg-cyan-500/5
            p-6
          "
        >

          <div
            className="
              flex
              items-start
              gap-4
            "
          >

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-cyan-500/10
              "
            >

              <Eye
                size={22}
                className="text-cyan-400"
              />

            </div>


            <div>

              <h2
                className="
                  text-lg
                  font-semibold
                  text-white
                "
              >

                Property Viewing

              </h2>


              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-400
                "
              >

                Save this property, share it,
                contact an agent, or schedule
                a viewing using the actions above.

              </p>

            </div>

          </div>

        </section>

      )}


      {/* ====================================================
          AVAILABILITY
          
          Shared between Admin + Agent + Viewer.
      ==================================================== */}

      <section
        className="
          rounded-3xl
          border
          border-emerald-500/20
          bg-emerald-500/5
          p-6
        "
      >

        <div
          className="
            flex
            items-start
            gap-4
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-emerald-500/10
            "
          >

            <Home
              size={22}
              className="text-emerald-400"
            />

          </div>


          <div>

            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >

              Availability

            </h2>


            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >

              Current property availability
              status.

            </p>


            <span
              className="
                mt-4
                inline-block
                rounded-full
                bg-emerald-500/20
                px-4
                py-2
                text-sm
                font-semibold
                capitalize
                text-emerald-400
              "
            >

              {property.status ||
                "Unknown"}

            </span>

          </div>

        </div>

      </section>


      {/* ====================================================
          SIMILAR PROPERTIES
          
          Shared between Admin + Agent + Viewer.
      ==================================================== */}

      <section
        className="
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-6
        "
      >

        <div className="mb-6">

          <h2
            className="
              text-2xl
              font-bold
              text-white
            "
          >

            Similar Properties

          </h2>


          <p
            className="
              mt-1
              text-sm
              text-slate-400
            "
          >

            Other properties recommended
            for this property.

          </p>

        </div>


        {/* ==================================================
            RECOMMENDATIONS LOADING
        ================================================== */}

        {recommendationsLoading && (

          <div
            className="
              grid
              gap-5
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="
                    h-72
                    animate-pulse
                    rounded-2xl
                    bg-slate-800
                  "
                />

              )
            )}

          </div>

        )}


        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!recommendationsLoading &&
          safeSimilarProperties.length ===
            0 && (

            <div
              className="
                rounded-2xl
                border
                border-slate-800
                bg-slate-950
                p-8
                text-center
              "
            >

              <div className="text-4xl">
                🏠
              </div>


              <p
                className="
                  mt-3
                  text-slate-400
                "
              >

                No similar properties available.

              </p>

            </div>

          )}


        {/* ==================================================
            SIMILAR PROPERTY GRID
        ================================================== */}

        {!recommendationsLoading &&
          safeSimilarProperties.length >
            0 && (

            <div
              className="
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              "
            >

              {safeSimilarProperties.map(
                (item) => {

                  /* ------------------------------------------
                     SHARED IMAGE ARCHITECTURE
                     
                     getPropertyImageUrl() is the ONLY
                     image resolver.
                  ------------------------------------------ */

                  const image =
                    getPropertyImage(
                      item
                    );


                  const itemId =
                    getPropertyId(
                      item
                    );


                  const itemTitle =
                    getPropertyTitle(
                      item
                    );


                  const itemLocation =
                    getPropertyLocation(
                      item
                    );


                  return (

                    <div
                      key={String(
                        itemId
                      )}
                      className="
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-800
                        bg-slate-950
                      "
                    >

                      {/* PROPERTY IMAGE */}

                      <img
                        src={image}
                        alt={
                          itemTitle
                        }
                        className="
                          h-40
                          w-full
                          object-cover
                        "
                        onError={(event) => {

                          if (
                            event.currentTarget
                              .src !==
                            window.location
                              .origin +
                              PLACEHOLDER_IMAGE
                          ) {

                            event.currentTarget.src =
                              PLACEHOLDER_IMAGE;

                          }

                        }}
                      />


                      {/* PROPERTY INFORMATION */}

                      <div className="p-4">

                        <h3
                          className="
                            font-semibold
                            text-white
                          "
                        >

                          {itemTitle}

                        </h3>


                        <div
                          className="
                            mt-1
                            flex
                            items-center
                            gap-1.5
                            text-sm
                            text-slate-400
                          "
                        >

                          <MapPin
                            size={14}
                          />

                          <span>

                            {itemLocation}

                          </span>

                        </div>


                        <p
                          className="
                            mt-3
                            font-semibold
                            text-cyan-400
                          "
                        >

                          {formatPrice(
                            item.price,
                            item.currency
                          )}

                        </p>


                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `${
                                isViewer
                                  ? "/viewer/properties"
                                  : isAgent
                                  ? "/agent/properties"
                                  : "/admin/properties"
                              }/${encodeURIComponent(
                                String(
                                  itemId
                                )
                              )}`
                            )
                          }
                          className="
                            mt-4
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-cyan-500
                            py-3
                            font-semibold
                            text-slate-950
                            transition
                            hover:bg-cyan-400
                            focus:outline-none
                            focus:ring-2
                            focus:ring-cyan-500
                          "
                        >

                          <Eye
                            size={17}
                          />

                          View Property

                        </button>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

      </section>

    </div>

  );

};


/* ==========================================================
   EXPORT
========================================================== */

export default PropertyDetails;