const { check } = require('express-validator');
const validatorMiddleware = require('../../middleware/validators');
const User = require('../../model/sequelize/user');

exports.checkSignUp = [
    check('name')
        .notEmpty()
        .withMessage('name is required')
        .isLength({ min: 3 })
        .withMessage('To Short'),
    check('email')
        .isEmail()
        .withMessage('E-mail not valid')
        .notEmpty()
        .withMessage('email is required')
        .isLowercase()
        .custom(async (val) => {
            const userEmail = await User.findOne({ where: { email: val } });
            if (userEmail) {
                return Promise.reject(new Error('this E-mail already in use'));
            }
        }),
    check('password')
        .notEmpty()
        .withMessage('password is required')
        .isLength({ min: 8 })
        .withMessage('password must be at least 8 Characters')
        .custom((val, { req }) => {
            if (val !== req.body.confirmPassword) {
                throw new Error('password Confirmation is not matched');
            }
            return true;
        }),
    check('confirmPassword')
        .notEmpty()
        .withMessage('password Confirmation is required'),
    check('phoneNumber')
        .optional()
        .isMobilePhone(['ar-AE', 'ar-EG', 'ar-SA', 'en-US', 'en-GB'])
        .withMessage(
            'phone Number not valid only accepts [EGY, KSA, UAE, USA, UK]'
        ),
    validatorMiddleware,
];

exports.checkLogIn = [
    check('email')
        .isEmail()
        .withMessage('E-mail not valid')
        .notEmpty()
        .withMessage('email is required')
        .isLowercase(),
    check('password')
        .notEmpty()
        .withMessage('password is required')
        .isLength({ min: 8 })
        .withMessage('password must be at least 8 Characters'),
    validatorMiddleware,
];

exports.checkVerifyEmail = [
    check('email')
        .notEmpty().withMessage('email is required')
        .isEmail().withMessage('E-mail not valid')
        .toLowerCase(),
    check('VerifyCode')
        .notEmpty().withMessage('VerifyCode is required')
        .isLength({ min: 6, max: 6 }).withMessage('VerifyCode must be 6 digits'),
    validatorMiddleware,
];

exports.checkForgetPassword = [
    check('email')
        .notEmpty().withMessage('email is required')
        .isEmail().withMessage('E-mail not valid')
        .toLowerCase(),
    validatorMiddleware,
];

exports.checkVerifyResetPassword = [
    check('email')
        .notEmpty().withMessage('email is required')
        .isEmail().withMessage('E-mail not valid')
        .toLowerCase(),
    check('resetCode')
        .notEmpty().withMessage('resetCode is required')
        .isLength({ min: 6, max: 6 }).withMessage('resetCode must be 6 digits'),
    validatorMiddleware,
];

exports.checkResetPassword = [
    check('email')
        .notEmpty().withMessage('email is required')
        .isEmail().withMessage('E-mail not valid')
        .toLowerCase(),
    check('password')
        .notEmpty().withMessage('password is required')
        .isLength({ min: 8 }).withMessage('password must be at least 8 Characters')
        .custom((val, { req }) => {
            if (val !== req.body.confirmPassword) {
                throw new Error('password Confirmation is not matched');
            }
            return true;
        }),
    check('confirmPassword')
        .notEmpty().withMessage('password Confirmation is required'),
    validatorMiddleware,
];