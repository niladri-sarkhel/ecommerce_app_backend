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
