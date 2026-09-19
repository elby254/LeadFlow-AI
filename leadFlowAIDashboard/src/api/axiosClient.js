// ==========================================================
//
// Used throughout the LeadFlow AI frontend.
//
// Responsibilities:
// • Central API base URL
// • JWT authentication
// • Response debugging
//
// IMPORTANT:
// Do NOT set a global Content-Type.
//
// Axios must be allowed to automatically determine the
// Content-Type for each request.
//
// JSON requests:
//   application/json
//
// FormData requests:
//   multipart/form-data; boundary=...
//
// This is required for Multer file uploads.
// ==========================================================

import axios from "axios";

/* ==========================================================
   AXIOS INSTANCE
========================================================== */

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

/* ==========================================================
   REQUEST INTERCEPTOR
   ----------------------------------------------------------
   Attach JWT token to every authenticated request.
========================================================== */

axiosClient.interceptors.request.use(
  (config) => {

    const auth = JSON.parse(
      localStorage.getItem(
        "leadflowai_auth"
      ) || "{}"
    );

    const token = auth.token;

    if (token) {

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    /* ======================================================
       DEVELOPMENT DEBUGGING
       ------------------------------------------------------
       Helps verify whether this is a FormData request.
    ====================================================== */

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {

      console.log(
        "AXIOS CLIENT - FormData request detected"
      );

      console.log(
        "AXIOS CLIENT - URL:",
        config.url
      );

      console.log(
        "AXIOS CLIENT - Method:",
        config.method
      );

      for (
        const [key, value]
        of config.data.entries()
      ) {

        if (
          typeof File !== "undefined" &&
          value instanceof File
        ) {

          console.log(
            `AXIOS CLIENT - ${key}: File`,
            {
              name: value.name,
              type: value.type,
              size: value.size,
            }
          );

        } else {

          console.log(
            `AXIOS CLIENT - ${key}:`,
            value
          );

        }

      }

    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/* ==========================================================
   RESPONSE INTERCEPTOR
========================================================== */

axiosClient.interceptors.response.use(

  (response) => {

    return response;

  },

  (error) => {

    console.error(
      "API ERROR:",
      error?.response?.status,
      error?.response?.data
    );

    return Promise.reject(error);

  }

);

/* ==========================================================
   EXPORT
========================================================== */

export default axiosClient;