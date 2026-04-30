const Solar = require('../models/Solar');

exports.getSolars = async (req, res) => {
  try {
    const solars = await Solar.find();
    res.json(solars);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching solar panels', error: err.message });
  }
};

exports.addSolar = async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;
    const newSolar = await Solar.create({ name, latitude, longitude });
    res.status(201).json(newSolar);
  } catch (err) {
    res.status(500).json({ message: 'Error adding solar panel', error: err.message });
  }
};

exports.deleteSolar = async (req, res) => {
  try {
    await Solar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Solar panel removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting solar panel', error: err.message });
  }
};
