/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Configure global platform settings.
 *
 * Features
 * ----------------------------------------------------------
 * • Platform Information
 * • Company Information
 * • AI Configuration
 * • Notification Settings
 * • Security
 * • Regional Settings
 * • Maintenance Mode
 *
 * Backend
 * ----------------------------------------------------------
 * GET    /api/settings
 * PUT    /api/settings
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {

  Settings,

  Globe,

  Bell,

  Shield,

  Brain,

  Building2,

  Save,

} from "lucide-react";

import settingsService from "../../services/settingsService";

const AdminSettings = () => {

  /*
  ==========================================================
  SETTINGS
  ==========================================================
  */

  const [

    settings,

    setSettings,

  ] = useState({

    platformName: "",

    website: "",

    supportEmail: "",

    supportPhone: "",

    defaultCountry: "Kenya",

    currency: "KES",

    timezone: "Africa/Nairobi",

    qualificationThreshold: 75,

    propertyRecommendations: true,

    autoAssignLeads: true,

    emailNotifications: true,

    smsNotifications: false,

    whatsappNotifications: true,

    maintenanceMode: false,

    twoFactorAuthentication: false,

    sessionTimeout: "30 Minutes",

  });

  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    saving,

    setSaving,

  ] = useState(false);

  /*
  ==========================================================
  LOAD SETTINGS
  ==========================================================
  */

  const loadSettings = async () => {

    try {

      setLoading(true);

      const response =

        await settingsService.getSettings();

      setSettings({

        platformName:

          response?.data?.platformName ||

          "LeadFlow AI",

        website:

          response?.data?.website ||

          "",

        supportEmail:

          response?.data?.supportEmail ||

          "",

        supportPhone:

          response?.data?.supportPhone ||

          "",

        defaultCountry:

          response?.data?.defaultCountry ||

          "Kenya",

        currency:

          response?.data?.currency ||

          "KES",

        timezone:

          response?.data?.timezone ||

          "Africa/Nairobi",

        qualificationThreshold:

          response?.data?.qualificationThreshold ??

          75,

        propertyRecommendations:

          response?.data?.propertyRecommendations ??

          true,

        autoAssignLeads:

          response?.data?.autoAssignLeads ??

          true,

        emailNotifications:

          response?.data?.emailNotifications ??

          true,

        smsNotifications:

          response?.data?.smsNotifications ??

          false,

        whatsappNotifications:

          response?.data?.whatsappNotifications ??

          true,

        maintenanceMode:

          response?.data?.maintenanceMode ??

          false,

        twoFactorAuthentication:

          response?.data?.twoFactorAuthentication ??

          false,

        sessionTimeout:

          response?.data?.sessionTimeout ||

          "30 Minutes",

      });

    } catch (error) {

      console.error(

        "Unable to load settings",

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

    loadSettings();

  }, []);

  /*
  ==========================================================
  INPUT HANDLER
  ==========================================================
  */

  const handleChange = (event) => {

    const {

      name,

      value,

    } = event.target;

    setSettings((previous) => ({

      ...previous,

      [name]: value,

    }));

  };

  /*
  ==========================================================
  TOGGLE HANDLER
  ==========================================================
  */

  const handleToggle = (name) => {

    setSettings((previous) => ({

      ...previous,

      [name]:

        !previous[name],

    }));

  };

  /*
  ==========================================================
  RANGE HANDLER
  ==========================================================
  */

  const handleThresholdChange = (

    event

  ) => {

    setSettings((previous) => ({

      ...previous,

      qualificationThreshold:

        Number(event.target.value),

    }));

  };

  /*
  ==========================================================
  SAVE SETTINGS
  ==========================================================
  */

  const handleSave = async () => {

    try {

      setSaving(true);

      await settingsService.updateSettings(

        settings

      );

      alert(

        "Platform settings updated successfully."

      );

    } catch (error) {

      console.error(

        "Unable to save settings",

        error

      );

      alert(

        "Failed to save settings."

      );

    } finally {

      setSaving(false);

    }

  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Loading platform settings...

        </p>

      </div>

    );

  }

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (

    <section className="mx-auto max-w-7xl space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>

        <h1 className="text-3xl font-bold">

          Workspace Settings

        </h1>

        <p className="text-muted-foreground">

          Configure LeadFlow AI for your organization.

        </p>

      </div>

      {/* ======================================================
          SETTINGS GRID
      ====================================================== */}

      <div className="grid gap-8 xl:grid-cols-2">

        {/* ======================================================
            PLATFORM INFORMATION
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-8">

          <div className="mb-8 flex items-center gap-3">

            <Settings className="text-primary" />

            <h2 className="text-2xl font-semibold">

              Platform Information

            </h2>

          </div>

          <div className="space-y-6">

            <div>

              <label className="mb-2 block text-sm font-medium">

                Platform Name

              </label>

              <input

                type="text"

                name="platformName"

                value={settings.platformName}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">

                Website

              </label>

              <input

                type="text"

                name="website"

                value={settings.website}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">

                Support Email

              </label>

              <input

                type="email"

                name="supportEmail"

                value={settings.supportEmail}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">

                Support Phone

              </label>

              <input

                type="text"

                name="supportPhone"

                value={settings.supportPhone}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              />

            </div>

          </div>

        </section>

        {/* ======================================================
            COMPANY INFORMATION
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-8">

          <div className="mb-8 flex items-center gap-3">

            <Building2 className="text-primary" />

            <h2 className="text-2xl font-semibold">

              Company Information

            </h2>

          </div>

          <div className="space-y-6">

            <div>

              <label className="mb-2 block text-sm font-medium">

                Default Country

              </label>

              <select

                name="defaultCountry"

                value={settings.defaultCountry}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              >

                <option value="Kenya">

                  Kenya

                </option>

                <option value="Uganda">

                  Uganda

                </option>

                <option value="Tanzania">

                  Tanzania

                </option>

              </select>

            </div>

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium">

                <Globe size={16} />

                Timezone

              </label>

              <input

                type="text"

                name="timezone"

                value={settings.timezone}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">

                Currency

              </label>

              <select

                name="currency"

                value={settings.currency}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              >

                <option value="KES">

                  Kenyan Shilling (KES)

                </option>

                <option value="USD">

                  US Dollar (USD)

                </option>

                <option value="UGX">

                  Uganda Shilling (UGX)

                </option>

              </select>

            </div>

          </div>

        </section>

        {/* ======================================================
            AI CONFIGURATION
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-8">

          <div className="mb-8 flex items-center gap-3">

            <Brain className="text-primary" />

            <h2 className="text-2xl font-semibold">

              AI Configuration

            </h2>

          </div>

          <div className="space-y-8">

            {/* Qualification Threshold */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <label className="text-sm font-medium">

                  Qualification Threshold

                </label>

                <span className="font-semibold text-primary">

                  {settings.qualificationThreshold}%

                </span>

              </div>

              <input

                type="range"

                min="50"

                max="100"

                value={settings.qualificationThreshold}

                onChange={handleThresholdChange}

                className="w-full"

              />

              <p className="mt-2 text-sm text-muted-foreground">

                Leads scoring above this value will
                be classified as qualified.

              </p>

            </div>

            {/* Property Recommendations */}

            <div className="flex items-center justify-between rounded-xl border p-4">

              <div>

                <h3 className="font-medium">

                  Enable Property Recommendations

                </h3>

                <p className="text-sm text-muted-foreground">

                  Allow AI to recommend suitable
                  properties to buyers.

                </p>

              </div>

              <button

                onClick={() =>
                  handleToggle(
                    "propertyRecommendations"
                  )
                }

                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  settings.propertyRecommendations
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}

              >

                {settings.propertyRecommendations
                  ? "Enabled"
                  : "Disabled"}

              </button>

            </div>

            {/* Auto Assign */}

            <div className="flex items-center justify-between rounded-xl border p-4">

              <div>

                <h3 className="font-medium">

                  Auto Assign Leads

                </h3>

                <p className="text-sm text-muted-foreground">

                  Automatically assign incoming
                  leads to available agents.

                </p>

              </div>

              <button

                onClick={() =>
                  handleToggle(
                    "autoAssignLeads"
                  )
                }

                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  settings.autoAssignLeads
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}

              >

                {settings.autoAssignLeads
                  ? "Enabled"
                  : "Disabled"}

              </button>

            </div>

          </div>

        </section>

        {/* ======================================================
            NOTIFICATIONS
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-8">

          <div className="mb-8 flex items-center gap-3">

            <Bell className="text-primary" />

            <h2 className="text-2xl font-semibold">

              Notifications

            </h2>

          </div>

          <div className="space-y-6">

            {/* Email */}

            <div className="flex items-center justify-between rounded-xl border p-4">

              <div>

                <h3 className="font-medium">

                  Email Notifications

                </h3>

                <p className="text-sm text-muted-foreground">

                  Receive platform updates by
                  email.

                </p>

              </div>

              <button

                onClick={() =>
                  handleToggle(
                    "emailNotifications"
                  )
                }

                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  settings.emailNotifications
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}

              >

                {settings.emailNotifications
                  ? "Enabled"
                  : "Disabled"}

              </button>

            </div>

            {/* SMS */}

            <div className="flex items-center justify-between rounded-xl border p-4">

              <div>

                <h3 className="font-medium">

                  SMS Notifications

                </h3>

                <p className="text-sm text-muted-foreground">

                  Send important updates via SMS.

                </p>

              </div>

              <button

                onClick={() =>
                  handleToggle(
                    "smsNotifications"
                  )
                }

                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  settings.smsNotifications
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}

              >

                {settings.smsNotifications
                  ? "Enabled"
                  : "Disabled"}

              </button>

            </div>

            {/* WhatsApp */}

            <div className="flex items-center justify-between rounded-xl border p-4">

              <div>

                <h3 className="font-medium">

                  WhatsApp Notifications

                </h3>

                <p className="text-sm text-muted-foreground">

                  Deliver customer alerts through
                  WhatsApp.

                </p>

              </div>

              <button

                onClick={() =>
                  handleToggle(
                    "whatsappNotifications"
                  )
                }

                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  settings.whatsappNotifications
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}

              >

                {settings.whatsappNotifications
                  ? "Enabled"
                  : "Disabled"}

              </button>

            </div>

          </div>

        </section>

        {/* ======================================================
            SECURITY
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-8">

          <div className="mb-8 flex items-center gap-3">

            <Shield className="text-primary" />

            <h2 className="text-2xl font-semibold">

              Security

            </h2>

          </div>

          <div className="space-y-6">

            {/* Two Factor */}

            <div className="flex items-center justify-between rounded-xl border p-4">

              <div>

                <h3 className="font-medium">

                  Two-Factor Authentication

                </h3>

                <p className="text-sm text-muted-foreground">

                  Require administrators to verify
                  sign in using a second factor.

                </p>

              </div>

              <button

                onClick={() =>
                  handleToggle(
                    "twoFactorAuthentication"
                  )
                }

                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  settings.twoFactorAuthentication
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}

              >

                {settings.twoFactorAuthentication
                  ? "Enabled"
                  : "Disabled"}

              </button>

            </div>

            {/* Session Timeout */}

            <div>

              <label className="mb-2 block text-sm font-medium">

                Session Timeout

              </label>

              <select

                name="sessionTimeout"

                value={settings.sessionTimeout}

                onChange={handleChange}

                className="w-full rounded-lg border bg-background px-4 py-3"

              >

                <option>

                  30 Minutes

                </option>

                <option>

                  1 Hour

                </option>

                <option>

                  4 Hours

                </option>

                <option>

                  8 Hours

                </option>

              </select>

            </div>

            {/* Maintenance */}

            <div className="flex items-center justify-between rounded-xl border p-4">

              <div>

                <h3 className="font-medium text-red-500">

                  Maintenance Mode

                </h3>

                <p className="text-sm text-muted-foreground">

                  Restrict platform access while
                  performing maintenance.

                </p>

              </div>

              <button

                onClick={() =>
                  handleToggle(
                    "maintenanceMode"
                  )
                }

                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  settings.maintenanceMode
                    ? "bg-red-600 text-white"
                    : "bg-muted"
                }`}

              >

                {settings.maintenanceMode
                  ? "Enabled"
                  : "Disabled"}

              </button>

            </div>

          </div>

        </section>

      </div>

      {/* ======================================================
          SAVE SETTINGS
      ====================================================== */}

      <div className="flex justify-end">

        <button

          onClick={handleSave}

          disabled={saving}

          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-primary
            px-6
            py-3
            font-semibold
            text-primary-foreground
            transition
            hover:opacity-90
            disabled:cursor-not-allowed
            disabled:opacity-60
          "

        >

          <Save size={18} />

          {saving

            ? "Saving..."

            : "Save Settings"}

        </button>

      </div>

    </section>

  );

};

export default AdminSettings;