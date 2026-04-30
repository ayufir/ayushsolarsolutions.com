const express = require('express');
const router = express.Router();
const { getItems, addItem, updateStock, deleteItem } = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getItems);
router.post('/', protect, admin, addItem);
router.put('/:id', protect, admin, updateStock);
router.delete('/:id', protect, admin, deleteItem);

module.exports = router;
