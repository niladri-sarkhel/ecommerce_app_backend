// src/schemas/product/specifications/sensor.schema.js

import mongoose from "mongoose";

export const sensorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);
