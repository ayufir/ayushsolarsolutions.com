const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  checkIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'present'
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
