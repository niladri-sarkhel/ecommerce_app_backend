// src/schemas/product/specifications/display.schema.js

import mongoose from "mongoose";

export const displaySchema = new mongoose.Schema(
  {
    technology: {
      type: String,
      trim: true,
    },

    touchscreen: {
      type: Boolean,
      default: true,
    },

    colorDepth: {
      type: String,
      trim: true,
    },

    sizeInches: Number,

    screenToBodyRatio: Number,

    resolution: {
      width: Number,
      height: Number,
    },

    pixelDensityPpi: Number,
  },
  {
    _id: false,
  },
);
