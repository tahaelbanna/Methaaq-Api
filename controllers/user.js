/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../model/sequelize/user');

// @desc    Get logged-in user data
// @route   GET /Api/v1/users/me
// @access  Private (Client & Freelancer)
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findByPk(req.user.id, {
        attributes: {
            exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
        },
    });
    if (!user) {
        return next(new ApiError('User not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: user,
    });
});

// @desc    Update logged-in user data
// @route   PUT /Api/v1/users/me
// @access  Private (Client & Freelancer)
exports.updateMe = asyncHandler(async (req, res, next) => {
    if (req.body.password || req.body.role) {
        return next(
            new ApiError('This route is not for password or role updates.', 400)
        );
    }
    const allowedUpdates = {
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
    };
    Object.keys(allowedUpdates).forEach((key) => {
        if (allowedUpdates[key] === undefined) {
            delete allowedUpdates[key];
        }
    });
    const user = await User.findByPk(req.user.id);
    if (!user) return next(new ApiError('User not found', 404));
    await user.update(allowedUpdates);
    const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
    });
    res.status(200).json({
        status: 'success',
        message: 'Your data updated successfully',
        data: updatedUser,
    });
});

// @desc    Upload profile image to Cloudinary and update database
// @route   PUT /Api/v1/users/me/profile-image
// @access  Private (Client & Freelancer)
exports.uploadProfileImage = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ApiError('Please upload an image file', 400));
    }
    const user = await User.findByPk(req.user.id);
    user.profileImage = req.file.path;
    await user.save();
    res.status(200).json({
        status: 'success',
        message: 'Profile image updated successfully',
        data: {
            profileImage: user.profileImage,
        },
    });
});
