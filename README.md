yo, i am back, lets write some code again about this little project, 

import mongoose from "mongoose";

import { addressSchema } from "../schemas/common/address.js";



const userSchema = new mongoose.Schema(

  {

    firstName: {

      type: String,

      required: true,

      trim: true,

    },

    lastName: {

      type: String,

      required: true,

      trim: true,

    },

    email: {

      type: String,

      required: true,

      unique: true, // Automatically indexes and ensures uniqueness

      lowercase: true,

      trim: true,

    },

    passwordHash: {

      type: String,

      required: true,

    },

    role: {

      type: String,

      enum: ["customer", "seller", "admin"],

      default: "customer",

      index: true, // Indexed for quick authorization and dashboard filtering

    },

    phoneNumber: {

      type: String,

      trim: true,

      default: null,

    },

    shippingAddresses: {

      type: [addressSchema],

      default: [],

    },

    isActive: {

      type: Boolean,

      default: true,

      index: true,

    },

  },

  {

    timestamps: true,

    collection: "users",

  },

);



// Virtual to get full name easily in your application

userSchema.virtual("fullName").get(function () {

  return `${this.firstName} ${this.lastName}`;

});



export const User = mongoose.model("User", userSchema);



import mongoose from "mongoose";

import { addressSchema } from "../schemas/common/address.js";



const sellerSchema = new mongoose.Schema(

  {

    userId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true, // One user can only own one merchant store profile

    },

    storeName: {

      type: String,

      required: true,

      unique: true, // Prevents duplicate storefront names

      trim: true,

    },

    slug: {

      type: String,

      required: true,

      unique: true, // Used for routing (e.g., /stores/awesome-phones-inc)

      lowercase: true,

      trim: true,

    },

    businessAddress: {

      type: addressSchema,

      required: true,

    },

    verificationStatus: {

      type: String,

      enum: ["pending", "verified", "suspended"],

      default: "pending",

      index: true, // High performance filtering for public marketplace search

    },

    rating: {

      average: { type: Number, default: 0 },

      count: { type: Number, default: 0 },

    },

  },

  {

    timestamps: true,

    collection: "sellers",

  },

);



export const Seller = mongoose.model("Seller", sellerSchema);



this are the schemas, 

Now here is the thing, there is no separate signup route for seller, the process to create a seller account is stratight forward, first you need to create the user account and then you need to upgrade your account to seller account, and there are separate pages for user and seller : e.g. : amazon.com for user and amazon.business.com for seller, first the seller makes an user account and upgrades it to an seller account, then the user can use the upgraded account mail and password to log into the business website , no need to create a separate seller account



so what would be the routes structure ? 
