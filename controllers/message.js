/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Message = require('../model/mongoose/message');
const Contract = require('../model/sequelize/contract');
const Notification = require('../model/mongoose/notification');

// @desc    Send a new message
// @route   POST /Api/v1/contracts/:contractId/messages
// @access  Private
exports.createMessage = asyncHandler(async (req, res, next) => {
    const { contractId } = req.params;
    const { content } = req.body;
    const contract = await Contract.findByPk(contractId);
    if (!contract) return next(new ApiError('Contract not found', 404));
    if (
        contract.clientId !== req.user.id &&
        contract.freelancerId !== req.user.id
    ) {
        return next(new ApiError('Not authorized', 403));
    }
    const receiverId =
        req.user.id === contract.clientId
            ? contract.freelancerId
            : contract.clientId;
    const newMessage = await Message.create({
        senderId: req.user.id,
        receiverId,
        contractId,
        content,
    });
    const io = req.app.get('io');
    io.to(contractId.toString()).emit('receive_message', newMessage);
    const newNotification = await Notification.create({
        receiverId,
        title: 'New Message',
        content: `You have a new message from ${req.user.name}`,
        type: 'new_message',
        relatedId: contractId,
    });
    io.emit(`notification_${receiverId}`, newNotification);
    res.status(201).json({
        status: 'success',
        data: newMessage,
    });
});

// @desc    Get all messages for a specific contract
// @route   GET /Api/v1/contracts/:contractId/messages
// @access  Private (Only Client & Freelancer of this contract)
exports.getContractsMessages = asyncHandler(async (req, res, next) => {
    const { contractId } = req.params;
    const contract = await Contract.findByPk(contractId);
    if (!contract) {
        return next(
            new ApiError(`No contract found for id: ${contractId}`, 404)
        );
    }
    if (
        contract.clientId !== req.user.id &&
        contract.freelancerId !== req.user.id
    ) {
        return next(
            new ApiError('You are not authorized to view these messages', 403)
        );
    }
    const messages = await Message.find({ contractId: contractId }).sort(
        'createdAt'
    );
    res.status(200).json({
        status: 'success',
        results: messages.length,
        data: messages,
    });
});
