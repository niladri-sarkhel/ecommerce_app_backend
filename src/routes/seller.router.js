import express from "express";
import { SellerController } from "#controllers";
import { SellerValidator } from "../validators/seller.validator.js";
import { ValidateMiddleware } from "../middlewares/validate.middleware.js";

const sellerController = new SellerController();
export const sellerRouter = express.Router();

// ----------------------------------------------------
// Public Authentication Pipeline (Guarded by Joi Body Rules)
// ----------------------------------------------------

sellerRouter.post(
  "/signup",
  ValidateMiddleware.body(SellerValidator.signup),
  sellerController.signup,
);

sellerRouter.post(
  "/verify-otp",
  ValidateMiddleware.body(SellerValidator.verifyOtp),
  sellerController.verifyOtp,
);

sellerRouter.post(
  "/login",
  ValidateMiddleware.body(SellerValidator.login),
  sellerController.login,
);

sellerRouter.post("/logout", sellerController.logout);

sellerRouter.post(
  "/forgot-password",
  ValidateMiddleware.body(SellerValidator.forgotPassword),
  sellerController.forgotPassword,
);

sellerRouter.post(
  "/reset-password",
  ValidateMiddleware.body(SellerValidator.resetPassword),
  sellerController.resetPassword,
);

// ----------------------------------------------------
// Protected Merchant Operations (Guarded by Header & Body Rules)
// ----------------------------------------------------

sellerRouter.patch(
  "/account",
  ValidateMiddleware.headers(SellerValidator.accountHeaders),
  ValidateMiddleware.body(SellerValidator.updateAccount),
  sellerController.updateAccount,
);

sellerRouter.delete(
  "/account",
  ValidateMiddleware.headers(SellerValidator.accountHeaders),
  sellerController.deleteAccount,
);
