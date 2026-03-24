/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { promisify } = require('util');
const ApiError = require('../utils/ApiError');
const User = require('../model/sequelize/user');
const { generateTokens } = require('../utils/generateToken');
const { sendEmail, passwordEmailSender } = require('../utils/emailProvider');

// @desc    Register a new user & send verification email
// @route   POST /Api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
    const { name, email, password, phoneNumber } = req.body;
    const user = await User.create(
        {
            name: name,
            email: email,
            password: password,
            phoneNumber: phoneNumber,
        },
        { fields: ['name', 'email', 'password', 'phoneNumber'] }
    );
    if (!user) {
        return next(new ApiError('there is an error happened', 400));
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpCode = crypto.createHash('sha256').update(code).digest('hex');
    user.emailVerifyCode = otpCode;
    user.resetVerifyCodeExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your verification reset code (valid for 10 min).',
            name: user.name,
            code,
        });
    } catch (err) {
        user.emailVerifyCode = null;
        user.resetVerifyCodeExpiry = null;
        await user.save();
        console.log(err);
        return next(new ApiError('There is an error in sending email', 500));
    }
    res.status(201).json({
        status: 'success',
        message: 'signup successfully, check your email for account activation',
    });
});

// @desc    Verify user email using OTP
// @route   POST /Api/v1/auth/verifyEmail
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { email, VerifyCode } = req.body;
    if (!email || !VerifyCode) {
        return next(new ApiError('misiing information', 400));
    }
    const otpCode = crypto
        .createHash('sha256')
        .update(VerifyCode)
        .digest('hex');
    const user = await User.findOne({
        where: {
            emailVerifyCode: otpCode,
            email,
            resetVerifyCodeExpiry: {
                [Op.gt]: Date.now(),
            },
        },
    });
    if (!user) {
        return next(new ApiError('misiing information', 404));
    }
    user.isVerified = true;
    user.emailVerifyCode = null;
    user.resetVerifyCodeExpiry = null;
    await user.save();
    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({
        status: 'success',
        message: 'email activated!',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        },
        token: accessToken,
    });
});

// @desc    Login user and assign tokens
// @route   POST /Api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new ApiError('Incorrect email or password', 401));
    }
    if (!user.isVerified) {
        return next(new ApiError('user not verified', 403));
    }
    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({
        status: 'success',
        message: 'email loggedIn successfully!',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        },
        token: accessToken,
    });
});

// @desc    Protect routes (Make sure user is logged in)
// @route   Middleware
// @access  Private
exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new ApiError('register to get access!', 401));
    }
    let decode;
    try {
        decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (error) {
        return next(
            new ApiError('Invalid or expired token, please login again!', 401)
        );
    }
    const user = await User.findOne({ where: { id: decode.userId } });
    if (!user) {
        return next(
            new ApiError('this account no longer exists, login again!', 401)
        );
    }
    if (user.isBanned) {
        return next(
            new ApiError(
                'Your account has been banned by the administration. Contact support.',
                403
            )
        );
    }
    if (user.passwordChangedAt) {
        const passwordChangedTimeStamp = parseInt(
            user.passwordChangedAt.getTime() / 1000,
            10
        );
        if (passwordChangedTimeStamp > decode.iat) {
            return next(
                new ApiError('this session no longer exists, login again!', 401)
            );
        }
    }
    req.user = user;
    next();
});

// @desc    Authorization (Make sure user has required role)
// @route   Middleware
// @access  Private
exports.allowTo = (...roles) =>
    asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ApiError('Unauthorized Access', 403));
        }
        next();
    });

// @desc    Issue a new access token using the refresh token cookie
// @route   GET /Api/v1/auth/refresh-token
// @access  Public
exports.RefreshToken = asyncHandler(async (req, res, next) => {
    const { cookies } = req;
    if (!cookies?.jwt) {
        return next(new ApiError('Unauthorized Access, login Again!', 401));
    }
    const refreshToken = cookies.jwt;
    let decode;
    try {
        decode = await promisify(jwt.verify)(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
    } catch (error) {
        return next(
            new ApiError('Invalid or expired token, please login again!', 401)
        );
    }
    const user = await User.findOne({
        where: {
            id: decode.userId,
            refreshToken,
        },
    });
    if (!user) {
        return next(
            new ApiError('Forbidden, token revoked or user not found', 403)
        );
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        generateTokens(user.id);
    user.refreshToken = newRefreshToken;
    await user.save();
    res.cookie('jwt', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
        status: 'success',
        message: 'token refreshed',
        token: newAccessToken,
    });
});

// @desc    Send OTP to user email for password reset
// @route   POST /Api/v1/auth/forgetPassword
// @access  Public
exports.forgetPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return next(new ApiError('this email not found!', 404));
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpCode = crypto.createHash('sha256').update(code).digest('hex');
    user.resetCode = otpCode;
    user.resetCodeExpiry = Date.now() + 10 * 60 * 1000;
    user.verifyResetCode = false;
    await user.save();
    try {
        await passwordEmailSender({
            email: user.email,
            subject: 'Your password reset code (valid for 10 min).',
            name: user.name,
            code,
        });
    } catch (err) {
        user.resetCode = null;
        user.resetCodeExpiry = null;
        user.verifyResetCode = null;
        await user.save();
        console.log(err);
        return next(new ApiError('There is an error in sending email', 500));
    }
    res.status(200).json({
        status: 'Success',
        message: 'Reset code sent to email',
    });
});

// @desc    Verify the OTP sent for password reset
// @route   POST /Api/v1/auth/verifyResetPassword
// @access  Public
exports.verifyResetPassword = asyncHandler(async (req, res, next) => {
    const { resetCode } = req.body;
    const hashedCode = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');
    const user = await User.findOne({
        where: {
            resetCode: hashedCode,
            resetCodeExpiry: {
                [Op.gt]: Date.now(),
            },
        },
    });
    if (!user) {
        return next(new ApiError('reset code not correct!', 404));
    }
    user.verifyResetCode = true;
    await user.save();
    res.status(200).json({
        status: 'Success',
    });
});

// @desc    Set new password after OTP verification
// @route   POST /Api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return next(new ApiError('email not correct!', 404));
    }
    if (!user.verifyResetCode) {
        return next(new ApiError('this email is not verified', 404));
    }
    user.password = password;
    user.passwordChangedAt = Date.now();
    user.resetCode = null;
    user.resetCodeExpiry = null;
    user.verifyResetCode = null;
    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    await user.save();
    res.status(200).json({
        status: 'success',
        message: 'password updated!',
        token: accessToken,
    });
});

// @desc    Logout user & clear cookie/database token
// @route   POST /Api/v1/auth/logout
// @access  Public
exports.logout = asyncHandler(async (req, res, next) => {
    const { cookies } = req;
    if (!cookies?.jwt) {
        return res.status(204).send();
    }
    const refreshToken = cookies.jwt;
    const user = await User.findOne({ where: { refreshToken } });
    if (!user) {
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        return res.status(204).send();
    }
    user.refreshToken = null;
    await user.save();
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
    });
});
