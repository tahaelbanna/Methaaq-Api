const express = require('express');
const notificationController = require('../controllers/notification');
const authController = require('../controllers/auth');

const router = express.Router();

router.use(authController.protect); 

router.get('/', notificationController.getMyNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);

module.exports = router;