const express = require('express');
const bidControllers = require('../controllers/bid');

const bidValidator = require('../utils/validators/bid');

const authController = require('../controllers/auth');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .post(
        authController.protect,
        authController.allowTo('freelancer'),
        bidValidator.checkCreateBid,
        bidControllers.createBid
    )
    .get(
        authController.protect,
        authController.allowTo('client'),
        bidValidator.checkGetProjectBids,
        bidControllers.getProjectBids
    );

router
    .route('/my-bids')
    .get(
        authController.protect,
        authController.allowTo('freelancer'),
        bidControllers.getMyBids
    );

router.put(
    '/:bidId/accept',
    authController.protect,
    authController.allowTo('client'),
    bidValidator.checkOneBid,
    bidControllers.acceptBid
);

router.put(
    '/:bidId/reject',
    authController.protect,
    authController.allowTo('client'),
    bidValidator.checkOneBid,
    bidControllers.rejectBid
);

router
    .route('/:bidId')
    .get(
        authController.protect,
        bidValidator.checkOneBid,
        bidControllers.getOneBid
    )
    .put(
        authController.protect,
        authController.allowTo('freelancer'),
        bidValidator.checkUpdateBid,
        bidControllers.updateBid
    )
    .delete(
        authController.protect,
        authController.allowTo('freelancer', 'admin'),
        bidValidator.checkOneBid,
        bidControllers.deleteBid
    );

module.exports = router;
