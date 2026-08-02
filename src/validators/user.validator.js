import Joi from "joi";

export class UserValidatorClass {
  // Shared schema primitives matching structural datatypes
  _objectIdStr = Joi.string().hex().length(24);
  _emailStr = Joi.string().email().lowercase().trim().required();
  _passwordStr = Joi.string().min(8).max(100).required();
  _otpStr = Joi.string().length(6).pattern(/^\d+$/).required();
  _phoneStr = Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .message("Phone number must be in valid E.164 format (e.g. +1234567890)")
    .trim()
    .required();

  // Reusable sub-validator mapping identically to your addressSchema fields
  _addressObject = Joi.object({
    street: Joi.string().min(3).max(150).trim().required(),
    city: Joi.string().min(2).max(100).trim().required(),
    state: Joi.string().min(2).max(100).trim().required(),
    postalCode: Joi.string().min(3).max(20).trim().required(),
    country: Joi.string().min(2).max(100).trim().required(),
  });

  // ==========================================
  // SIGNUP VALIDATION SCHEMAS
  // ==========================================

  initiateSignup = Joi.object({
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    email: this._emailStr,
    password: this._passwordStr,
    phoneNumber: this._phoneStr, // <-- Added required phone validation
  });

  verifySignup = Joi.object({
    email: this._emailStr,
    otp: this._otpStr,
  });

  updateProfile = Joi.object({
    firstName: Joi.string().min(2).max(50).trim().optional(),
    lastName: Joi.string().min(2).max(50).trim().optional(),
  }).min(1); // Ensures client sends at least one field to update

  // ==========================================
  // AUTHENTICATION VALIDATION SCHEMAS
  // ==========================================

  loginInitiate = Joi.object({
    email: this._emailStr,
    password: this._passwordStr,
  });

  loginVerify = Joi.object({
    userId: this._objectIdStr.required(),
    otp: this._otpStr,
  });

  // ==========================================
  // PASSWORD RECOVERY VALIDATION SCHEMAS
  // ==========================================

  forgotPassword = Joi.object({
    email: this._emailStr,
  });

  resetPassword = Joi.object({
    userId: this._objectIdStr.required(),
    otp: this._otpStr,
    newPassword: this._passwordStr,
  });

  changePassword = Joi.object({
    currentPassword: this._passwordStr,
    newPassword: this._passwordStr,
  });

  // ==========================================
  // ACCOUNT UPDATE VALIDATION SCHEMAS
  // ==========================================

  updateAccount = Joi.object({
    firstName: Joi.string().min(2).max(50).trim().optional(),
    lastName: Joi.string().min(2).max(50).trim().optional(),
    // phoneNumber: this._phoneStr.allow(null).optional(),
    // shippingAddresses expects an array of validated address records matching your Mongoose array design
    shippingAddresses: Joi.array().items(this._addressObject).optional(),
  }).min(1); // Ensures that the client provides at least one property to drop into the change query

  upgradeToSeller = Joi.object({
    storeName: Joi.string().min(3).max(100).trim().required(),
    businessAddress: this._addressObject.required(),
  });

  initiateEmailChange = Joi.object({
    currentPassword: this._passwordStr,
  });

  verifyExistingEmailOtp = Joi.object({
    otp: this._otpStr,
  });

  requestNewEmailVerification = Joi.object({
    emailChangeToken: Joi.string().required(),
    newEmail: this._emailStr,
  });

  confirmNewEmailUpdate = Joi.object({
    emailChangeToken: Joi.string().required(),
    newEmail: this._emailStr,
    otp: this._otpStr,
  });

  // ==========================================
  // PHONE CHANGE VALIDATION SCHEMAS
  // ==========================================

  initiatePhoneChange = Joi.object({
    currentPassword: this._passwordStr,
  });

  verifyExistingPhoneOtp = Joi.object({
    otp: this._otpStr,
  });

  requestNewPhoneVerification = Joi.object({
    phoneChangeToken: Joi.string().required(),
    newPhoneNumber: this._phoneStr,
  });

  confirmNewPhoneUpdate = Joi.object({
    phoneChangeToken: Joi.string().required(),
    newPhoneNumber: this._phoneStr,
    otp: this._otpStr,
  });

  initiatePasswordChange = Joi.object({
    currentPassword: this._passwordStr,
  });

  confirmPasswordChange = Joi.object({
    otp: this._otpStr,
    newPassword: this._passwordStr,
  });
}

export const UserValidator = new UserValidatorClass();
