// src/schemas/product/specifications/connectivity.schema.js

import mongoose from "mongoose";

export const connectivitySchema = new mongoose.Schema(
  {
    wifi: {
      standards: {
        type: [String],
        default: [],
      },

      wifiDirect: {
        type: Boolean,
        default: false,
      },

      hotspot: {
        type: Boolean,
        default: false,
      },
    },

    bluetooth: {
      version: String,

      profiles: {
        type: [String],
        default: [],
      },
    },

    positioning: {
      supported: {
        type: Boolean,
        default: false,
      },

      systems: {
        type: [String],
        default: [],
      },
    },

    nfc: {
      type: Boolean,
      default: false,
    },

    infrared: {
      type: Boolean,
      default: false,
    },

    usb: {
      connector: String,

      version: String,

      features: {
        type: [String],
        default: [],
      },
    },
  },
  {
    _id: false,
  },
);
