/**
 * ==========================================================
 *
 * PATH
 * ----
 * src/pages/agent/agentProfile.jsx
 *
 * PURPOSE
 * -------
 * Agent-specific profile workspace.
 *
 * This page allows the currently authenticated agent to:
 *
 * • View personal information
 * • View contact information
 * • View assigned role
 * • View organization information
 * • Edit profile information
 * • Update profile details
 * • Refresh profile data
 *
 * IMPORTANT
 * ---------
 * This page is intentionally AGENT-SPECIFIC.
 *
 * It does NOT accept a user ID from the URL.
 *
 * The authenticated agent is determined by the
 * application's authentication layer / API.
 *
 * SECURITY
 * --------
 * Passwords, authentication tokens, roles and other
 * privileged security fields must NOT be editable here.
 *
 * The backend remains responsible for validating:
 *
 * • Authentication
 * • Authorization
 * • Role
 * • Organization ownership
 * • Profile update permissions
 *
 * ==========================================================
 */

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Save,
  RefreshCw,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import axiosClient from "../../api/axiosClient";

import useAuth from "../../hooks/useAuth";

/*
==========================================================
DEFAULT PROFILE
==========================================================
*/

const EMPTY_PROFILE = {
  name: "",
  email: "",
  phone: "",
  role: "",
  organizationId: "",
  organizationName: "",
};

/*
==========================================================
HELPERS
==========================================================
*/

/**
 * Safely extract the profile object from different
 * possible backend response shapes.
 *
 * Supported:
 *
 * {
 *   data: {...}
 * }
 *
 * {
 *   data: {
 *     data: {...}
 *   }
 * }
 *
 * {...}
 */
const extractProfile = (response) => {
  if (!response) {
    return null;
  }

  if (
    response?.data?.data &&
    typeof response.data.data === "object" &&
    !Array.isArray(response.data.data)
  ) {
    return response.data.data;
  }

  if (
    response?.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  if (
    typeof response === "object" &&
    !Array.isArray(response)
  ) {
    return response;
  }

  return null;
};

/**
 * Normalize the backend user/profile object.
 */
const normalizeProfile = (profile = {}) => {
  const organization =
    profile.organization || {};

  return {
    name:
      profile.name ||
      profile.fullName ||
      "",

    email:
      profile.email ||
      "",

    phone:
      profile.phone ||
      profile.phoneNumber ||
      "",

    role:
      profile.role ||
      "agent",

    organizationId:
      profile.organizationId ||
      organization._id ||
      organization.id ||
      "",

    organizationName:
      profile.organizationName ||
      organization.name ||
      "",
  };
};

/**
 * Human-readable role.
 */
const formatRole = (role) => {
  if (!role) {
    return "Agent";
  }

  return String(role)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/*
==========================================================
COMPONENT
==========================================================
*/

const AgentProfile = () => {
  /*
  ========================================================
  AUTHENTICATED USER
  ========================================================
  */

  const auth = useAuth();

  const authenticatedUser =
    auth?.user || null;

  /*
  ========================================================
  PROFILE STATE
  ========================================================
  */

  const [profile, setProfile] =
    useState(EMPTY_PROFILE);

  /*
  ========================================================
  EDIT STATE
  ========================================================
  */

  const [formData, setFormData] =
    useState({
      name: "",
      phone: "",
    });

  const [editing, setEditing] =
    useState(false);

  /*
  ========================================================
  UI STATE
  ========================================================
  */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  ========================================================
  LOAD PROFILE
  ========================================================
  */

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        console.log(
          "[AgentProfile] Loading authenticated agent profile..."
        );

        /*
        ----------------------------------------------------
        IMPORTANT
        ----------------------------------------------------
        This endpoint should return the authenticated user's
        profile.

        It must NOT rely on an ID supplied by the frontend.
        ----------------------------------------------------
        */

        const response =
          await axiosClient.get(
            "/auth/me"
          );

        console.log(
          "[AgentProfile] Raw profile response:",
          response
        );

        const profileData =
          extractProfile(response);

        /*
        ----------------------------------------------------
        FALLBACK
        ----------------------------------------------------
        If the backend response is unavailable but AuthContext
        already contains the authenticated user, use that
        information as the initial profile.
        ----------------------------------------------------
        */

        if (!profileData) {
          if (authenticatedUser) {
            const normalized =
              normalizeProfile(
                authenticatedUser
              );

            setProfile(normalized);

            setFormData({
              name: normalized.name,
              phone: normalized.phone,
            });

            console.log(
              "[AgentProfile] Using authenticated user fallback:",
              normalized
            );

            return;
          }

          throw new Error(
            "Unable to load your profile."
          );
        }

        const normalized =
          normalizeProfile(
            profileData
          );

        setProfile(normalized);

        setFormData({
          name: normalized.name,
          phone: normalized.phone,
        });

        console.log(
          "[AgentProfile] Normalized profile:",
          normalized
        );
      } catch (requestError) {
        console.error(
          "[AgentProfile] Failed to load profile:",
          requestError
        );

        /*
        ----------------------------------------------------
        FALLBACK TO AUTH CONTEXT
        ----------------------------------------------------
        ----------------------------------------------------
        */

        if (authenticatedUser) {
          const normalized =
            normalizeProfile(
              authenticatedUser
            );

          setProfile(normalized);

          setFormData({
            name: normalized.name,
            phone: normalized.phone,
          });

          setError(
            ""
          );

          return;
        }

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authenticatedUser]
  );

  /*
  ========================================================
  INITIAL LOAD
  ========================================================
  */

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /*
  ========================================================
  FORM CHANGE
  ========================================================
  */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    /*
    Clear previous feedback when
    the agent starts editing again.
    */

    setSuccess("");

    setError("");
  };

  /*
  ========================================================
  START EDITING
  ========================================================
  */

  const handleEdit = () => {
    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
    });

    setSuccess("");
    setError("");
    setEditing(true);
  };

  /*
  ========================================================
  CANCEL EDIT
  ========================================================
  */

  const handleCancel = () => {
    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
    });

    setError("");
    setSuccess("");
    setEditing(false);
  };

  /*
  ========================================================
  SAVE PROFILE
  ========================================================
  */

  const handleSave = async () => {
    /*
    ------------------------------------------------------
    VALIDATION
    ------------------------------------------------------
    */

    const trimmedName =
      formData.name.trim();

    const trimmedPhone =
      formData.phone.trim();

    if (!trimmedName) {
      setError(
        "Your name is required."
      );

      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      console.log(
        "[AgentProfile] Saving profile:",
        {
          name: trimmedName,
          phone: trimmedPhone,
        }
      );

      /*
      ------------------------------------------------------
      UPDATE AUTHENTICATED USER PROFILE
      ------------------------------------------------------
      */

      const response =
        await axiosClient.patch(
          "/auth/me",
          {
            name: trimmedName,
            phone: trimmedPhone,
          }
        );

      console.log(
        "[AgentProfile] Profile update response:",
        response
      );

      const updatedProfile =
        extractProfile(response);

      /*
      ------------------------------------------------------
      IF BACKEND RETURNS UPDATED PROFILE
      ------------------------------------------------------
      */

      if (updatedProfile) {
        const normalized =
          normalizeProfile(
            updatedProfile
          );

        setProfile(normalized);

        setFormData({
          name: normalized.name,
          phone: normalized.phone,
        });
      } else {
        /*
        ----------------------------------------------------
        OTHERWISE UPDATE LOCAL UI FROM FORM
        ----------------------------------------------------
        */

        setProfile(
          (previous) => ({
            ...previous,
            name: trimmedName,
            phone: trimmedPhone,
          })
        );
      }

      /*
      ------------------------------------------------------
      UPDATE AUTH CONTEXT IF AVAILABLE
      ------------------------------------------------------
      */

      if (
        typeof auth?.updateProfile ===
        "function"
      ) {
        try {
          await auth.updateProfile({
            name: trimmedName,
            phone: trimmedPhone,
          });

          console.log(
            "[AgentProfile] AuthContext profile updated."
          );
        } catch (authUpdateError) {
          /*
          --------------------------------------------------
          The backend update already succeeded.
          Do not treat a local AuthContext refresh failure
          as a failed server update.
          --------------------------------------------------
          */

          console.warn(
            "[AgentProfile] AuthContext update warning:",
            authUpdateError
          );
        }
      }

      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );

      console.log(
        "[AgentProfile] Profile saved successfully."
      );
    } catch (requestError) {
      console.error(
        "[AgentProfile] Failed to save profile:",
        requestError
      );

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ========================================================
  LOADING STATE
  ========================================================
  */

  if (loading) {
    return (
      <section className="space-y-8">

        <div>
          <h1 className="text-3xl font-bold">
            My Profile
          </h1>

          <p className="mt-1 text-muted-foreground">
            Loading your agent profile...
          </p>
        </div>

        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border bg-card">

          <div className="flex flex-col items-center gap-4">

            <RefreshCw
              size={30}
              className="animate-spin text-primary"
            />

            <p className="text-muted-foreground">
              Loading profile...
            </p>

          </div>

        </div>

      </section>
    );
  }

  /*
  ========================================================
  ERROR STATE
  ========================================================
  */

  if (
    error &&
    !profile.name &&
    !profile.email
  ) {
    return (
      <section className="space-y-8">

        <div>
          <h1 className="text-3xl font-bold">
            My Profile
          </h1>

          <p className="mt-1 text-muted-foreground">
            Manage your LeadFlow AI agent account.
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">

          <div className="flex items-start gap-3">

            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>

              <h2 className="font-semibold text-red-400">
                Unable to load profile
              </h2>

              <p className="mt-2 text-sm text-red-300">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadProfile()
                }
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-red-500/40
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-red-300
                  transition
                  hover:bg-red-500/10
                "
              >
                <RefreshCw size={16} />
                Try Again
              </button>

            </div>

          </div>

        </div>

      </section>
    );
  }

  /*
  ========================================================
  PAGE
  ========================================================
  */

  return (
    <section className="space-y-8">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-primary/10 p-3">

              <User
                size={25}
                className="text-primary"
              />

            </div>

            <div>

              <h1 className="text-3xl font-bold">
                My Profile
              </h1>

              <p className="mt-1 text-muted-foreground">
                Manage your LeadFlow AI agent profile.
              </p>

            </div>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              loadProfile(true)
            }
            disabled={
              refreshing ||
              editing
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              px-4
              py-2
              text-sm
              font-medium
              transition
              hover:bg-muted
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

          {!editing && (
            <button
              type="button"
              onClick={handleEdit}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-primary
                px-4
                py-2
                text-sm
                font-semibold
                text-primary-foreground
                transition
                hover:opacity-90
              "
            >
              <Edit3 size={17} />
              Edit Profile
            </button>
          )}

        </div>

      </div>

      {/* ====================================================
          FEEDBACK
      ==================================================== */}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">

          <CheckCircle2 size={19} />

          <span>
            {success}
          </span>

        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">

          <AlertCircle size={19} />

          <span>
            {error}
          </span>

        </div>
      )}

      {/* ====================================================
          PROFILE OVERVIEW
      ==================================================== */}

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* ==================================================
            PROFILE CARD
        ================================================== */}

        <div className="rounded-2xl border bg-card p-6">

          <div className="flex flex-col items-center text-center">

            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">

              <User
                size={44}
                className="text-primary"
              />

            </div>

            <h2 className="mt-5 text-xl font-bold">
              {profile.name ||
                "LeadFlow Agent"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {profile.email ||
                "No email available"}
            </p>

            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">

              <ShieldCheck size={16} />

              {formatRole(
                profile.role
              )}

            </span>

          </div>

        </div>

        {/* ==================================================
            PROFILE DETAILS
        ================================================== */}

        <div className="rounded-2xl border bg-card p-6">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-semibold">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your contact and account information.
              </p>

            </div>

            {!editing && (
              <Edit3
                size={20}
                className="text-muted-foreground"
              />
            )}

          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* =================================================
                NAME
            ================================================= */}

            <div>

              <label
                htmlFor="agent-name"
                className="mb-2 block text-sm font-medium"
              >
                Full Name
              </label>

              {editing ? (
                <div className="relative">

                  <User
                    size={18}
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-muted-foreground
                    "
                  />

                  <input
                    id="agent-name"
                    name="name"
                    type="text"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="
                      w-full
                      rounded-lg
                      border
                      bg-background
                      py-3
                      pl-10
                      pr-3
                      outline-none
                      transition
                      focus:border-primary
                    "
                    placeholder="Your full name"
                  />

                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">

                  <User
                    size={18}
                    className="text-muted-foreground"
                  />

                  <span>
                    {profile.name ||
                      "Not provided"}
                  </span>

                </div>
              )}

            </div>

            {/* =================================================
                EMAIL
            ================================================= */}

            <div>

              <label
                htmlFor="agent-email"
                className="mb-2 block text-sm font-medium"
              >
                Email Address
              </label>

              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">

                <Mail
                  size={18}
                  className="shrink-0 text-muted-foreground"
                />

                <span className="truncate">
                  {profile.email ||
                    "Not provided"}
                </span>

              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Email is managed by your account
                authentication system.
              </p>

            </div>

            {/* =================================================
                PHONE
            ================================================= */}

            <div>

              <label
                htmlFor="agent-phone"
                className="mb-2 block text-sm font-medium"
              >
                Phone Number
              </label>

              {editing ? (
                <div className="relative">

                  <Phone
                    size={18}
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-muted-foreground
                    "
                  />

                  <input
                    id="agent-phone"
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                    className="
                      w-full
                      rounded-lg
                      border
                      bg-background
                      py-3
                      pl-10
                      pr-3
                      outline-none
                      transition
                      focus:border-primary
                    "
                    placeholder="e.g. 0712345678"
                  />

                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">

                  <Phone
                    size={18}
                    className="text-muted-foreground"
                  />

                  <span>
                    {profile.phone ||
                      "Not provided"}
                  </span>

                </div>
              )}

            </div>

            {/* =================================================
                ROLE
            ================================================= */}

            <div>

              <label className="mb-2 block text-sm font-medium">
                Role
              </label>

              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">

                <ShieldCheck
                  size={18}
                  className="shrink-0 text-muted-foreground"
                />

                <span className="font-medium">
                  {formatRole(
                    profile.role
                  )}
                </span>

              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Your role is controlled by LeadFlow AI
                authorization settings.
              </p>

            </div>

          </div>

          {/* =================================================
              EDIT ACTIONS
          ================================================= */}

          {editing && (
            <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={saving}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  px-5
                  py-2.5
                  font-medium
                  transition
                  hover:bg-muted
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                <X size={17} />

                Cancel

              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-primary
                  px-5
                  py-2.5
                  font-semibold
                  text-primary-foreground
                  transition
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >

                <Save size={17} />

                {saving
                  ? "Saving..."
                  : "Save Changes"}

              </button>

            </div>
          )}

        </div>

      </section>

      {/* ====================================================
          ACCOUNT / ORGANIZATION INFORMATION
      ==================================================== */}

      <section className="rounded-2xl border bg-card p-6">

        <div className="mb-6">

          <h2 className="text-xl font-semibold">
            LeadFlow AI Account
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Information about your current agent account
            and organization.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* =================================================
              ORGANIZATION
          ================================================= */}

          <div className="rounded-xl border bg-background p-5">

            <div className="flex items-start gap-4">

              <div className="rounded-lg bg-primary/10 p-3">

                <Building2
                  size={21}
                  className="text-primary"
                />

              </div>

              <div className="min-w-0">

                <p className="text-sm text-muted-foreground">
                  Organization
                </p>

                <p className="mt-1 font-semibold">
                  {profile.organizationName ||
                    "Organization"}
                </p>

                {profile.organizationId && (
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    ID:{" "}
                    {
                      profile.organizationId
                    }
                  </p>
                )}

              </div>

            </div>

          </div>

          {/* =================================================
              ACCOUNT ROLE
          ================================================= */}

          <div className="rounded-xl border bg-background p-5">

            <div className="flex items-start gap-4">

              <div className="rounded-lg bg-primary/10 p-3">

                <ShieldCheck
                  size={21}
                  className="text-primary"
                />

              </div>

              <div>

                <p className="text-sm text-muted-foreground">
                  Account Role
                </p>

                <p className="mt-1 font-semibold">
                  {formatRole(
                    profile.role
                  )}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  Your permissions are determined by
                  your assigned LeadFlow AI role.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ====================================================
          AGENT WORKFLOW NOTE
      ==================================================== */}

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">

        <div className="flex items-start gap-4">

          <div className="rounded-lg bg-primary/10 p-3">

            <User
              size={22}
              className="text-primary"
            />

          </div>

          <div>

            <h2 className="font-semibold">
              Agent Workspace
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Your profile is connected to your LeadFlow AI
              agent workspace. Your assigned leads, property
              activities, follow-ups, scheduled viewings and
              performance information remain associated with
              your authenticated agent account.
            </p>

          </div>

        </div>

      </section>

    </section>
  );
};

export default AgentProfile;