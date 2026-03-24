const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const Profile = require('../model/mongoose/profile');
const User = require('../model/sequelize/user');

// @desc    Get Freelancer Profile by User ID
// @route   GET /api/v1/profiles/:userId
// @access  Public
exports.getProfile = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'profileImage'],
    });
    if (!user) {
        return next(new ApiError(`No user found for id: ${userId}`, 404));
    }
    if (user.role !== 'freelancer') {
        return next(new ApiError(`This user is not a freelancer`, 400));
    }
    const profile = await Profile.findOne({ userId: userId });
    res.status(200).json({
        status: 'success',
        data: {
            user,
            profile: profile || {
                message: 'Profile not completely set up yet',
            },
        },
    });
});

// @desc    Create or Update Logged-in Freelancer's Profile
// @route   PUT /Api/v1/profiles/me
// @access  Private (Freelancer only)
exports.upsertMyProfile = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'freelancer') {
        return next(
            new ApiError(
                'Only freelancers can have a professional profile',
                403
            )
        );
    }
    const { bio, skills, hourlyRate } = req.body;
    const profile = await Profile.findOneAndUpdate(
        { userId: req.user.id },
        {
            $set: {
                name: req.user.name,
                bio,
                skills,
                hourlyRate,
            },
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
        }
    );
    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: profile,
    });
});

// @desc    Add a project to Freelancer's Portfolio
// @route   POST /api/v1/profiles/me/portfolio
// @access  Private (Freelancer only)
exports.addPortfolioItem = asyncHandler(async (req, res, next) => {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
        return next(
            new ApiError(
                'Please create your basic profile first before adding to portfolio',
                400
            )
        );
    }
    if (!req.file) {
        return next(
            new ApiError(
                'Please upload an image for your portfolio project',
                400
            )
        );
    }
    const { title, description, projectUrl } = req.body;
    const newProject = {
        title,
        description,
        projectUrl,
        imageUrl: req.file.path,
    };
    profile.portfolio.push(newProject);
    await profile.save();
    res.status(201).json({
        status: 'success',
        message: 'Portfolio item added successfully',
        data: profile,
    });
});
