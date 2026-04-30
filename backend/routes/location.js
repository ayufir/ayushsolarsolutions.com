const express = require('express');
const router = express.Router();
const { updateLocation, getLiveLocations, getHistory } = require('../controllers/locationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/update', protect, updateLocation);
router.get('/live', protect, admin, getLiveLocations);
router.get('/history/:userId', protect, admin, getHistory);

module.exports = router;
