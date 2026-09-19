/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Complete property management dashboard.
 *
 * Features
 * ----------------------------------------------------------
 * • View Properties
 * • Search
 * • Pagination
 * • Create Property
 * • Edit Property
 * • Archive Property
 * • Delete Property
 * • Availability Toggle
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import PropertySearchBar from "../../components/properties/propertySearchBar";
import PropertyTable from "../../components/properties/propertyTable";
import PropertyPagination from "../../components/properties/propertyPagination";
import PropertyForm from "../../components/properties/propertyForm";
import ArchivePropertyModal from "../../components/properties/archivePropertyModal";
import DeletePropertyModal from "../../components/properties/deletePropertyModal";

import propertyService from "../../services/propertyService";
import propertySearchService from "../../services/propertySearchService";

const DEFAULT_FILTERS = {

  search: "",

  status: "",

  propertyType: "",

  bedrooms: "",

  minPrice: "",

  maxPrice: "",

};

const AdminProperties = () => {

  /*
  ==========================================================
  PROPERTY DATA
  ==========================================================
  */

  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);

  /*
  ==========================================================
  SEARCH FILTERS
  ==========================================================
  */

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  /*
  ==========================================================
  PAGINATION
  ==========================================================
  */

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  /*
  ==========================================================
  PROPERTY FORM
  ==========================================================
  */

  const [formOpen, setFormOpen] = useState(false);

  const [editingProperty, setEditingProperty] = useState(null);

  /*
  ==========================================================
  ARCHIVE MODAL
  ==========================================================
  */

  const [archiveOpen, setArchiveOpen] = useState(false);

  const [archiveLoading, setArchiveLoading] = useState(false);

  /*
  ==========================================================
  DELETE MODAL
  ==========================================================
  */

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  /*
  ==========================================================
  CURRENT PROPERTY
  ==========================================================
  */

  const [selectedProperty, setSelectedProperty] = useState(null);

/*
==========================================================
LOAD PROPERTIES
==========================================================
*/

const loadProperties = async (page = currentPage) => {

  try {

    setLoading(true);

    const response = await propertyService.getAllProperties({

      page,

    });

    /*
    Expected Backend Response

    {
      data: [],
      pagination: {
        page,
        totalPages
      }
    }
    */

    setProperties(

      response?.data || []

    );

    setTotalPages(

      response?.pagination?.totalPages ||

      1

    );

  } catch (error) {

    console.error(

      "Failed to load properties",

      error

    );

  } finally {

    setLoading(false);

  }

};

/*
==========================================================
INITIAL LOAD
==========================================================
*/

useEffect(() => {

  loadProperties(currentPage);

}, [currentPage]);

/*
==========================================================
FILTER CHANGE
==========================================================
*/

const handleFilterChange = (event) => {

  const {

    name,

    value,

  } = event.target;

  setFilters((previous) => ({

    ...previous,

    [name]: value,

  }));

};

/*
==========================================================
RESET FILTERS
==========================================================
*/

const handleResetFilters = () => {

  setFilters(DEFAULT_FILTERS);

  loadProperties(1);

  setCurrentPage(1);

};

/*
==========================================================
SEARCH
==========================================================
*/

const handleSearch = async () => {

  try {

    setLoading(true);

    const response =

      await propertySearchService.searchProperties(

        filters

      );

    setProperties(

      response?.data || []

    );

    setCurrentPage(1);

    setTotalPages(

      response?.pagination?.totalPages ||

      1

    );

  } catch (error) {

    console.error(

      "Search failed",

      error

    );

  } finally {

    setLoading(false);

  }

};

/*
==========================================================
CREATE PROPERTY
==========================================================
*/

const handleCreate = () => {

  setEditingProperty(null);

  setFormOpen(true);

};

/*
==========================================================
EDIT PROPERTY
==========================================================
*/

const handleEdit = (property) => {

  setEditingProperty(property);

  setFormOpen(true);

};

/*
==========================================================
VIEW PROPERTY
==========================================================
*/

const handleView = (property) => {

  setSelectedProperty(property);

  /*
  Optional:
  navigate(`/properties/${property._id}`)
  */

};

/*
==========================================================
FORM CLOSED
==========================================================
*/

const handleCloseForm = () => {

  setEditingProperty(null);

  setFormOpen(false);

};

/*
==========================================================
FORM SUCCESS
==========================================================
*/

const handleFormSuccess = () => {

  handleCloseForm();

  loadProperties(currentPage);

};

/*
==========================================================
ARCHIVE PROPERTY
==========================================================
*/

const openArchiveModal = (property) => {

  setSelectedProperty(property);

  setArchiveOpen(true);

};

const closeArchiveModal = () => {

  setArchiveOpen(false);

  setSelectedProperty(null);

};

const confirmArchive = async () => {

  if (!selectedProperty) return;

  try {

    setArchiveLoading(true);

    await propertyService.archiveProperty(

      selectedProperty._id

    );

    closeArchiveModal();

    loadProperties(currentPage);

  } catch (error) {

    console.error(

      "Archive failed",

      error

    );

  } finally {

    setArchiveLoading(false);

  }

};

/*
==========================================================
DELETE PROPERTY
==========================================================
*/

const openDeleteModal = (property) => {

  setSelectedProperty(property);

  setDeleteOpen(true);

};

const closeDeleteModal = () => {

  setDeleteOpen(false);

  setSelectedProperty(null);

};

const confirmDelete = async () => {

  if (!selectedProperty) return;

  try {

    setDeleteLoading(true);

    await propertyService.deleteProperty(

      selectedProperty._id

    );

    closeDeleteModal();

    loadProperties(currentPage);

  } catch (error) {

    console.error(

      "Delete failed",

      error

    );

  } finally {

    setDeleteLoading(false);

  }

};

/*
==========================================================
PROPERTY AVAILABILITY
==========================================================
*/

const handleAvailabilityToggle = async (

  property,

  available

) => {

  try {

    await propertyService.updateProperty(

      property._id,

      {

        status: available

          ? "available"

          : "inactive",

      }

    );

    loadProperties(currentPage);

  } catch (error) {

    console.error(

      "Availability update failed",

      error

    );

  }

};

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (

    <section className="space-y-8">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Property Management

          </h1>

          <p className="text-muted-foreground">

            Manage all properties across LeadFlow AI.

          </p>

        </div>

        <button

          type="button"

          onClick={handleCreate}

          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90"

        >

          <Plus size={18} />

          Add Property

        </button>

      </div>

      {/* ======================================================
          SEARCH BAR
      ====================================================== */}

      <PropertySearchBar

        filters={filters}

        onChange={handleFilterChange}

        onSearch={handleSearch}

        onReset={handleResetFilters}

      />

      {/* ======================================================
          PROPERTY TABLE
      ====================================================== */}

      <PropertyTable

        properties={properties}

        loading={loading}

        showActions

        onView={handleView}

        onEdit={handleEdit}

        onDelete={openDeleteModal}

        onArchive={openArchiveModal}

        onAvailabilityToggle={

          handleAvailabilityToggle

        }

      />

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      <PropertyPagination

        currentPage={currentPage}

        totalPages={totalPages}

        onPageChange={setCurrentPage}

      />

      {/* ======================================================
          PROPERTY FORM
      ====================================================== */}

      {formOpen && (

        <PropertyForm

          property={editingProperty}

          onClose={handleCloseForm}

          onSuccess={handleFormSuccess}

        />

      )}

      {/* ======================================================
          ARCHIVE MODAL
      ====================================================== */}

      <ArchivePropertyModal

        open={archiveOpen}

        property={selectedProperty}

        loading={archiveLoading}

        onClose={closeArchiveModal}

        onConfirm={confirmArchive}

      />

      {/* ======================================================
          DELETE MODAL
      ====================================================== */}

      <DeletePropertyModal

        open={deleteOpen}

        property={selectedProperty}

        loading={deleteLoading}

        onClose={closeDeleteModal}

        onConfirm={confirmDelete}

      />

    </section>

  );

};

export default AdminProperties;