import { SellerService } from "#services";

export class SellerController {
  signup = async (req, res) => {
    try {
      const payload = await SellerService.signupMerchant(req.body);
      return res.status(201).json({
        success: true,
        message:
          "Merchant onboarding initiated successfully. Verification code dispatched.",
        data: payload,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  verifyOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
      await SellerService.verifyOnboardingChallenge(email, otp);
      return res.status(200).json({
        success: true,
        message:
          "Merchant authentication challenge cleared. Account activated.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const data = await SellerService.loginMerchant(email, password);
      return res.status(200).json({
        success: true,
        message: "Authentication tokens generated successfully.",
        ...data,
      });
    } catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
  };

  logout = async (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Session context successfully terminated client side.",
    });
  };

  forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      await SellerService.requestPasswordRecovery(email);
      return res.status(200).json({
        success: true,
        message:
          "If credentials exist on file, an action token has been dispatched.",
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  resetPassword = async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      await SellerService.resetPasswordWithOtp(email, otp, newPassword);
      return res.status(200).json({
        success: true,
        message:
          "Credentials successfully re-secured. Please authenticate using your new password.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  updateAccount = async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || req.body.userId;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated context." });

      const updatedProfile = await SellerService.updateMerchantProfile(
        userId,
        req.body,
      );
      return res.status(200).json({
        success: true,
        message: "Merchant metadata modified successfully.",
        data: updatedProfile,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  deleteAccount = async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || req.body.userId;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated context." });

      await SellerService.terminateMerchantAccount(userId);
      return res.status(200).json({
        success: true,
        message: "Merchant entity cascading deletion executed cleanly.",
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}
