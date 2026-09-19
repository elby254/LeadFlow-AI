import express from "express";
import { getAdminDashboard } from "../controllers/adminDashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

import {
    authenticatedUser,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authenticatedUser,
  getAdminDashboard
);

export default router;