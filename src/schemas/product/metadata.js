// src/schemas/product/metadata.schema.js

import mongoose from "mongoose";

export const metadataSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
    },

    importedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);
