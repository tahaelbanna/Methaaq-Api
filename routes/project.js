/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const projectController = require('../controllers/project');
const projectValidator = require('../utils/validators/project');
const authController = require('../controllers/auth');
const bidRoutes = require('./bid');

const router = express.Router();

router.use('/:projectId/bids', bidRoutes);

router
    .route('/')
    .post(
        authController.protect,
        authController.allowTo('client'),
        projectValidator.checkCreateProject,
        projectController.createProject
    )
    .get(projectController.getAllProjects);

router
    .route('/:projectId')
    .get(
        projectValidator.checkGetOneProject,
        projectController.getOneProject
    )
    .put(
        authController.protect,
        authController.allowTo('client'),
        projectValidator.checkUpdateProject,
        projectController.updateProject
    )
    .delete(
        authController.protect,
        authController.allowTo('client', 'admin'),
        projectValidator.checkDeleteProject,
        projectController.deleteProject
    );

module.exports = router;
