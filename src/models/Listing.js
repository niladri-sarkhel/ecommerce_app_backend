import mongoose from "mongoose";
import {
  pricingSchema,
  inventorySchema,
  shippingSchema,
  statusSchema,
} from "#schemas";

const listingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    pricing: {
      type: pricingSchema,
      required: true,
    },
    inventory: {
      type: inventorySchema,
      required: true,
    },
    shipping: {
      type: shippingSchema,
      required: true,
    },
    status: {
      type: statusSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "listings",
  },
);

// Compound indexing to guarantee a single seller can't list the exact same product twice
listingSchema.index({ sellerId: 1, productId: 1 }, { unique: true });

listingSchema.index({
  productId: 1,
  "status.state": 1,
  "pricing.sellingPrice": 1,
});

export const Listing = mongoose.model("Listing", listingSchema);
