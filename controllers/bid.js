/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const User = require('../model/sequelize/user');
const Project = require('../model/sequelize/project');
const Bid = require('../model/sequelize/bid');
const Contract = require('../model/sequelize/contract');
const BidMilestone = require('../model/sequelize/bidMilestone');
const sequelize = require('../config/seqeulize-dataBase');
const contractMilestone = require('../model/sequelize/contractMilestone');
const Notification = require('../model/mongoose/notification');

// @desc    Create a new bid with proposed milestones
// @route   POST /Api/v1/projects/:projectId/bids (Nested Route)
// @access  Private (Freelancer only)
exports.createBid = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { amount, deliveryDays, proposal, milestones } = req.body;
    const project = await Project.findByPk(projectId);
    if (!project) {
        return next(
            new ApiError(`No project found for this id: ${projectId}`, 404)
        );
    }
    if (project.status !== 'open') {
        return next(
            new ApiError('This project is no longer accepting bids', 400)
        );
    }
    const existingBid = await Bid.findOne({
        where: { freelancerId: req.user.id, projectId: projectId },
    });
    if (existingBid) {
        return next(
            new ApiError(
                'You have already submitted a bid for this project',
                400
            )
        );
    }
    const t = await sequelize.transaction();
    try {
        const bid = await Bid.create(
            {
                amount,
                deliveryDays,
                proposal,
                projectId,
                freelancerId: req.user.id,
            },
            { transaction: t }
        );
        if (milestones && milestones.length > 0) {
            const milestonesData = milestones.map((m) => ({
                bidId: bid.id,
                order: m.order,
                title: m.title,
                amount: m.amount,
            }));
            await BidMilestone.bulkCreate(milestonesData, { transaction: t });
        }
        const createdBid = await Bid.findByPk(bid.id, {
            include: [{ model: BidMilestone, as: 'milestones' }],
        });
        await t.commit();
        try {
            const newNotification = await Notification.create({
                receiverId: project.clientId,
                title: 'New Bid Received',
                content: `${req.user.name} placed a new bid on your project`,
                type: 'new_bid',
                relatedId: bid.id,
            });
            const io = req.app.get('io');
            io.emit(`notification_${project.clientId}`, newNotification);
        } catch (notifyErr) {
            console.error('Notification failed to send/save:', notifyErr);
        }
        res.status(201).json({
            status: 'success',
            message: 'Bid and milestones submitted successfully',
            data: createdBid,
        });
    } catch (error) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error('Bid Creation Error:', error);
        return next(new ApiError('Failed to create bid and milestones', 500));
    }
});

// @desc    Get all bids for a specific project
// @route   GET /Api/v1/projects/:projectId/bids  (Nested Route)
// @access  Private (Project Owner/Client only)
exports.getProjectBids = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);
    if (!project) {
        return next(
            new ApiError(`No project found for this id: ${projectId}`, 404)
        );
    }
    if (project.clientId !== req.user.id) {
        return next(
            new ApiError('Only the project owner can view these bids', 403)
        );
    }
    const bids = await Bid.findAll({
        where: { projectId: projectId },
        include: [
            {
                model: User,
                as: 'freelancer',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: BidMilestone,
                as: 'milestones',
                attributes: ['id', 'order', 'title', 'amount']
            }
        ],
        order: [['createdAt', 'ASC']],
    });
    res.status(200).json({
        status: 'success',
        results: bids.length,
        data: bids,
    });
});

// @desc    Get specific bid by ID
// @route   GET /Api/v1/bids/:bidId
// @access  Private (Project Owner or Bid Owner)
exports.getOneBid = asyncHandler(async (req, res, next) => {
    const { bidId } = req.params;
    const bid = await Bid.findByPk(bidId, {
        include: [
            {
                model: User,
                as: 'freelancer',
                attributes: ['id', 'name', 'email'],
            },
            {
                model: Project,
                as: 'project',
                attributes: ['id', 'title', 'clientId', 'status'],
            },
            {
                model: BidMilestone,
                as: 'milestones',
                attributes: ['id', 'order', 'title', 'amount']
            }
        ],
    });
    if (!bid) {
        return next(new ApiError(`No bid found for this id: ${bidId}`, 404));
    }
    const isClient = bid.project.clientId === req.user.id;
    const isFreelancer = bid.freelancerId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isClient && !isFreelancer && !isAdmin) {
        return next(new ApiError('You are not allowed to view this bid', 403));
    }
    res.status(200).json({
        status: 'success',
        data: bid,
    });
});

// @desc    Accept a bid
// @route   PUT /Api/v1/bids/:bidId/accept
// @access  Private (Project Owner/Client only)
exports.acceptBid = asyncHandler(async (req, res, next) => {
    const { bidId } = req.params;
    const bid = await Bid.findByPk(bidId, {
        include: [
            { model: Project, as: 'project' },
            { model: BidMilestone, as: 'milestones' },
        ],
    });
    if (!bid) {
        return next(new ApiError(`No bid found for this id: ${bidId}`, 404));
    }
    if (bid.project.clientId !== req.user.id) {
        return next(
            new ApiError('You are not authorized to accept this bid', 403)
        );
    }
    const t = await sequelize.transaction();
    try {
        bid.status = 'accepted';
        await bid.save({ transaction: t });
        bid.project.status = 'in_progress';
        await bid.project.save({ transaction: t });
        await Bid.update(
            { status: 'rejected' },
            {
                where: {
                    projectId: bid.projectId,
                    id: { [Op.ne]: bidId },
                },
                transaction: t,
            }
        );
        const contract = await Contract.create(
            {
                totalAmount: bid.amount,
                freelancerId: bid.freelancerId,
                projectId: bid.projectId,
                clientId: bid.project.clientId,
                bidId,
            },
            { transaction: t }
        );
        if (bid.milestones && bid.milestones.length > 0) {
            const ContractMilestones = bid.milestones.map((m) => ({
                contractId: contract.id,
                order: m.order,
                title: m.title,
                amount: m.amount,
            }));
            await contractMilestone.bulkCreate(ContractMilestones, {
                transaction: t,
            });
        }
        const finalBid = await Bid.findByPk(bid.id, {
            include: [{ model: BidMilestone, as: 'milestones' }],
        });
        const finalContract = await Contract.findByPk(contract.id, {
            include: [{ model: contractMilestone, as: 'milestones' }],
        });
        const newNotification = await Notification.create({
            receiverId: bid.freelancerId,
            title: 'Bid Accepted!',
            content: `Your bid on project has been accepted!`,
            type: 'bid_accepted',
            relatedId: bid.projectId,
        });
        await t.commit();
        req.app
            .get('io')
            .emit(`notification_${bid.freelancerId}`, newNotification);
        res.status(200).json({
            status: 'success',
            message:
                'Bid accepted successfully, other bids rejected, and project is now in progress',
            data: {
                finalBid,
                finalContract,
            },
        });
    } catch (err) {
        await t.rollback();
        console.error('Accept Bid Transaction Error:', err);
        return next(
            new ApiError('Failed to accept bid and generate contract', 500)
        );
    }
});

// @desc    Reject a bid
// @route   PUT /Api/v1/bids/:bidId/reject
// @access  Private (Project Owner/Client only)
exports.rejectBid = asyncHandler(async (req, res, next) => {
    const { bidId } = req.params;
    const bid = await Bid.findByPk(bidId, {
        include: [{ model: Project, as: 'project' }],
    });
    if (!bid) {
        return next(new ApiError(`No bid found for this id: ${bidId}`, 404));
    }
    if (bid.project.clientId !== req.user.id) {
        return next(
            new ApiError('You are not authorized to reject this bid', 403)
        );
    }
    bid.status = 'rejected';
    await bid.save();
    res.status(200).json({
        status: 'success',
        message: 'Bid rejected successfully',
        data: bid,
    });
});

// @desc    Get logged in freelancer's bids
// @route   GET /Api/v1/bids/my-bids
// @access  Private (Freelancer only)
exports.getMyBids = asyncHandler(async (req, res, next) => {
    const bids = await Bid.findAll({
        where: { freelancerId: req.user.id },
        include: [
            {
                model: Project,
                as: 'project',
                attributes: ['id', 'title', 'status'],
            },
        ],
        order: [['createdAt', 'DESC']],
    });
    res.status(200).json({
        status: 'success',
        results: bids.length,
        data: bids,
    });
});

// @desc    Update specific bid
// @route   PUT /api/v1/bids/:bidId
// @access  Private (Freelancer only)
exports.updateBid = asyncHandler(async (req, res, next) => {
    const { bidId } = req.params;
    let bid = await Bid.findByPk(bidId);
    if (!bid) {
        return next(new ApiError(`No bid found for this id: ${bidId}`, 404));
    }
    if (bid.freelancerId !== req.user.id) {
        return next(
            new ApiError('You are not allowed to update this bid', 403)
        );
    }
    if (bid.status !== 'pending') {
        return next(new ApiError('You can only update pending bids', 400));
    }
    const { amount, deliveryDays, proposal } = req.body;
    bid = await bid.update({
        amount: amount || bid.amount,
        deliveryDays: deliveryDays || bid.deliveryDays,
        proposal: proposal || bid.proposal,
    });
    res.status(200).json({
        status: 'success',
        message: 'Bid updated successfully',
        data: bid,
    });
});

// @desc    Delete a bid
// @route   DELETE /api/v1/bids/:bidId
// @access  Private (Freelancer only)
exports.deleteBid = asyncHandler(async (req, res, next) => {
    const { bidId } = req.params;
    const bid = await Bid.findByPk(bidId);
    if (!bid) {
        return next(new ApiError(`No bid found for this id: ${bidId}`, 404));
    }
    if (bid.freelancerId !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ApiError('You are not allowed to delete this bid', 403)
        );
    }
    if (bid.status === 'accepted') {
        return next(new ApiError('You cannot delete an accepted bid', 400));
    }
    await bid.destroy();
    res.status(200).json({
        status: 'success',
        message: 'Bid deleted successfully',
    });
});
