const Library = require('../models/Library');

exports.getProblems = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const problems = await Library.find({ userId }).sort({ createdAt: -1 });
    res.json(problems);
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addProblem = async (req, res) => {
  try {
    const { problemTitle, category, severity, description, solution, cropAffected, symptoms, symptomsVoice, descriptionVoice, solutionVoice } = req.body;
    
    const userId = req.user._id || req.user.id;
    console.log('Adding problem for user:', userId);
    
    // Check voice data size
    const voiceDataSize = (symptomsVoice?.length || 0) + (descriptionVoice?.length || 0) + (solutionVoice?.length || 0);
    console.log('Voice data size:', voiceDataSize, 'bytes');
    
    if (voiceDataSize > 15000000) { // 15MB limit
      return res.status(400).json({ message: 'Voice recordings too large. Please keep recordings under 2 minutes.' });
    }
    
    const newProblem = new Library({
      problemTitle: problemTitle || 'Untitled',
      category,
      severity,
      description,
      solution,
      cropAffected: cropAffected || 'Not specified',
      symptoms,
      symptomsVoice: symptomsVoice || null,
      descriptionVoice: descriptionVoice || null,
      solutionVoice: solutionVoice || null,
      userId
    });
    
    const savedProblem = await newProblem.save();
    console.log('Problem saved successfully:', savedProblem._id);
    res.status(201).json(savedProblem);
  } catch (error) {
    console.error('Error adding problem:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    
    if (error.message.includes('document is too large')) {
      return res.status(400).json({ message: 'Data too large. Please use shorter voice recordings.' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProblem = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const problem = await Library.findOneAndDelete({ _id: req.params.id, userId });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json({ message: 'Problem deleted' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
