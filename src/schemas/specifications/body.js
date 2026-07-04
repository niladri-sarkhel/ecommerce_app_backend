// src/schemas/product/specifications/body.schema.js

import mongoose from "mongoose";

export const bodySchema = new mongoose.Schema(
  {
    dimensions: {
      heightMm: Number,
      widthMm: Number,
      thicknessMm: Number,
    },

    weight: {
      grams: Number,
      ounces: Number,
    },

    colors: {
      type: [String],
      default: [],
    },

    sim: {
      count: Number,

      types: {
        type: [String],
        default: [],
      },
    },
  },
  {
    _id: false,
  },
);
