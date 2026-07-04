import mongoose from "mongoose";

export const pricingSchema = new mongoose.Schema(
  {
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: "INR",
    },
  },
  {
    _id: false,
  },
);
