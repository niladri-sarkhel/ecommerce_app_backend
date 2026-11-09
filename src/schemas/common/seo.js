import mongoose from "mongoose";

export const seoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, trim: true, maxlength: 70, default: "" },
    metaDescription: { type: String, trim: true, maxlength: 160, default: "" },
    keywords: [{ type: String, trim: true }],
  },
  { _id: false },
);
