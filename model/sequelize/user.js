/* eslint-disable import/no-extraneous-dependencies */
const bcrypt = require('bcryptjs');
const Sequelize = require('sequelize');
const sequelize = require('../../config/seqeulize-dataBase');

const User = sequelize.define(
    'user',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        googleId: {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true,
        },
        role: {
            type: Sequelize.ENUM('client', 'freelancer', 'admin'),
            defaultValue: 'client',
            allowNull: false,
        },
        isBanned: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        isVerified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        passwordChangedAt: {
            type: Sequelize.DATE,
        },
        resetCode: {
            type: Sequelize.STRING,
        },
        emailVerifyCode: {
            type: Sequelize.STRING,
        },
        resetCodeExpiry: {
            type: Sequelize.DATE,
        },
        verifyResetCode: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        phoneNumber: {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true,
        },
        profileImage: {
            type: Sequelize.STRING,
        },
        refreshToken: {
            type: Sequelize.STRING,
        },
        resetVerifyCodeExpiry: {
            type: Sequelize.DATE,
        },
        balance: {
            type: Sequelize.INTEGER,
            defaultValue: 10000,
        },
    },
    {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password') && user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
        },
    }
);

module.exports = User;
