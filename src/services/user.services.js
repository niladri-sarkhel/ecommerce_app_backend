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
    const { email, password, firstName, lastName } = signupData;

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

    const { firstName, lastName, passwordHash, otp } = JSON.parse(cachedData);

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

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError({
        message: "Target user profile reference missing.",
      });
    }

    const isOldPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isOldPasswordMatch) {
      throw new UnauthorizedError({
        message: "Current credential verification parameters failed.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return { success: true };
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
}

export const UserService = new UserServiceClass();
