import mongoose from "mongoose";

export const moneySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative."],
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: "INR",
    },
  },
  {
    _id: false, // Prevents generating an unnecessary _id for embedded price objects
  },
);
