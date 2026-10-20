import express from "express";

import {
  getAdminDashboard,
} from "../controllers/adminDashboardController.js";

import {
  getDeliveryReconciliationQueue,
} from "../controllers/deliveryReconciliationController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  adminOnly,
  authenticatedUser,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

// Existing dashboard route — preserved.
router.get(
  "/dashboard",
  protect,
  authenticatedUser,
  getAdminDashboard
);

// Read-only delivery reconciliation queue.
// Organization scope is established by adminOnly.
router.get(
  "/delivery/reconciliation",
  protect,
  adminOnly,
  getDeliveryReconciliationQueue
);

export default router;
