/**
 * ==========================================================
 *
 * Single source of truth for property image URLs.
 *
 * Responsibilities
 * ----------------
 * • Resolve Property.coverImage
 * • Resolve populated coverImage.url
 * • Resolve relative backend upload paths
 * • Preserve absolute URLs
 * • Return null when no usable image exists
 *
 * IMPORTANT
 * ---------
 * Components MUST NOT construct property image URLs.
 *
 * ==========================================================
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/**
 * Remove `/api` from the API URL so static uploads are
 * resolved against:
 *
 * http://localhost:5000/uploads/...
 *
 * rather than:
 *
 * http://localhost:5000/api/uploads/...
 */
const getServerBaseUrl = () => {
  return API_BASE_URL.replace(/\/api\/?$/, "");
};

/**
 * Convert an image path into a browser-ready URL.
 */
const toBrowserImageUrl = (value) => {
  if (!value) {
    return null;
  }

  const url = String(value).trim();

  if (!url) {
    return null;
  }

  /*
   * Already an absolute URL.
   *
   * Examples:
   * http://localhost:5000/uploads/...
   * https://cloudinary.com/...
   */
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  /*
   * Protocol-relative URL.
   *
   * Example:
   * //cdn.example.com/image.jpg
   */
  if (url.startsWith("//")) {
    return `${window.location.protocol}${url}`;
  }

  /*
   * Backend-relative upload path.
   *
   * Example:
   * /uploads/properties/image.jpg
   */
  if (url.startsWith("/")) {
    return `${getServerBaseUrl()}${url}`;
  }

  /*
   * Relative path without leading slash.
   *
   * Example:
   * uploads/properties/image.jpg
   */
  return `${getServerBaseUrl()}/${url}`;
};

/**
 * Resolve the authoritative property cover image.
 */
const getPropertyImageUrl = (property) => {
  if (!property) {
    return null;
  }

  /*
   * ========================================================
   * POPULATED coverImage
   *
   * {
   *   coverImage: {
   *     _id: "...",
   *     url: "/uploads/properties/image.jpg"
   *   }
   * }
   * ========================================================
   */

  if (
    property.coverImage &&
    typeof property.coverImage === "object"
  ) {
    if (property.coverImage.url) {
      return toBrowserImageUrl(
        property.coverImage.url
      );
    }

    /*
     * Some API responses may expose another image URL
     * property.
     */
    if (property.coverImage.imageUrl) {
      return toBrowserImageUrl(
        property.coverImage.imageUrl
      );
    }
  }

  /*
   * ========================================================
   * coverImage as a string
   *
   * {
   *   coverImage: "/uploads/properties/image.jpg"
   * }
   *
   * or:
   *
   * {
   *   coverImage: "https://..."
   * }
   * ========================================================
   */

  if (
    typeof property.coverImage === "string"
  ) {
    return toBrowserImageUrl(
      property.coverImage
    );
  }

  /*
   * ========================================================
   * Direct image URL fallback
   *
   * This supports existing/legacy property responses
   * without making the table responsible for URL logic.
   * ========================================================
   */

  if (property.imageUrl) {
    return toBrowserImageUrl(
      property.imageUrl
    );
  }

  if (property.image) {
    if (
      typeof property.image === "object" &&
      property.image.url
    ) {
      return toBrowserImageUrl(
        property.image.url
      );
    }

    if (
      typeof property.image === "string"
    ) {
      return toBrowserImageUrl(
        property.image
      );
    }
  }

  return null;
};

export {
  getPropertyImageUrl,
};

export default getPropertyImageUrl;