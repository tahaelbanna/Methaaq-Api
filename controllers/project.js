/* eslint-disable import/no-extraneous-dependencies */
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const ApiFeatures = require('../utils/ApiFeatures');
const User = require('../model/sequelize/user');
const Project = require('../model/sequelize/project');

// @desc    Create a new project
// @route   POST /Api/v1/projects
// @access  Private (Client only)
exports.createProject = asyncHandler(async (req, res, next) => {
    const { title, description, budget, deadline } = req.body;
    const project = await Project.create({
        title,
        description,
        budget,
        deadline,
        clientId: req.user.id,
    });
    if (!project) {
        return next(
            new ApiError('there is a problem when creating project!', 400)
        );
    }
    res.status(201).json({
        status: 'success',
        message: 'project created successfully',
        data: project,
    });
});

// @desc    Get specific project by ID
// @route   GET /Api/v1/projects/:projectId
// @access  Public / Private
exports.getOneProject = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId, {
        include: [
            {
                model: User,
                as: 'client',
                attributes: ['id', 'name', 'email'],
            },
        ],
    });
    if (!project) {
        return next(
            new ApiError(`there is no project for this id: ${projectId}!`, 404)
        );
    }
    res.status(200).json({
        status: 'success',
        message: 'project fetched successfully',
        data: project,
    });
});

// @desc    Get all projects
// @route   GET /Api/v1/projects
// @access  Public / Private
exports.getAllProjects = asyncHandler(async (req, res, next) => {
    const initialOptions = {
        include: [{
            model: User,
            as: 'client',
            attributes: ['id', 'name', 'email'],
        }]
    };
    const features = new ApiFeatures(req.query, initialOptions)
        .filter()
        .search(['title', 'description'])
        .sort()
        .limitFields()
        .paginate();
    const { count, rows: projects } = await Project.findAndCountAll(features.queryOptions);
    const paginationResult = features.calcPaginationResult(count);
    res.status(200).json({
        status: 'success',
        results: projects.length,
        paginationResult,
        data: projects,
    });
});

// @desc    Update specific project
// @route   PUT /Api/v1/projects/:projectId
// @access  Private (Only Project Owner)
exports.updateProject = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    let project = await Project.findByPk(projectId);
    if (!project) {
        return next(
            new ApiError(`there is no project for this id: ${projectId}!`, 404)
        );
    }
    if (project.clientId !== req.user.id) {
        return next(
            new ApiError('You are not allowed to update this project', 403)
        );
    }
    delete req.body.clientId;
    project = await project.update(req.body);
    res.status(200).json({
        status: 'success',
        message: 'project updated successfully',
        data: project,
    });
});

// @desc    Cancel/Delete specific project (Soft Delete)
// @route   DELETE /Api/v1/projects/:projectId
// @access  Private (Only Project Owner or Admin)
exports.deleteProject = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);
    if (!project) {
        return next(new ApiError(`there is no project for this id: ${projectId}!`, 404));
    }
    if (project.clientId !== req.user.id && req.user.role !== 'admin') {
        return next(new ApiError('You are not allowed to delete/cancel this project', 403));
    }
    project.status = 'cancelled';
    await project.save();
    res.status(200).json({
        status: 'success',
        message: 'Project cancelled successfully',
        data: project
    });
});
