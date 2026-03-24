/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Review = require('../model/mongoose/review');
const Contract = require('../model/sequelize/contract');

// @desc    Create a review for a completed contract
// @route   POST /api/v1/contracts/:contractId/reviews
// @access  Private (Client only)
exports.createReview = asyncHandler(async (req, res, next) => {
    const { review, rating } = req.body;
    const { contractId } = req.params;
    const contract = await Contract.findByPk(contractId);
    if (!contract) {
        return next(
            new ApiError(`No contract found for id: ${contractId}`, 404)
        );
    }
    if (contract.clientId !== req.user.id) {
        return next(
            new ApiError(
                'Only the client of this contract can leave a review',
                403
            )
        );
    }
    if (contract.status !== 'completed') {
        return next(
            new ApiError('You can only review completed contracts', 400)
        );
    }
    try {
        const newReview = await Review.create({
            review,
            rating,
            contractId: contract.id,
            freelancerId: contract.freelancerId,
            clientId: req.user.id,
        });
        res.status(201).json({
            status: 'success',
            message: 'Review submitted successfully',
            data: newReview,
        });
    } catch (err) {
        if (err.code === 11000) {
            return next(
                new ApiError('You have already reviewed this contract', 400)
            );
        }
        return next(new ApiError('Error creating review', 500));
    }
});

// @desc    Get all reviews for a specific freelancer
// @route   GET /api/v1/profiles/:userId/reviews
// @access  Public
exports.getFreelancerReviews = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const reviews = await Review.find({ freelancerId: userId });
    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: reviews
    });
});
