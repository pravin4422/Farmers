const Problem = require('../models/Problem');

const createProblem = async (req, res) => {
  try {
    const { title, description, season, year } = req.body;
    
    const problemData = {
      userId: req.user.id,
      title: title || 'Untitled Problem',
      description: description || '',
      season: season || null,
      year: year ? parseInt(year) : null
    };

    const problem = new Problem(problemData);
    const savedProblem = await problem.save();
    
    res.status(201).json(savedProblem);
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ message: 'Server error while creating problem', error: error.message });
  }
};

const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ message: 'Server error while fetching problems' });
  }
};

const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await Problem.findOneAndDelete({ _id: id, userId: req.user.id });
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.status(500).json({ message: 'Server error while deleting problem' });
  }
};

const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, season, year } = req.body;
    
    const problem = await Problem.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        title: title || 'Untitled Problem',
        description: description || '',
        season: season || null,
        year: year ? parseInt(year) : null
      },
      { new: true }
    );
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Error updating problem:', error);
    res.status(500).json({ message: 'Server error while updating problem' });
  }
};

module.exports = {
  createProblem,
  getProblems,
  deleteProblem,
  updateProblem
};
