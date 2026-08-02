import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { User, Seller } from "#models"; // Adjust path as needed
import { redis, generateOTP, slugify } from "#utils";
import { MailService } from "#services"; // Adjust path as needed
import { env } from "#config";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
  ExpiredSessionError,
} from "#errors";

export class UserServiceClass {
  _jwtSecret = env.JWT_SECRET;
  _otpTtL = 300; // 5 minutes in seconds

  _getCookieConfig(role) {
    const tokenName = `${role}_token`;
    const options = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    return { tokenName, options };
  }

  // ==========================================
  // SIGNUP WORKFLOW
  // ==========================================

  async initiateSignup(signupData) {
    const { email, password, firstName, lastName, phoneNumber } = signupData;

    // Check if user already exists in persistent storage
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOTP();

    // Cache registration payload in Redis
    const redisKey = `pending:signup:${email.toLowerCase()}`;
    const payload = JSON.stringify({
      firstName,
      lastName,
      email,
      passwordHash,
      otp,
      phoneNumber,
    });
    await redis.setex(redisKey, this._otpTtL, payload);

    // Dispatch OTP via mail infrastructure
    await MailService.sendEmail(
      email,
      otp,
      "Verify Your Registration",
      "Thank you for registering. Please use the following 2FA verification code to finalize creating your account. This code is valid for 5 minutes.",
    );

    return { message: "Verification OTP dispatched to email." };
  }

  async verifySignup(email, submittedOtp) {
    const redisKey = `pending:signup:${email.toLowerCase()}`;
    const cachedData = await redis.get(redisKey);

    if (!cachedData) {
      throw new ExpiredSessionError({
        message: "Verification session expired. Please register again.",
      });
    }

    const { firstName, lastName, passwordHash, otp, phoneNumber } =
      JSON.parse(cachedData);

    if (otp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid verification code provided.",
        errors: ["OTP mismatch"],
      });
    }

    // Persist to MongoDB since authentication succeeded
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phoneNumber,
      passwordHash,
      role: "customer", // Defaults to customer on direct signup
    });

    // Wipe Redis cache record
    await redis.del(redisKey);

    return newUser;
  }

  // ==========================================
  // LOGIN WORKFLOW
  // ==========================================

  async initiateLogin(email, password) {
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });
    if (!user) {
      throw new UnauthorizedError({
        message: "Invalid email or password credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError({
        message: "Invalid email or password credentials.",
      });
    }

    const otp = generateOTP();
    const redisKey = `pending:auth:${user._id}`;

    // Cache OTP challenges tightly under user ID reference
    await redis.setex(redisKey, this._otpTtL, otp);

    await MailService.sendEmail(
      user.email,
      otp,
      "2-Step Verification Login Request",
      "A login attempt was initiated for your profile. Input this security code to verify your session identity.",
    );

    return { userId: user._id, message: "2FA checkpoint reached. Code sent." };
  }

  async verifyLogin(userId, submittedOtp, res) {
    const redisKey = `pending:auth:${userId}`;
    const cachedOtp = await redis.get(redisKey);

    if (!cachedOtp) {
      throw new ExpiredSessionError({
        message: "Login verification session expired. Please re-authenticate.",
      });
    }

    if (cachedOtp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid security verification code.",
        errors: ["OTP mismatch"],
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError({
        message: "Account profile records non-existent.",
      });
    }

    if (!user.isActive) {
      throw new ForbiddenError({
        message: "Account access restrictions active. Contact support.",
      });
    }

    // Issue Token Payload matching AuthMiddleware rules down-stream
    const tokenPayload = { id: user._id, email: user.email, role: user.role };
    const token = jwt.sign(tokenPayload, this._jwtSecret, { expiresIn: "7d" });

    // Dynmically determine identity token names based on system scopes
    const { tokenName, options } = this._getCookieConfig(user.role);
    res.cookie(tokenName, token, options);

    // Clean verification state
    await redis.del(redisKey);

    return { user, tokenName };
  }

  // ==========================================
  // FORGOT / RESET PASSWORD WORKFLOW
  // ==========================================

  async initiatePasswordReset(email) {
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });
    if (!user) {
      // Security abstract: avoid leaking existence mapping, but return safely
      return {
        message: "If the account exists, a reset code has been dispatched.",
      };
    }

    const otp = generateOTP();
    const redisKey = `pending:reset:${user._id}`;
    await redis.setex(redisKey, this._otpTtL, otp);

    await MailService.sendEmail(
      user.email,
      otp,
      "Password Reset Code Verification",
      "We received a request to update your password profile security credentials. Use this authorization code to proceed.",
    );

    return {
      userId: user._id,
      message: "If the account exists, a reset code has been dispatched.",
    };
  }

  async completePasswordReset(userId, submittedOtp, newPassword) {
    const redisKey = `pending:reset:${userId}`;
    const cachedOtp = await redis.get(redisKey);

    if (!cachedOtp) {
      throw new ExpiredSessionError({
        message: "Password authorization pipeline token expired.",
      });
    }

    if (cachedOtp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid password modification token.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { passwordHash },
      { new: true },
    );

    await redis.del(redisKey);
    return {
      success: true,
      message: "Security parameters successfully reset.",
    };
  }

  // ==========================================
  // PROTECTED UTILITY WORKFLOWS
  // ==========================================

  // ==========================================
  // PASSWORD CHANGE WORKFLOW (Via Email OTP)
  // ==========================================

  // Step 1: Verify current password -> Dispatch OTP to registered email
  async initiatePasswordChange(userId, currentPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError({ message: "User profile record missing." });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError({
        message: "Invalid current password provided.",
      });
    }

    const otp = generateOTP();
    const redisKey = `pending:password-change:${userId}`;
    await redis.setex(redisKey, this._otpTtL, otp);

    await MailService.sendEmail(
      user.email,
      otp,
      "Authorize Password Change Request",
      "A request was made to change your account password. Use this verification code to authorize the change. Valid for 5 minutes.",
    );

    return {
      message:
        "Security verification code sent to your registered email address.",
    };
  }

  // Step 2: Verify OTP & update password in MongoDB
  async confirmPasswordChange(userId, submittedOtp, newPassword) {
    const redisKey = `pending:password-change:${userId}`;
    const cachedOtp = await redis.get(redisKey);

    if (!cachedOtp) {
      throw new ExpiredSessionError({
        message: "Password reset session expired. Please request a new code.",
      });
    }

    if (cachedOtp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid verification code provided.",
        errors: ["OTP mismatch"],
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError({ message: "User profile record missing." });
    }

    // Hash new password & save document
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Clear Redis session
    await redis.del(redisKey);

    return { message: "Password updated successfully." };
  }

  async logout(userRole, res) {
    const { tokenName, options } = this._getCookieConfig(userRole);

    res.clearCookie(tokenName, { ...options, maxAge: 0 });
    return { success: true };
  }

  async softDeleteAccount(userId, res, userRole) {
    const user = await User.findByIdAndUpdate(userId, { isActive: false });
    if (!user) {
      throw new NotFoundError({ message: "Target user non-existent." });
    }

    await this.logout(userRole, res);
    return { success: true, message: "Account successfully closed." };
  }

  async upgradeAccountToSeller(userId, upgradeData) {
    const { storeName, businessAddress } = upgradeData;
    const slug = slugify(storeName);

    // 1. Pre-check uniqueness constraints outside the transaction to save resources
    const existingStore = await Seller.findOne({
      $or: [{ storeName }, { slug }],
    });
    if (existingStore) {
      throw new ConflictError({
        message: "Store identity conflict.",
        errors: [
          "A store with this name or slug configuration already exists.",
        ],
      });
    }

    // 2. Start Mongoose session for transactional safety
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 3. Update the User role status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role: "seller" },
        { returnDocument: "after", session },
      );

      if (!updatedUser) {
        throw new NotFoundError({
          message: "User account profile target missing.",
        });
      }

      // 4. Provision the new Seller storefront profile
      const newSeller = await Seller.create(
        [
          {
            userId,
            storeName,
            slug,
            businessAddress,
            verificationStatus: "pending", // Sets to verification baseline stage
          },
        ],
        { session },
      );

      // 5. Commit both operations atomatically
      await session.commitTransaction();
      return {
        user: updatedUser,
        seller: newSeller[0], // Mongoose .create returns an array when passed an array wrapper
      };
    } catch (error) {
      // Abort and roll back all changes if any query collapses
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  getProfile = async (userId) => {
    // Exclude passwordHash from the queried document
    const user = await User.findById(userId).select("-passwordHash").lean();

    if (!user || !user.isActive) {
      throw new NotFoundError({
        message: "User profile not found or inactive.",
      });
    }

    let storeDetails = null;

    // If user has upgraded, include their storefront metadata
    if (user.role === "seller") {
      storeDetails = await Seller.findOne({ userId }).lean();
    }

    return {
      ...user,
      sellerProfile: storeDetails,
    };
  };

  // ==========================================
  // PROFILE UPDATE WORKFLOW
  // ==========================================

  async updateProfile(userId, updateData) {
    const { firstName, lastName } = updateData;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!updatedUser || !updatedUser.isActive) {
      throw new NotFoundError({
        message: "User profile record missing or inactive.",
      });
    }

    return updatedUser;
  }

  async initiateEmailChange(userId, currentPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError({ message: "User profile record missing." });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError({
        message: "Invalid current password provided.",
      });
    }

    const otp = generateOTP();
    const redisKey = `pending:email-change:step1:${userId}`;

    // Cache OTP in Redis for 5 minutes
    await redis.setex(redisKey, this._otpTtL, otp);

    await MailService.sendEmail(
      user.email,
      otp,
      "Authorize Email Change Request",
      "A request was initiated to update your account email. Use this security code to verify ownership of your current email address.",
    );

    return {
      message:
        "Security authorization code sent to your current email address.",
    };
  }

  // Step 2: Verify current email OTP -> issue temporary session authorization token
  async verifyExistingEmailOtp(userId, submittedOtp) {
    const redisKey = `pending:email-change:step1:${userId}`;
    const cachedOtp = await redis.get(redisKey);

    if (!cachedOtp) {
      throw new ExpiredSessionError({
        message:
          "Email verification session expired. Please restart the process.",
      });
    }

    if (cachedOtp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid verification code provided.",
        errors: ["OTP mismatch"],
      });
    }

    // Clear step 1 state
    await redis.del(redisKey);

    // Generate temporary access token for step 3 & 4 (Valid for 10 minutes)
    const emailChangeToken = crypto.randomBytes(32).toString("hex");
    const tokenKey = `pending:email-change:authorized:${userId}`;
    await redis.setex(tokenKey, 600, emailChangeToken);

    return { emailChangeToken };
  }

  // Step 3: Check new email uniqueness & send OTP to target email
  async requestNewEmailVerification(userId, emailChangeToken, newEmail) {
    const tokenKey = `pending:email-change:authorized:${userId}`;
    const storedToken = await redis.get(tokenKey);

    if (!storedToken || storedToken !== emailChangeToken) {
      throw new UnauthorizedError({
        message: "Unauthorized or expired email modification session.",
      });
    }

    // Check if target email is already claimed by another user
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      throw new ConflictError({
        message: "An account with this target email address already exists.",
      });
    }

    const newOtp = generateOTP();
    const redisKey = `pending:email-change:step2:${userId}`;
    const payload = JSON.stringify({
      newEmail: newEmail.toLowerCase(),
      otp: newOtp,
    });

    await redis.setex(redisKey, this._otpTtL, payload);

    await MailService.sendEmail(
      newEmail,
      newOtp,
      "Verify Your New Email Address",
      "Please use this code to confirm and link your new email address to your account.",
    );

    return { message: "Verification code sent to your new email address." };
  }

  // Step 4: Verify new email OTP & commit update to MongoDB
  async confirmNewEmailUpdate(
    userId,
    emailChangeToken,
    newEmail,
    submittedOtp,
  ) {
    const tokenKey = `pending:email-change:authorized:${userId}`;
    const storedToken = await redis.get(tokenKey);

    if (!storedToken || storedToken !== emailChangeToken) {
      throw new UnauthorizedError({
        message: "Unauthorized or expired email modification session.",
      });
    }

    const step2Key = `pending:email-change:step2:${userId}`;
    const cachedData = await redis.get(step2Key);

    if (!cachedData) {
      throw new ExpiredSessionError({
        message:
          "New email verification session expired. Please request a new code.",
      });
    }

    const { newEmail: targetEmail, otp: storedOtp } = JSON.parse(cachedData);

    if (targetEmail !== newEmail.toLowerCase() || storedOtp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid verification details or target email mismatch.",
      });
    }

    // Persist updated email
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email: newEmail.toLowerCase() },
      { new: true },
    ).select("-passwordHash");

    // Clean up Redis keys
    await redis.del([tokenKey, step2Key]);

    return updatedUser;
  }

  async initiatePhoneChange(userId, currentPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError({ message: "User profile record missing." });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError({
        message: "Invalid current password provided.",
      });
    }

    const otp = generateOTP();
    const redisKey = `pending:phone-change:step1:${userId}`;

    // Cache OTP in Redis for 5 minutes
    await redis.setex(redisKey, this._otpTtL, otp);

    // Dispatch OTP to existing registered email address
    await MailService.sendEmail(
      user.email,
      otp,
      "Authorize Phone Number Change Request",
      "A request was initiated to update your account phone number. Use this security authorization code to verify your identity. Valid for 5 minutes.",
    );

    return {
      message:
        "Security authorization code sent to your registered email address.",
    };
  }

  // Step 2: Verify existing email OTP -> issue temporary session authorization token
  async verifyExistingPhoneOtp(userId, submittedOtp) {
    const redisKey = `pending:phone-change:step1:${userId}`;
    const cachedOtp = await redis.get(redisKey);

    if (!cachedOtp) {
      throw new ExpiredSessionError({
        message:
          "Phone verification session expired. Please restart the process.",
      });
    }

    if (cachedOtp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid verification code provided.",
        errors: ["OTP mismatch"],
      });
    }

    // Clear step 1 Redis key
    await redis.del(redisKey);

    // Issue temporary single-use token (10 min TTL)
    const phoneChangeToken = crypto.randomBytes(32).toString("hex");
    const tokenKey = `pending:phone-change:authorized:${userId}`;
    await redis.setex(tokenKey, 600, phoneChangeToken);

    return { phoneChangeToken };
  }

  // Step 3: Check new phone uniqueness & dispatch verification OTP to registered email
  async requestNewPhoneVerification(userId, phoneChangeToken, newPhoneNumber) {
    const tokenKey = `pending:phone-change:authorized:${userId}`;
    const storedToken = await redis.get(tokenKey);

    if (!storedToken || storedToken !== phoneChangeToken) {
      throw new UnauthorizedError({
        message: "Unauthorized or expired phone modification session.",
      });
    }

    // Ensure new phone number isn't registered to another account
    const existingUser = await User.findOne({ phoneNumber: newPhoneNumber });
    if (existingUser) {
      throw new ConflictError({
        message: "This phone number is already registered to another account.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError({ message: "User profile record missing." });
    }

    const newOtp = generateOTP();
    const redisKey = `pending:phone-change:step2:${userId}`;
    const payload = JSON.stringify({
      newPhoneNumber,
      otp: newOtp,
    });

    await redis.setex(redisKey, this._otpTtL, payload);

    // Send secondary confirmation OTP to the user's email
    await MailService.sendEmail(
      user.email,
      newOtp,
      "Confirm New Phone Number Update",
      `Use this verification code to confirm linking ${newPhoneNumber} as your new account phone number. Valid for 5 minutes.`,
    );

    return {
      message: "Confirmation code sent to your registered email address.",
    };
  }

  // Step 4: Verify email OTP & commit new phone number to MongoDB
  async confirmNewPhoneUpdate(
    userId,
    phoneChangeToken,
    newPhoneNumber,
    submittedOtp,
  ) {
    const tokenKey = `pending:phone-change:authorized:${userId}`;
    const storedToken = await redis.get(tokenKey);

    if (!storedToken || storedToken !== phoneChangeToken) {
      throw new UnauthorizedError({
        message: "Unauthorized or expired phone modification session.",
      });
    }

    const step2Key = `pending:phone-change:step2:${userId}`;
    const cachedData = await redis.get(step2Key);

    if (!cachedData) {
      throw new ExpiredSessionError({
        message:
          "New phone verification session expired. Please request a new code.",
      });
    }

    const { newPhoneNumber: targetPhone, otp: storedOtp } =
      JSON.parse(cachedData);

    if (targetPhone !== newPhoneNumber || storedOtp !== submittedOtp) {
      throw new ValidationError({
        message: "Invalid verification code or target phone number mismatch.",
      });
    }

    // Persist update in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { phoneNumber: newPhoneNumber },
      { new: true },
    ).select("-passwordHash");

    // Clean up Redis keys
    await redis.del([tokenKey, step2Key]);

    return updatedUser;
  }
}

export const UserService = new UserServiceClass();
