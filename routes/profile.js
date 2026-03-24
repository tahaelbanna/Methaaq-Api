/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const profileController = require('../controllers/profile');
const authController = require('../controllers/auth');
const uploadMiddleware = require('../middleware/uploadFields');
const reviewController = require('../controllers/review');

const router = express.Router();

router.get('/:userId', authController.protect, profileController.getProfile);

router.put(
    '/me',
    authController.protect,
    authController.allowTo('freelancer'),
    profileController.upsertMyProfile
);

router.post(
    '/me/portfolio',
    authController.protect,
    authController.allowTo('freelancer'),
    uploadMiddleware.uploadSingleImage('image'),
    uploadMiddleware.resizeProfileImage,
    profileController.addPortfolioItem
);

router.get(
    '/:userId/reviews',
    authController.protect,
    reviewController.getFreelancerReviews
);

module.exports = router;
