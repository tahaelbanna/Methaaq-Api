const mongoose = require('mongoose');
const Profile = require('./profile');

const { Schema } = mongoose;

const reviewSchema = new Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot be empty!'],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: [true, 'Review must have a rating'],
        },
        contractId: {
            type: Number,
            required: [true, 'Review must belong to a contract.'],
        },
        freelancerId: {
            type: Number,
            required: [true, 'Review must belong to a freelancer.'],
        },
        clientId: {
            type: Number,
            required: [true, 'Review must belong to a client.'],
        },
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ contractId: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (freelancerId) {
    const stats = await this.aggregate([
        {
            $match: { freelancerId: freelancerId },
        },
        {
            $group: {
                _id: '$freelancerId',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ]);
    if (stats.length > 0) {
        await Profile.findOneAndUpdate(
            { userId: freelancerId },
            {
                ratingAverage: Math.round(stats[0].avgRating * 10) / 10,
                totalReviews: stats[0].nRating,
            }
        );
    } else {
        await Profile.findOneAndUpdate(
            { userId: freelancerId },
            { ratingAverage: 0, totalReviews: 0 }
        );
    }
};

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.freelancerId);
});

module.exports = mongoose.model('Review', reviewSchema);
