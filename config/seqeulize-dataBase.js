const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: false,
    });
} else {
    sequelize = new Sequelize(
        process.env.PG_DB_NAME,
        process.env.PG_USER,
        process.env.PG_PASSWORD,
        {
            dialect: 'postgres',
            host: process.env.PG_HOST,
            logging: false,
        }
    );
}
module.exports = sequelize;
