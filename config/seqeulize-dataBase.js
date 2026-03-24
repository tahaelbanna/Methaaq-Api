// eslint-disable-next-line import/no-extraneous-dependencies
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    process.env.PG_DB_NAME,     
    process.env.PG_USER,        
    process.env.PG_PASSWORD,   
    {
        dialect: 'postgres',
        host: process.env.PG_HOST,
        logging: false,
    }
);

module.exports = sequelize;
