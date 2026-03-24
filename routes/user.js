/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const userController = require('../controllers/user');
const authController = require('../controllers/auth');
const uploadMiddleware = require('../middleware/uploadFields');

const router = express.Router();

router.get(
    '/me',
    authController.protect,
    authController.allowTo('client', 'freelancer'),
    userController.getMe
);
router.put(
    '/me',
    authController.protect,
    authController.allowTo('client', 'freelancer'),
    userController.updateMe
);
router.put(
    '/me/profile-image',
    authController.protect,
    authController.allowTo('client', 'freelancer'),
    uploadMiddleware.uploadSingleImage('image'),
    uploadMiddleware.resizeProfileImage,
    userController.uploadProfileImage
);

module.exports = router;
