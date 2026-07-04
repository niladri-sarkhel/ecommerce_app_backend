// src/schemas/product/specifications/battery.schema.js

import mongoose from "mongoose";

export const batterySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
    },

    capacityMah: {
      type: Number,
      min: 0,
    },

    energyWh: {
      type: Number,
      min: 0,
    },

    removable: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);
