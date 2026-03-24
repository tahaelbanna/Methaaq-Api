// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');

const dbConnection = async () => {
    const connect = await mongoose.connect(process.env.DB_URL);
    console.log(`Database Connected: ${connect.connection.host}`);
};

module.exports = dbConnection;
