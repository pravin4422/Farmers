const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

// Test 1: Get Crop Recommendations
async function testCropRecommendation() {
  console.log('\n🧪 Testing Crop Recommendation...\n');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/crop-recommendation/recommend`,
      {
        targetYear: 2024,
        targetSeason: 'All'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success!');
    console.log('\n📊 Results:');
    console.log(`Location: ${response.data.userLocation}`);
    console.log(`Land Size: ${response.data.landSize}`);
    console.log(`Records Analyzed: ${response.data.totalRecordsAnalyzed}`);
    
    console.log('\n🌾 Top Recommendations:');
    response.data.topRecommendations.forEach((rec, idx) => {
      console.log(`\n${idx + 1}. ${rec.crop}`);
      console.log(`   Score: ${rec.score.toFixed(1)}/100`);
      console.log(`   Avg Cost: ₹${rec.avgCost.toLocaleString()}`);
      console.log(`   Avg Price: ₹${rec.avgPrice?.toLocaleString() || 'N/A'}`);
      console.log(`   Est. Profit: ₹${rec.estimatedProfit?.toLocaleString() || 'N/A'}`);
      console.log(`   Times Grown: ${rec.timesGrown}`);
      console.log(`   ${rec.recommendation}`);
    });

    console.log('\n💡 Key Insights:');
    console.log(`Most Frequent: ${response.data.insights.mostFrequentCrop}`);
    console.log(`Lowest Cost: ${response.data.insights.lowestCostCrop}`);
    console.log(`Highest Price: ${response.data.insights.highestPriceCrop || 'N/A'}`);
    console.log(`Best Profit: ${response.data.insights.bestProfitCrop || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Test 2: Predict Future Crop
async function testFuturePrediction() {
  console.log('\n\n🧪 Testing Future Crop Prediction...\n');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/crop-recommendation/predict-future`,
      {
        crop: 'Rice',
        targetYear: 2024,
        season: 'Kharif',
        area: 1021721.0,
        rainfall: 935.6
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Success!');
    console.log('\n📈 Prediction Results:');
    console.log(`Crop: ${response.data.crop}`);
    console.log(`Year: ${response.data.targetYear}`);
    console.log(`Season: ${response.data.season}`);
    console.log(`Predicted Yield: ${response.data.predictedYield}`);
    console.log(`Estimated Cost: ₹${response.data.estimatedCost?.toLocaleString()}`);
    console.log(`Estimated Price: ₹${response.data.estimatedPrice?.toLocaleString() || 'N/A'}`);
    console.log(`Estimated Revenue: ₹${response.data.estimatedRevenue?.toLocaleString() || 'N/A'}`);
    console.log(`Estimated Profit: ₹${response.data.estimatedProfit?.toLocaleString() || 'N/A'}`);
    console.log(`Profit Margin: ${response.data.profitMargin || 'N/A'}`);
    console.log(`Recommendation: ${response.data.recommendation}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Crop Recommendation Tests...');
  console.log('=' .repeat(50));
  
  if (TEST_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('\n⚠️  Please update TEST_TOKEN with your actual JWT token');
    console.log('You can get it by logging in and copying from localStorage\n');
    return;
  }

  await testCropRecommendation();
  await testFuturePrediction();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

// Execute tests
runTests();
