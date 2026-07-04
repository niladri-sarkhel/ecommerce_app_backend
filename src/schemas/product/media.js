// src/schemas/product/media.schema.js

import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "thumbnail",
        "front",
        "back",
        "left",
        "right",
        "top",
        "bottom",
        "gallery",
      ],
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

export const mediaSchema = new mongoose.Schema(
  {
    images: {
      type: [imageSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

export default mediaSchema;
