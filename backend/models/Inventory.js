const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    unique: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'pcs' // pcs, meters, kg, etc.
  },
  minStockLevel: {
    type: Number,
    default: 5 // Alert if quantity falls below this
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);
