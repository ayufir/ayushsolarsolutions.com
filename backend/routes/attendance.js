const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getAttendanceStatus, getAllAttendance } = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/status', protect, getAttendanceStatus);
router.get('/all', protect, admin, getAllAttendance);

module.exports = router;
