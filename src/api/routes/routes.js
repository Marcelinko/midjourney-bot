const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const stripeController = require('../controllers/stripeController')

//this should be under auth/google, login, register...
router.post('/register', authController.registerUser);
router.post('/google', authController.loginUserGoogle);
router.post('/login', authController.loginUserEmailPassword);
router.delete('/logout', authController.authenticate, authController.logoutUser);
router.delete('/logout-all', authController.authenticate, authController.logoutUserAllDevices);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:user_id/:token', authController.resetPassword);
router.get('/verify/:token', authController.verifyEmail);

router.post('/checkout', stripeController.createCheckoutSession);

router.get('/test', authController.authenticate, (req, res) => {
    res.send("Ok");
});


router.post('/generate', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    if (prompt.length > 100) return res.status(400).json({ error: 'Prompt too long' });
    const job = createJob(prompt.replace(/\*/g, ''));
    processJob(job);

    return res.json({ job_id: job.job_id, status: job.status });
});