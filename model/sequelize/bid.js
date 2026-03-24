/* eslint-disable import/no-extraneous-dependencies */
const Sequelize = require('sequelize');
const sequelize = require('../../config/seqeulize-dataBase');

const Bid = sequelize.define(
    'bid',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
        },
        deliveryDays: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        proposal: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM(
                'pending',
                'accepted',
                'rejected',
            ),
            defaultValue: 'pending',
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
            references: {
                model: 'projects',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        }
    },
);

module.exports = Bid;
