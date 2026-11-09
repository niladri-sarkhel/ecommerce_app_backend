// src/schemas/product/specifications/audio.schema.js

import mongoose from "mongoose";

export const audioSchema = new mongoose.Schema(
  {
    loudSpeaker: {
      type: Boolean,
      default: false,
    },

    audioJack: {
      type: Boolean,
      default: false,
    },

    radio: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);
