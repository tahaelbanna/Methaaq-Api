/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Notification = require('../model/mongoose/notification');

// @desc    Get logged-in user notifications
// @route   GET /Api/v1/notifications
// @access  Private
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
    const notifications = await Notification.find({
        receiverId: req.user.id,
    }).sort('-createdAt');
    res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: notifications,
    });
});

// @desc    Mark a notification as read
// @route   PUT /Api/v1/notifications/:notificationId/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
        {
            receiverId: req.user.id,
            _id: notificationId,
        },
        {
            isRead: true,
        },
        {
            new: true,
        }
    );
    if (!notification) {
        return next(
            new ApiError(
                'Notification not found or you are not authorized',
                404
            )
        );
    }
    res.status(200).json({
        status: 'success',
        data: notification,
    });
});
