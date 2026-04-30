const Task = require('../models/Task');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'approved' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    
    // Performance: Tasks by employee
    const performance = await Task.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$employee', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: '$employeeInfo' },
      {
        $project: {
          name: '$employeeInfo.name',
          count: 1
        }
      }
    ]);

    res.json({
      stats: {
        totalEmployees,
        totalTasks,
        completedTasks,
        pendingTasks,
        successRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
      },
      performance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
