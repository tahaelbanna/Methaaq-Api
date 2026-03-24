const Sequelize = require('sequelize');
const sequelize = require('../../config/seqeulize-dataBase');

const BidMilestone = sequelize.define('bid_milestone', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    bidId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'bids',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    order: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
    },
});

module.exports = BidMilestone;
