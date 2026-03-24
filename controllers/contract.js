/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Contract = require('../model/sequelize/contract');
const User = require('../model/sequelize/user');
const Project = require('../model/sequelize/project');
const ContractMilestone = require('../model/sequelize/contractMilestone');

// @desc    Get all contracts for logged-in user
// @route   GET /Api/v1/contracts
// @access  Private
exports.getContracts = asyncHandler(async (req, res, next) => {
    let filter = {};
    if (req.user.role === 'client') {
        filter.clientId = req.user.id;
    }
    if (req.user.role === 'freelancer') {
        filter.freelancerId = req.user.id;
    }
    const contracts = await Contract.findAll({
        where: filter,
        include: [
            {
                model: User,
                as: 'client',
                attributes: ['name', 'role', 'email'],
            },
            {
                model: User,
                as: 'freelancer',
                attributes: ['name', 'role', 'email'],
            },
            {
                model: Project,
                as: 'project',
                attributes: ['title', 'status'],
            },
            {
                model: ContractMilestone,
                as: 'milestones',
                attributes: ['id', 'order', 'title', 'amount', 'status'],
            },
        ],
        order: [['createdAt', 'DESC']],
    });
    if (!contracts) {
        return next(new ApiError(`Unauthorized access`, 404));
    }
    res.status(200).json({
        status: 'success',
        results: contracts.length,
        data: contracts,
    });
});

// @desc    Get specific contract by ID
// @route   GET /Api/v1/contracts/:contractId
// @access  Private
exports.getContract = asyncHandler(async (req, res, next) => {
    const { contractId } = req.params;
    let filter = {};
    if (req.user.role === 'client') {
        filter.clientId = req.user.id;
    }
    if (req.user.role === 'freelancer') {
        filter.freelancerId = req.user.id;
    }
    const contract = await Contract.findByPk(contractId, {
        where: filter,
        include: [
            {
                model: User,
                as: 'client',
                attributes: ['name', 'role', 'email'],
            },
            {
                model: User,
                as: 'freelancer',
                attributes: ['name', 'role', 'email'],
            },
            {
                model: Project,
                as: 'project',
                attributes: ['title', 'status'],
            },
            {
                model: ContractMilestone,
                as: 'milestones',
                attributes: ['id', 'order', 'title', 'amount', 'status'],
            },
        ],
    });
    if (!contract) {
        return next(
            new ApiError(`No contract found for this id: ${contractId}`, 404)
        );
    }
    res.status(200).json({
        status: 'success',
        data: contract,
    });
});

// @desc    Mark contract as complete
// @route   PUT /Api/v1/contracts/:contractId/complete
// @access  Private (Client only)
exports.compeleteContract = asyncHandler(async (req, res, next) => {
    const { contractId } = req.params;
    if (req.user.role !== 'client') {
        return next(new ApiError(`Unauthorized Access`, 403));
    }
    const contract = await Contract.findByPk(contractId, {
        include: [
            {
                model: Project,
                as: 'project',
            },
        ],
    });
    if (!contract) {
        return next(
            new ApiError(`No contract found for this id: ${contractId}`, 404)
        );
    }
    if (contract.clientId !== req.user.id) {
        return next(new ApiError(`Unauthorized Access`, 403));
    }
    if (contract.status === 'completed') {
        return next(new ApiError('This contract is already completed', 400));
    }
    contract.status = 'completed';
    contract.endDate = Date.now();
    await contract.save();
    contract.project.status = 'completed';
    await contract.project.save();
    res.status(200).json({
        status: 'success',
        message: 'Contract and Project marked as completed successfully!',
        data: contract,
    });
});
