import mongoose from "mongoose";
import { productSchema } from "#schemas";

// Core Identity Unique Constraints
productSchema.index({ "identity.gtin": 1 }, { unique: true });
productSchema.index({ "identity.sku": 1 }, { unique: true });
productSchema.index({ "identity.slug": 1 }, { unique: true });

// Multi-attribute relational filters
productSchema.index({ "identity.brandId": 1, "catalog.categoryId": 1 });
productSchema.index({ "catalog.status": 1 });

// High-performance search filter index for active, non-deleted entries
productSchema.index(
  { "metadata.isActive": 1, "metadata.isDeleted": 1 },
  { partialFilterExpression: { "metadata.isDeleted": false } },
);

export const Product = mongoose.model("Product", productSchema, "products");
