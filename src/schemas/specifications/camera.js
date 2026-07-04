// src/schemas/product/specifications/camera.schema.js

import mongoose from "mongoose";

const cameraUnitSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
    },

    resolutionMp: {
      type: Number,
      min: 0,
    },

    aperture: {
      type: Number,
      min: 0,
    },

    autofocus: {
      type: Boolean,
      default: false,
    },

    opticalImageStabilization: {
      type: Boolean,
      default: false,
    },

    focalLengthMm: Number,

    features: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

export const cameraSchema = new mongoose.Schema(
  {
    rear: {
      type: [cameraUnitSchema],
      default: [],
    },

    front: {
      type: [cameraUnitSchema],
      default: [],
    },

    rearVideo: {
      type: [String],
      default: [],
    },

    frontVideo: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);
