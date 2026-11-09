import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Indexed so a user can see their review history history
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true, // Crucial for aggregating the average score on product detail pages
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true, // Links review to an authentic transactional event
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1 star."],
      max: [5, "Rating cannot exceed 5 stars."],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title is too long."],
      default: "",
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters."],
      default: "",
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "reviews",
  },
);

// Enforce a strict unique compound constraint:
// A single user can only submit exactly ONE review per product item.
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
