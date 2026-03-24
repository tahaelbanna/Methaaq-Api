/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const authController = require('../controllers/auth');
const adminController = require('../controllers/admin');

const router = express.Router();

router.put(
    '/users/:userId/ban',
    authController.protect,
    authController.allowTo('admin'),
    adminController.banUser
);
router.put(
    '/users/:userId/unban',
    authController.protect,
    authController.allowTo('admin'),
    adminController.unbanUser
);

router.get(
    '/stats',
    authController.protect,
    authController.allowTo('admin'),
    adminController.getAdminStats
);
module.exports = router;
