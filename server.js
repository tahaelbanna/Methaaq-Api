// eslint-disable-next-line import/no-extraneous-dependencies
const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' });

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const dbConnection = require('./config/mongoose-dataBase');
const sequelize = require('./config/seqeulize-dataBase');

require('./model/associations');

const socketHandler = require('./config/socket');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.set('io', io);

socketHandler(io);

const startServer = async () => {
    try {
        await dbConnection();
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('PostgreSQL Connected Successfully.');
        server.listen(PORT, () => {
            console.log(`App running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
};

startServer();

process.on('unhandledRejection', (err) => {
    console.log(`UnhandledRejection Error: ${err.name} | ${err.message}`);
    if (server) {
        server.close(() => {
            console.log('Shutting down server gracefully...');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});
