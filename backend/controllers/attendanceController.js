const Attendance = require('../models/Attendance');

exports.checkIn = async (req, res) => {
  try {
    const { location } = req.body;
    const date = new Date().toISOString().split('T')[0];
    
    let attendance = await Attendance.findOne({ user: req.user.id, date });
    if (attendance) return res.status(400).json({ message: 'Already checked in today' });

    attendance = await Attendance.create({
      user: req.user.id,
      date,
      checkIn: { time: Date.now(), location }
    });
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { location } = req.body;
    const date = new Date().toISOString().split('T')[0];
    
    let attendance = await Attendance.findOne({ user: req.user.id, date });
    if (!attendance) return res.status(400).json({ message: 'No check-in found for today' });
    if (attendance.checkOut?.time) return res.status(400).json({ message: 'Already checked out today' });

    attendance.checkOut = { time: Date.now(), location };
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceStatus = async (req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ user: req.user.id, date });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const list = await Attendance.find().populate('user', 'name employeeId').sort({ date: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
