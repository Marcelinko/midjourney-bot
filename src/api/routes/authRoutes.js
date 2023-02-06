const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.post('/register', authController.registerUser);
router.post('/google', authController.loginUserGoogle);
router.post('/login', authController.loginUserEmailPassword);
router.delete('/logout', authController.authenticate, authController.logoutUser);
router.delete('/logout-all', authController.authenticate, authController.logoutUserAllDevices);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:user_id/:token', authController.resetPassword);
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;