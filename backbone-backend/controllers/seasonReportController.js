const SeasonReport = require('../models/SeasonReport');

exports.createReport = async (req, res) => {
  try {
    const { season, year, productName, totalYield, numberOfBags, totalAmount } = req.body;
    
    const report = new SeasonReport({
      user: req.user.id,
      season,
      year,
      productName,
      totalYield,
      numberOfBags,
      totalAmount
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { season, year } = req.query;
    const query = { user: req.user.id };
    
    if (season) query.season = season;
    if (year) query.year = parseInt(year);

    const reports = await SeasonReport.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

exports.getLatestReport = async (req, res) => {
  try {
    const { season, year } = req.query;
    const query = { user: req.user.id };
    
    if (season) query.season = season;
    if (year) query.year = parseInt(year);

    const report = await SeasonReport.findOne(query).sort({ createdAt: -1 });
    
    if (!report) {
      return res.status(404).json({ message: 'No report found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching latest report', error: error.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { season, year, productName, totalYield, numberOfBags, totalAmount } = req.body;

    const report = await SeasonReport.findOne({ _id: id, user: req.user.id });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.season = season;
    report.year = year;
    report.productName = productName;
    report.totalYield = totalYield;
    report.numberOfBags = numberOfBags;
    report.totalAmount = totalAmount;
    report.updatedAt = Date.now();

    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error updating report', error: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await SeasonReport.findOneAndDelete({ _id: id, user: req.user.id });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
};
