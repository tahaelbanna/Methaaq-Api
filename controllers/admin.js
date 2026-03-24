/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../model/sequelize/user');
const { Op } = require('sequelize');
const Project = require('../model/sequelize/project');
const Contract = require('../model/sequelize/contract');
const ContractMilestone = require('../model/sequelize/contractMilestone');

// @desc    Ban a user
// @route   PUT /Api/v1/admin/users/:userId/ban
// @access  Private (Admin only)
exports.banUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
        return next(new ApiError(`No user found for this id: ${userId}`, 404));
    }
    if (user.role === 'admin') {
        return next(new ApiError('You cannot ban an admin', 400));
    }
    user.isBanned = true;
    await user.save();
    res.status(200).json({
        status: 'success',
        message: 'User has been banned successfully',
        data: { id: user.id, name: user.name, isBanned: user.isBanned },
    });
});

// @desc    Unban a user
// @route   PUT /Api/v1/admin/users/:userId/unban
// @access  Private (Admin only)
exports.unbanUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
        return next(new ApiError(`No user found for this id: ${userId}`, 404));
    }
    user.isBanned = false;
    await user.save();
    res.status(200).json({
        status: 'success',
        message: 'User has been unbanned successfully',
        data: { id: user.id, name: user.name, isBanned: user.isBanned },
    });
});

// @desc    Get system statistics for admin dashboard
// @route   GET /api/v1/admin/stats
// @access  Private (Admin only)
exports.getAdminStats = asyncHandler(async (req, res, next) => {
    const [totalUsers, totalProjects, totalContracts, totalRevenue] =
        await Promise.all([
            User.count({ where: { role: { [Op.ne]: 'admin' } } }),
            Project.count(),
            Contract.count(),
            ContractMilestone.sum('amount', { where: { status: 'paid' } }),
        ]);
    res.status(200).json({
        status: 'success',
        data: {
            totalUsers,
            totalProjects,
            totalContracts,
            totalRevenue: totalRevenue || 0,
        },
    });
});
