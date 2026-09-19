/**
 * ==========================================================
 * CHANNEL SOURCE MIDDLEWARE
 * ==========================================================
 *
 * Establishes and validates trusted channel metadata.
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * The customer must NEVER be able to provide:
 *
 * req.body.source
 *
 * as the authority for the channel.
 *
 * The channel adapter establishes req.source.
 * This middleware validates it.
 *
 * ==========================================================
 */

const VALID_SOURCES = [
  "whatsapp",
  "sms",
  "website",
  "facebook",
];

/* ==========================================================
   SET CHANNEL SOURCE
========================================================== */

/**
 * Use this only when a route itself knows the trusted source.
 *
 * Example:
 *
 * router.post(
 *   "/website",
 *   setChannelSource("website"),
 *   ...
 * );
 */

export const setChannelSource = (
  source
) => {
  return (
    req,
    res,
    next
  ) => {

    if (!source) {
      return res.status(500).json({
        success: false,
        message:
          "Channel source is not configured",
      });
    }

    if (
      !VALID_SOURCES.includes(
        source
      )
    ) {
      return res.status(500).json({
        success: false,
        message:
          `Invalid channel source: ${source}`,
      });
    }

    req.source = source;

    next();
  };
};

/* ==========================================================
   REQUIRE CHANNEL SOURCE
========================================================== */

export const requireChannelSource = (
  req,
  res,
  next
) => {

  if (!req.source) {
    return res.status(400).json({
      success: false,
      message:
        "Trusted channel source is missing",
    });
  }

  if (
    !VALID_SOURCES.includes(
      req.source
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid trusted channel source",
    });
  }

  next();
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  setChannelSource,
  requireChannelSource,
};