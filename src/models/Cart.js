import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1."],
      default: 1,
    },
  },
  { _id: false }, // No separate ID needed for sub-documents in a cart
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Guarantees exactly one active cart instance per user account
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    collection: "carts",
  },
);

export const Cart = mongoose.model("Cart", cartSchema);
