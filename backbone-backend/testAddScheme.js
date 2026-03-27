const axios = require('axios');

const testScheme = {
  name: "Test Scheme",
  category: "Test Category",
  startDate: "2024-01-01",
  endDate: null,
  image: "/agri.jpg",
  details: {
    launch: "2024",
    objective: "Test objective",
    benefit: "Test benefit",
    eligibility: "Test eligibility",
    apply: "Test apply",
    documents: "Test documents",
    website: "https://test.com",
    applicationMode: "Online"
  }
};

axios.post('http://localhost:5000/api/schemes/add', testScheme)
  .then(response => {
    console.log('✅ Success! Scheme added:');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('❌ Error adding scheme:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  });
