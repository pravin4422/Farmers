const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET all tasks for a user
router.get('/:userId', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.params.userId }).sort({ date: 1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new task
router.post('/', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error saving task' });
  }
});

// PUT – toggle completed
router.put('/:taskId', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error updating task' });
  }
});

// DELETE a task
router.delete('/:taskId', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error deleting task' });
  }
});

module.exports = router;
