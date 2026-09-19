/**
 * ==========================================================
 *
 * Parent component responsible for:
 *
 * • Creating Properties
 * • Editing Properties
 * • Validation
 * • Form Submission
 * • API Integration
 * • Image Upload Coordination
 *
 * Child Components
 * ----------------------------------------------------------
 * • PropertyBasicInfo
 * • PropertyLocation
 * • PropertyPricing
 * • PropertyDetails
 * • PropertyAmenities
 * • PropertyFeatures
 * • PropertyImages
 * • PropertyStatus
 * • PropertyFormActions
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Building2,
} from "lucide-react";

import PropertyBasicInfo from "./propertyBasicInfo";
import PropertyLocation from "./propertyLocation";
import PropertyPricing from "./propertyPricing";
import PropertyDetails from "./propertyDetails";
import PropertyAmenities from "./propertyAmenities";
import PropertyFeatures from "./propertyFeatures";
import PropertyImages from "./propertyImages";
import PropertyStatus from "./propertyStatus";
import PropertyFormActions from "./propertyFormActions";

import propertyService from "../../services/propertyService";

const initialForm = {

  /*
  ==========================================================
  BASIC
  ==========================================================
  */

  title: "",

  description: "",

  propertyCode: "",

  propertyType: "apartment",

  /*
  ==========================================================
  LOCATION
  ==========================================================
  */

  location: "",

  county: "",

  city: "",

  estate: "",

  coordinates: {

    latitude: "",

    longitude: "",

  },

  /*
  ==========================================================
  PRICING
  ==========================================================
  */

  price: "",

  currency: "KES",

  paymentType: "sale",

  negotiable: true,

  /*
  ==========================================================
  DETAILS
  ==========================================================
  */

  bedrooms: 1,

  bathrooms: 1,

  parking: 0,

  squareFeet: "",

  furnished: false,

  petsAllowed: false,

  /*
  ==========================================================
  RELATIONSHIPS
  ==========================================================
  */

  assignedAgent: "",

  amenities: [],

  features: [],

  /*
  ==========================================================
  STATUS
  ==========================================================
  */

  status: "available",

  featured: false,

  /*
  ==========================================================
  IMAGES
  ==========================================================
  */

  coverImage: null,

  galleryImages: [],

};

const PropertyForm = ({

  mode = "create",

  propertyId = null,

  onSuccess,

  onCancel,

}) => {

  /*
  ==========================================================
  STATE
  ==========================================================
  */

  const [formData, setFormData] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [agents, setAgents] =
    useState([]);

  /*
  ==========================================================
  LOAD PROPERTY (EDIT MODE)
  ==========================================================
  */

  useEffect(() => {

    if (mode === "edit" && propertyId) {

      loadProperty();

    }

    loadAgents();

  }, [mode, propertyId]);

  /* 
==========================================================
LOAD PROPERTY
==========================================================
*/

const loadProperty = async () => {

  try {

    setLoading(true);


    /* ----------------------------------------------------
       LOAD PROPERTY FROM API
    ---------------------------------------------------- */

    const response =
      await propertyService.getPropertyById(
        propertyId
      );


    /* ----------------------------------------------------
       NORMALIZE API RESPONSE
       ----------------------------------------------------
       propertyService.getPropertyById() already extracts
       response.data.data and returns the property object.
    ---------------------------------------------------- */

    const loadedProperty =
      response?.data || response;


    /* ----------------------------------------------------
       VERIFY PROPERTY
    ---------------------------------------------------- */

    if (!loadedProperty?._id) {

      console.error(
        "Failed to load property: invalid property response.",
        loadedProperty
      );

      return null;

    }


    /* ----------------------------------------------------
       UPDATE FORM DATA
    ---------------------------------------------------- */

    setFormData({

      ...initialForm,

      ...loadedProperty,

      galleryImages:
        loadedProperty.galleryImages || [],

      amenities:
        loadedProperty.amenities || [],

      features:
        loadedProperty.features || [],

    });


    /* ----------------------------------------------------
       RETURN THE PROPERTY
       ----------------------------------------------------
       This is important because initialise() needs the
       actual property immediately. React state updates
       are asynchronous.
    ---------------------------------------------------- */

    return loadedProperty;


  } catch (error) {

    console.error(
      "Failed to load property",
      error
    );

    return null;


  } finally {

    setLoading(false);

  }

};

  /*
  ==========================================================
  LOAD AGENTS

  Placeholder until Agent Service is connected.
  ==========================================================
  */

  const loadAgents = async () => {

    try {

      /*
      Later:

      const response =
        await agentService.getAgents();

      setAgents(response.data);
      */

      setAgents([]);

    } catch (error) {

      console.error(error);

    }

  };

  /*
  ==========================================================
  HANDLE INPUT CHANGE
  ==========================================================
  */

  const handleChange = (event) => {

    const {

      name,

      value,

      type,

      checked,

    } = event.target;

    setFormData((previous) => ({

      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));

  };

  /*
  ==========================================================
  HANDLE NESTED OBJECTS

  coordinates.latitude
  coordinates.longitude
  ==========================================================
  */

  const handleNestedChange = (

    parent,

    field,

    value

  ) => {

    setFormData((previous) => ({

      ...previous,

      [parent]: {

        ...previous[parent],

        [field]: value,

      },

    }));

  };

  /*
  ==========================================================
  HANDLE ARRAY CHANGE

  Amenities
  Features
  ==========================================================
  */

  const handleArrayChange = (

    field,

    values

  ) => {

    setFormData((previous) => ({

      ...previous,

      [field]: values,

    }));

  };

  /*
  ==========================================================
  HANDLE IMAGE CHANGE
  ==========================================================
  */

  const handleImagesChange = (

    coverImage,

    galleryImages

  ) => {

    setFormData((previous) => ({

      ...previous,

      coverImage,

      galleryImages,

    }));

  };

  /*
  ==========================================================
  SIMPLE VALIDATION
  ==========================================================
  */

  const validateForm = () => {

    const validationErrors = {};

    if (!formData.title.trim()) {

      validationErrors.title =
        "Property title is required.";

    }

    if (!formData.location.trim()) {

      validationErrors.location =
        "Location is required.";

    }

    if (!formData.price) {

      validationErrors.price =
        "Price is required.";

    }

    if (Number(formData.bedrooms) < 0) {

      validationErrors.bedrooms =
        "Bedrooms cannot be negative.";

    }

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors)
        .length === 0
    );

  };

  /*
  ==========================================================
  SUBMIT
  ==========================================================
  */

  const handleSubmit = async (event) => {

    event.preventDefault();

    if (!validateForm()) return;

    try {

      setLoading(true);

      if (mode === "create") {

        await propertyService.createProperty(
          formData
        );

      } else {

        await propertyService.updateProperty(

          propertyId,

          formData

        );

      }

      if (onSuccess) {

        onSuccess();

      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (

    <form

      onSubmit={handleSubmit}

      className="space-y-8"

    >

      {/* Header */}

      <div className="flex items-center gap-3">

        <Building2
          className="h-7 w-7 text-primary"
        />

        <div>

          <h2 className="text-2xl font-bold">

            {

              mode === "create"

                ? "Add Property"

                : "Edit Property"

            }

          </h2>

          <p className="text-sm text-muted-foreground">

            Manage property information,
            pricing, images and availability.

          </p>

        </div>

      </div>

      {/* Basic */}

      <PropertyBasicInfo

        formData={formData}

        errors={errors}

        onChange={handleChange}

      />

      {/* Location */}

      <PropertyLocation

        formData={formData}

        errors={errors}

        onChange={handleChange}

        onNestedChange={
          handleNestedChange
        }

      />

      {/* Pricing */}

      <PropertyPricing

        formData={formData}

        errors={errors}

        onChange={handleChange}

      />

      {/* Details */}

      <PropertyDetails

        formData={formData}

        errors={errors}

        agents={agents}

        onChange={handleChange}

      />

      {/* Amenities */}

      <PropertyAmenities

        value={formData.amenities}

        onChange={(values) =>

          handleArrayChange(

            "amenities",

            values

          )

        }

      />

      {/* Features */}

      <PropertyFeatures

        value={formData.features}

        onChange={(values) =>

          handleArrayChange(

            "features",

            values

          )

        }

      />

      {/* Images */}

      <PropertyImages

        coverImage={formData.coverImage}

        galleryImages={
          formData.galleryImages
        }

        onChange={handleImagesChange}

      />

      {/* Status */}

      <PropertyStatus

        formData={formData}

        onChange={handleChange}

      />

      {/* Actions */}

      <PropertyFormActions

        loading={loading}

        mode={mode}

        onCancel={onCancel}

      />

    </form>

  );

};

export default PropertyForm;