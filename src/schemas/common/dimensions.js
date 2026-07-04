import mongoose from "mongoose";

export const dimensionsSchema = new mongoose.Schema(
  {
    heightMm: { type: Number, default: null, min: 0 },
    widthMm: { type: Number, default: null, min: 0 },
    thicknessMm: { type: Number, default: null, min: 0 },
  },
  { _id: false },
);
