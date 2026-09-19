/**
 *
 * Route
 * ----------------------------------------------------------
 * /admin/properties/settings
 *
 * Purpose
 * ----------------------------------------------------------
 * Central configuration page for the LeadFlow AI
 * Property Management workflow.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * Backend settings endpoints do NOT exist yet.
 *
 * Planned future endpoints:
 *
 * GET /api/properties/settings
 * PUT /api/properties/settings
 *
 * Therefore this component currently:
 *
 * • Uses local React state
 * • Does NOT make fake settings API requests
 * • Provides frontend-only save/reset behavior
 * • Keeps the settings structure ready for backend persistence
 *
 * ==========================================================
 *
 * ORGANIZATION SETTINGS
 * ----------------------------------------------------------
 * These settings are organization-level.
 *
 * The organizationId should eventually be determined by the
 * authenticated backend session.
 *
 * The frontend must NOT allow an administrator to manually
 * submit an arbitrary organizationId.
 *
 * ==========================================================
 *
 * IMAGE ARCHITECTURE
 * ----------------------------------------------------------
 * PropertySettings does not render or transform property
 * image URLs.
 *
 * Image URL normalization/display remains centralized in the
 * shared LeadFlow AI image helper used by property-facing
 * components.
 *
 * This page only controls image-related configuration such as:
 *
 * • Whether a cover image is required
 * • Maximum images per property
 * • Whether AI image analysis is enabled
 *
 * ==========================================================
 *
 * TECHNOLOGY
 * ----------------------------------------------------------
 * • React
 * • JSX
 * • Tailwind CSS v4
 * • No TypeScript
 *
 * ==========================================================
 */

import {
  useEffect,
  useMemo,
  useState,
} from "react";


/* ==========================================================
   DEFAULT SETTINGS
========================================================== */

const DEFAULT_SETTINGS = {
  general: {
    currency: "KES",
    defaultPropertyStatus: "available",
    defaultListingVisibility: true,
    defaultPageSize: 20,
  },

  workflow: {
    allowReservations: true,
    allowReservedToSold: true,
    allowArchiving: true,
    requireDeleteConfirmation: true,
    defaultAvailability: "available",
  },

  agentAssignment: {
    enabled: true,
    routeEnquiriesToAssignedAgent: true,
    routeAppointmentsToAssignedAgent: true,
    routeFollowUpsToAssignedAgent: true,
    allowReassignment: true,

    assignmentMethod: "property_based",

    reassignUnhandled: false,
    reassignmentDelay: 30,
    reassignmentDelayUnit: "minutes",
  },

  ai: {
    recommendationsEnabled: true,
    leadMatchingEnabled: true,
    recommendationLimit: 10,
    minimumRecommendationScore: 50,

    matchBudget: true,
    matchLocation: true,
    matchBedrooms: true,
    matchPropertyType: true,

    featuredRankingBonus: true,
    recommendAvailableOnly: true,
  },

  enquiries: {
    acceptEnquiries: true,
    autoRouteEnquiries: true,
    allowFallbackRouting: true,
    autoCreateLead: true,
    followUpsEnabled: true,
  },

  listings: {
    featuredEnabled: true,
    includeArchivedInAdminSearch: false,
    searchEnabled: true,
    filtersEnabled: true,

    showAvailable: true,
    showReserved: false,
    showSold: false,
  },

  images: {
    requireCoverImage: false,
    maximumImages: 20,
    aiImageAnalysisEnabled: true,
  },

  notifications: {
    newEnquiry: true,
    propertyReserved: true,
    propertySold: true,
    followUpReminders: true,

    notifyViewingRequest: true,
    notifyStatusChange: true,
  },

  viewings: {
    allowViewings: true,
    requireViewingConfirmation: true,
    minimumViewingNotice: 2,
    minimumViewingNoticeUnit: "hours",
  },

  followUp: {
    enabled: true,
    firstFollowUpDelay: 30,
    firstFollowUpUnit: "minutes",
    maximumFollowUps: 3,
  },

  advanced: {
    analyticsEnabled: true,
    recommendationAnalyticsEnabled: true,
  },
};


/* ==========================================================
   SETTINGS NAVIGATION
========================================================== */

const SECTIONS = [
  {
    id: "general",
    label: "General",
    description: "Basic property configuration",
  },

  {
    id: "workflow",
    label: "Property Workflow",
    description: "Control property lifecycle behavior",
  },

  {
    id: "agentAssignment",
    label: "Agent Assignment",
    description: "Configure property and enquiry routing",
  },

  {
    id: "ai",
    label: "AI & Matching",
    description: "Configure LeadFlow AI property matching",
  },

  {
    id: "enquiries",
    label: "Lead & Enquiries",
    description: "Configure enquiry routing and lead creation",
  },

  {
    id: "listings",
    label: "Listings",
    description: "Configure property listing visibility",
  },

  {
    id: "images",
    label: "Images",
    description: "Configure property image handling",
  },

  {
    id: "viewings",
    label: "Viewings & Appointments",
    description: "Configure property viewing requests",
  },

  {
    id: "followUp",
    label: "Follow-Up Automation",
    description: "Configure automated prospect follow-ups",
  },

  {
    id: "notifications",
    label: "Notifications",
    description: "Configure property notifications",
  },

  {
    id: "advanced",
    label: "Advanced",
    description: "Advanced property analytics controls",
  },
];


/* ==========================================================
   PROPERTY SETTINGS PAGE
========================================================== */

const PropertySettings = () => {

  /* ========================================================
     SETTINGS STATE
  ======================================================== */

  const [
    settings,
    setSettings,
  ] = useState(() =>
    cloneSettings(DEFAULT_SETTINGS)
  );


  /* ========================================================
     SAVED SETTINGS STATE
  ======================================================== */

  const [
    savedSettings,
    setSavedSettings,
  ] = useState(() =>
    cloneSettings(DEFAULT_SETTINGS)
  );


  /* ========================================================
     ACTIVE SECTION
  ======================================================== */

  const [
    activeSection,
    setActiveSection,
  ] = useState("general");


  /* ========================================================
     UI STATE
  ======================================================== */

  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    saved,
    setSaved,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState(null);


  /* ========================================================
     DIRTY STATE
  ======================================================== */

  const hasChanges = useMemo(
    () =>
      JSON.stringify(settings) !==
      JSON.stringify(savedSettings),
    [
      settings,
      savedSettings,
    ]
  );


  /* ========================================================
     LOAD INITIAL SETTINGS
  ======================================================== */

  useEffect(() => {

    /*
     * Backend integration will eventually happen here.
     *
     * Example:
     *
     * const response = await axiosClient.get(
     *   "/properties/settings"
     * );
     *
     * const data = response?.data?.data;
     *
     * setSettings(data);
     * setSavedSettings(data);
     *
     * For now we intentionally use frontend defaults.
     */

    const defaults = cloneSettings(
      DEFAULT_SETTINGS
    );

    setSettings(defaults);

    setSavedSettings(
      cloneSettings(defaults)
    );

  }, []);


  /* ========================================================
     UPDATE NESTED SETTING
  ======================================================== */

  const updateSetting = (
    section,
    key,
    value
  ) => {

    setSettings(
      (previous) => ({
        ...previous,

        [section]: {
          ...previous[section],
          [key]: value,
        },
      })
    );

    setSaved(false);
    setError(null);
  };


  /* ========================================================
     SAVE SETTINGS
  ======================================================== */

  const handleSave = async () => {

    if (!hasChanges) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {

      /*
       * ====================================================
       * FUTURE BACKEND INTEGRATION
       * ====================================================
       *
       * const response =
       *   await axiosClient.put(
       *     "/properties/settings",
       *     settings
       *   );
       *
       * const savedData =
       *   response?.data?.data;
       *
       * setSettings(savedData);
       * setSavedSettings(savedData);
       *
       * ====================================================
       */

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 400)
      );

      const newSavedSettings =
        cloneSettings(settings);

      setSavedSettings(
        newSavedSettings
      );

      setSettings(
        cloneSettings(newSavedSettings)
      );

      setSaved(true);

    } catch (saveError) {

      console.error(
        "Property settings save error:",
        saveError
      );

      setError(
        "Unable to save property settings."
      );

    } finally {

      setSaving(false);

    }
  };


  /* ========================================================
     DISCARD UNSAVED CHANGES
  ======================================================== */

  const handleReset = () => {

    setSettings(
      cloneSettings(savedSettings)
    );

    setSaved(false);
    setError(null);

  };


  /* ========================================================
     RESTORE DEFAULTS
  ======================================================== */

  const handleRestoreDefaults = () => {

    setSettings(
      cloneSettings(DEFAULT_SETTINGS)
    );

    setSaved(false);
    setError(null);

  };


  /* ========================================================
     CURRENT SECTION
  ======================================================== */

  const currentSection =
    SECTIONS.find(
      (section) =>
        section.id === activeSection
    );


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <div className="min-h-screen bg-muted/30">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="border-b bg-background">

        <div className="mx-auto max-w-7xl px-6 py-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h1 className="text-2xl font-semibold tracking-tight">

                Property Settings

              </h1>

              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">

                Configure how LeadFlow AI manages properties,
                agents, enquiries, viewings and property matching.

              </p>

            </div>


            {/* ============================================
                SAVE CONTROLS
            ============================================ */}

            <div className="flex flex-wrap items-center gap-3">

              {hasChanges && (

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="
                    rounded-lg
                    border
                    bg-background
                    px-4
                    py-2
                    text-sm
                    font-medium
                    hover:bg-muted
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  Discard Changes

                </button>

              )}


              <button
                type="button"
                onClick={handleSave}
                disabled={
                  saving ||
                  !hasChanges
                }
                className="
                  rounded-lg
                  bg-primary
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-primary-foreground
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                {saving
                  ? "Saving..."
                  : "Save Settings"}

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* ==================================================
          STATUS MESSAGES
      ================================================== */}

      <div className="mx-auto max-w-7xl px-6 pt-6">

        {saved && (

          <div
            className="
              rounded-lg
              border
              bg-background
              px-4
              py-3
              text-sm
            "
          >

            Property settings saved successfully.

          </div>

        )}


        {error && (

          <div
            className="
              mt-3
              rounded-lg
              border
              border-destructive/30
              bg-destructive/5
              px-4
              py-3
              text-sm
              text-destructive
            "
          >

            {error}

          </div>

        )}

      </div>


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-6">

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">


          {/* =================================================
              LEFT NAVIGATION
          ================================================= */}

          <aside
            className="
              h-fit
              rounded-xl
              border
              bg-background
            "
          >

            <div className="border-b px-4 py-4">

              <p className="text-sm font-semibold">

                Property Management

              </p>

              <p className="mt-1 text-xs text-muted-foreground">

                Organization settings

              </p>

            </div>


            <nav className="p-2">

              {SECTIONS.map(
                (section) => (

                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {

                      setActiveSection(
                        section.id
                      );

                      setSaved(false);
                      setError(null);

                    }}
                    className={`
                      mb-1
                      w-full
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      transition

                      ${
                        activeSection ===
                        section.id
                          ? "bg-muted font-medium"
                          : "hover:bg-muted/60"
                      }
                    `}
                  >

                    <span className="block text-sm">

                      {section.label}

                    </span>

                    <span className="mt-0.5 block text-xs text-muted-foreground">

                      {section.description}

                    </span>

                  </button>

                )
              )}

            </nav>

          </aside>


          {/* =================================================
              SETTINGS CONTENT
          ================================================= */}

          <main className="min-w-0">

            <div
              className="
                rounded-xl
                border
                bg-background
              "
            >

              {/* =============================================
                  SECTION HEADER
              ============================================= */}

              <div className="border-b px-6 py-5">

                <h2 className="text-lg font-semibold">

                  {currentSection?.label}

                </h2>

                <p className="mt-1 text-sm text-muted-foreground">

                  {currentSection?.description}

                </p>

              </div>


              {/* =============================================
                  GENERAL
              ============================================= */}

              {activeSection === "general" && (

                <GeneralSettings
                  settings={settings.general}
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "general",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  PROPERTY WORKFLOW
              ============================================= */}

              {activeSection === "workflow" && (

                <WorkflowSettings
                  settings={settings.workflow}
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "workflow",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  AGENT ASSIGNMENT
              ============================================= */}

              {activeSection === "agentAssignment" && (

                <AgentAssignmentSettings
                  settings={
                    settings.agentAssignment
                  }
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "agentAssignment",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  AI
              ============================================= */}

              {activeSection === "ai" && (

                <AISettings
                  settings={settings.ai}
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "ai",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  ENQUIRIES
              ============================================= */}

              {activeSection === "enquiries" && (

                <EnquirySettings
                  settings={
                    settings.enquiries
                  }
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "enquiries",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  LISTINGS
              ============================================= */}

              {activeSection === "listings" && (

                <ListingSettings
                  settings={
                    settings.listings
                  }
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "listings",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  IMAGES
              ============================================= */}

              {activeSection === "images" && (

                <ImageSettings
                  settings={settings.images}
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "images",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  VIEWINGS
              ============================================= */}

              {activeSection === "viewings" && (

                <ViewingSettings
                  settings={
                    settings.viewings
                  }
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "viewings",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  FOLLOW-UP
              ============================================= */}

              {activeSection === "followUp" && (

                <FollowUpSettings
                  settings={
                    settings.followUp
                  }
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "followUp",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  NOTIFICATIONS
              ============================================= */}

              {activeSection === "notifications" && (

                <NotificationSettings
                  settings={
                    settings.notifications
                  }
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "notifications",
                        key,
                        value
                      )
                  }
                />

              )}


              {/* =============================================
                  ADVANCED
              ============================================= */}

              {activeSection === "advanced" && (

                <AdvancedSettings
                  settings={
                    settings.advanced
                  }
                  updateSetting={
                    (key, value) =>
                      updateSetting(
                        "advanced",
                        key,
                        value
                      )
                  }
                />

              )}

            </div>


            {/* =================================================
                BOTTOM ACTIONS
            ================================================= */}

            <div
              className="
                mt-6
                flex
                flex-col
                gap-3
                rounded-xl
                border
                bg-background
                p-5
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <div>

                <p className="text-sm font-medium">

                  Restore default configuration

                </p>

                <p className="mt-1 text-xs text-muted-foreground">

                  Restore all property management settings
                  to the LeadFlow AI defaults.

                </p>

              </div>


              <button
                type="button"
                onClick={handleRestoreDefaults}
                disabled={saving}
                className="
                  rounded-lg
                  border
                  px-4
                  py-2
                  text-sm
                  font-medium
                  hover:bg-muted
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                Restore Defaults

              </button>

            </div>

          </main>

        </div>

      </div>

    </div>

  );
};


/* ==========================================================
   GENERAL SETTINGS
========================================================== */

function GeneralSettings({
  settings,
  updateSetting,
}) {

  return (

    <SettingsSection>

      <SettingSelect
        label="Default Currency"
        description="
          Default currency used when displaying property prices.
        "
        value={settings.currency}
        onChange={(value) =>
          updateSetting(
            "currency",
            value
          )
        }
      >

        <option value="KES">
          KES — Kenyan Shilling
        </option>

        <option value="USD">
          USD — US Dollar
        </option>

        <option value="EUR">
          EUR — Euro
        </option>

        <option value="GBP">
          GBP — British Pound
        </option>

      </SettingSelect>


      <SettingSelect
        label="Default Property Status"
        description="
          Status automatically assigned when a new property is created.
        "
        value={
          settings.defaultPropertyStatus
        }
        onChange={(value) =>
          updateSetting(
            "defaultPropertyStatus",
            value
          )
        }
      >

        <option value="available">
          Available
        </option>

        <option value="reserved">
          Reserved
        </option>

        <option value="inactive">
          Inactive
        </option>

      </SettingSelect>


      <SettingToggle
        label="New Property Listing Visibility"
        description="
          Make newly created properties visible in normal property listings.
        "
        checked={
          settings.defaultListingVisibility
        }
        onChange={(value) =>
          updateSetting(
            "defaultListingVisibility",
            value
          )
        }
      />


      <SettingSelect
        label="Default Properties Per Page"
        description="
          Controls the default number of properties displayed in list views.
        "
        value={
          settings.defaultPageSize
        }
        onChange={(value) =>
          updateSetting(
            "defaultPageSize",
            Number(value)
          )
        }
      >

        <option value={10}>
          10 properties
        </option>

        <option value={20}>
          20 properties
        </option>

        <option value={50}>
          50 properties
        </option>

        <option value={100}>
          100 properties
        </option>

      </SettingSelect>

    </SettingsSection>

  );
}


/* ==========================================================
   WORKFLOW SETTINGS
========================================================== */

function WorkflowSettings({
  settings,
  updateSetting,
}) {

  return (

    <SettingsSection>

      <SettingToggle
        label="Allow Property Reservations"
        description="
          Allow properties to move from available to reserved.
        "
        checked={
          settings.allowReservations
        }
        onChange={(value) =>
          updateSetting(
            "allowReservations",
            value
          )
        }
      />


      <SettingToggle
        label="Allow Reserved to Sold"
        description="
          Allow reserved properties to transition to sold.
        "
        checked={
          settings.allowReservedToSold
        }
        onChange={(value) =>
          updateSetting(
            "allowReservedToSold",
            value
          )
        }
      />


      <SettingToggle
        label="Allow Property Archiving"
        description="
          Archive properties instead of permanently deleting them.
        "
        checked={
          settings.allowArchiving
        }
        onChange={(value) =>
          updateSetting(
            "allowArchiving",
            value
          )
        }
      />


      <SettingToggle
        label="Require Delete Confirmation"
        description="
          Require confirmation before permanently deleting a property.
        "
        checked={
          settings.requireDeleteConfirmation
        }
        onChange={(value) =>
          updateSetting(
            "requireDeleteConfirmation",
            value
          )
        }
      />


      <SettingSelect
        label="Default Availability"
        description="
          Default availability assigned to newly created properties.
        "
        value={
          settings.defaultAvailability
        }
        onChange={(value) =>
          updateSetting(
            "defaultAvailability",
            value
          )
        }
      >

        <option value="available">
          Available
        </option>

        <option value="unavailable">
          Unavailable
        </option>

        <option value="coming_soon">
          Coming Soon
        </option>

      </SettingSelect>

    </SettingsSection>

  );
}


/* ==========================================================
   AGENT ASSIGNMENT SETTINGS
========================================================== */

function AgentAssignmentSettings({
  settings,
  updateSetting,
}) {

  return (

    <SettingsSection>

      <SettingToggle
        label="Automatic Agent Assignment"
        description="
          Allow LeadFlow AI to automatically route property enquiries
          to suitable agents.
        "
        checked={
          settings.enabled
        }
        onChange={(value) =>
          updateSetting(
            "enabled",
            value
          )
        }
      />


      <SettingToggle
        label="Route Enquiries to Assigned Agent"
        description="
          Automatically route property enquiries to the property's
          assigned agent.
        "
        checked={
          settings.routeEnquiriesToAssignedAgent
        }
        onChange={(value) =>
          updateSetting(
            "routeEnquiriesToAssignedAgent",
            value
          )
        }
        disabled={
          !settings.enabled
        }
      />


      <SettingToggle
        label="Route Appointments to Assigned Agent"
        description="
          Automatically route property viewing appointments to
          the assigned agent.
        "
        checked={
          settings.routeAppointmentsToAssignedAgent
        }
        onChange={(value) =>
          updateSetting(
            "routeAppointmentsToAssignedAgent",
            value
          )
        }
        disabled={
          !settings.enabled
        }
      />


      <SettingToggle
        label="Route Follow-Ups to Assigned Agent"
        description="
          Automatically route follow-up tasks to the assigned agent.
        "
        checked={
          settings.routeFollowUpsToAssignedAgent
        }
        onChange={(value) =>
          updateSetting(
            "routeFollowUpsToAssignedAgent",
            value
          )
        }
        disabled={
          !settings.enabled
        }
      />


      <SettingSelect
        label="Assignment Method"
        description="
          Determines how LeadFlow AI selects an agent when automatic
          assignment is enabled.
        "
        value={
          settings.assignmentMethod
        }
        onChange={(value) =>
          updateSetting(
            "assignmentMethod",
            value
          )
        }
        disabled={
          !settings.enabled
        }
      >

        <option value="manual">
          Manual
        </option>

        <option value="round_robin">
          Round Robin
        </option>

        <option value="least_loaded">
          Least Loaded Agent
        </option>

        <option value="property_based">
          Property Based
        </option>

      </SettingSelect>


      <SettingToggle
        label="Allow Property Reassignment"
        description="
          Allow administrators to reassign properties between agents.
        "
        checked={
          settings.allowReassignment
        }
        onChange={(value) =>
          updateSetting(
            "allowReassignment",
            value
          )
        }
      />


      <SettingToggle
        label="Reassign Unhandled Enquiries"
        description="
          Automatically reassign enquiries when the assigned agent
          does not respond within the configured time.
        "
        checked={
          settings.reassignUnhandled
        }
        onChange={(value) =>
          updateSetting(
            "reassignUnhandled",
            value
          )
        }
      />


      <div className="grid gap-4 md:grid-cols-2">

        <SettingInput
          label="Reassignment Delay"
          type="number"
          min="1"
          value={
            settings.reassignmentDelay
          }
          disabled={
            !settings.reassignUnhandled
          }
          onChange={(value) =>
            updateSetting(
              "reassignmentDelay",
              Number(value)
            )
          }
        />


        <SettingSelect
          label="Delay Unit"
          value={
            settings.reassignmentDelayUnit
          }
          disabled={
            !settings.reassignUnhandled
          }
          onChange={(value) =>
            updateSetting(
              "reassignmentDelayUnit",
              value
            )
          }
        >

          <option value="minutes">
            Minutes
          </option>

          <option value="hours">
            Hours
          </option>

        </SettingSelect>

      </div>

    </SettingsSection>

  );
}


/* ==========================================================
   AI SETTINGS
========================================================== */

function AISettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="AI Property Recommendations"
        description="Enable LeadFlow AI property recommendations."
        checked={settings.recommendationsEnabled}
        onChange={(value) =>
          updateSetting(
            "recommendationsEnabled",
            value
          )
        }
      />

      <SettingToggle
        label="Lead Matching"
        description="Match properties against customer requirements."
        checked={settings.leadMatchingEnabled}
        onChange={(value) =>
          updateSetting(
            "leadMatchingEnabled",
            value
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SettingInput
          label="Recommendation Limit"
          type="number"
          min="1"
          max="50"
          value={settings.recommendationLimit}
          disabled={!settings.recommendationsEnabled}
          onChange={(value) =>
            updateSetting(
              "recommendationLimit",
              Number(value)
            )
          }
        />

        <SettingInput
          label="Minimum Recommendation Score"
          type="number"
          min="0"
          max="100"
          value={settings.minimumRecommendationScore}
          disabled={!settings.recommendationsEnabled}
          onChange={(value) =>
            updateSetting(
              "minimumRecommendationScore",
              Number(value)
            )
          }
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">
          Matching Signals
        </p>

        <SettingToggle
          label="Match Budget"
          description="Consider customer budget when matching properties."
          checked={settings.matchBudget}
          onChange={(value) =>
            updateSetting("matchBudget", value)
          }
        />

        <SettingToggle
          label="Match Location"
          description="Consider preferred customer location."
          checked={settings.matchLocation}
          onChange={(value) =>
            updateSetting("matchLocation", value)
          }
        />

        <SettingToggle
          label="Match Bedrooms"
          description="Consider required bedroom count."
          checked={settings.matchBedrooms}
          onChange={(value) =>
            updateSetting("matchBedrooms", value)
          }
        />

        <SettingToggle
          label="Match Property Type"
          description="Consider the customer's preferred property type."
          checked={settings.matchPropertyType}
          onChange={(value) =>
            updateSetting(
              "matchPropertyType",
              value
            )
          }
        />

        <SettingToggle
          label="Featured Property Ranking Bonus"
          description="Give featured properties additional ranking weight."
          checked={settings.featuredRankingBonus}
          onChange={(value) =>
            updateSetting(
              "featuredRankingBonus",
              value
            )
          }
        />

        <SettingToggle
          label="Recommend Available Properties Only"
          description="Prevent unavailable, archived or inactive properties from appearing in AI recommendations."
          checked={settings.recommendAvailableOnly}
          onChange={(value) =>
            updateSetting(
              "recommendAvailableOnly",
              value
            )
          }
        />
      </div>
    </SettingsSection>
  );
}


/* ==========================================================
   ENQUIRY SETTINGS
========================================================== */

function EnquirySettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="Accept Property Enquiries"
        description="Allow customers to submit enquiries against property listings."
        checked={settings.acceptEnquiries}
        onChange={(value) =>
          updateSetting("acceptEnquiries", value)
        }
      />

      <SettingToggle
        label="Automatically Route Enquiries"
        description="Automatically route new property enquiries to appropriate agents."
        checked={settings.autoRouteEnquiries}
        onChange={(value) =>
          updateSetting(
            "autoRouteEnquiries",
            value
          )
        }
      />

      <SettingToggle
        label="Allow Fallback Routing"
        description="Use the organization's fallback assignment mechanism when no property agent is assigned."
        checked={settings.allowFallbackRouting}
        onChange={(value) =>
          updateSetting(
            "allowFallbackRouting",
            value
          )
        }
      />

      <SettingToggle
        label="Automatically Create Leads"
        description="Create a LeadFlow AI lead when a customer submits a property enquiry."
        checked={settings.autoCreateLead}
        onChange={(value) =>
          updateSetting(
            "autoCreateLead",
            value
          )
        }
      />

      <SettingToggle
        label="Enable Automated Follow-Ups"
        description="Allow automated follow-up workflows after property enquiries."
        checked={settings.followUpsEnabled}
        onChange={(value) =>
          updateSetting(
            "followUpsEnabled",
            value
          )
        }
      />
    </SettingsSection>
  );
}


/* ==========================================================
   LISTING SETTINGS
========================================================== */

function ListingSettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="Featured Properties"
        description="Allow properties to be marked as featured."
        checked={settings.featuredEnabled}
        onChange={(value) =>
          updateSetting(
            "featuredEnabled",
            value
          )
        }
      />

      <SettingToggle
        label="Property Search"
        description="Enable property search functionality."
        checked={settings.searchEnabled}
        onChange={(value) =>
          updateSetting(
            "searchEnabled",
            value
          )
        }
      />

      <SettingToggle
        label="Property Filters"
        description="Enable filtering of property listings."
        checked={settings.filtersEnabled}
        onChange={(value) =>
          updateSetting(
            "filtersEnabled",
            value
          )
        }
      />

      <SettingToggle
        label="Include Archived in Admin Search"
        description="Include archived properties when administrators search."
        checked={settings.includeArchivedInAdminSearch}
        onChange={(value) =>
          updateSetting(
            "includeArchivedInAdminSearch",
            value
          )
        }
      />

      <div className="space-y-3">
        <p className="text-sm font-medium">
          Customer Visibility
        </p>

        <SettingToggle
          label="Show Available Properties"
          checked={settings.showAvailable}
          onChange={(value) =>
            updateSetting(
              "showAvailable",
              value
            )
          }
        />

        <SettingToggle
          label="Show Reserved Properties"
          checked={settings.showReserved}
          onChange={(value) =>
            updateSetting(
              "showReserved",
              value
            )
          }
        />

        <SettingToggle
          label="Show Sold Properties"
          checked={settings.showSold}
          onChange={(value) =>
            updateSetting(
              "showSold",
              value
            )
          }
        />
      </div>
    </SettingsSection>
  );
}


/* ==========================================================
   IMAGE SETTINGS
========================================================== */

function ImageSettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="Require Cover Image"
        description="Require a cover image before a property can be published."
        checked={settings.requireCoverImage}
        onChange={(value) =>
          updateSetting(
            "requireCoverImage",
            value
          )
        }
      />

      <SettingInput
        label="Maximum Images Per Property"
        type="number"
        min="1"
        max="100"
        value={settings.maximumImages}
        onChange={(value) =>
          updateSetting(
            "maximumImages",
            Number(value)
          )
        }
      />

      <SettingToggle
        label="AI Image Analysis"
        description="Enable AI-powered image metadata and analysis features."
        checked={settings.aiImageAnalysisEnabled}
        onChange={(value) =>
          updateSetting(
            "aiImageAnalysisEnabled",
            value
          )
        }
      />
    </SettingsSection>
  );
}


/* ==========================================================
   VIEWING SETTINGS
========================================================== */

function ViewingSettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="Allow Property Viewings"
        description="Allow customers to request appointments for property viewings."
        checked={settings.allowViewings}
        onChange={(value) =>
          updateSetting(
            "allowViewings",
            value
          )
        }
      />

      <SettingToggle
        label="Require Agent Confirmation"
        description="Require the assigned agent to confirm a viewing request before it becomes confirmed."
        checked={settings.requireViewingConfirmation}
        disabled={!settings.allowViewings}
        onChange={(value) =>
          updateSetting(
            "requireViewingConfirmation",
            value
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SettingInput
          label="Minimum Viewing Notice"
          type="number"
          min="0"
          value={settings.minimumViewingNotice}
          disabled={!settings.allowViewings}
          onChange={(value) =>
            updateSetting(
              "minimumViewingNotice",
              Number(value)
            )
          }
        />

        <SettingSelect
          label="Notice Unit"
          value={settings.minimumViewingNoticeUnit}
          disabled={!settings.allowViewings}
          onChange={(value) =>
            updateSetting(
              "minimumViewingNoticeUnit",
              value
            )
          }
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </SettingSelect>
      </div>
    </SettingsSection>
  );
}

/* ==========================================================
   FOLLOW-UP SETTINGS
========================================================== */

function FollowUpSettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="Enable Automated Follow-Up"
        description="Allow LeadFlow AI to automatically follow up with property prospects."
        checked={settings.enabled}
        onChange={(value) =>
          updateSetting("enabled", value)
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SettingInput
          label="First Follow-Up Delay"
          type="number"
          min="1"
          value={settings.firstFollowUpDelay}
          disabled={!settings.enabled}
          onChange={(value) =>
            updateSetting(
              "firstFollowUpDelay",
              Number(value)
            )
          }
        />

        <SettingSelect
          label="Follow-Up Unit"
          value={settings.firstFollowUpUnit}
          disabled={!settings.enabled}
          onChange={(value) =>
            updateSetting(
              "firstFollowUpUnit",
              value
            )
          }
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </SettingSelect>
      </div>

      <SettingInput
        label="Maximum Follow-Ups"
        type="number"
        min="0"
        max="20"
        value={settings.maximumFollowUps}
        disabled={!settings.enabled}
        onChange={(value) =>
          updateSetting(
            "maximumFollowUps",
            Number(value)
          )
        }
      />
    </SettingsSection>
  );
}


/* ==========================================================
   NOTIFICATION SETTINGS
========================================================== */

function NotificationSettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="New Property Enquiry Notifications"
        description="Notify assigned agents when a new enquiry is received."
        checked={settings.newEnquiry}
        onChange={(value) =>
          updateSetting(
            "newEnquiry",
            value
          )
        }
      />

      <SettingToggle
        label="Property Reserved Notifications"
        description="Notify relevant users when a property is reserved."
        checked={settings.propertyReserved}
        onChange={(value) =>
          updateSetting(
            "propertyReserved",
            value
          )
        }
      />

      <SettingToggle
        label="Property Sold Notifications"
        description="Notify relevant users when a property is sold."
        checked={settings.propertySold}
        onChange={(value) =>
          updateSetting(
            "propertySold",
            value
          )
        }
      />

      <SettingToggle
        label="Follow-Up Reminders"
        description="Notify agents about pending follow-up tasks."
        checked={settings.followUpReminders}
        onChange={(value) =>
          updateSetting(
            "followUpReminders",
            value
          )
        }
      />

      <SettingToggle
        label="Viewing Request Notifications"
        description="Notify agents when a customer requests a property viewing."
        checked={settings.notifyViewingRequest}
        onChange={(value) =>
          updateSetting(
            "notifyViewingRequest",
            value
          )
        }
      />

      <SettingToggle
        label="Property Status Notifications"
        description="Notify relevant users when a property's status changes."
        checked={settings.notifyStatusChange}
        onChange={(value) =>
          updateSetting(
            "notifyStatusChange",
            value
          )
        }
      />
    </SettingsSection>
  );
}


/* ==========================================================
   ADVANCED SETTINGS
========================================================== */

function AdvancedSettings({
  settings,
  updateSetting,
}) {
  return (
    <SettingsSection>
      <SettingToggle
        label="Property Analytics"
        description="Track property views and related analytics activity."
        checked={settings.analyticsEnabled}
        onChange={(value) =>
          updateSetting(
            "analyticsEnabled",
            value
          )
        }
      />

      <SettingToggle
        label="Recommendation Analytics"
        description="Track property recommendation activity and performance."
        checked={
          settings.recommendationAnalyticsEnabled
        }
        onChange={(value) =>
          updateSetting(
            "recommendationAnalyticsEnabled",
            value
          )
        }
      />

      <div
        className="
          rounded-lg
          border
          border-dashed
          p-4
        "
      >
        <p className="text-sm font-medium">
          Backend Persistence
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          These settings are currently stored only in the
          frontend session. Backend persistence will be connected
          when the organization settings API is implemented.
        </p>
      </div>
    </SettingsSection>
  );
}


/* ==========================================================
   SETTINGS SECTION WRAPPER
========================================================== */

function SettingsSection({
  children,
}) {
  return (
    <div className="space-y-6 p-6">
      {children}
    </div>
  );
}


/* ==========================================================
   SETTING TOGGLE
========================================================== */

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
        rounded-xl
        border
        bg-background
        p-4
      "
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {label}
        </p>

        {description && (
          <p
            className="
              mt-1
              max-w-2xl
              text-xs
              leading-5
              text-muted-foreground
            "
          >
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() =>
          onChange(!checked)
        }
        className={`
          relative
          mt-0.5
          inline-flex
          h-6
          w-11
          shrink-0
          items-center
          rounded-full
          transition
          focus:outline-none
          focus:ring-2
          focus:ring-ring
          focus:ring-offset-2
          disabled:cursor-not-allowed
          disabled:opacity-50

          ${
            checked
              ? "bg-primary"
              : "bg-muted"
          }
        `}
      >
        <span
          className={`
            inline-block
            h-4
            w-4
            transform
            rounded-full
            bg-background
            shadow
            transition

            ${
              checked
                ? "translate-x-6"
                : "translate-x-1"
            }
          `}
        />
      </button>
    </div>
  );
}


/* ==========================================================
   SETTING SELECT
========================================================== */

function SettingSelect({
  label,
  description,
  value,
  onChange,
  disabled = false,
  children,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-lg
          border
          bg-background
          px-3
          py-2
          text-sm
          outline-none
          focus:ring-2
          focus:ring-ring
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {children}
      </select>

      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}


/* ==========================================================
   SETTING INPUT
========================================================== */

function SettingInput({
  label,
  type = "text",
  value,
  onChange,
  min,
  max,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-lg
          border
          bg-background
          px-3
          py-2
          text-sm
          outline-none
          focus:ring-2
          focus:ring-ring
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      />
    </div>
  );
}


/* ==========================================================
   CLONE SETTINGS
========================================================== */

function cloneSettings(settings) {
  /*
   * structuredClone is supported in modern browsers.
   * JSON fallback keeps compatibility with older environments.
   */

  if (
    typeof structuredClone ===
    "function"
  ) {
    return structuredClone(settings);
  }

  return JSON.parse(
    JSON.stringify(settings)
  );
}


/* ==========================================================
   EXPORT
========================================================== */

export default PropertySettings;