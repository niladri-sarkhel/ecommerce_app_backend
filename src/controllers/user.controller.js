import { UserService } from "#services";

export class UserControllerClass {
  // ==========================================
  // SIGNUP CONTROLLERS
  // ==========================================

  initiateSignup = async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await UserService.initiateSignup({
        email,
        password,
        firstName,
        lastName,
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
}

// Inside class UserControllerClass ...

export const UserController = new UserControllerClass();
