import {
  listReconciliationRequiredDeliveryJobs,
} from "../services/deliveryJobService.js";

// ==========================================================
// LIST RECONCILIATION-REQUIRED DELIVERY JOBS
// ==========================================================
//
// GET /api/admin/delivery/reconciliation
//
// Read-only administrative endpoint.
//
// Organization scope comes exclusively from authenticated
// middleware. Never trust a client-supplied organizationId.
//
// ==========================================================

export const getDeliveryReconciliationQueue = async (
  req,
  res
) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message: "Organization context is required.",
      });
    }

    const rawLimit = req.query.limit;
    let limit = 50;

    if (rawLimit !== undefined) {
      const parsedLimit = Number(rawLimit);

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "limit must be an integer between 1 and 100.",
        });
      }

      limit = parsedLimit;
    }

    const jobs =
      await listReconciliationRequiredDeliveryJobs({
        organizationId,
        limit,
      });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      limit,
      jobs,
    });
  } catch (error) {
    console.error(
      "[DELIVERY RECONCILIATION] Failed to list jobs:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the delivery reconciliation queue.",
    });
  }
};
