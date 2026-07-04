import mongoose from "mongoose";
import { addressSchema } from "../schemas/common/address.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Automatically indexes and ensures uniqueness
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
      index: true, // Indexed for quick authorization and dashboard filtering
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    shippingAddresses: {
      type: [addressSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Virtual to get full name easily in your application
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const User = mongoose.model("User", userSchema);
