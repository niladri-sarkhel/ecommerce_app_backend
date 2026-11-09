import mongoose from "mongoose";

export const timestampsSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);
