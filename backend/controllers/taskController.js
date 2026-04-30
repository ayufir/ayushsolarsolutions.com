const Task = require('../models/Task');

// Admin: Assign a task
exports.assignTask = async (req, res) => {
  try {
    const { employeeId, title, description, taskLocation } = req.body;
    const task = await Task.create({
      employee: employeeId,
      title,
      description,
      taskLocation
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Get my tasks
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ employee: req.user.id }).sort({ assignedAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee: Submit Proof (Selfie)
exports.submitProof = async (req, res) => {
  try {
    const { taskId, proofImages, location } = req.body;
    const task = await Task.findById(taskId);

    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.employee.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    task.proofImages = proofImages; // Expecting array of base64 strings
    task.locationAtCompletion = location;
    task.status = 'completed';
    task.submittedAt = Date.now();

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get all tasks for review
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('employee', 'name email').sort({ submittedAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Approve/Reject Task
exports.reviewTask = async (req, res) => {
  try {
    const { taskId, status } = req.body; // status: 'approved' or 'rejected'
    const task = await Task.findByIdAndUpdate(taskId, { status }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
