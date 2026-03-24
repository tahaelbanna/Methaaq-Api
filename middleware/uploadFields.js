const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('express-async-handler');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new ApiError('Not an image! Please upload only images.', 400),
            false
        );
    }
};

const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: multerFilter,
});

exports.uploadSingleImage = (fieldName) => upload.single(fieldName);

exports.resizeProfileImage = asyncHandler(async (req, res, next) => {
    if (!req.file) return next();
    const imageBuffer = await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 55 })
        .toBuffer();
    const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'freelance-profile-images' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(imageBuffer);
    });
    const result = await uploadPromise;
    req.file.path = result.secure_url;
    next();
});
