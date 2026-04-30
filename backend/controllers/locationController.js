const Location = require('../models/Location');
const User = require('../models/User');

exports.updateLocation = async (req, res) => {
  const { latitude, longitude, battery, address } = req.body;
  const userId = req.user.id;

  try {
    const location = await Location.create({
      userId,
      latitude,
      longitude,
      battery,
      address,
      status: 'online',
      timestamp: new Date()
    });

    // We'll also emit this via Socket.IO later, handled in server.js or socket handler
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLiveLocations = async (req, res) => {
  try {
    // Get the most recent location for each employee
    const locations = await Location.aggregate([
      { $sort: { timestamp: -1 } },
      { 
        $group: {
          _id: '$userId',
          latestLocation: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          latitude: '$latestLocation.latitude',
          longitude: '$latestLocation.longitude',
          timestamp: '$latestLocation.timestamp',
          battery: '$latestLocation.battery',
          address: '$latestLocation.address',
          status: '$latestLocation.status',
          'user.name': 1,
          'user.employeeId': 1,
          'user.email': 1
        }
      }
    ]);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  const { userId } = req.params;
  const { date } = req.query; // Expecting YYYY-MM-DD

  try {
    const query = { userId };
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: startDate, $lte: endDate };
    }

    const history = await Location.find(query).sort({ timestamp: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
