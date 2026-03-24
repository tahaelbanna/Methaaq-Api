const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        receiverId: {
            type: Number,
            required: [true, 'receiverId is required'],
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: [
                'new_message',
                'new_bid',
                'bid_accepted',
                'milestone_funded',
                'milestone_submited',
                'milestone_approved',
                'milestone_disApproved',
            ],
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        relatedId: {
            type: Number,
            required: [true, 'relatedId is required'],
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
