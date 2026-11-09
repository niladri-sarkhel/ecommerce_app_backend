import mongoose from "mongoose";
import { addressSchema, moneySchema } from "#schemas";

const orderItemSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true, // Crucial index for seller dashboard order processing pipelines
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Historical price snapshot using your moneySchema (amount + currency)
    priceAtPurchase: {
      type: moneySchema,
      required: true,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Indexed so customers can instantly load their order history page
    },
    items: {
      type: [orderItemSchema],
      validate: [
        (v) => v.length > 0,
        "An order must contain at least one item.",
      ],
    },
    totalAmount: {
      type: moneySchema,
      required: true,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
      index: true,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "orders",
  },
);

export const Order = mongoose.model("Order", orderSchema);
