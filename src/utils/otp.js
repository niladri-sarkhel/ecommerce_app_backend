// utils/generate-otp.js

import crypto from "node:crypto";

export const generateOTP = ({ length = 6, asString = true } = {}) => {
  if (!Number.isInteger(length) || length < 4 || length > 10) {
    throw new RangeError("OTP length must be an integer between 4 and 10.");
  }

  const min = 10 ** (length - 1);
  const max = 10 ** length;

  const otp = crypto.randomInt(min, max);

  return asString ? String(otp) : otp;
};
