/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const authController = require('../controllers/auth');
const authValidator = require('../utils/validators/auth');
const passport = require('passport');
const { generateTokens } = require('../utils/generateToken');
const router = express.Router();

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const { refreshToken } = generateTokens(req.user.id); 
            req.user.refreshToken = refreshToken;
            await req.user.save();
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.redirect(`${process.env.FRONTEND_URL}/auth-success`);
        } catch (error) {
            console.error('Google Auth Error:', error);
            res.redirect('http://localhost:3000/login?error=auth_failed');
        }
    }
);

router.post('/signup', authValidator.checkSignUp, authController.signup);
router.post(
    '/verifyEmail',
    authValidator.checkVerifyEmail,
    authController.verifyEmail
);
router.post('/login', authValidator.checkLogIn, authController.login);
router.get('/refresh-token', authController.RefreshToken);
router.post(
    '/forgetPassword',
    authValidator.checkForgetPassword,
    authController.forgetPassword
);
router.post(
    '/verifyResetPassword',
    authValidator.checkVerifyResetPassword,
    authController.verifyResetPassword
);
router.post(
    '/resetPassword',
    authValidator.checkResetPassword,
    authController.resetPassword
);
router.post('/logout', authController.logout);

module.exports = router;
