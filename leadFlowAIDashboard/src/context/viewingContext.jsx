// ======================================================
// Global Viewing Context
// ======================================================
//
// LeadFlow AI - Viewing Management
//
// This context provides shared viewing state for:
// ✓ Property selection
// ✓ Viewing requests
// ✓ Viewing availability
// ✓ Viewing calendar
// ✓ Viewing reminders
// ✓ Viewing workflow
//
// IMPORTANT
// ------------------------------------------------------
// Any component calling useViewingContext() MUST be
// rendered inside <ViewingProvider>.
// ======================================================

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import useViewings from "../hooks/useViewings";
import useViewingAvailability from "../hooks/useViewingAvailability";
import useViewingCalendar from "../hooks/useViewingCalendar";
import useViewingReminder from "../hooks/useViewingReminder";

// ======================================================
// CREATE CONTEXT
// ======================================================

const ViewingContext = createContext(null);

// ======================================================
// VIEWING PROVIDER
// ======================================================

export const ViewingProvider = ({ children }) => {
  // ====================================================
  // VIEWINGS
  // ====================================================

  const viewing = useViewings();

  // ====================================================
  // VIEWING AVAILABILITY
  // ====================================================

  const availability = useViewingAvailability();

  // ====================================================
  // VIEWING CALENDAR
  // ====================================================

  const calendar = useViewingCalendar();

  // ====================================================
  // VIEWING REMINDERS
  // ====================================================

  const reminders = useViewingReminder();

  // ====================================================
  // GLOBAL VIEWING WORKFLOW
  // ====================================================

  const [selectedProperty, setSelectedProperty] =
    useState(null);

  const [viewingMode, setViewingMode] =
    useState("Viewer");

  const [currentStep, setCurrentStep] =
    useState(1);

  const [viewingStatus, setViewingStatus] =
    useState("Requested");

  // ====================================================
  // RESET WORKFLOW
  // ====================================================

  const resetViewingWorkflow = useCallback(() => {
    // Property
    setSelectedProperty(null);

    // Availability
    availability.setSelectedAgent(null);
    availability.setSelectedSlot(null);

    // Calendar
    calendar.setSelectedSlot(null);
    calendar.setSelectedDate(new Date());

    // Current viewing
    viewing.setSelectedViewing(null);

    // Workflow
    setViewingStatus("Requested");
    setCurrentStep(1);
  }, [
    availability,
    calendar,
    viewing,
  ]);

  // ====================================================
  // CONTEXT VALUE
  // ====================================================

  const contextValue = useMemo(
    () => ({
      // ================================================
      // GLOBAL STATE
      // ================================================

      selectedProperty,
      setSelectedProperty,

      viewingMode,
      setViewingMode,

      currentStep,
      setCurrentStep,

      viewingStatus,
      setViewingStatus,

      resetViewingWorkflow,

      // ================================================
      // VIEWINGS
      // ================================================

      ...viewing,

      // ================================================
      // AVAILABILITY
      // ================================================

      ...availability,

      // ================================================
      // CALENDAR
      // ================================================

      ...calendar,

      // ================================================
      // REMINDERS
      // ================================================

      ...reminders,
    }),
    [
      selectedProperty,
      viewingMode,
      currentStep,
      viewingStatus,
      resetViewingWorkflow,
      viewing,
      availability,
      calendar,
      reminders,
    ]
  );

  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <ViewingContext.Provider value={contextValue}>
      {children}
    </ViewingContext.Provider>
  );
};

// ======================================================
// VIEWING CONTEXT HOOK
// ======================================================

export const useViewingContext = () => {
  const context = useContext(ViewingContext);

  if (context === null) {
    throw new Error(
      "useViewingContext must be used within a ViewingProvider."
    );
  }

  return context;
};

export default ViewingContext;


