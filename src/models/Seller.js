import mongoose from "mongoose";
import { addressSchema } from "../schemas/common/address.js";

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One user can only own one merchant store profile
    },
    storeName: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate storefront names
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true, // Used for routing (e.g., /stores/awesome-phones-inc)
      lowercase: true,
      trim: true,
    },
    businessAddress: {
      type: addressSchema,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "suspended"],
      default: "pending",
      index: true, // High performance filtering for public marketplace search
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    collection: "sellers",
  },
);

export const Seller = mongoose.model("Seller", sellerSchema);
