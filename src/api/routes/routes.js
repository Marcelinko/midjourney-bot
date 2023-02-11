const express = require('express');
const router = express.Router();

const jobController = require('../controllers/jobController');
const stripeController = require('../controllers/stripeController');

router.post('/generate', jobController.createJob);
router.get('/jobs/:jobId', jobController.getImagePreviewUrl);
router.post('/checkout', stripeController.createCheckoutSession);

module.exports = router;