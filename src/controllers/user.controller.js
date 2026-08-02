import { UserService } from "#services";

export class UserControllerClass {
  // ==========================================
  // SIGNUP CONTROLLERS
  // ==========================================

  initiateSignup = async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, phoneNumber } = req.body;

      const result = await UserService.initiateSignup({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
      });

      return res.status(202).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  verifySignup = async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      const newUser = await UserService.verifySignup(email, otp);

      return res.status(201).json({
        success: true,
        data: {
          message: "Account successfully provisioned.",
          userId: newUser._id,
          email: newUser.email,
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // LOGIN CONTROLLERS
  // ==========================================

  initiateLogin = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const result = await UserService.initiateLogin(email, password);

      return res.status(200).json({
        success: true,
        data: result, // Contains userId and 2FA message
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyLogin = async (req, res, next) => {
    try {
      const { userId, otp } = req.body;

      const { user, tokenName } = await UserService.verifyLogin(
        userId,
        otp,
        res,
      );

      return res.status(200).json({
        success: true,
        data: {
          message: "Authentication handshake successful.",
          profile: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
          sessionCookieName: tokenName,
        },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const updatedUser = await UserService.updateProfile(
        req.user.id,
        req.body,
      );
      return res.status(200).json({
        success: true,
        message: "Profile details updated successfully.",
        data: updatedUser,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // PASSWORD MANAGEMENT CONTROLLERS
  // ==========================================

  initiatePasswordReset = async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await UserService.initiatePasswordReset(email);

      return res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  completePasswordReset = async (req, res, next) => {
    try {
      const { userId, otp, newPassword } = req.body;
      const result = await UserService.completePasswordReset(
        userId,
        otp,
        newPassword,
      );

      return res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const userId = req.user.id; // Set downstream via your AuthMiddleware
      const { currentPassword, newPassword } = req.body;

      const result = await UserService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      return res.status(200).json({
        success: true,
        data: { message: "Credentials successfully synchronized." },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // SESSION & PROFILE LIFECYCLE CONTROLLERS
  // ==========================================

  logout = async (req, res, next) => {
    try {
      const userRole = req.user.role; // Set downstream via your AuthMiddleware

      await UserService.logout(userRole, res);

      return res.status(200).json({
        success: true,
        data: { message: "Session terminated successfully." },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      await UserService.softDeleteAccount(userId, res, userRole);

      return res.status(200).json({
        success: true,
        data: { message: "Profile successfully offboarded." },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  upgradeAccountToSeller = async (req, res, next) => {
    try {
      const userId = req.user.id; // Extracted dynamically from AuthMiddleware.authorize cookie verification
      const { storeName, businessAddress } = req.body;
      console.log(req.user);

      const result = await UserService.upgradeAccountToSeller(userId, {
        storeName,
        businessAddress,
      });

      return res.status(200).json({
        success: true,
        data: {
          message: "Account tier successfully upgraded to Merchant status.",
          profile: {
            id: result.user._id,
            email: result.user.email,
            role: result.user.role,
          },
          store: {
            id: result.seller._id,
            storeName: result.seller.storeName,
            slug: result.seller.slug,
            verificationStatus: result.seller.verificationStatus,
          },
        },
        error: null,
      });
    } catch (error) {
      next(error); // Route errors directly into handleReqErrors middleware
    }
  };

  // Inside class UserControllerClass ...
  getProfile = async (req, res, next) => {
    try {
      const userId = req.user.id; // Extracted from AuthMiddleware token verification
      const profileData = await UserService.getProfile(userId);

      return res.status(200).json({
        success: true,
        data: profileData,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  initiateEmailChange = async (req, res, next) => {
    try {
      const result = await UserService.initiateEmailChange(
        req.user.id,
        req.body.currentPassword,
      );
      return res.status(200).json({ success: true, data: result, error: null });
    } catch (error) {
      next(error);
    }
  };

  verifyExistingEmailOtp = async (req, res, next) => {
    try {
      const result = await UserService.verifyExistingEmailOtp(
        req.user.id,
        req.body.otp,
      );
      return res.status(200).json({
        success: true,
        message: "Current email verified. You may now enter your new email.",
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  requestNewEmailVerification = async (req, res, next) => {
    try {
      const { emailChangeToken, newEmail } = req.body;
      const result = await UserService.requestNewEmailVerification(
        req.user.id,
        emailChangeToken,
        newEmail,
      );
      return res.status(200).json({ success: true, data: result, error: null });
    } catch (error) {
      next(error);
    }
  };

  confirmNewEmailUpdate = async (req, res, next) => {
    try {
      const { emailChangeToken, newEmail, otp } = req.body;
      const updatedUser = await UserService.confirmNewEmailUpdate(
        req.user.id,
        emailChangeToken,
        newEmail,
        otp,
      );
      return res.status(200).json({
        success: true,
        message: "Email address updated successfully.",
        data: updatedUser,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  initiatePhoneChange = async (req, res, next) => {
    try {
      const result = await UserService.initiatePhoneChange(
        req.user.id,
        req.body.currentPassword,
      );
      return res.status(200).json({ success: true, data: result, error: null });
    } catch (error) {
      next(error);
    }
  };

  verifyExistingPhoneOtp = async (req, res, next) => {
    try {
      const result = await UserService.verifyExistingPhoneOtp(
        req.user.id,
        req.body.otp,
      );
      return res.status(200).json({
        success: true,
        message: "Identity verified. You may now enter your new phone number.",
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  requestNewPhoneVerification = async (req, res, next) => {
    try {
      const { phoneChangeToken, newPhoneNumber } = req.body;
      const result = await UserService.requestNewPhoneVerification(
        req.user.id,
        phoneChangeToken,
        newPhoneNumber,
      );
      return res.status(200).json({ success: true, data: result, error: null });
    } catch (error) {
      next(error);
    }
  };

  confirmNewPhoneUpdate = async (req, res, next) => {
    try {
      const { phoneChangeToken, newPhoneNumber, otp } = req.body;
      const updatedUser = await UserService.confirmNewPhoneUpdate(
        req.user.id,
        phoneChangeToken,
        newPhoneNumber,
        otp,
      );
      return res.status(200).json({
        success: true,
        message: "Phone number updated successfully.",
        data: updatedUser,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  initiatePasswordChange = async (req, res, next) => {
    try {
      const result = await UserService.initiatePasswordChange(
        req.user.id,
        req.body.currentPassword,
      );
      return res.status(200).json({ success: true, data: result, error: null });
    } catch (error) {
      next(error);
    }
  };

  confirmPasswordChange = async (req, res, next) => {
    try {
      const { otp, newPassword } = req.body;
      const result = await UserService.confirmPasswordChange(
        req.user.id,
        otp,
        newPassword,
      );
      return res.status(200).json({
        success: true,
        message: result.message,
        data: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  addAddress = async (req, res, next) => {
    try {
      const addresses = await UserService.addAddress(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        message: "Address added successfully.",
        data: addresses,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  getAddresses = async (req, res, next) => {
    try {
      const addresses = await UserService.getAddresses(req.user.id);
      return res.status(200).json({
        success: true,
        data: addresses,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  updateAddress = async (req, res, next) => {
    try {
      const addresses = await UserService.updateAddress(
        req.user.id,
        req.params.addressId,
        req.body,
      );
      return res.status(200).json({
        success: true,
        message: "Address updated successfully.",
        data: addresses,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req, res, next) => {
    try {
      const addresses = await UserService.deleteAddress(
        req.user.id,
        req.params.addressId,
      );
      return res.status(200).json({
        success: true,
        message: "Address deleted successfully.",
        data: addresses,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };

  setDefaultAddress = async (req, res, next) => {
    try {
      const addresses = await UserService.setDefaultAddress(
        req.user.id,
        req.params.addressId,
      );
      return res.status(200).json({
        success: true,
        message: "Default address set successfully.",
        data: addresses,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const UserController = new UserControllerClass();
