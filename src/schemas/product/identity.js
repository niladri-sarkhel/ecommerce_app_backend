// src/schemas/product/identity.schema.js

import mongoose from "mongoose";

export const identitySchema = new mongoose.Schema(
  {
    gtin: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      immutable: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // index: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      immutable: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);
