import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';
import '../css/PriceAnalysis.css';

function PriceAnalysis() {
  const [commodity, setCommodity] = useState('');
  const [timeRange, setTimeRange] = useState(365);
  const [market, setMarket] = useState('');
  const [state, setState] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/price-analysis/analyze', {
        commodity,
        timeRange,
        market: market || undefined,
        state: state || undefined
      });

      setAnalysis(response.data.analysis);
      setChartData(response.data.chartData.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString()
      })));
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-analysis-container">
      <h2>AI Price Trend Analysis</h2>

      <form onSubmit={handleAnalyze} className="analysis-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Commodity (e.g., Rice, Wheat)"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            required
          />
          <select value={timeRange} onChange={(e) => setTimeRange(Number(e.target.value))}>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 3 Months</option>
            <option value={180}>Last 6 Months</option>
            <option value={365}>Last 1 Year</option>
          </select>
        </div>

        <div className="form-row">
          <input
            type="text"
            placeholder="Market (optional)"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          />
          <input
            type="text"
            placeholder="State (optional)"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Trends'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {analysis && (
        <div className="analysis-results">
          <div className="analysis-summary">
            <h3>{analysis.commodity} Price Analysis</h3>
            <div className="stats-grid">
              <div className={`stat-card ${analysis.isProfitable ? 'profit' : 'loss'}`}>
                <label>Price Change</label>
                <span className="value">₹{analysis.priceDifference}</span>
                <span className="percent">{analysis.percentChange}</span>
              </div>
              <div className="stat-card">
                <label>Trend</label>
                <span className="value">{analysis.trend}</span>
              </div>
              <div className="stat-card">
                <label>Old Price</label>
                <span className="value">₹{analysis.oldestPrice.price}</span>
                <span className="date">{new Date(analysis.oldestPrice.date).toLocaleDateString()}</span>
              </div>
              <div className="stat-card">
                <label>Current Price</label>
                <span className="value">₹{analysis.latestPrice.price}</span>
                <span className="date">{new Date(analysis.latestPrice.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="chart-container">
              <h4>Price Trend Chart ({analysis.dataPoints} data points)</h4>
              <p className="data-source">📊 Data from: User entries + Government market records</p>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgPrice" stroke="#2563eb" name="Avg Price" strokeWidth={2} />
                  <Line type="monotone" dataKey="minPrice" stroke="#10b981" name="Min Price" />
                  <Line type="monotone" dataKey="maxPrice" stroke="#ef4444" name="Max Price" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PriceAnalysis;
