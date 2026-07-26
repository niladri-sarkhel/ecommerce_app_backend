import express from "express";
import { UserController } from "#controllers";
import { UserValidator } from "#validators";
import { ValidateMiddleware, AuthMiddleware } from "#middlewares";

export const userRouter = express.Router();

// ----------------------------------------------------
// Public Authentication Pipeline (Guarded by Joi Body Rules)
// ----------------------------------------------------

// Step 1: Initiate registration (Dispatches 2FA OTP to Redis + Email)
userRouter.post(
  "/signup/initiate",
  ValidateMiddleware.body(UserValidator.initiateSignup),
  UserController.initiateSignup,
);

// Step 2: Finalize registration (Verifies OTP and commits user to MongoDB)
userRouter.post(
  "/signup/verify",
  ValidateMiddleware.body(UserValidator.verifySignup),
  UserController.verifySignup,
);

// Step 1: Initiate authentication (Validates credentials, sends login OTP)
userRouter.post(
  "/login/initiate",
  ValidateMiddleware.body(UserValidator.loginInitiate),
  UserController.initiateLogin,
);

// Step 2: Finalize authentication (Verifies OTP and issues secure httpOnly role cookie)
userRouter.post(
  "/login/verify",
  ValidateMiddleware.body(UserValidator.loginVerify),
  UserController.verifyLogin,
);

// Step 1: Request account recovery (Dispatches reset OTP code)
userRouter.post(
  "/forgot-password",
  ValidateMiddleware.body(UserValidator.forgotPassword),
  UserController.initiatePasswordReset,
);

// Step 2: Conclude account recovery (Validates state and rewrites passwordHash)
userRouter.post(
  "/reset-password",
  ValidateMiddleware.body(UserValidator.resetPassword),
  UserController.completePasswordReset,
);

// ----------------------------------------------------
// Protected User Operations (Requires Active Role Whitelist Session)
// ----------------------------------------------------

// Terminate session (Accessible to any authenticated user tier)
userRouter.post(
  "/logout",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  UserController.logout,
);

// Intercept profile updates (Validates changing parameters)
userRouter.patch(
  "/account/change-password",
  AuthMiddleware.authorize(["customer"]),
  ValidateMiddleware.body(UserValidator.changePassword),
  UserController.changePassword,
);

userRouter.post(
  "/account/upgrade-to-seller",
  AuthMiddleware.authorize(["customer"]),
  ValidateMiddleware.body(UserValidator.upgradeToSeller), // We will add this Joi schema next
  UserController.upgradeAccountToSeller, // We will add this controller next
);

// Deactivate account profile (Soft-delete status execution)
userRouter.delete(
  "/account",
  AuthMiddleware.authorize(["customer"]),
  UserController.deleteAccount,
);

// Fetch authenticated user profile (Accessible by any active role)
userRouter.get(
  "/account",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  UserController.getProfile,
);
