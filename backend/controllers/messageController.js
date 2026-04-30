const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'name role')
      .sort({ timestamp: 1 })
      .limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.create({
      sender: req.user.id,
      text
    });
    const populated = await Message.findById(message._id).populate('sender', 'name role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
