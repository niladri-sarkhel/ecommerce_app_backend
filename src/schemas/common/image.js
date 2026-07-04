import mongoose from "mongoose";

export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["thumbnail", "hero", "gallery", "avatar"],
      default: "gallery",
    },
  },
  { _id: false },
);
