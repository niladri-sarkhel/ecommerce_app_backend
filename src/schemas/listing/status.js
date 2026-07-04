import mongoose from "mongoose";

export const statusSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      enum: ["active", "inactive", "out_of_stock", "draft", "archived"],
      default: "active",
    },
  },
  {
    _id: false,
  },
);
