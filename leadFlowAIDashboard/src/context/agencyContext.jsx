/**
 * ==========================================================
 * Stores the currently selected agency.
 *
 * Purpose
 * -------
 * Every authenticated user belongs to a Real Estate Agency.
 *
 * This context provides agency information globally so that:
 *
 * ✓ dashboards
 * ✓ leads
 * ✓ conversations
 * ✓ properties
 * ✓ reports
 *
 * automatically know which agency data to load.
 *
 * NOTE
 * ----
 * Authentication is handled separately by AuthContext.
 * This context only manages the active agency.
 * ==========================================================
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { useAuth } from "../hooks/useAuth";

const AgencyContext = createContext();

export const AgencyProvider = ({ children }) => {
  //----------------------------------------------------------
  // Logged in user
  //----------------------------------------------------------

  const { user } = useAuth();

  //----------------------------------------------------------
  // Current agency
  //----------------------------------------------------------

  const [agency, setAgency] = useState(null);

  //----------------------------------------------------------
  // Load agency whenever user changes
  //----------------------------------------------------------

  useEffect(() => {
    if (!user) {
      setAgency(null);
      return;
    }

    /**
     * Later this can become:
     *
     * GET /api/agencies/:agencyId
     *
     * For now we populate directly from the user.
     */

    setAgency({
      id: user.agencyId,

      name: user.agencyName || "LeadFlow Demo Agency",

      logo: user.agencyLogo || "",

      // Branch or location info
      branch: user.branch || user.location || "Nairobi",

      subscription: user.subscription || "Professional",

      timezone: user.timezone || "Africa/Nairobi",

      // Brand colors for theming
      brandColors: user.brandColors || {
        primary: "#2563eb", // default blue
        secondary: "#10b981", // default green
        accent: "#f59e0b", // default amber
      },
    });
  }, [user]);

  //----------------------------------------------------------
  // Update agency
  //----------------------------------------------------------

  const updateAgency = (updates) => {
    setAgency((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  //----------------------------------------------------------
  // Clear agency
  //----------------------------------------------------------

  const clearAgency = () => {
    setAgency(null);
  };

  //----------------------------------------------------------
  // Context value
  //----------------------------------------------------------

  const value = {
    agency,
    setAgency,
    updateAgency,
    clearAgency,
  };

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  );
};

/**
 * Custom Hook
 */

export const useAgency = () => {
  const context = useContext(AgencyContext);

  if (!context) {
    throw new Error(
      "useAgency must be used inside AgencyProvider."
    );
  }

  return context;
};

export default AgencyContext;
