import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import '../../css/AgroChemicals/AgroChemical.css';

// Constants moved outside component
const TABS = ["Crop Protection", "Plant Nutrition", "Speciality Products"];

const TRANSLATIONS = {
  ta: {
    title: "விவசாயத் தீர்வுகள்",
    subtitle: "பயிர் உற்பத்தியை மேம்படுத்த உருவாக்கப்பட்ட எங்கள் முழுமையான வேளாண் தயாரிப்புகளை கண்டறியுங்கள்",
    tabs: {
      "Crop Protection": "பயிர் பாதுகாப்பு",
      "Plant Nutrition": "தாவர ஊட்டச்சத்து",
      "Speciality Products": "சிறப்பு தயாரிப்புகள்",
    },
    view: "தயாரிப்புகளை பார்க்கவும்",
    count: "வகைகள் கிடைக்கின்றன",
    loading: "ஏற்றப்படுகிறது...",
    switchLang: "Switch to English",
  },
  en: {
    title: "Agricultural Solutions",
    subtitle: "Discover our comprehensive range of agricultural products designed to enhance crop productivity",
    tabs: {
      "Crop Protection": "Crop Protection",
      "Plant Nutrition": "Plant Nutrition",
      "Speciality Products": "Speciality Products",
    },
    view: "View Products",
    count: "categories available",
    loading: "Loading...",
    switchLang: "தமிழில் காண்க",
  },
};

const CATEGORIES = {
  "Crop Protection": [
    { id: 1, name: "Insecticides", desc: "Controls harmful insects", path: "insecticides" },
    { id: 2, name: "Herbicides", desc: "Weed control solutions", path: "herbicides" },
    { id: 3, name: "Fungicides", desc: "Fungal disease control", path: "fungicides" },
  ],
  "Plant Nutrition": [
    { id: 4, name: "Macro Nutrients", desc: "Essential nutrients for growth", path: "macro" },
    { id: 5, name: "Micro Nutrients", desc: "Trace elements for health", path: "micro" },
  ],
  "Speciality Products": [
    { id: 6, name: "Biostimulants", desc: "Natural growth enhancers", path: "biostimulants" },
    { id: 7, name: "Seed Coatings", desc: "Protective seed treatments", path: "seeds" },
  ],
};

// CategoryCard component extracted and memoized
const CategoryCard = React.memo(({ item, language, onCardClick }) => {
  const handleClick = () => onCardClick(item.path);
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="chemical-card"
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`View ${item.name} products`}
    >
      <img
        src={`https://via.placeholder.com/400x250?text=${item.name}`}
        alt={item.name}
        className="card-image"
        loading="lazy"
      />
      <div className="card-content">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <span className="view-btn">{TRANSLATIONS[language].view}</span>
      </div>
    </div>
  );
});

CategoryCard.displayName = 'CategoryCard';

CategoryCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
  }).isRequired,
  language: PropTypes.oneOf(['en', 'ta']).isRequired,
  onCardClick: PropTypes.func.isRequired,
};

const AgroChemicalCategories = () => {
  const [activeTab, setActiveTab] = useState(() => 
    sessionStorage.getItem("agroChemicalActiveTab") || "Crop Protection"
  );
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  const t = TRANSLATIONS[language];
  const currentCategories = CATEGORIES[activeTab];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem("agroChemicalActiveTab", tab);
  };

  const handleCardClick = (path) => {
    setLoading(true);
    setTimeout(() => {
      navigate(`/agromedical/${path}`);
      setLoading(false);
    }, 500);
  };

  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === "ta" ? "en" : "ta"));
  };

  return (
    <div className="agro-container">
      <header className="agro-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <button 
          className="lang-toggle" 
          onClick={handleLanguageToggle}
          aria-label={t.switchLang}
        >
          {t.switchLang}
        </button>
      </header>

      <nav className="agro-tabs" role="tablist" aria-label="Product categories">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => handleTabChange(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
          >
            {t.tabs[tab]}
          </button>
        ))}
      </nav>

      <main className="agro-grid" id={`panel-${activeTab}`} role="tabpanel">
        <h2>{t.tabs[activeTab]}</h2>
        <p>
          {currentCategories.length} {t.count}
        </p>

        <div className="grid">
          {currentCategories.map((item) => (
            <CategoryCard 
              key={item.id} 
              item={item} 
              language={language}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </main>

      {loading && (
        <div className="loading-overlay" role="alert" aria-live="assertive">
          <div className="spinner" aria-hidden="true"></div>
          <p>{t.loading}</p>
        </div>
      )}
    </div>
  );
};

export default AgroChemicalCategories;