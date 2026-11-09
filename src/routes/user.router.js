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

// Step 1: Validate password & send OTP to current email
userRouter.post(
  "/account/email/change-initiate",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.initiateEmailChange),
  UserController.initiateEmailChange,
);

// Step 2: Validate OTP from current email & receive state token
userRouter.post(
  "/account/email/verify-current-otp",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.verifyExistingEmailOtp),
  UserController.verifyExistingEmailOtp,
);

// Step 3: Validate state token & send OTP to new email
userRouter.post(
  "/account/email/request-new-otp",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.requestNewEmailVerification),
  UserController.requestNewEmailVerification,
);

// Step 4: Validate new email OTP & commit update
userRouter.post(
  "/account/email/confirm-update",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.confirmNewEmailUpdate),
  UserController.confirmNewEmailUpdate,
);

// ----------------------------------------------------
// Secure Multi-Step Phone Update Pipeline (Via Email OTP)
// ----------------------------------------------------

// Step 1: Validate current password -> Dispatch OTP to registered email
userRouter.post(
  "/account/phone/change-initiate",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.initiatePhoneChange),
  UserController.initiatePhoneChange,
);

// Step 2: Validate email OTP -> Receive phoneChangeToken
userRouter.post(
  "/account/phone/verify-current-otp",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.verifyExistingPhoneOtp),
  UserController.verifyExistingPhoneOtp,
);

// Step 3: Validate phoneChangeToken + new phone -> Dispatch final confirmation OTP to email
userRouter.post(
  "/account/phone/request-new-otp",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.requestNewPhoneVerification),
  UserController.requestNewPhoneVerification,
);

// Step 4: Validate email OTP -> Update phone number in MongoDB
userRouter.post(
  "/account/phone/confirm-update",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.confirmNewPhoneUpdate),
  UserController.confirmNewPhoneUpdate,
);

// Intercept basic profile updates (firstName, lastName)
userRouter.patch(
  "/account",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.updateProfile),
  UserController.updateProfile,
);

// Step 1: Validate current password -> Send OTP to email
userRouter.post(
  "/account/password/change-initiate",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.initiatePasswordChange),
  UserController.initiatePasswordChange,
);

// Step 2: Validate OTP + new password -> Commit new password
userRouter.post(
  "/account/password/change-confirm",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.confirmPasswordChange),
  UserController.confirmPasswordChange,
);

// ----------------------------------------------------
// Shipping Address Routes
// ----------------------------------------------------

// 1. Create Address
userRouter.post(
  "/account/addresses",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.body(UserValidator.createAddress),
  UserController.addAddress,
);

// 2. Read All Addresses
userRouter.get(
  "/account/addresses",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  UserController.getAddresses,
);

// 3. Update Address
userRouter.patch(
  "/account/addresses/:addressId",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.params(UserValidator.addressParams),
  ValidateMiddleware.body(UserValidator.updateAddress),
  UserController.updateAddress,
);

// 4. Delete Address
userRouter.delete(
  "/account/addresses/:addressId",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.params(UserValidator.addressParams),
  UserController.deleteAddress,
);

// 5. Set Address as Default
userRouter.patch(
  "/account/addresses/:addressId/default",
  AuthMiddleware.authorize(["customer", "seller", "admin"]),
  ValidateMiddleware.params(UserValidator.addressParams),
  UserController.setDefaultAddress,
);
