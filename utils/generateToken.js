/* eslint-disable import/no-extraneous-dependencies */
const jwt = require('jsonwebtoken');

exports.generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
        expiresIn: '325m',
    });
    const refreshToken = jwt.sign(
        { userId: userId },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: '7d',
        }
    );
    return { accessToken, refreshToken };
};
