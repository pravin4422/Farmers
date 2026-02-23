const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Scheme = require('./models/Scheme');

dotenv.config();

const initialSchemes = [
  {
    name: "Sub‑Mission on Agricultural Mechanization",
    category: "Farm Mechanization",
    image: "/agri.jpg",
    startDate: new Date("2014-01-01"),
    endDate: null,
    details: {
      launch: "2014",
      objective: "Subsidies and custom hiring for farm machinery",
      eligibility: "All farmers; rural entrepreneurs, FPOs, cooperatives for Custom Hiring Centres (CHCs)",
      benefit: "Subsidy on machinery; field demonstrations; CHC setup",
      apply: "Visit your local Agriculture Engineering Department (AED) or Panchayat. Forms available offline.",
      documents: "Aadhaar, land proof, bank details, credentials for entrepreneurs/FPOs.",
      website: "https://aed.tn.gov.in",
      applicationMode: "Offline"
    }
  },
  {
    name: "Pradhan Mantri Kisan Samman Nidhi",
    category: "Income Support",
    image: "/agri.jpg",
    startDate: new Date("2019-02-01"),
    endDate: null,
    details: {
      launch: "2019",
      objective: "Provide direct income support to small and marginal farmers.",
      benefit: "₹6,000 per year in 3 equal installments.",
      eligibility: "All landholding farmer families (except taxpayers and certain professionals).",
      apply: "Online at pmkisan.gov.in or through the local Patwari or CSC.",
      documents: "Aadhaar, bank account, land records.",
      website: "https://pmkisan.gov.in",
      applicationMode: "Online/Offline"
    }
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana",
    category: "Insurance",
    image: "/agri.jpg",
    startDate: new Date("2016-01-01"),
    endDate: null,
    details: {
      launch: "2016",
      objective: "Insurance against crop failure due to natural calamities.",
      benefit: "Premium: Kharif 2%, Rabi 1.5%, Commercial 5%.",
      eligibility: "All farmers including tenants and sharecroppers.",
      apply: "Via banks, CSCs, or the PMFBY portal.",
      documents: "Aadhaar, bank account, land details, sowing certificate.",
      website: "https://pmfby.gov.in",
      applicationMode: "Online"
    }
  }
];

const seedSchemes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing schemes (optional)
    // await Scheme.deleteMany({});
    // console.log('🗑️  Cleared existing schemes');

    // Insert initial schemes
    await Scheme.insertMany(initialSchemes);
    console.log('✅ Seeded initial schemes');

    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding schemes:', error);
    process.exit(1);
  }
};

seedSchemes();
