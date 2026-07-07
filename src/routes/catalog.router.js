import express from "express";
import { CatalogController } from "#controllers";

// Import your authentication & authorization middlewares from your middlewares folder
// import { authenticate, authorizeRoles } from "#middlewares";

const catalogController = new CatalogController();
export const catalogRouter = express.Router();

// 🔒 FORCE AUTHENTICATION: No public access to raw Catalog APIs.
// catalogRouter.use(authenticate);

// ==========================================
// 🔍 SELLER & ADMIN: READ-ONLY CATALOG ENGINES
// ==========================================

// GET /api/v1/catalog/search - Live fuzzy/typeahead suggestions (Sellers & Admins only)
catalogRouter.get(
  "/search",
  // authorizeRoles("seller", "admin"),
  catalogController.getLiveSuggestions,
);

// GET /api/v1/catalog/lookup/:gtin - Normal static lookup by standard GTIN barcode (Sellers & Admins only)
catalogRouter.get(
  "/lookup/:gtin",
  // authorizeRoles("seller", "admin"),
  catalogController.getGtinLookup,
);

// ==========================================
// 🛠️ ADMIN ONLY: MASTER CATALOG WRITES (CRUD)
// ==========================================

// // POST /api/v1/catalog - Add a new standardized global model to the Master Catalog
// catalogRouter.post(
//   "/",
//   authorizeRoles("admin"),
//   catalogController.createCatalogProduct,
// );
//
// // PATCH /api/v1/catalog/:id - Modify standardized specs or metadata for a catalog item
// catalogRouter.patch(
//   "/:id",
//   authorizeRoles("admin"),
//   catalogController.updateCatalogProduct,
// );
//
// // DELETE /api/v1/catalog/:id - Hard or soft delete a global model from the catalog
// catalogRouter.delete(
//   "/:id",
//   authorizeRoles("admin"),
//   catalogController.deleteCatalogProduct,
// );
