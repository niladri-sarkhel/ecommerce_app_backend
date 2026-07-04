// src/schemas/product/specifications/network.schema.js

import mongoose from "mongoose";

const bandSchema = new mongoose.Schema(
  {
    generation: {
      type: String,
      enum: ["2G", "3G", "4G", "5G"],
    },

    band: String,

    frequencyMHz: Number,
  },
  {
    _id: false,
  },
);

const speedSchema = new mongoose.Schema(
  {
    technology: String,

    category: String,

    downloadMbps: Number,

    uploadMbps: Number,
  },
  {
    _id: false,
  },
);

export const networkSchema = new mongoose.Schema(
  {
    technologies: {
      type: [String],
      default: [],
    },

    bands: {
      type: [bandSchema],
      default: [],
    },

    speeds: {
      type: [speedSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);
