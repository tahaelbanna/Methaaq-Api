/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../model/sequelize/user');
const Contract = require('../model/sequelize/contract');
const ContractMilestone = require('../model/sequelize/contractMilestone');
const sequelize = require('../config/seqeulize-dataBase');
const Notification = require('../model/mongoose/notification');

// @desc    Fund a Milestone (Client pays money into Escrow)
// @route   PUT /Api/v1/milestones/:milestoneId/fund
// @access  Private (Client only)
exports.fundMilestone = asyncHandler(async (req, res, next) => {
    const { milestoneId } = req.params;
    const milestone = await ContractMilestone.findByPk(milestoneId, {
        include: [{ model: Contract, as: 'contract' }],
    });
    if (!milestone) {
        return next(
            new ApiError(`No milestone found for id ${milestoneId}`, 404)
        );
    }
    if (milestone.contract.clientId !== req.user.id) {
        return next(
            new ApiError(
                'Only the contract client can fund this milestone',
                403
            )
        );
    }
    if (milestone.status !== 'pending') {
        return next(
            new ApiError(`Milestone is already ${milestone.status}`, 400)
        );
    }
    const t = await sequelize.transaction();
    try {
        const client = await User.findByPk(req.user.id, { transaction: t });
        if (parseFloat(client.balance) < parseFloat(milestone.amount)) {
            await t.rollback();
            return next(
                new ApiError('Insufficient balance to fund this milestone', 400)
            );
        }
        client.balance =
            parseFloat(client.balance) - parseFloat(milestone.amount);
        await client.save({ transaction: t });

        milestone.status = 'funded';
        await milestone.save({ transaction: t });
        await t.commit();
        res.status(200).json({
            status: 'success',
            message: 'Milestone funded successfully! Money is now in Escrow.',
            data: milestone,
        });
    } catch (err) {
        await t.rollback();
        console.error('Fund Milestone Error:', err);
        return next(new ApiError('Payment simulation failed', 500));
    }
});

// @desc    Submit Milestone Work (Freelancer action)
// @route   PUT /Api/v1/milestones/:milestoneId/submit
// @access  Private (Freelancer only)
exports.submitMilestone = asyncHandler(async (req, res, next) => {
    const { milestoneId } = req.params;
    const milestone = await ContractMilestone.findByPk(milestoneId, {
        include: [{ model: Contract, as: 'contract' }],
    });
    if (!milestone) {
        return next(
            new ApiError(`No milestone found for id ${milestoneId}`, 404)
        );
    }
    if (milestone.contract.freelancerId !== req.user.id) {
        return next(
            new ApiError(
                'Only the contract freelancer can submit this milestone',
                403
            )
        );
    }
    if (milestone.status !== 'funded') {
        return next(
            new ApiError(
                'Cannot submit work. Milestone must be funded first.',
                400
            )
        );
    }
    milestone.status = 'submitted';
    await milestone.save();
    const newNotification = await Notification.create({
        receiverId: milestone.contract.clientId,
        title: 'Milestone submitted',
        content: `A milestone has been submitted.`,
        type: 'milestone_submited',
        relatedId: milestone.contract.id,
    });
    req.app
        .get('io')
        .emit(`notification_${milestone.contract.clientId}`, newNotification);
    res.status(200).json({
        status: 'success',
        message: 'Milestone work submitted to client for review.',
        data: milestone,
    });
});

// @desc    Approve Milestone Work (Client action)
// @route   PUT /Api/v1/milestones/:milestoneId/approve
// @access  Private (Client only)
exports.approveMilestone = asyncHandler(async (req, res, next) => {
    const { milestoneId } = req.params;
    const milestone = await ContractMilestone.findByPk(milestoneId, {
        include: [{ model: Contract, as: 'contract' }],
    });
    if (!milestone) {
        return next(
            new ApiError(`No milestone found for id ${milestoneId}`, 404)
        );
    }
    if (milestone.contract.clientId !== req.user.id) {
        return next(
            new ApiError(
                'Only the contract client can approve this milestone',
                403
            )
        );
    }
    if (milestone.status !== 'submitted') {
        return next(
            new ApiError(
                'Cannot approve. Milestone work must be submitted by freelancer first.',
                400
            )
        );
    }
    milestone.status = 'approved';
    await milestone.save();
    const newNotification = await Notification.create({
        receiverId: milestone.contract.freelancerId,
        title: 'Milestone approved',
        content: `A milestone has been approved.`,
        type: 'milestone_approved',
        relatedId: milestone.contract.id,
    });
    req.app
        .get('io')
        .emit(
            `notification_${milestone.contract.freelancerId}`,
            newNotification
        );
    res.status(200).json({
        status: 'success',
        message: 'Milestone work approved. You can now release the payment.',
        data: milestone,
    });
});

// @desc    Disapprove/Reject Milestone Work (Client action)
// @route   PUT /Api/v1/milestones/:milestoneId/disapprove
// @access  Private (Client only)
exports.disApproveMilestone = asyncHandler(async (req, res, next) => {
    const { milestoneId } = req.params;
    const milestone = await ContractMilestone.findByPk(milestoneId, {
        include: [{ model: Contract, as: 'contract' }],
    });
    if (!milestone) {
        return next(
            new ApiError(`No milestone found for id ${milestoneId}`, 404)
        );
    }
    if (milestone.contract.clientId !== req.user.id) {
        return next(
            new ApiError(
                'Only the contract client can disapprove this milestone',
                403
            )
        );
    }
    if (milestone.status !== 'submitted') {
        return next(
            new ApiError(
                'Cannot disapprove. Milestone work must be submitted by freelancer first.',
                400
            )
        );
    }
    milestone.status = 'disApproved';
    const newNotification = await Notification.create({
        receiverId: milestone.contract.freelancerId,
        title: 'Milestone disApproved',
        content: `A milestone has been disApproved.`,
        type: 'milestone_disApproved',
        relatedId: milestone.contract.id,
    });
    req.app
        .get('io')
        .emit(
            `notification_${milestone.contract.freelancerId}`,
            newNotification
        );
    await milestone.save();
    res.status(200).json({
        status: 'success',
        message: 'Milestone work disapproved. Freelancer needs to update it.',
        data: milestone,
    });
});

// @desc    Release Milestone Money (Escrow -> Freelancer)
// @route   PUT /Api/v1/milestones/:milestoneId/release
// @access  Private (Client only)
exports.releaseMilestone = asyncHandler(async (req, res, next) => {
    const { milestoneId } = req.params;
    const milestone = await ContractMilestone.findByPk(milestoneId, {
        include: [{ model: Contract, as: 'contract' }],
    });
    if (!milestone) {
        return next(
            new ApiError(`No milestone found for id ${milestoneId}`, 404)
        );
    }
    if (milestone.contract.clientId !== req.user.id) {
        return next(
            new ApiError(
                'Only the contract client can release this milestone payment',
                403
            )
        );
    }
    if (milestone.status !== 'submitted' && milestone.status !== 'approved') {
        return next(
            new ApiError(
                `Cannot release money. Current status is ${milestone.status}`,
                400
            )
        );
    }
    const t = await sequelize.transaction();
    try {
        const freelancer = await User.findByPk(
            milestone.contract.freelancerId,
            { transaction: t }
        );
        freelancer.balance =
            parseFloat(freelancer.balance) + parseFloat(milestone.amount);
        await freelancer.save({ transaction: t });
        milestone.status = 'paid';
        await milestone.save({ transaction: t });
        await t.commit();
        const newNotification = await Notification.create({
            receiverId: milestone.contract.freelancerId,
            title: 'Milestone funded successfully',
            content: `A Milestone funded successfully.`,
            type: 'milestone_funded',
            relatedId: milestone.contract.id,
        });
        req.app
            .get('io')
            .emit(
                `notification_${milestone.contract.freelancerId}`,
                newNotification
            );
        res.status(200).json({
            status: 'success',
            message:
                'Milestone paid successfully! Money has been transferred to the freelancer.',
            data: milestone,
        });
    } catch (err) {
        await t.rollback();
        console.error('Release Milestone Error:', err);
        return next(new ApiError('Payment simulation failed', 500));
    }
});
