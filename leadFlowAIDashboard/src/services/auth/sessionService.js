/**
 * ==========================================================
 *
 * Manages client-side authentication session.
 *
 * Stores:
 * • JWT Access Token
 * • Refresh Token
 * • Logged-in User
 * • Agency
 * • Permissions
 * • Expiration
 *
 * Supports:
 * • Persistent Login
 * • Offline Login
 * • Session Restore
 * • Session Expiration
 *
 * ==========================================================
 */

const STORAGE_KEY = "leadflowai_session";

/* ==========================================================
   SAVE SESSION
========================================================== */

const saveSession = (session) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(session)
  );
};

/* ==========================================================
   LOAD SESSION
========================================================== */

const loadSession = () => {
  try {
    const session = localStorage.getItem(STORAGE_KEY);

    if (!session) return null;

    return JSON.parse(session);
  } catch (error) {
    console.error("Unable to load session.", error);
    return null;
  }
};

/* ==========================================================
   CLEAR SESSION
========================================================== */

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/* ==========================================================
   TOKEN
========================================================== */

const getToken = () => {
  return loadSession()?.token || null;
};

const getRefreshToken = () => {
  return loadSession()?.refreshToken || null;
};

/* ==========================================================
   USER
========================================================== */

const getUser = () => {
  return loadSession()?.user || null;
};

/* ==========================================================
   ROLE
========================================================== */

const getRole = () => {
  return loadSession()?.user?.role || null;
};

/* ==========================================================
   PERMISSIONS
========================================================== */

const getPermissions = () => {
  return loadSession()?.user?.permissions || [];
};

/* ==========================================================
   AGENCY
========================================================== */

const getAgency = () => {
  return loadSession()?.agency || null;
};

/* ==========================================================
   SESSION EXPIRATION
========================================================== */

const getExpiration = () => {
  return loadSession()?.expiresAt || null;
};

const isExpired = () => {
  const expiresAt = getExpiration();

  if (!expiresAt) return true;

  return Date.now() > expiresAt;
};

/* ==========================================================
   AUTHENTICATION STATUS
========================================================== */

const isAuthenticated = () => {
  const session = loadSession();

  if (!session) return false;

  return !isExpired();
};

/* ==========================================================
   OFFLINE LOGIN
========================================================== */

/**
 * Viewer/Agent/Admin can continue using cached data
 * while offline if a valid session already exists.
 */

const canUseOfflineSession = () => {
  const session = loadSession();

  if (!session) return false;

  return !!session.token;
};

/* ==========================================================
   UPDATE TOKEN
========================================================== */

const updateToken = (newToken, expiresAt) => {
  const session = loadSession();

  if (!session) return;

  session.token = newToken;

  session.expiresAt = expiresAt;

  saveSession(session);
};

/* ==========================================================
   UPDATE USER
========================================================== */

const updateUser = (updates) => {
  const session = loadSession();

  if (!session) return;

  session.user = {
    ...session.user,
    ...updates,
  };

  saveSession(session);
};

/* ==========================================================
   SESSION SUMMARY
========================================================== */

const getSessionSummary = () => {
  const session = loadSession();

  if (!session) return null;

  return {
    authenticated: isAuthenticated(),

    offlineAvailable: canUseOfflineSession(),

    role: session.user?.role,

    agency: session.agency,

    expiresAt: session.expiresAt,
  };
};

/* ==========================================================
   EXPORT
========================================================== */

const sessionService = {
  saveSession,

  loadSession,

  clearSession,

  getToken,

  getRefreshToken,

  getUser,

  getRole,

  getPermissions,

  getAgency,

  getExpiration,

  isExpired,

  isAuthenticated,

  canUseOfflineSession,

  updateToken,

  updateUser,

  getSessionSummary,
};

export default sessionService;