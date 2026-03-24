const express = require('express');
const contractController = require('../controllers/contract');
const authController = require('../controllers/auth');
const reviewController = require('../controllers/review');
const messageController = require('../controllers/message');

const router = express.Router();

router
    .route('/')
    .get(
        authController.protect,
        authController.allowTo('client', 'freelancer'),
        contractController.getContracts
    );

router.get(
    '/:contractId', 
    authController.protect,
    authController.allowTo('client', 'freelancer'),
    contractController.getContract
);

router.put(
    '/:contractId/complete',
    authController.protect,
    authController.allowTo('client'),
    contractController.compeleteContract 
);

router.post(
    '/:contractId/reviews',
    authController.protect,
    authController.allowTo('client'),
    reviewController.createReview
);

router.get(
    '/:contractId/messages',
    authController.protect,
    authController.allowTo('client', 'freelancer'),
    messageController.getContractsMessages
);

router.post(
    '/:contractId/messages',
    authController.protect,
    authController.allowTo('client', 'freelancer'),
    messageController.createMessage
);

module.exports = router;