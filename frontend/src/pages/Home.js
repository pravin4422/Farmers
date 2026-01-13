import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from '../context/LanguageContext';
import '../css/Home.css';

function Home() {
  const { language, toggleLanguage } = useLanguage();

  const content = {
    tamil: {
      title: "ஸ்மார்ட் விவசாயி வரவேற்கிறோம்",
      
      cards: [
        {
          title: "உருவாக்குனர் விவரங்கள்",
          description: "இந்த தளத்தின் பின்னால் உள்ள உருவாக்குனர்களின் தனிப்பட்ட விவரங்கள்"
        },
        {
          title: "AI-Chart",
          description: "பண்ணை அமைப்பு, நீர்ப்பாசன அமைப்புகள் மற்றும் சேமிப்பு வசதிகள்"
        },
        {
          title: "சந்தை விலைகள்",
          description: "பயிர்கள் மற்றும் பொருட்களுக்கான தினசரி மண்டி விலைகளைக் கண்காணிக்கவும்"
        },
        {
          title: "Common Forum",
          description: "பயிர் சாகுபடி, பருவங்கள் மற்றும் சிறந்த நடைமுறைகள் விளக்கப்பட்டுள்ளன"
        },
        {
          title: "விவசாயிகள் மன்றம்",
          description: "இணைந்து, அறிவைப் பகிர்ந்து, விவசாய ஆதரவைப் பெறுங்கள்"
        },
        {
          title: "வானிலை முன்னறிவிப்பு",
          description: "சிறந்த திட்டமிடலுக்கு சமீபத்திய வானிலை தகவல்கள்"
        },
        {
          title: "அரசாங்க திட்டங்கள்",
          description: "சமீபத்திய விவசாயி நட்பு அரசாங்க முன்முயற்சிகள்"
        },
        {
          title: "நினைவூட்டல்",
          description: "விவசாயிகளுக்கான கூடுதல் ஆதாரங்கள் மற்றும் கருவிகள்"
        },
        {
          title: "விவசாய ரசாயன பொருட்கள்",
          description: "உரங்கள், பூச்சிக்கொல்லிகள் மற்றும் விவசாய ரசாயனங்கள் பற்றிய விவரங்கள்"
        }
      ]
    },
    english: {
      title: "Welcome to Smart Farmer",
      
      cards: [
        {
          title: "Creator Details",
          description: "Personal details of the creators behind this platform."
        },
        {
          title: "AI-Chart",
          description: "Farm setup, irrigation systems, and storage facilities."
        },
        {
          title: "Market Prices",
          description: "Track daily mandi prices for crops and commodities."
        },
        {
          title: "Common Forum",
          description: "Crop cultivation, seasons, and best practices explained."
        },
        {
          title: "Farmer Forum",
          description: "Connect, share knowledge, and get farming support."
        },
        {
          title: "Weather Forecast",
          description: "Up-to-date weather information for better planning."
        },
        {
          title: "Government Schemes",
          description: "Latest farmer-friendly government initiatives."
        },
        {
          title: "Reminder",
          description: "Additional resources and tools for farmers."
        },
        {
          title: "AgroChemical Products",
          description: "Details about fertilizers, pesticides, and farming chemicals."
        }
      ]
    }
  };

  const routes = [
    "/creator", "/ai-chat", "/prices", "/common-forum",
    "/forum", "/weather", "/schemes", "/reminder", "/agro-chemicals"
  ];

  const currentContent = content[language];

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="theme-language-controls">
          <button 
            onClick={toggleLanguage} 
            className="control-btn language-btn"
            aria-label={`Switch to ${language === 'tamil' ? 'English' : 'Tamil'}`}
          >
            {language === 'tamil' ? 'EN' : 'தமிழ்'}
          </button>
        </div>
      </div>

      <div className="home-content">
        <h1 className="home-title">{currentContent.title}</h1>         
        <div className="home-sections">
          {currentContent.cards.map((card, index) => (
            <Link 
              key={index}
              to={routes[index]} 
              className="home-card"
              aria-label={`Navigate to ${card.title}`}
            >
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;