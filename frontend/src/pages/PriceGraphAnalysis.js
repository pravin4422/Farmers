import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../css/PriceGraphAnalysis.css';

function PriceGraphAnalysis() {
  const [commodities, setCommodities] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [priceStats, setPriceStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAvailableCommodities();
  }, []);

  const fetchAvailableCommodities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/prices/all');
      if (response.ok) {
        const data = await response.json();
        console.log(' Fetched all prices:', data.length);
        
        // Normalize commodity names (capitalize first letter, trim spaces)
        const normalizedCommodities = data.map(item => {
          const name = item.commodity.trim();
          return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        });
        const uniqueCommodities = [...new Set(normalizedCommodities)].sort();
        
        console.log(' Available commodities:', uniqueCommodities);
        console.log(' Total unique commodities:', uniqueCommodities.length);
        
        setCommodities(uniqueCommodities);
        if (uniqueCommodities.length > 0) {
          setSelectedCommodity(uniqueCommodities[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching commodities:', error);
    }
  };

  useEffect(() => {
    if (selectedCommodity) {
      fetchPriceData();
    }
  }, [selectedCommodity, timeRange]);

  const fetchPriceData = async () => {
    setLoading(true);
    try {
      let days, startDateCalc, endDateCalc;
      
      if (customDateRange && startDate && endDate) {
        startDateCalc = new Date(startDate);
        endDateCalc = new Date(endDate);
        endDateCalc.setHours(23, 59, 59, 999);
      } else {
        days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === '3months' ? 90 : 365;
      }
      
      // Fetch all prices for the commodity
      const response = await fetch('http://localhost:5000/api/prices/all');

      if (response.ok) {
        const allPrices = await response.json();
        
        console.log('Total prices fetched:', allPrices.length);
        console.log('All commodities:', [...new Set(allPrices.map(p => p.commodity))]);
        console.log('Data sources:', {
          userEntries: allPrices.filter(p => p.userId).length,
          governmentData: allPrices.filter(p => !p.userId).length
        });
        
        // Filter by commodity first
        const commodityPrices = allPrices.filter(item => 
          item.commodity.toLowerCase() === selectedCommodity.toLowerCase()
        );
        
        console.log('Prices for', selectedCommodity + ':', commodityPrices.length);
        console.log('Sources:', {
          user: commodityPrices.filter(p => p.userId).length,
          government: commodityPrices.filter(p => !p.userId).length
        });
        
        if (commodityPrices.length > 0) {
          // Find the actual date range in the data
          const allDates = commodityPrices.map(p => new Date(p.arrival_date));
          const maxDataDate = new Date(Math.max(...allDates));
          const minDataDate = new Date(Math.min(...allDates));
          
          // Use custom date range or calculate from days
          let endDate, startDate;
          if (customDateRange && startDateCalc && endDateCalc) {
            startDate = startDateCalc;
            endDate = endDateCalc;
          } else {
            endDate = new Date(maxDataDate);
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - (days - 1));
            startDate.setHours(0, 0, 0, 0);
          }
          
          console.log('Using date range:', startDate.toDateString(), 'to', endDate.toDateString());
          
          // Filter by date range
          const filteredPrices = commodityPrices.filter(item => {
            const itemDate = new Date(item.arrival_date);
            return itemDate >= startDate && itemDate <= endDate;
          });
          
          console.log('Filtered prices in range:', filteredPrices.length);
          
          // Create separate maps for user and government data
          const dataMap = new Map();
          const userDataMap = new Map();
          const govDataMap = new Map();
          
          filteredPrices.forEach(item => {
            const itemDate = new Date(item.arrival_date);
            itemDate.setHours(0, 0, 0, 0);
            const dateKey = itemDate.toISOString().split('T')[0];
            
            const avgPrice = (parseFloat(item.min_price) + parseFloat(item.max_price)) / 2;
            const isUserEntry = !!item.userId;
            
            // Store in appropriate map
            const targetMap = isUserEntry ? userDataMap : govDataMap;
            
            if (targetMap.has(dateKey)) {
              const existing = targetMap.get(dateKey);
              targetMap.set(dateKey, {
                avgPrice: (existing.avgPrice + avgPrice) / 2,
                minPrice: Math.min(existing.minPrice, parseFloat(item.min_price)),
                maxPrice: Math.max(existing.maxPrice, parseFloat(item.max_price)),
                count: existing.count + 1
              });
            } else {
              targetMap.set(dateKey, {
                avgPrice: avgPrice,
                minPrice: parseFloat(item.min_price),
                maxPrice: parseFloat(item.max_price),
                count: 1
              });
            }
            
            // Combined data map for overall view
            if (dataMap.has(dateKey)) {
              const existing = dataMap.get(dateKey);
              dataMap.set(dateKey, {
                avgPrice: (existing.avgPrice + avgPrice) / 2,
                minPrice: Math.min(existing.minPrice, parseFloat(item.min_price)),
                maxPrice: Math.max(existing.maxPrice, parseFloat(item.max_price))
              });
            } else {
              dataMap.set(dateKey, {
                avgPrice: avgPrice,
                minPrice: parseFloat(item.min_price),
                maxPrice: parseFloat(item.max_price)
              });
            }
          });
          
          console.log('Data map has', dataMap.size, 'unique dates');
          
          // Fill all dates in the range
          const filledData = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const dateStr = currentDate.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short',
              year: timeRange === 'year' ? '2-digit' : undefined
            });
            
            const hasData = dataMap.has(dateKey);
            const hasUserData = userDataMap.has(dateKey);
            const hasGovData = govDataMap.has(dateKey);
            
            if (hasData) {
              const priceData = dataMap.get(dateKey);
              const userData = userDataMap.get(dateKey);
              const govData = govDataMap.get(dateKey);
              
              filledData.push({
                date: dateStr,
                avgPrice: parseFloat(priceData.avgPrice.toFixed(2)),
                minPrice: parseFloat(priceData.minPrice.toFixed(2)),
                maxPrice: parseFloat(priceData.maxPrice.toFixed(2)),
                userPrice: userData ? parseFloat(userData.avgPrice.toFixed(2)) : null,
                govPrice: govData ? parseFloat(govData.avgPrice.toFixed(2)) : null,
                hasUserEntry: hasUserData,
                hasGovEntry: hasGovData,
                fullDate: new Date(currentDate)
              });
            } else {
              filledData.push({
                date: dateStr,
                avgPrice: null,
                minPrice: null,
                maxPrice: null,
                userPrice: null,
                govPrice: null,
                hasUserEntry: false,
                hasGovEntry: false,
                fullDate: new Date(currentDate)
              });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          console.log('Filled data:', filledData.length, 'dates');
          console.log('First date:', filledData[0]?.date, 'Last date:', filledData[filledData.length - 1]?.date);
          console.log('Data points with prices:', filledData.filter(d => d.avgPrice !== null).length);

          setChartData(filledData);
          
          // Calculate stats
          const pricesWithData = filledData.filter(d => d.avgPrice !== null);
          if (pricesWithData.length >= 2) {
            const oldestPrice = pricesWithData[0];
            const latestPrice = pricesWithData[pricesWithData.length - 1];
            const priceDiff = latestPrice.avgPrice - oldestPrice.avgPrice;
            const percentChange = ((priceDiff / oldestPrice.avgPrice) * 100).toFixed(2);
            
            setPriceStats({
              commodity: selectedCommodity,
              oldestPrice: { price: oldestPrice.avgPrice.toFixed(2), date: oldestPrice.fullDate },
              latestPrice: { price: latestPrice.avgPrice.toFixed(2), date: latestPrice.fullDate },
              priceDifference: priceDiff.toFixed(2),
              percentChange: percentChange,
              trend: priceDiff > 0 ? 'Rising' : priceDiff < 0 ? 'Falling' : 'Stable',
              isProfitable: priceDiff > 0,
              dataPoints: pricesWithData.length
            });
          } else {
            setPriceStats(null);
          }
        } else {
          console.log('No prices found for commodity:', selectedCommodity);
          setChartData([]);
          setPriceStats(null);
        }
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setLoading(false);
    }
  };


  const getPercentageChange = () => {
    if (!priceStats) return null;
    const change = parseFloat(priceStats.percentChange);
    return {
      value: Math.abs(change).toFixed(2),
      isPositive: change >= 0
    };
  };

  return (
    <div className="price-graph-container">
      <div className="graph-header">
        <h1>Market Price Analysis</h1>
        <p>Track commodity price trends like stock market</p>
      </div>

      <div className="controls-panel">
        <div className="control-group">
          <label>Select Commodity:</label>
          <select value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)}>
            {commodities.map(commodity => (
              <option key={commodity} value={commodity}>{commodity}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Time Range:</label>
          <div className="time-buttons">
            <button 
              className={timeRange === 'week' && !customDateRange ? 'active' : ''} 
              onClick={() => { setTimeRange('week'); setCustomDateRange(false); }}
            >
              1 Week
            </button>
            <button 
              className={timeRange === 'month' && !customDateRange ? 'active' : ''} 
              onClick={() => { setTimeRange('month'); setCustomDateRange(false); }}
            >
              1 Month
            </button>
            <button 
              className={timeRange === '3months' && !customDateRange ? 'active' : ''} 
              onClick={() => { setTimeRange('3months'); setCustomDateRange(false); }}
            >
              3 Months
            </button>
            <button 
              className={timeRange === 'year' && !customDateRange ? 'active' : ''} 
              onClick={() => { setTimeRange('year'); setCustomDateRange(false); }}
            >
              1 Year
            </button>
            <button 
              className={customDateRange ? 'active' : ''} 
              onClick={() => setCustomDateRange(!customDateRange)}
            >
              Custom
            </button>
          </div>
          {customDateRange && (
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '2px solid #e0e0e0' }}
              />
              <span>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '2px solid #e0e0e0' }}
              />
              <button 
                onClick={fetchPriceData}
                style={{ padding: '8px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading price data...</p>
        </div>
      ) : (
        <>
          {priceStats && (
            <div className="stats-dashboard">
              <div className="stat-card">
                <div className="stat-label">Current Price</div>
                <div className="stat-value">₹{priceStats.latestPrice.price}</div>
                <div className="stat-date">{new Date(priceStats.latestPrice.date).toLocaleDateString('en-IN')}</div>
              </div>

              <div className={`stat-card ${getPercentageChange()?.isPositive ? 'positive' : 'negative'}`}>
                <div className="stat-label">Price Change</div>
                <div className="stat-value">
                  {getPercentageChange()?.isPositive ? '▲' : '▼'} {getPercentageChange()?.value}%
                </div>
                <div className="stat-change">₹{priceStats.priceDifference}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Trend</div>
                <div className="stat-value">{priceStats.trend}</div>
                <div className="stat-info">{priceStats.dataPoints} data points</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Starting Price</div>
                <div className="stat-value">₹{priceStats.oldestPrice.price}</div>
                <div className="stat-date">{new Date(priceStats.oldestPrice.date).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          )}

          <div className="chart-section">
            <h2>{selectedCommodity} - Price Movement</h2>
            <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '15px', borderRadius: '8px', fontSize: '0.9rem' }}>
              <strong>Debug Info:</strong> Showing {chartData.length} dates | 
              Data points: {chartData.filter(d => d.avgPrice !== null).length} | 
              Empty dates: {chartData.filter(d => d.avgPrice === null).length}
            </div>
            {chartData.length > 0 ? (
              <>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <ResponsiveContainer width={Math.max(chartData.length * 60, 800)} height={500}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft' }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '2px solid #2e7d32',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                        formatter={(value) => value !== null ? `₹${value}` : 'No data'}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div style={{ backgroundColor: '#fff', border: '2px solid #2e7d32', borderRadius: '8px', padding: '10px' }}>
                                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.date}</p>
                                {data.avgPrice && <p style={{ margin: '3px 0', color: '#2e7d32' }}>Avg: ₹{data.avgPrice}</p>}
                                {data.userPrice && <p style={{ margin: '3px 0', color: '#ff6b35' }}>👤 Your Entry: ₹{data.userPrice}</p>}
                                {data.govPrice && <p style={{ margin: '3px 0', color: '#1976d2' }}>🏛️ Govt Data: ₹{data.govPrice}</p>}
                                {data.minPrice && <p style={{ margin: '3px 0', fontSize: '0.85em' }}>Min: ₹{data.minPrice}</p>}
                                {data.maxPrice && <p style={{ margin: '3px 0', fontSize: '0.85em' }}>Max: ₹{data.maxPrice}</p>}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgPrice" 
                        stroke="#2e7d32" 
                        strokeWidth={3}
                        name="Average Price"
                        dot={{ fill: '#2e7d32', r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="userPrice" 
                        stroke="#ff6b35" 
                        strokeWidth={3}
                        name="👤 Your Entries"
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          if (payload.hasUserEntry) {
                            return (
                              <g>
                                <circle cx={cx} cy={cy} r={6} fill="#ff6b35" stroke="#fff" strokeWidth={2} />
                                <text x={cx} y={cy - 12} textAnchor="middle" fill="#ff6b35" fontSize="16">📍</text>
                              </g>
                            );
                          }
                          return null;
                        }}
                        activeDot={{ r: 8 }}
                        connectNulls={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="govPrice" 
                        stroke="#1976d2" 
                        strokeWidth={2}
                        name="🏛️ Government Data"
                        dot={{ fill: '#1976d2', r: 3 }}
                        strokeDasharray="5 5"
                        connectNulls={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="minPrice" 
                        stroke="#9e9e9e" 
                        strokeWidth={1}
                        name="Min Price"
                        strokeDasharray="3 3"
                        connectNulls={true}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="maxPrice" 
                        stroke="#9e9e9e" 
                        strokeWidth={1}
                        name="Max Price"
                        strokeDasharray="3 3"
                        connectNulls={true}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend-info">
                  <p className="chart-note">
                    Showing all {chartData.length} dates in the selected range. Lines connect dates with available price data.
                  </p>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '20px' }}></span>
                      <span>Your manually entered prices</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '20px', height: '3px', background: '#ff6b35' }}></div>
                      <span>User Entry Line</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '20px', height: '3px', background: '#1976d2', borderTop: '2px dashed #1976d2' }}></div>
                      <span>Government Data Line</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-data-message">
                <p>No price data available for {selectedCommodity} in the selected time range</p>
              </div>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="price-table-section">
              <h3> Detailed Price History</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Min Price (₹)</th>
                      <th>Avg Price (₹)<br/><span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>(👤 User / 🏛️ Govt)</span></th>
                      <th>Max Price (₹)</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.filter(item => item.avgPrice !== null).map((item, index, filteredArray) => {
                      const prevItem = index > 0 ? filteredArray[index - 1] : null;
                      const change = prevItem ? item.avgPrice - prevItem.avgPrice : 0;
                      const changePercent = prevItem ? ((change / prevItem.avgPrice) * 100).toFixed(2) : 0;
                      
                      return (
                        <tr key={index} className={item.hasUserEntry ? 'user-entry-row' : ''}>
                          <td>
                            {item.hasUserEntry && <span style={{ marginRight: '5px' }}></span>}
                            {item.date}
                            {item.hasUserEntry && <span style={{ marginLeft: '5px', fontSize: '0.8em', color: '#ff6b35' }}>(Your Entry)</span>}
                          </td>
                          <td>₹{item.minPrice}</td>
                          <td className="highlight">
                            ₹{item.avgPrice}
                            {item.userPrice && item.govPrice && (
                              <div style={{ fontSize: '0.8em', color: '#666', marginTop: '3px' }}>
                                <div>👤 ₹{item.userPrice}</div>
                                <div>🏛️ ₹{item.govPrice}</div>
                              </div>
                            )}
                          </td>
                          <td>₹{item.maxPrice}</td>
                          <td className={change >= 0 ? 'positive' : 'negative'}>
                            {index === 0 ? '-' : `${change >= 0 ? '▲' : '▼'} ₹${Math.abs(change).toFixed(2)} (${Math.abs(changePercent)}%)`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PriceGraphAnalysis;
