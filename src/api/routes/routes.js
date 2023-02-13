const express = require('express');
const router = express.Router();

<<<<<<< Updated upstream
=======
const jobController = require('../controllers/jobController');
const stripeController = require('../controllers/stripeController');

router.post('/generate', jobController.createJob);
router.post('/checkout', stripeController.createCheckoutSession);

module.exports = router;
>>>>>>> Stashed changes
