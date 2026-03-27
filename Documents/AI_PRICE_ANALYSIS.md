# AI Price Analysis Feature - Documentation

## Overview
The AI Price Analysis feature provides intelligent market price trend analysis with profit/loss calculations, helping farmers make data-driven decisions about when to sell their produce.

## Features

### 1. Price Trend Analysis
- Analyze commodity prices over customizable time periods (30 days to 1 year)
- Calculate price differences and percentage changes
- Determine profit/loss trends
- AI-powered insights and recommendations

### 2. Visual Charts
- Interactive line charts showing price trends
- Display min, max, and average prices
- Date-based price tracking
- Responsive design for all devices

### 3. AI Insights
- Automated profit/loss analysis
- Market trend identification (rising/falling/stable)
- Actionable recommendations (sell now/wait/store)
- Context-aware advice based on historical data

## API Endpoints

### Analyze Price Trends
**Endpoint:** `POST /api/price-analysis/analyze`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "commodity": "Rice",
  "timeRange": 365,
  "market": "Delhi" (optional),
  "state": "Delhi" (optional)
}
```

**Response:**
```json
{
  "analysis": {
    "commodity": "Rice",
    "timeRange": "365 days",
    "oldestPrice": {
      "date": "2024-01-15",
      "price": "2500.00"
    },
    "latestPrice": {
      "date": "2025-01-15",
      "price": "2800.00"
    },
    "priceDifference": "300.00",
    "percentChange": "12.00%",
    "trend": "Rising",
    "isProfitable": true,
    "dataPoints": 45
  },
  "chartData": [
    {
      "date": "2024-01-15",
      "avgPrice": 2500,
      "minPrice": 2400,
      "maxPrice": 2600,
      "market": "Delhi"
    }
  ],
  "aiInsight": "The rice market shows a positive trend with 12% price increase over the past year. This is profitable for farmers. The rising trend suggests good market conditions. Recommendation: Current prices are favorable for selling, but monitor for further increases."
}
```

### Compare Commodities
**Endpoint:** `POST /api/price-analysis/compare`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "commodities": ["Rice", "Wheat", "Maize"],
  "timeRange": 365
}
```

**Response:**
```json
{
  "comparisons": [
    {
      "commodity": "Rice",
      "oldPrice": "2500.00",
      "currentPrice": "2800.00",
      "change": "300.00",
      "percentChange": "12.00%",
      "isProfitable": true
    }
  ],
  "aiRecommendation": "Rice shows the best profit potential with 12% growth, followed by Wheat at 8%. Consider focusing on rice cultivation for maximum returns."
}
```

## Frontend Usage

### Import Component
```javascript
import PriceAnalysis from './pages/PriceAnalysis';
```

### Add Route
```javascript
<Route path="/price-analysis" element={
  <ProtectedRoute>
    <PriceAnalysis />
  </ProtectedRoute>
} />
```

### Component Features
- Commodity search with autocomplete
- Time range selection (30 days, 3 months, 6 months, 1 year)
- Optional market and state filters
- Real-time chart updates
- Profit/loss indicators with color coding
- Responsive design for mobile and desktop

## Setup Instructions

### 1. Backend Setup

Add to `server.js`:
```javascript
const priceAnalysisRoutes = require('./routes/priceAnalysisRoutes');
app.use('/api/price-analysis', priceAnalysisRoutes);
```

### 2. Environment Variables

Add to `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

### 3. Install Dependencies

Backend (already included):
- @google/generative-ai

Frontend (already included):
- recharts

### 4. Start Services

```bash
# Backend
cd backbone-backend
npm start

# Frontend
cd frontend
npm start
```

## Usage Examples

### Example 1: Analyze Rice Prices (1 Year)
```javascript
const response = await api.post('/price-analysis/analyze', {
  commodity: 'Rice',
  timeRange: 365
});
```

### Example 2: Analyze with Filters
```javascript
const response = await api.post('/price-analysis/analyze', {
  commodity: 'Wheat',
  timeRange: 180,
  market: 'Mumbai',
  state: 'Maharashtra'
});
```

### Example 3: Compare Multiple Commodities
```javascript
const response = await api.post('/price-analysis/compare', {
  commodities: ['Rice', 'Wheat', 'Maize', 'Bajra'],
  timeRange: 365
});
```

## AI Analysis Capabilities

The AI provides insights on:

1. **Profitability Assessment**
   - Determines if price trends are favorable for farmers
   - Calculates profit/loss percentages
   - Compares historical vs current prices

2. **Market Trend Identification**
   - Rising: Prices increasing over time
   - Falling: Prices decreasing over time
   - Stable: Minimal price fluctuation

3. **Actionable Recommendations**
   - Sell now: Prices at peak or declining
   - Wait: Prices expected to rise further
   - Store: Market conditions unfavorable

4. **Comparative Analysis**
   - Best performing commodities
   - Investment recommendations
   - Risk assessment

## Data Requirements

### Minimum Data Points
- At least 1 price record for analysis
- More data points = better AI insights
- Recommended: 10+ records for accurate trends

### Data Quality
- Accurate arrival dates
- Valid min/max prices
- Consistent commodity naming
- Regular data updates

## Error Handling

### Common Errors

1. **No Data Found**
```json
{
  "message": "No price data found for analysis"
}
```
Solution: Add price records for the commodity

2. **Missing Commodity**
```json
{
  "message": "Commodity is required"
}
```
Solution: Provide commodity name in request

3. **AI Unavailable**
- Falls back to basic analysis
- Shows "AI analysis unavailable"
- Ensure GEMINI_API_KEY is set

## Best Practices

1. **Regular Data Updates**
   - Add price records frequently
   - Keep data current for accurate analysis

2. **Consistent Naming**
   - Use standard commodity names
   - Avoid typos and variations

3. **Time Range Selection**
   - Short term (30-90 days): Quick trends
   - Long term (6-12 months): Seasonal patterns

4. **Filter Usage**
   - Use market/state filters for localized analysis
   - Leave blank for broader trends

## Future Enhancements

- [ ] Seasonal pattern detection
- [ ] Price prediction (future forecasting)
- [ ] Multi-market comparison
- [ ] Export analysis reports (PDF/Excel)
- [ ] Price alerts and notifications
- [ ] Historical comparison (year-over-year)
- [ ] Weather impact correlation
- [ ] Demand-supply analysis

## Troubleshooting

### Chart Not Displaying
- Check if chartData has records
- Verify recharts is installed
- Check browser console for errors

### AI Insights Not Working
- Verify GEMINI_API_KEY in .env
- Check API key validity
- Review backend logs for errors

### Slow Analysis
- Reduce time range
- Add database indexes on arrival_date
- Optimize query filters

## Support

For issues or questions:
1. Check backend logs: `npm start` output
2. Check frontend console: Browser DevTools
3. Verify API endpoints: Test with Postman
4. Review error messages in UI

## License
Part of Backbone Agricultural Management System
