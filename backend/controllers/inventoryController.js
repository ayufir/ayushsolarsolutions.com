const Inventory = require('../models/Inventory');

exports.getItems = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ itemName: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { itemName, quantity, unit, minStockLevel } = req.body;
    const item = await Inventory.create({ itemName, quantity, unit, minStockLevel });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const item = await Inventory.findByIdAndUpdate(id, { quantity, updatedAt: Date.now() }, { new: true });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
