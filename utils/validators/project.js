const { check } = require('express-validator');
const validatorMiddleware = require('../../middleware/validators');
const Project = require('../../model/sequelize/project');

exports.checkCreateProject = [
    check('title')
        .notEmpty()
        .withMessage('title is required')
        .isLength({ min: 3 })
        .withMessage('To Short'),
    check('description')
        .notEmpty()
        .withMessage('description is required')
        .isLength({ min: 20 })
        .withMessage('To Short'),
    check('budget')
        .notEmpty()
        .withMessage('description is required')
        .isNumeric()
        .withMessage('Budget must be a number')
        .custom((val) => {
            if (val <= 0) throw new Error('Budget must be greater than 0');
            return true;
        }),
    check('deadline')
        .notEmpty()
        .withMessage('Deadline is required')
        .isISO8601()
        .withMessage('Invalid date format (must be YYYY-MM-DD)')
        .custom((val) => {
            if (new Date(val) < new Date()) {
                throw new Error('Deadline must be in the future');
            }
            return true;
        }),
    validatorMiddleware,
];

exports.checkGetOneProject = [
    check('projectId').isInt().withMessage('Invalid project ID format'),
    validatorMiddleware,
];

exports.checkUpdateProject = [
    check('projectId').isInt().withMessage('Invalid project ID format'),
    check('title')
        .optional()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    check('budget')
        .optional()
        .isNumeric()
        .custom((val) => {
            if (val <= 0) throw new Error('Budget must be greater than 0');
            return true;
        }),
    validatorMiddleware,
];

exports.checkDeleteProject = [
    check('projectId').isInt().withMessage('Invalid project ID format'),
    validatorMiddleware,
];
