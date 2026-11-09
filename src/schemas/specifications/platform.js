// src/schemas/product/specifications/platform.schema.js

import mongoose from "mongoose";

export const platformSchema = new mongoose.Schema(
  {
    operatingSystem: {
      name: String,

      version: String,

      codename: String,
    },

    chipset: {
      manufacturer: String,

      model: String,
    },

    cpu: {
      architecture: String,

      cores: Number,

      clockSpeedGHz: Number,
    },

    gpu: {
      manufacturer: String,

      model: String,
    },
  },
  {
    _id: false,
  },
);
