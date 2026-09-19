/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Create and edit Property Amenity records.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Settings
 * • Property Amenity Management
 *
 * Backend
 * ----------------------------------------------------------
 * PropertyAmenityController
 * PropertyAmenityService
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import propertyAmenityService from "../../services/propertyAmenityService";

const initialForm = {

  name: "",

  description: "",

  icon: "",

  category: "",

  displayOrder: 0,

  isActive: true,

};

const PropertyAmenitiesForm = ({

  mode = "create",

  amenityId,

  onSuccess,

  onCancel,

}) => {

  const [formData, setFormData] =

    useState(initialForm);

  const [loading, setLoading] =

    useState(false);

  const [errors, setErrors] =

    useState({});

  /*
  ==========================================================
  LOAD EXISTING AMENITY
  ==========================================================
  */

  useEffect(() => {

    if (

      mode === "edit" &&

      amenityId

    ) {

      loadAmenity();

    }

  }, [mode, amenityId]);

  /*
  ==========================================================
  LOAD
  ==========================================================
  */

  const loadAmenity = async () => {

    try {

      setLoading(true);

      const response =

        await propertyAmenityService.getAmenityById(

          amenityId

        );

      if (response?.data) {

        setFormData({

          ...initialForm,

          ...response.data,

        });

      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  /*
  ==========================================================
  CHANGE
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
  VALIDATION
  ==========================================================
  */

  const validateForm = () => {

    const validationErrors = {};

    if (!formData.name.trim()) {

      validationErrors.name =
        "Amenity name is required.";

    }

    if (!formData.category.trim()) {

      validationErrors.category =
        "Category is required.";

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

        await propertyAmenityService.createAmenity(
          formData
        );

      } else {

        await propertyAmenityService.updateAmenity(
          amenityId,
          formData
        );

      }

      onSuccess?.();

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
      className="space-y-6 rounded-xl border bg-card p-6"
    >

      <div>

        <h2 className="text-xl font-semibold">

          {mode === "create"

            ? "Create Amenity"

            : "Edit Amenity"}

        </h2>

        <p className="text-sm text-muted-foreground">

          Manage the master amenity catalogue
          used across all properties.

        </p>

      </div>

      {/* Name */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Amenity Name

        </label>

        <input

          type="text"

          name="name"

          value={formData.name}

          onChange={handleChange}

          className="w-full rounded-lg border px-3 py-2"

          placeholder="Swimming Pool"

        />

        {errors.name && (

          <p className="text-sm text-red-500">

            {errors.name}

          </p>

        )}

      </div>

      {/* Description */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Description

        </label>

        <textarea

          name="description"

          rows={4}

          value={formData.description}

          onChange={handleChange}

          className="w-full rounded-lg border px-3 py-2"

          placeholder="Describe this amenity."

        />

      </div>

      {/* Category */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Category

        </label>

        <input

          type="text"

          name="category"

          value={formData.category}

          onChange={handleChange}

          placeholder="Security"

          className="w-full rounded-lg border px-3 py-2"

        />

        {errors.category && (

          <p className="text-sm text-red-500">

            {errors.category}

          </p>

        )}

      </div>

      {/* Icon */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Icon

        </label>

        <input

          type="text"

          name="icon"

          value={formData.icon}

          onChange={handleChange}

          placeholder="shield"

          className="w-full rounded-lg border px-3 py-2"

        />

      </div>

      {/* Display Order */}

      <div className="space-y-2">

        <label className="text-sm font-medium">

          Display Order

        </label>

        <input

          type="number"

          min="0"

          name="displayOrder"

          value={formData.displayOrder}

          onChange={handleChange}

          className="w-full rounded-lg border px-3 py-2"

        />

      </div>

      {/* Active */}

      <div className="flex items-center justify-between rounded-lg border p-4">

        <div>

          <h4 className="font-medium">

            Active

          </h4>

          <p className="text-sm text-muted-foreground">

            Active amenities can be assigned
            to properties.

          </p>

        </div>

        <input

          type="checkbox"

          name="isActive"

          checked={formData.isActive}

          onChange={handleChange}

          className="h-4 w-4"

        />

      </div>

      {/* Actions */}

      <div className="flex justify-end gap-3">

        <button

          type="button"

          onClick={onCancel}

          className="rounded-lg border px-5 py-2"

        >

          Cancel

        </button>

        <button

          type="submit"

          disabled={loading}

          className="rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50"

        >

          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create Amenity"
            : "Update Amenity"}

        </button>

      </div>

    </form>

  );

};

export default PropertyAmenitiesForm;