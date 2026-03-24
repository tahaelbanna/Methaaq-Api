/* eslint-disable import/no-extraneous-dependencies */
const Sequelize = require('sequelize');
const sequelize = require('../../config/seqeulize-dataBase');

const Contract = sequelize.define('contract', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM('active', 'completed', 'terminated'),
        defaultValue: 'active',
    },
    startDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
    },
    endDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    freelancerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'projects',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    bidId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'bids',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
});

module.exports = Contract;
