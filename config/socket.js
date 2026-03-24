const jwt = require('jsonwebtoken');
const User = require('../model/sequelize/user');
const Message = require('../model/mongoose/message');
const Notification = require('../model/mongoose/notification');

const socketHandler = (io) => {
    // auth middleware
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) {
                return next(
                    new Error('Authentication error: No token provided')
                );
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const currentUser = await User.findByPk(decoded.userId);
            if (!currentUser) {
                return next(new Error('Authentication error: User not found'));
            }
            socket.user = currentUser;
            next();
        } catch (err) {
            return next(
                new Error('Authentication error: Invalid or expired token')
            );
        }
    });

    // Events & Rooms
    io.on('connection', (socket) => {
        console.log(`User [${socket.user.name}] connected`);
        // join room Event
        socket.on('join_contract', (contractId) => {
            socket.join(contractId.toString());
            console.log(
                `User [${socket.user.name}] joined room: ${contractId}`
            );
        });
        // mark messages as read Event
        socket.on('mark_messages_read', async (contractId) => {
            try {
                await Message.updateMany(
                    { contractId, receiverId: socket.user.id, isRead: false },
                    { isRead: true }
                );
                io.to(contractId.toString()).emit('messages_read', {
                    contractId,
                    readerId: socket.user.id,
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
        // Disconnect Event
        socket.on('disconnect', () => {
            console.log(`User [${socket.user.name}] disconnected`);
        });
    });
};

module.exports = socketHandler;
