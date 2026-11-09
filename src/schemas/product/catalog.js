// src/schemas/product/catalog.schema.js

import mongoose from "mongoose";

const releaseSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      min: 1970,
      max: 2100,
    },

    month: {
      type: Number,
      min: 1,
      max: 12,
    },
  },
  {
    _id: false,
  },
);

export const catalogSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    release: {
      announced: releaseSchema,

      released: releaseSchema,
    },

    status: {
      type: String,
      required: true,
      enum: ["coming_soon", "available", "discontinued", "cancelled"],
      lowercase: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);
