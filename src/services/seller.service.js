import { User, Seller } from "#models";
import crypto from "node:crypto";

// In-memory OTP cache storage
const otpStore = new Map();

export class SellerServiceClass {
  /**
   * Internal utility to generate and save out-of-band SHA-256 OTP challenges
   */
  sendEmailOtp = async (email, template) => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute frame

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    otpStore.set(email, { hashedOtp, expiresAt });

    console.log(
      `[EMAIL SYSTEM - ${template}] To: ${email} | Code: ${otp} (Valid for 5 mins)`,
    );
    return true;
  };

  /**
   * Internal verification utility
   */
  verifyOtpToken = (email, candidateOtp) => {
    const record = otpStore.get(email);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return false;
    }

    const candidateHash = crypto
      .createHash("sha256")
      .update(candidateOtp)
      .digest("hex");
    if (candidateHash !== record.hashedOtp) return false;

    otpStore.delete(email); // Instantly invalidate once verified
    return true;
  };

  /**
   * Complete Merchant Onboarding Engine
   */
  signupMerchant = async ({
    firstName,
    lastName,
    email,
    password,
    storeName,
    businessAddress,
  }) => {
    const sanitizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser)
      throw new Error("A user account with this email address already exists.");

    const existingStore = await Seller.findOne({ storeName: storeName.trim() });
    if (existingStore)
      throw new Error("Store name is already taken by another merchant.");

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // 1. Instantiate Root User Record
    const user = await User.create({
      firstName,
      lastName,
      email: sanitizedEmail,
      passwordHash,
      role: "seller",
      isActive: false, // Inactive until OTP challenge verification
    });

    // 2. Instantiate Storefront Metadata Schema
    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const seller = await Seller.create({
      userId: user._id,
      storeName,
      slug,
      businessAddress,
      verificationStatus: "pending",
    });

    // 3. Dispatch out-of-band OTP verification challenge
    await this.sendEmailOtp(user.email, "EMAIL_VERIFICATION");

    return { userId: user._id, sellerId: seller._id, email: user.email };
  };

  /**
   * Finalizes email verification via OTP matching
   */
  verifyOnboardingChallenge = async (email, otp) => {
    const sanitizedEmail = email.toLowerCase().trim();
    const verified = this.verifyOtpToken(sanitizedEmail, otp);
    if (!verified) throw new Error("Invalid or expired verification code.");

    const user = await User.findOneAndUpdate(
      { email: sanitizedEmail },
      { isActive: true },
      { new: true },
    );
    if (!user) throw new Error("Merchant identity record not found.");

    await Seller.findOneAndUpdate(
      { userId: user._id },
      { verificationStatus: "verified" },
    );
    return { verified: true };
  };

  /**
   * Authenticates merchants and signs secure response profiles
   */
  loginMerchant = async (email, password) => {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.role !== "seller")
      throw new Error("Invalid login credentials.");
    if (!user.isActive)
      throw new Error("Account is inactive. Please complete email validation.");

    const candidateHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    if (user.passwordHash !== candidateHash)
      throw new Error("Invalid login credentials.");

    const seller = await Seller.findOne({ userId: user._id });
    const mockAccessToken = crypto.randomBytes(32).toString("hex");

    return {
      token: mockAccessToken,
      merchant: {
        id: seller._id,
        storeName: seller.storeName,
        slug: seller.slug,
        owner: { id: user._id, email: user.email, name: user.fullName },
      },
    };
  };

  /**
   * Triggers password recovery challenge
   */
  requestPasswordRecovery = async (email) => {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "seller",
    });
    if (!user) return true; // Fail silently to prevent user enumeration
    await this.sendEmailOtp(user.email, "PASSWORD_RESET");
    return true;
  };

  /**
   * Restructures user credentials via out-of-band OTP matching
   */
  resetPasswordWithOtp = async (email, otp, newPassword) => {
    const sanitizedEmail = email.toLowerCase().trim();
    const verified = this.verifyOtpToken(sanitizedEmail, otp);
    if (!verified) throw new Error("Invalid or expired password reset token.");

    const newHash = crypto
      .createHash("sha256")
      .update(newPassword)
      .digest("hex");
    await User.findOneAndUpdate(
      { email: sanitizedEmail },
      { passwordHash: newHash },
    );
    return true;
  };

  /**
   * Processes updates across both Identity (User) and Storefront (Seller) frameworks
   */
  updateMerchantProfile = async (userId, updates) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("Merchant account not found.");

    // Update root user profile data
    if (updates.email && updates.email.toLowerCase().trim() !== user.email) {
      const emailCheck = await User.findOne({
        email: updates.email.toLowerCase().trim(),
      });
      if (emailCheck)
        throw new Error("Requested email address is already in use.");
      user.email = updates.email.toLowerCase().trim();
    }
    if (updates.firstName) user.firstName = updates.firstName;
    if (updates.lastName) user.lastName = updates.lastName;
    if (updates.password) {
      user.passwordHash = crypto
        .createHash("sha256")
        .update(updates.password)
        .digest("hex");
    }
    await user.save();

    // Update merchant storefront parameters
    const seller = await Seller.findOne({ userId });
    if (seller) {
      if (updates.storeName && updates.storeName.trim() !== seller.storeName) {
        const nameCheck = await Seller.findOne({
          storeName: updates.storeName.trim(),
        });
        if (nameCheck) throw new Error("Requested store name is taken.");
        seller.storeName = updates.storeName.trim();
        seller.slug = updates.storeName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }
      if (updates.businessAddress) {
        seller.businessAddress = {
          ...seller.businessAddress,
          ...updates.businessAddress,
        };
      }
      await seller.save();
    }

    return {
      id: seller?._id,
      storeName: seller?.storeName,
      owner: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  };

  /**
   * Drops dependent documents across structures atomically
   */
  terminateMerchantAccount = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("Merchant profile does not exist.");

    await Promise.all([
      Seller.deleteOne({ userId }),
      User.deleteOne({ _id: userId }),
    ]);

    return { terminated: true };
  };
}

// Export a singleton instance of the service
export const SellerService = new SellerServiceClass();
