import mongoose from "mongoose";

export const shippingSchema = new mongoose.Schema(
  {
    freeShipping: {
      type: Boolean,
      default: false,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    estimatedDeliveryDays: {
      min: {
        type: Number,
        min: 0,
      },

      max: {
        type: Number,
        min: 0,
      },
    },
  },
  {
    _id: false,
  },
);
