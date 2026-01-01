const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const protect = require('../middleware/authMiddleware');

// GET all tasks for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new task
router.post('/', protect, async (req, res) => {
  try {
    const newTask = new Task({
      ...req.body,
      userId: req.user._id
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error saving task' });
  }
});

// PUT – toggle completed
router.put('/:taskId', protect, async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.taskId, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error updating task' });
  }
});

// DELETE a task
router.delete('/:taskId', protect, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.taskId, userId: req.user._id });
    if (!deletedTask) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error deleting task' });
  }
});

module.exports = router;
