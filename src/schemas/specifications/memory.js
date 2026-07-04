// src/schemas/product/specifications/memory.schema.js

import mongoose from "mongoose";

export const memorySchema = new mongoose.Schema(
  {
    ramMb: Number,

    storageOptionsMb: {
      type: [Number],
      default: [],
    },

    expandable: {
      supported: {
        type: Boolean,
        default: false,
      },

      // Crucial Fix: Wrap the literal 'type' field so Mongoose handles it as a string attribute
      type: {
        type: String,
        default: null,
      },

      maxMb: Number,

      dedicatedSlot: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    _id: false,
  },
);
