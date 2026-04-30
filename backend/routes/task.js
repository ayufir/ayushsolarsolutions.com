const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/Shared
router.get('/my', protect, taskController.getMyTasks);
router.post('/submit', protect, taskController.submitProof);

// Admin Only
router.post('/assign', protect, admin, taskController.assignTask);
router.get('/all', protect, admin, taskController.getAllTasks);
router.put('/review', protect, admin, taskController.reviewTask);

module.exports = router;
