import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Clean fix: Enforces uniqueness inline
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true, // Clean fix: Enforces uniqueness inline
    },
    logo: {
      type: String,
      trim: true,
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "brands",
  },
);

export const Brand = mongoose.model("Brand", brandSchema);
