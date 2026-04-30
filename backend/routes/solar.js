const express = require('express');
const router = express.Router();
const { getSolars, addSolar, deleteSolar } = require('../controllers/solarController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSolars)          // employees can VIEW solars
  .post(protect, admin, addSolar);  // only admin can ADD

router.route('/:id')
  .delete(protect, admin, deleteSolar);

module.exports = router;
