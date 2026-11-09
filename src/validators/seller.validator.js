import Joi from "joi";

export class SellerValidatorClass {
  // Shared schema primitives matching structural datatypes
  _objectIdStr = Joi.string().hex().length(24);
  _emailStr = Joi.string().email().lowercase().trim().required();
  _passwordStr = Joi.string().min(8).max(100).required();
  _otpStr = Joi.string().length(6).pattern(/^\d+$/).required();

  // Reusable sub-validator mapping identically to your addressSchema fields
  _addressObject = Joi.object({
    street: Joi.string().min(3).max(150).trim().required(),
    city: Joi.string().min(2).max(100).trim().required(),
    state: Joi.string().min(2).max(100).trim().required(),
    postalCode: Joi.string().min(3).max(20).trim().required(),
    country: Joi.string().min(2).max(100).trim().required(),
  });

  signup = Joi.object({
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    email: this._emailStr,
    password: this._passwordStr,
    storeName: Joi.string().min(3).max(100).trim().required(), // Corresponds to schema's storeName
    businessAddress: this._addressObject.required(), // Corresponds to schema's businessAddress
  });

  verifyOtp = Joi.object({
    email: this._emailStr,
    otp: this._otpStr,
  });

  login = Joi.object({
    email: this._emailStr,
    password: this._passwordStr,
  });

  forgotPassword = Joi.object({
    email: this._emailStr,
  });

  resetPassword = Joi.object({
    email: this._emailStr,
    otp: this._otpStr,
    newPassword: this._passwordStr,
  });

  updateAccount = Joi.object({
    userId: this._objectIdStr.optional(),
    firstName: Joi.string().min(2).max(50).trim().optional(),
    lastName: Joi.string().min(2).max(50).trim().optional(),
    email: Joi.string().email().lowercase().trim().optional(),
    password: Joi.string().min(8).max(100).optional(),
    storeName: Joi.string().min(3).max(100).trim().optional(),
    // Make address attributes completely optional during patch/partial updates
    businessAddress: this._addressObject
      .keys({
        street: Joi.string().min(3).max(150).trim().optional(),
        city: Joi.string().min(2).max(100).trim().optional(),
        state: Joi.string().min(2).max(100).trim().optional(),
        postalCode: Joi.string().min(3).max(20).trim().optional(),
        country: Joi.string().min(2).max(100).trim().optional(),
      })
      .optional(),
  }).min(1);

  accountHeaders = Joi.object({
    "x-user-id": this._objectIdStr.required(),
  }).unknown(true);
}

export const SellerValidator = new SellerValidatorClass();
