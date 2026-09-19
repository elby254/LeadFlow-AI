/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles Property Price History.
 *
 * Used By
 * ----------------------------------------------------------
 * • Admin Dashboard
 * • Agent Dashboard
 * • Property Details
 * • Analytics
 *
 * NOTE
 * ----------------------------------------------------------
 * Price history is created automatically by
 * propertyController.js whenever a property's
 * price changes.
 *
 * ==========================================================
 */

import express from "express";

import {
  getPropertyPriceHistory,
  getLatestPriceChange,
  getPriceStatistics,
  deletePriceHistoryRecord,
} from "../controllers/propertyPriceHistoryController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  authenticatedUser,
  allowRoles,
} from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
==========================================================
AUTHENTICATION
==========================================================
*/

router.use(protect);
router.use(authenticatedUser);

/*
==========================================================
GET PROPERTY PRICE HISTORY

GET /api/properties/:propertyId/price-history
==========================================================
*/

router.get(
  "/properties/:propertyId/price-history",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getPropertyPriceHistory
);

/*
==========================================================
GET LATEST PRICE CHANGE

GET /api/properties/:propertyId/latest-price-change
==========================================================
*/

router.get(
  "/properties/:propertyId/latest-price-change",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getLatestPriceChange
);

/*
==========================================================
GET PRICE STATISTICS

GET /api/properties/:propertyId/price-statistics
==========================================================
*/

router.get(
  "/properties/:propertyId/price-statistics",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  getPriceStatistics
);

/*
==========================================================
DELETE PRICE HISTORY RECORD

DELETE /api/property-price-history/:historyId

Administrative cleanup only.
==========================================================
*/

router.delete(
  "/property-price-history/:historyId",
  allowRoles([
    "admin",
  ]),
  deletePriceHistoryRecord
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

GET    /api/properties/:propertyId/price-history
       • Retrieve complete property price history

GET    /api/properties/:propertyId/latest-price-change
       • Retrieve latest recorded price change

GET    /api/properties/:propertyId/price-statistics
       • Price analytics
       • Highest price
       • Lowest price
       • Current price
       • Total increases
       • Total decreases

DELETE /api/property-price-history/:historyId
       • Administrative cleanup of incorrect
         history records

==========================================================
*/

export default router;