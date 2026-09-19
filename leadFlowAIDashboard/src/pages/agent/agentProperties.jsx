/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Allows an agent to manage only properties assigned to them.
 *
 * Features
 * ----------------------------------------------------------
 * • My Properties
 * • Search
 * • Pagination
 * • Create Property
 * • Edit Property
 * • Archive Property
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

const AgentProperties = () => {
  /*
  ==========================================================
  PROPERTY DATA
  ==========================================================
  */

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
  ==========================================================
  FILTERS
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
  ARCHIVE
  ==========================================================
  */

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  /*
  ==========================================================
  CURRENT PROPERTY
  ==========================================================
  */

  const [selectedProperty, setSelectedProperty] = useState(null);

  /*
  ==========================================================
  LOAD MY PROPERTIES
  ==========================================================
  */

  const loadProperties = async (page = currentPage) => {
    try {
      setLoading(true);

      const response = await propertyService.getMyProperties({
        page,
        search: filters.search,
        status: filters.status,
        propertyType: filters.propertyType,
        bedrooms: filters.bedrooms,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
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

      setProperties(response?.data || []);

      setTotalPages(
        response?.pagination?.totalPages || 1
      );
    } catch (error) {
      console.error(
        "Failed loading agent properties",
        error
      );

      setProperties([]);
      setTotalPages(1);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /*
  ==========================================================
  FILTER CHANGE
  ==========================================================
  */

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

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

  const handleResetFilters = async () => {
    setFilters(DEFAULT_FILTERS);

    setCurrentPage(1);

    try {
      setLoading(true);

      const response =
        await propertyService.getMyProperties({
          page: 1,
        });

      setProperties(response?.data || []);

      setTotalPages(
        response?.pagination?.totalPages || 1
      );
    } catch (error) {
      console.error(
        "Failed resetting property filters",
        error
      );

      setProperties([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
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
        await propertySearchService.searchProperties({
          ...filters,
          page: 1,
        });

      setProperties(response?.data || []);

      setCurrentPage(1);

      setTotalPages(
        response?.pagination?.totalPages || 1
      );
    } catch (error) {
      console.error(
        "Search failed",
        error
      );

      setProperties([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  /*
  ==========================================================
  CREATE
  ==========================================================
  */

  const handleCreate = () => {
    setEditingProperty(null);
    setFormOpen(true);
  };

  /*
  ==========================================================
  EDIT
  ==========================================================
  */

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormOpen(true);
  };

  /*
  ==========================================================
  VIEW
  ==========================================================
  */

  const handleView = (property) => {
    setSelectedProperty(property);
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

  const handleFormSuccess = async () => {
    handleCloseForm();

    await loadProperties(currentPage);
  };

  /*
  ==========================================================
  ARCHIVE
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
    if (!selectedProperty?._id) {
      return;
    }

    try {
      setArchiveLoading(true);

      await propertyService.archiveProperty(
        selectedProperty._id
      );

      closeArchiveModal();

      await loadProperties(currentPage);
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
  AVAILABILITY
  ==========================================================
  */

  const handleAvailabilityToggle = async (
    property,
    available
  ) => {
    if (!property?._id) {
      return;
    }

    try {
      setLoading(true);

      await propertyService.updateProperty(
        property._id,
        {
          status: available
            ? "available"
            : "inactive",
        }
      );

      await loadProperties(currentPage);
    } catch (error) {
      console.error(
        "Availability update failed",
        error
      );

      setLoading(false);
    }
  };

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (
    <section className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-medium text-cyan-400">
            Agent Workspace
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            My Properties
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage the properties assigned to you,
            update availability, and prepare listings
            for your customers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-primary
            px-5
            py-3
            font-medium
            text-primary-foreground
            transition
            hover:opacity-90
          "
        >
          <Plus size={18} />

          Add Property
        </button>

      </div>

      {/* ====================================================
          SEARCH
      ==================================================== */}

      <PropertySearchBar
        filters={filters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
      />

      {/* ====================================================
          PROPERTY TABLE
      ==================================================== */}

      <PropertyTable
        properties={properties}
        loading={loading}
        showActions
        onView={handleView}
        onEdit={handleEdit}
        onArchive={openArchiveModal}
        onAvailabilityToggle={
          handleAvailabilityToggle
        }
      />

      {/* ====================================================
          PAGINATION
      ==================================================== */}

      {totalPages > 1 && (
        <PropertyPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSelectedProperty(null);
          }}
        />
      )}

      {/* ====================================================
          SELECTED PROPERTY
      ==================================================== */}

      {selectedProperty &&
        !archiveOpen &&
        !formOpen && (
          <div
            className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900
              p-5
            "
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

              <div>
                <p className="text-sm text-slate-400">
                  Selected Property
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  {selectedProperty.title ||
                    selectedProperty.name ||
                    "Property"}
                </h2>

                {selectedProperty.location && (
                  <p className="mt-1 text-sm text-slate-400">
                    {typeof selectedProperty.location ===
                    "string"
                      ? selectedProperty.location
                      : selectedProperty.location?.address ||
                        selectedProperty.location?.city ||
                        ""}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProperty(null)
                }
                className="
                  rounded-lg
                  border
                  border-slate-700
                  px-4
                  py-2
                  text-sm
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Close
              </button>

            </div>
          </div>
        )}

      {/* ====================================================
          PROPERTY FORM
      ==================================================== */}

      {formOpen && (
        <PropertyForm
          property={editingProperty}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* ====================================================
          ARCHIVE MODAL
      ==================================================== */}

      <ArchivePropertyModal
        open={archiveOpen}
        property={selectedProperty}
        loading={archiveLoading}
        onClose={closeArchiveModal}
        onConfirm={confirmArchive}
      />

    </section>
  );
};

export default AgentProperties;