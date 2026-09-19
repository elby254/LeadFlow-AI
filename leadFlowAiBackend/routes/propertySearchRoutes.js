/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Handles property discovery.
 *
 * Used By
 * ----------------------------------------------------------
 * • Viewer Portal
 * • AI Property Search
 * • Property Listings
 * • Dashboard Search
 * • Saved Searches
 *
 * ==========================================================
 */

import express from "express";

import {
  searchProperties,
  advancedSearch,
  searchByLocation,
  searchByPriceRange,
  searchByPropertyType,
} from "../controllers/propertySearchController.js";

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
GENERAL PROPERTY SEARCH

GET /api/property-search
==========================================================
*/

router.get(
  "/",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  searchProperties
);

/*
==========================================================
ADVANCED SEARCH

GET /api/property-search/advanced
==========================================================
*/

router.get(
  "/advanced",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  advancedSearch
);

/*
==========================================================
SEARCH BY LOCATION

GET /api/property-search/location
==========================================================
*/

router.get(
  "/location",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  searchByLocation
);

/*
==========================================================
SEARCH BY PRICE RANGE

GET /api/property-search/price
==========================================================
*/

router.get(
  "/price",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  searchByPriceRange
);

/*
==========================================================
SEARCH BY PROPERTY TYPE

GET /api/property-search/type
==========================================================
*/

router.get(
  "/type",
  allowRoles([
    "admin",
    "agent",
    "viewer",
  ]),
  searchByPropertyType
);

/*
==========================================================
ENDPOINT SUMMARY
==========================================================

GET /api/property-search
    • General keyword search

GET /api/property-search/advanced
    • Multi-filter property search

GET /api/property-search/location
    • Search by county/city/estate/location

GET /api/property-search/price
    • Search by price range

GET /api/property-search/type
    • Search by property type

==========================================================
*/

export default router;