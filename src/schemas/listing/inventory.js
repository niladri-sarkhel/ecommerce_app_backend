import mongoose from "mongoose";

export const inventorySchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
  },
  {
    _id: false,
  },
);
