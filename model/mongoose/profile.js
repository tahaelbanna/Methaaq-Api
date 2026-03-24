const mongoose = require('mongoose');

const { Schema } = mongoose;

const profileSchema = new Schema(
    {
        userId: {
            type: Number,
            required: [true, 'userId is required'],
            unique: [true, 'must be unique'],
        },
        name: {
            type: String,
        },
        bio: {
            type: String,
            required: [true, 'bio is required'],
        },
        hourlyRate: {
            type: Number,
            required: [true, 'hourlyRate is required'],
        },
        portfolio: [
            {
                title: String,
                description: String,
                imageUrl: String,
                projectUrl: String,
            },
        ],
        skills: [String],
        rating: { 
            type: Number, 
            default: 1,
            min: [1, `rating must be >= 1`],
            max: [5, `rating must be <= 5`],
        },
        totalReviews: { 
            type: Number, 
            default: 0 
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Profile', profileSchema);
