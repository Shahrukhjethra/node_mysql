const db = require("../config/db");
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const User = db.user;
const Op = db.Sequelize.Op;
const crypto = require('crypto');

exports.create = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  sendTokenResponse(user, 200, res);
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ where: { email: req.body.email } });

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  sendTokenResponse(user, 200, res);
});


// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ where: { email: req.body.email } });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save();

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/user/reset_password_template/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'Password reset token',
  //     message,
  //   });

  //   res.status(200).json({ success: true, data: 'Email sent' });
  // } catch (err) {
  //   console.log(err);
  //   user.resetPasswordToken = undefined;
  //   user.resetPasswordExpire = undefined;

  //   await user.save();

  //   return next(new ErrorResponse('Email could not be sent', 500));
  // }
  res.status(200).json({
    success: true,
    data: resetUrl,
  });
});

// @desc      Reset password
// @route     PUT /api/v1/user/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //console.log("resetPassword_post", JSON.parse(JSON.stringify(req.body))  );
  console.log('resetPassword_post', req.body);

  if (req.body.password == req.body.confirm) {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: {
          [Op.gt]: Date.now()
        }
      },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res
      .status(200)
      .json({
        success: true,
        message: 'Success! Your password has been changed.'
      });

  } else {
    return next(new ErrorResponse('you password done not match with confirm password.', 400));
  }
});

// @desc      Reset password
// @route     GET /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.reset_password_template = asyncHandler(async (req, res, next) => {
  res.render('reset_password.ejs', {
    token: req.params.resettoken,
  });
});

// @desc      Update user details
// @route     PUT /api/v1/user/
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {

  const fieldsToUpdate = {
    email: req.body.email,
    mobile: req.body.mobile
  };

  const user = await User.update(fieldsToUpdate, { where: { id: req.user.id } });

  res.status(200).json({
    success: true,
    data: user
  });

});

// @desc      Update password
// @route     PUT /api/v1/user/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {

  const user = await User.findByPk(req.user.id);

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  res
    .status(statusCode)
    .json({
      success: true,
      token
    });
};