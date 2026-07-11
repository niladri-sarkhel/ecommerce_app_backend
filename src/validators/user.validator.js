import Joi from "joi";

export class UserValidatorClass {
  // Shared schema primitives matching structural datatypes
  _objectIdStr = Joi.string().hex().length(24);
  _emailStr = Joi.string().email().lowercase().trim().required();
  _passwordStr = Joi.string().min(8).max(100).required();
  _otpStr = Joi.string().length(6).pattern(/^\d+$/).required();
  _phoneStr = Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .trim(); // Validates standard E.164 phone formats

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
  });

  verifySignup = Joi.object({
    email: this._emailStr,
    otp: this._otpStr,
  });

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
    phoneNumber: this._phoneStr.allow(null).optional(),
    // shippingAddresses expects an array of validated address records matching your Mongoose array design
    shippingAddresses: Joi.array().items(this._addressObject).optional(),
  }).min(1); // Ensures that the client provides at least one property to drop into the change query

  upgradeToSeller = Joi.object({
    storeName: Joi.string().min(3).max(100).trim().required(),
    businessAddress: this._addressObject.required(),
  });
}

export const UserValidator = new UserValidatorClass();
