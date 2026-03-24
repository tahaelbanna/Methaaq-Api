const { check } = require('express-validator');
const validatorMiddleware = require('../../middleware/validators');

exports.checkCreateBid = [
    check('projectId').isInt().withMessage('Invalid project ID format'),
    check('amount')
        .notEmpty()
        .withMessage('Bid amount is required')
        .isNumeric()
        .withMessage('Amount must be a number')
        .custom((val) => {
            if (val <= 0) throw new Error('Amount must be greater than 0');
            return true;
        }),
    check('deliveryDays')
        .notEmpty()
        .withMessage('Delivery days are required')
        .isInt()
        .withMessage('Delivery days must be an integer')
        .custom((val) => {
            if (val <= 0)
                throw new Error('Delivery days must be at least 1 day');
            return true;
        }),
    check('proposal')
        .notEmpty()
        .withMessage('Proposal letter is required')
        .isLength({ min: 20 })
        .withMessage(
            'Proposal must be at least 20 characters long to explain your offer'
        ),
    validatorMiddleware,
];

exports.checkGetProjectBids = [
    check('projectId').isInt().withMessage('Invalid project ID format'),
    validatorMiddleware,
];

exports.checkOneBid = [
    check('bidId').isInt().withMessage('Invalid bid ID format'),
    validatorMiddleware,
];

exports.checkUpdateBid = [
    check('bidId').isInt().withMessage('Invalid bid ID format'),
    check('amount')
        .optional()
        .isNumeric()
        .custom((val) => {
            if (val <= 0) throw new Error('Amount must be greater than 0');
            return true;
        }),
    check('deliveryDays')
        .optional()
        .isInt()
        .custom((val) => {
            if (val <= 0)
                throw new Error('Delivery days must be at least 1 day');
            return true;
        }),
    check('proposal')
        .optional()
        .isLength({ min: 20 })
        .withMessage('Proposal must be at least 20 characters'),
    validatorMiddleware,
];
