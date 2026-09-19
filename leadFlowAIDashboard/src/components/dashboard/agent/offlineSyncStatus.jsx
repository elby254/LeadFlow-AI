// Is my data safe? Will my changes sync?
// Displays the current synchronization state
// between local offline storage and the server.
// Moments internet connectivity
// may disappear;
// offlineSync stores updates locally and
// synchronizes them automatically once
// connectivity returns.

import { useNavigate } from "react-router-dom";

const OfflineSyncStatus = () => {
  const navigate = useNavigate();

  const handleViewSyncLogs = () => {
    alert("Sync logs feature coming soon.");
  };

  const handleSyncNow = () => {
    if (!syncData.online) {
      alert(
        "You are currently offline. Pending changes will sync automatically when connectivity is restored."
      );
      return;
    }

    alert("Manual synchronization started.");
  };

  const syncData = {
    online: true,
    pendingUpdates: 3,
    lastSync: "2 minutes ago",
    localLeads: 47,
  };

  const statusStyles = syncData.online
    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
    : "bg-orange-500/15 text-orange-400 border border-orange-500/30";

  const statusText = syncData.online
    ? "Online & Synced"
    : "Offline Mode";

  return (
    <section
      className="
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        shadow-xl
      "
    >
      {/* HEADER */}

      <div
        className="
          border-b
          border-slate-800
          p-6
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              📡 Offline Sync Status
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Monitor synchronization between
              local storage and the cloud.
            </p>
          </div>

          <span
            className={`
              self-start
              rounded-full
              px-4
              py-2
              text-sm
              font-semibold
              ${statusStyles}
            `}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* KPI CARDS */}

      <div
        className="
          grid
          gap-4
          p-6
          md:grid-cols-3
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-700
            bg-slate-800
            p-5
          "
        >
          <p className="text-sm text-slate-400">
            Last Successful Sync
          </p>

          <h3
            className="
              mt-2
              text-xl
              font-bold
              text-white
            "
          >
            {syncData.lastSync}
          </h3>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-700
            bg-slate-800
            p-5
          "
        >
          <p className="text-sm text-slate-400">
            Pending Updates
          </p>

          <h3
            className="
              mt-2
              text-xl
              font-bold
              text-orange-400
            "
          >
            {syncData.pendingUpdates}
          </h3>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-700
            bg-slate-800
            p-5
          "
        >
          <p className="text-sm text-slate-400">
            Cached Leads
          </p>

          <h3
            className="
              mt-2
              text-xl
              font-bold
              text-cyan-400
            "
          >
            {syncData.localLeads}
          </h3>
        </div>
      </div>

      {/* SYSTEM INFO */}

      <div
        className="
          border-t
          border-slate-800
          bg-slate-800/50
          p-6
        "
      >
        <h3
          className="
            text-sm
            font-semibold
            uppercase
            tracking-wider
            text-slate-300
          "
        >
          Sync Information
        </h3>

        <ul
          className="
            mt-4
            space-y-2
            text-sm
            text-slate-400
          "
        >
          <li>
            • Lead updates are stored locally when internet is unavailable.
          </li>

          <li>
            • Synchronization resumes automatically when connectivity returns.
          </li>

          <li>
            • No lead notes, status updates, or follow-up actions are lost.
          </li>

          <li>
            • Service Workers and IndexedDB maintain offline functionality.
          </li>
        </ul>
      </div>

      {/* ACTIONS */}

      <div
        className="
          flex
          flex-wrap
          gap-3
          p-6
        "
      >
        <button
          type="button"
          onClick={handleViewSyncLogs}
          className="
            rounded-xl
            border
            border-slate-700
            bg-slate-800
            px-4
            py-2
            text-sm
            font-medium
            text-slate-300
            transition
            hover:bg-slate-700
          "
        >
          View Sync Logs
        </button>

        <button
          type="button"
          onClick={handleSyncNow}
          className="
            rounded-xl
            bg-cyan-500
            px-4
            py-2
            text-sm
            font-semibold
            text-slate-950
            transition
            hover:bg-cyan-400
          "
        >
          Sync Now
        </button>
      </div>
    </section>
  );
};

export default OfflineSyncStatus;