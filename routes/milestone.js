const express = require('express');
const milestoneController = require('../controllers/milestones');
const authController = require('../controllers/auth');

const router = express.Router();
router.put(
    '/:milestoneId/fund',
    authController.protect,
    authController.allowTo('client'),
    milestoneController.fundMilestone
);

router.put(
    '/:milestoneId/submit',
    authController.protect,
    authController.allowTo('freelancer'),
    milestoneController.submitMilestone
);

router.put(
    '/:milestoneId/approve',
    authController.protect,
    authController.allowTo('client'),
    milestoneController.approveMilestone
);

router.put(
    '/:milestoneId/disapprove',
    authController.protect,
    authController.allowTo('client'),
    milestoneController.disApproveMilestone
);

router.put(
    '/:milestoneId/release',
    authController.protect,
    authController.allowTo('client'),
    milestoneController.releaseMilestone
);

module.exports = router;