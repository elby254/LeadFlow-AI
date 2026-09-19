/**
 * ==========================================================
 * Allows users to configure how they receive CRM
 * notifications.
 *
 * Supports
 * --------
 * • Email notifications
 * • SMS notifications
 * • WhatsApp notifications
 * • Browser notifications
 * • New Lead Alerts
 * • Follow-up Reminders
 * • AI Qualification Alerts
 * • Daily Reports
 *
 * Backend
 * -------
 * GET  /settings/notifications
 * PUT  /settings/notifications
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {
  Bell,
  Mail,
  Smartphone,
  MessageCircle,
  Monitor,
  Save,
} from "lucide-react";

import settingsService from "../../services/settingsService";

const NotificationSettings = () => {

  const [settings, setSettings] = useState({

    email: true,

    sms: false,

    whatsapp: true,

    browser: true,

    newLeadAlerts: true,

    followUpReminders: true,

    aiQualificationAlerts: true,

    dailyReports: false,

  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {

    loadSettings();

  }, []);

  const loadSettings = async () => {

    try {

      setLoading(true);

      const response =
        await settingsService.getNotificationSettings();

      if (response) {

        setSettings(response);

      }

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  const handleToggle = (field) => {

    setSettings((prev) => ({

      ...prev,

      [field]: !prev[field],

    }));

  };

  const handleSave = async () => {

    try {

      setSaving(true);

      await settingsService.updateNotificationSettings(
        settings
      );

      setMessage("Notification settings updated.");

      setTimeout(() => {

        setMessage("");

      }, 2500);

    } catch (error) {

      console.error(error);

    } finally {

      setSaving(false);

    }

  };

  if (loading) {

    return (

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">

        Loading notification settings...

      </div>

    );

  }

  const Toggle = ({ label, value, field, icon }) => (

    <div
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-slate-800
        bg-slate-950
        p-5
      "
    >

      <div className="flex items-center gap-4">

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-cyan-500/10
            text-cyan-400
          "
        >

          {icon}

        </div>

        <span className="font-medium text-white">

          {label}

        </span>

      </div>

      <button

        onClick={() => handleToggle(field)}

        className={`
          relative
          h-7
          w-14
          rounded-full
          transition

          ${value
            ? "bg-cyan-500"
            : "bg-slate-700"}
        `}
      >

        <span
          className={`
            absolute
            top-1
            h-5
            w-5
            rounded-full
            bg-white
            transition

            ${value
              ? "left-8"
              : "left-1"}
          `}
        />

      </button>

    </div>

  );

  return (

    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-8
      "
    >

      <div className="mb-8">

        <div className="flex items-center gap-3">

          <Bell className="text-cyan-400" />

          <h2 className="text-2xl font-bold text-white">

            Notification Settings

          </h2>

        </div>

        <p className="mt-3 text-slate-400">

          Configure how LeadFlow AI communicates
          important CRM events.

        </p>

      </div>

      <div className="space-y-4">

        <Toggle

          label="Email Notifications"

          field="email"

          value={settings.email}

          icon={<Mail size={20} />}

        />

        <Toggle

          label="SMS Notifications"

          field="sms"

          value={settings.sms}

          icon={<Smartphone size={20} />}

        />

        <Toggle

          label="WhatsApp Notifications"

          field="whatsapp"

          value={settings.whatsapp}

          icon={<MessageCircle size={20} />}

        />

        <Toggle

          label="Browser Notifications"

          field="browser"

          value={settings.browser}

          icon={<Monitor size={20} />}

        />

        <Toggle

          label="New Lead Alerts"

          field="newLeadAlerts"

          value={settings.newLeadAlerts}

          icon={<Bell size={20} />}

        />

        <Toggle

          label="Follow-up Reminders"

          field="followUpReminders"

          value={settings.followUpReminders}

          icon={<Bell size={20} />}

        />

        <Toggle

          label="AI Qualification Alerts"

          field="aiQualificationAlerts"

          value={settings.aiQualificationAlerts}

          icon={<Bell size={20} />}

        />

        <Toggle

          label="Daily Business Reports"

          field="dailyReports"

          value={settings.dailyReports}

          icon={<Mail size={20} />}

        />

      </div>

      {message && (

        <div
          className="
            mt-6
            rounded-xl
            border
            border-emerald-500/30
            bg-emerald-500/10
            p-4
            text-emerald-400
          "
        >

          {message}

        </div>

      )}

      <div className="mt-8 flex justify-end">

        <button

          onClick={handleSave}

          disabled={saving}

          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-cyan-500
            px-6
            py-3
            font-semibold
            text-slate-950
            transition
            hover:bg-cyan-400
            disabled:opacity-60
          "
        >

          <Save size={18} />

          {saving ? "Saving..." : "Save Settings"}

        </button>

      </div>

    </section>

  );

};

export default NotificationSettings;

