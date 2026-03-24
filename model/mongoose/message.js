const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema(
    {
        senderId: {
            type: Number,
            required: [true, 'senderId is required'], 
        },
        receiverId: {
            type: Number,
            required: [true, 'receiverId is required'], 
        },
        contractId: {
            type: Number,
            required: [true, 'contractId is required'], 
        },
        content: {
            type: String,
            required: [true, 'Message content cannot be empty'],
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ contractId: 1, createdAt: 1 });
module.exports = mongoose.model('Message', messageSchema);