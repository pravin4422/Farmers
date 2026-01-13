import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../css/Prices/Prices.css';

function Prices() {
  const [userPrices, setUserPrices] = useState([]);
  const [apiPrices, setApiPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
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
    fetchUserPrices();
    fetchApiPrices();
  }, []);

  const fetchUserPrices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/prices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setUserPrices(data);
    } catch (error) {
      console.error('Error fetching user prices:', error);
    }
  };

  const fetchApiPrices = async () => {
    try {
      const response = await fetch('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=100');
      const data = await response.json();
      setApiPrices(data.records || []);
    } catch (error) {
      console.error('Error fetching API prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/prices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        fetchUserPrices();
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
      if (response.ok) fetchUserPrices();
    } catch (error) {
      console.error('Error deleting price:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatDateWithDay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (dateStr) => {
    return dateStr === today;
  };

  const combinedPrices = [...userPrices, ...apiPrices].filter(item => {
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

  const chartData = [];
  const priceMap = {};

  combinedPrices.forEach(item => {
    const key = item.commodity;
    const avg = (parseFloat(item.min_price) + parseFloat(item.max_price)) / 2 || 0;
    if (!priceMap[key]) {
      priceMap[key] = { commodity: key, total: avg, count: 1 };
    } else {
      priceMap[key].total += avg;
      priceMap[key].count += 1;
    }
  });

  Object.values(priceMap).forEach(entry => {
    chartData.push({
      commodity: entry.commodity,
      avgPrice: parseFloat((entry.total / entry.count).toFixed(2))
    });
  });

  return (
    <div className="prices-container">
      <h2>Market Prices Dashboard</h2>
      <p>Today: {formatDateWithDay(today)}</p>

      <div className="filters">
        <input 
          type="text" 
          placeholder=" Search Commodity/Market/State" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        <input 
          type="date" 
          value={filterDate} 
          onChange={(e) => setFilterDate(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Min Price (₹)" 
          value={filterMinPrice} 
          onChange={(e) => setFilterMinPrice(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Max Price (₹)" 
          value={filterMaxPrice} 
          onChange={(e) => setFilterMaxPrice(e.target.value)} 
        />
      </div>

      <div className="button-group">
        <button onClick={handleExportCSV}> Export to CSV</button>
        <button onClick={handlePrint}> Print Report</button>
      </div>

      {loading ? (
        <p className="loading">Loading market data...</p>
      ) : (
        <>
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
                    <td><strong>{item.commodity}</strong></td>
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

          <h3> All Market Prices</h3>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {combinedPrices.length > 0 ? combinedPrices.map((item, idx) => {
                const itemIsToday = isToday(item.arrival_date);
                const isUserPrice = userPrices.some(p => p._id === item._id);
                return (
                  <tr key={item._id || idx} className={itemIsToday ? 'today-row' : ''}>
                    <td><strong>{item.commodity}</strong></td>
                    <td>{item.market}</td>
                    <td>{item.state}</td>
                    <td>₹{item.min_price}</td>
                    <td>₹{item.max_price}</td>
                    <td>{formatDateWithDay(item.arrival_date)}</td>
                    <td>
                      <span className="status-badge">
                        {itemIsToday ? '✅ Yes' : '❌ No'}
                      </span>
                    </td>
                    <td>
                      {isUserPrice && (
                        <button onClick={() => handleDelete(item._id)}> Delete</button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" className="no-data">No data available</td>
                </tr>
              )}
            </tbody>
          </table>

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
                ➕ Add Price Entry
              </button>
            </form>
          </div>

          {chartData.length > 0 && (
            <div className="chart-container">
              <h3> Average Price by Commodity</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                  <XAxis 
                    dataKey="commodity" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Avg Price']}
                    labelStyle={{ color: '#2c3e50' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="avgPrice" 
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3498db" />
                      <stop offset="100%" stopColor="#2980b9" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Prices;