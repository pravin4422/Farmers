import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../css/Prices/Prices.css';

function Prices() {
  const navigate = useNavigate();
  const [userPrices, setUserPrices] = useState([]);
  const [allUserPrices, setAllUserPrices] = useState([]);
  const [apiPrices, setApiPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [analyzingCommodity, setAnalyzingCommodity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [govState, setGovState] = useState('');
  const [govMarket, setGovMarket] = useState('');
  const [govCommodity, setGovCommodity] = useState('');
  const [govDate, setGovDate] = useState('');
  const [formData, setFormData] = useState({
    commodity: '',
    market: '',
    state: '',
    min_price: '',
    max_price: '',
    arrival_date: ''
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUserPrices(), fetchAllUserPrices(), fetchApiPrices()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchUserPrices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/prices/my-prices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserPrices(data);
      } else {
        setUserPrices([]);
      }
    } catch (error) {
      setUserPrices([]);
    }
  };

  const fetchAllUserPrices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/prices/all');
      if (response.ok) {
        const data = await response.json();
        setAllUserPrices(data);
      } else {
        setAllUserPrices([]);
      }
    } catch (error) {
      setAllUserPrices([]);
    }
  };

  const fetchApiPrices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/prices/external');
      if (!response.ok) {
        setApiPrices([]);
        return;
      }
      const data = await response.json();
      const prices = (data.records || []).filter(item => {
        // Validate date
        if (item.arrival_date?.includes('/')) {
          const [day] = item.arrival_date.split('/');
          const dayNum = parseInt(day);
          if (dayNum < 1 || dayNum > 31) return false;
        }
        return true;
      }).map(item => ({
        ...item,
        min_price: (parseFloat(item.min_price) / 100).toFixed(2),
        max_price: (parseFloat(item.max_price) / 100).toFixed(2)
      }));
      setApiPrices(prices);
    } catch (error) {
      setApiPrices([]);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/prices/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        fetchUserPrices();
        fetchAllUserPrices();
        setFormData({ commodity: '', market: '', state: '', min_price: '', max_price: '', arrival_date: '' });
      }
    } catch (error) {
      console.error('Error adding price:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/prices/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchUserPrices();
        fetchAllUserPrices();
      }
    } catch (error) {
      console.error('Error deleting price:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatDateWithDay = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      let date;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        const dayNum = parseInt(day);
        if (dayNum < 1 || dayNum > 31) return 'N/A';
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dateStr);
      }
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    try {
      let date;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        const dayNum = parseInt(day);
        if (dayNum < 1 || dayNum > 31) return false;
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dateStr);
      }
      if (isNaN(date.getTime())) return false;
      const itemDate = date.toISOString().split('T')[0];
      return itemDate === today;
    } catch {
      return false;
    }
  };

  const combinedPrices = [...allUserPrices, ...apiPrices].filter(item => {
    const matchesSearch = !searchQuery || 
      item.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.market?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.state?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !filterDate || item.arrival_date === filterDate;
    const matchesMinPrice = !filterMinPrice || parseFloat(item.min_price) >= parseFloat(filterMinPrice);
    const matchesMaxPrice = !filterMaxPrice || parseFloat(item.max_price) <= parseFloat(filterMaxPrice);
    
    return matchesSearch && matchesDate && matchesMinPrice && matchesMaxPrice;
  });

  const todayPrices = combinedPrices.filter(item => isToday(item.arrival_date));

  const handleExportCSV = () => {
    const headers = ['Commodity', 'Market', 'State', 'Min Price', 'Max Price', 'Date'];
    const csvContent = [headers, ...combinedPrices.map(item => [
      item.commodity, item.market, item.state, item.min_price, item.max_price, item.arrival_date
    ])].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'market_prices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const tableHtml = document.getElementById('price-table').outerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Market Prices Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .today-row { background-color: #e0ffe0; }
          </style>
        </head>
        <body>
          <h1>Market Prices Report</h1>
          ${tableHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchUserPrices(), fetchAllUserPrices(), fetchApiPrices()]);
    setLoading(false);
  };

  const handleSyncPrices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/sync-prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        alert('Government prices synced successfully! Data will be available for graph analysis.');
        await handleRefresh();
      } else {
        alert('❌ Failed to sync prices');
      }
    } catch (error) {
      console.error('Error syncing prices:', error);
      alert('❌ Error syncing prices');
    } finally {
      setLoading(false);
    }
  };

  const handleGraphAnalysis = async (commodity) => {
    setAnalyzingCommodity(commodity);
    setShowGraph(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/price-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ commodity, timeRange: 365 })
      });
      if (response.ok) {
        const data = await response.json();
        setGraphData({
          ...data,
          chartData: data.chartData.map(d => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            avgPrice: parseFloat(d.avgPrice.toFixed(2))
          }))
        });
      }
    } catch (error) {
      console.error('Graph analysis error:', error);
    }
  };

  return (
    <div className="prices-container">
      <h2>Market Prices Dashboard</h2>
      <p>Today: {formatDateWithDay(today)}</p>

      <div className="button-group">
        <button onClick={handleRefresh} disabled={loading}>Refresh</button>
        <button onClick={handleSyncPrices} disabled={loading}>Sync Gov Data</button>
        <button onClick={handleExportCSV}>Export CSV</button>
        <button onClick={handlePrint}>Print</button>
        <button onClick={() => navigate('/price-graph-analysis')}>Graph Analysis</button>
      </div>

      {loading ? (
        <p className="loading">Loading market data...</p>
      ) : (
        <>
          <div className="manual-form">
            <h3>Add New Price Entry</h3>
            <form onSubmit={handleAdd}>
              <input 
                type="text" 
                name="commodity" 
                placeholder="Commodity (e.g., Rice, Wheat)" 
                value={formData.commodity} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="text" 
                name="market" 
                placeholder="Market Name" 
                value={formData.market} 
                onChange={handleChange} 
                required 
              />
              <input 
                type="text" 
                name="state" 
                placeholder="State" 
                value={formData.state} 
                onChange={handleChange} 
                required
              />
              <input 
                type="number" 
                name="min_price" 
                placeholder="Minimum Price (₹)" 
                value={formData.min_price} 
                onChange={handleChange} 
                required
                min="0"
                step="0.01"
              />
              <input 
                type="number" 
                name="max_price" 
                placeholder="Maximum Price (₹)" 
                value={formData.max_price} 
                onChange={handleChange} 
                required
                min="0"
                step="0.01"
              />
              <input 
                type="date" 
                name="arrival_date" 
                value={formData.arrival_date} 
                onChange={handleChange} 
                required 
              />
              <button type="submit">
                Add Price Entry
              </button>
            </form>
          </div>

          <h3> Today's Market Prices ({todayPrices.length} items)</h3>
          {todayPrices.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Commodity</th>
                  <th>Market</th>
                  <th>State</th>
                  <th>Min Price (₹)</th>
                  <th>Max Price (₹)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {todayPrices.map((item, idx) => (
                  <tr key={idx} className="today-row">
                    <td>
                      <strong>{item.commodity}</strong>
                      <button 
                        className="graph-btn" 
                        onClick={() => handleGraphAnalysis(item.commodity)}
                        title="View price trend"
                      >
                        📊
                      </button>
                    </td>
                    <td>{item.market}</td>
                    <td>{item.state}</td>
                    <td>₹{item.min_price}</td>
                    <td>₹{item.max_price}</td>
                    <td>{formatDateWithDay(item.arrival_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No prices available for today</p>
          )}

          <h3>My Manually Entered Prices ({userPrices.length} items)</h3>
          <table>
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Market</th>
                <th>State</th>
                <th>Min Price (₹)</th>
                <th>Max Price (₹)</th>
                <th>Date</th>
                <th>Today?</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {userPrices.filter(item => {
                const matchesSearch = !searchQuery || 
                  item.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.market?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.state?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDate = !filterDate || item.arrival_date === filterDate;
                const matchesMinPrice = !filterMinPrice || parseFloat(item.min_price) >= parseFloat(filterMinPrice);
                const matchesMaxPrice = !filterMaxPrice || parseFloat(item.max_price) <= parseFloat(filterMaxPrice);
                return matchesSearch && matchesDate && matchesMinPrice && matchesMaxPrice;
              }).length > 0 ? userPrices.filter(item => {
                const matchesSearch = !searchQuery || 
                  item.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.market?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.state?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDate = !filterDate || item.arrival_date === filterDate;
                const matchesMinPrice = !filterMinPrice || parseFloat(item.min_price) >= parseFloat(filterMinPrice);
                const matchesMaxPrice = !filterMaxPrice || parseFloat(item.max_price) <= parseFloat(filterMaxPrice);
                return matchesSearch && matchesDate && matchesMinPrice && matchesMaxPrice;
              }).map((item, idx) => {
                const itemIsToday = isToday(item.arrival_date);
                return (
                  <tr key={item._id || idx} className={itemIsToday ? 'today-row' : ''}>
                    <td>
                      <strong>{item.commodity}</strong>
                      <button 
                        className="graph-btn" 
                        onClick={() => handleGraphAnalysis(item.commodity)}
                        title="View price trend"
                      >
                        📊
                      </button>
                    </td>
                    <td>{item.market}</td>
                    <td>{item.state}</td>
                    <td>₹{item.min_price}</td>
                    <td>₹{item.max_price}</td>
                    <td>{formatDateWithDay(item.arrival_date)}</td>
                    <td>
                      <span className="status-badge">
                        {itemIsToday ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item._id)}>Delete</button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" className="no-data">No manually entered prices</td>
                </tr>
              )}
            </tbody>
          </table>

          <h3>Government Market Prices ({apiPrices.filter(item => {
            const matchesState = !govState || item.state?.toLowerCase().includes(govState.toLowerCase());
            const matchesMarket = !govMarket || item.market?.toLowerCase().includes(govMarket.toLowerCase());
            const matchesCommodity = !govCommodity || item.commodity?.toLowerCase().includes(govCommodity.toLowerCase());
            let matchesDate = true;
            if (govDate && item.arrival_date) {
              const [day, month, year] = item.arrival_date.split('/');
              const itemDateStr = `${year}-${month}-${day}`;
              matchesDate = itemDateStr === govDate;
            }
            return matchesState && matchesMarket && matchesCommodity && matchesDate;
          }).length} items)</h3>
          <div className="filters">
            <input 
              type="text" 
              placeholder="Search Commodity" 
              value={govCommodity} 
              onChange={(e) => setGovCommodity(e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Search Market" 
              value={govMarket} 
              onChange={(e) => setGovMarket(e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Search State" 
              value={govState} 
              onChange={(e) => setGovState(e.target.value)} 
            />
            <input 
              type="date" 
              value={govDate} 
              onChange={(e) => setGovDate(e.target.value)} 
            />
          </div>
          <table id="price-table">
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Market</th>
                <th>State</th>
                <th>Min Price (₹)</th>
                <th>Max Price (₹)</th>
                <th>Date</th>
                <th>Today?</th>
              </tr>
            </thead>
            <tbody>
              {apiPrices.filter(item => {
                const matchesState = !govState || item.state?.toLowerCase().includes(govState.toLowerCase());
                const matchesMarket = !govMarket || item.market?.toLowerCase().includes(govMarket.toLowerCase());
                const matchesCommodity = !govCommodity || item.commodity?.toLowerCase().includes(govCommodity.toLowerCase());
                let matchesDate = true;
                if (govDate && item.arrival_date) {
                  const [day, month, year] = item.arrival_date.split('/');
                  const itemDateStr = `${year}-${month}-${day}`;
                  matchesDate = itemDateStr === govDate;
                }
                return matchesState && matchesMarket && matchesCommodity && matchesDate;
              }).length > 0 ? apiPrices.filter(item => {
                const matchesState = !govState || item.state?.toLowerCase().includes(govState.toLowerCase());
                const matchesMarket = !govMarket || item.market?.toLowerCase().includes(govMarket.toLowerCase());
                const matchesCommodity = !govCommodity || item.commodity?.toLowerCase().includes(govCommodity.toLowerCase());
                let matchesDate = true;
                if (govDate && item.arrival_date) {
                  const [day, month, year] = item.arrival_date.split('/');
                  const itemDateStr = `${year}-${month}-${day}`;
                  matchesDate = itemDateStr === govDate;
                }
                return matchesState && matchesMarket && matchesCommodity && matchesDate;
              }).map((item, idx) => {
                const itemIsToday = isToday(item.arrival_date);
                return (
                  <tr key={idx} className={itemIsToday ? 'today-row' : ''}>
                    <td>
                      <strong>{item.commodity}</strong>
                      <button 
                        className="graph-btn" 
                        onClick={() => handleGraphAnalysis(item.commodity)}
                        title="View price trend"
                      >
                        📊
                      </button>
                    </td>
                    <td>{item.market}</td>
                    <td>{item.state}</td>
                    <td>₹{item.min_price}</td>
                    <td>₹{item.max_price}</td>
                    <td>{formatDateWithDay(item.arrival_date)}</td>
                    <td>
                      <span className="status-badge">
                        {itemIsToday ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="no-data">No government prices available</td>
                </tr>
              )}
            </tbody>
          </table>

          <h3>All Users' Market Prices ({allUserPrices.length} items)</h3>
          <table>
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Market</th>
                <th>State</th>
                <th>Min Price (₹)</th>
                <th>Max Price (₹)</th>
                <th>Date</th>
                <th>Today?</th>
              </tr>
            </thead>
            <tbody>
              {allUserPrices.filter(item => {
                const matchesSearch = !searchQuery || 
                  item.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.market?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.state?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDate = !filterDate || item.arrival_date === filterDate;
                const matchesMinPrice = !filterMinPrice || parseFloat(item.min_price) >= parseFloat(filterMinPrice);
                const matchesMaxPrice = !filterMaxPrice || parseFloat(item.max_price) <= parseFloat(filterMaxPrice);
                return matchesSearch && matchesDate && matchesMinPrice && matchesMaxPrice;
              }).length > 0 ? allUserPrices.filter(item => {
                const matchesSearch = !searchQuery || 
                  item.commodity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.market?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.state?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDate = !filterDate || item.arrival_date === filterDate;
                const matchesMinPrice = !filterMinPrice || parseFloat(item.min_price) >= parseFloat(filterMinPrice);
                const matchesMaxPrice = !filterMaxPrice || parseFloat(item.max_price) <= parseFloat(filterMaxPrice);
                return matchesSearch && matchesDate && matchesMinPrice && matchesMaxPrice;
              }).map((item, idx) => {
                const itemIsToday = isToday(item.arrival_date);
                return (
                  <tr key={item._id || idx} className={itemIsToday ? 'today-row' : ''}>
                    <td>
                      <strong>{item.commodity}</strong>
                      <button 
                        className="graph-btn" 
                        onClick={() => handleGraphAnalysis(item.commodity)}
                        title="View price trend"
                      >
                        📊
                      </button>
                    </td>
                    <td>{item.market}</td>
                    <td>{item.state}</td>
                    <td>₹{item.min_price}</td>
                    <td>₹{item.max_price}</td>
                    <td>{formatDateWithDay(item.arrival_date)}</td>
                    <td>
                      <span className="status-badge">
                        {itemIsToday ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="no-data">No prices from other users</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {showGraph && graphData && (
        <div className="graph-modal">
          <div className="graph-content">
            <button className="close-btn" onClick={() => setShowGraph(false)}>✖</button>
            <h3>{analyzingCommodity} - Price Trend Analysis</h3>
            
            <div className="analysis-stats">
              <div className={`stat-box ${graphData.analysis.isProfitable ? 'profit' : 'loss'}`}>
                <label>Price Change</label>
                <div className="stat-value">₹{graphData.analysis.priceDifference}</div>
                <div className="stat-percent">{graphData.analysis.percentChange}</div>
              </div>
              <div className="stat-box">
                <label>Trend</label>
                <div className="stat-value">{graphData.analysis.trend}</div>
              </div>
              <div className="stat-box">
                <label>Oldest Price</label>
                <div className="stat-value">₹{graphData.analysis.oldestPrice.price}</div>
                <div className="stat-date">{new Date(graphData.analysis.oldestPrice.date).toLocaleDateString('en-IN')}</div>
              </div>
              <div className="stat-box">
                <label>Latest Price</label>
                <div className="stat-value">₹{graphData.analysis.latestPrice.price}</div>
                <div className="stat-date">{new Date(graphData.analysis.latestPrice.date).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={graphData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgPrice" stroke="#2563eb" strokeWidth={3} name="Avg Price (₹)" />
                </LineChart>
              </ResponsiveContainer>
              <p className="data-info"> {graphData.analysis.dataPoints} data points from last year</p>
            </div>

            {graphData.aiInsight && graphData.aiInsight !== 'AI analysis unavailable' && (
              <div className="ai-insight">
                <h4> AI Recommendation</h4>
                <p>{graphData.aiInsight}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Prices;