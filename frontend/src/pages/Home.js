import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import '../css/Home.css';

function Home() {
  const [language, setLanguage] = useState('english');

  // Language content
  const content = {
    tamil: {
      title: "பாக்போனில் வரவேற்கிறோம்",
      subtitle: "விவசாயத்திற்கான உங்கள் நம்பகமான துணையாளர்",
      cards: [
        {
          title: "உருவாக்குனர் விவரங்கள்",
          description: "இந்த தளத்தின் பின்னால் உள்ள உருவாக்குனர்களின் தனிப்பட்ட விவரங்கள்"
        },
        {
          title: "சந்தை விலைகள்",
          description: "பயிர்கள் மற்றும் பொருட்களுக்கான தினசரி மண்டி விலைகளைக் கண்காணிக்கவும்"
        },
         {
          title: "விவசாயிகள் மன்றம்",
          description: "இணைந்து, அறிவைப் பகிர்ந்து, விவசாய ஆதரவைப் பெறுங்கள்"
        },
         {
          title: "அரசாங்க திட்டங்கள்",
          description: "சமீபத்திய விவசாயி நட்பு அரசாங்க முன்முயற்சிகள்"
        }
        ,
        {
          title: "வானிலை முன்னறிவிப்பு",
          description: "சிறந்த திட்டமிடலுக்கு சமீபத்திய வானிலை தகவல்கள்"
        },
        {
          title: "நினைவூட்டல்",
          description: "விவசாயிகளுக்கான கூடுதல் ஆதாரங்கள் மற்றும் கருவிகள்"
        }
        ,
        {
          title: "விவசாய தொற்றுகள்",
          description: "பூச்சிகள், நோய்கள் மற்றும் பயிர் அச்சுறுத்தல்களை அடையாளம் காணுங்கள்"
        },
        {
          title: "இயற்கை விவசாயம்",
          description: "நிலையான, சுற்றுச்சூழல் நட்பு விவசாய முறைகள்"
        },
        {
          title: "செயற்கை விவசாயம்",
          description: "உற்பத்தித்திறனுக்கான நவீன நுட்பங்கள் மற்றும் செயற்கை உள்ளீடுகள்"
        },
        {
          title: "விவசாய கட்டமைப்பு",
          description: "பண்ணை அமைப்பு, நீர்ப்பாசன அமைப்புகள் மற்றும் சேமிப்பு வசதிகள்"
        },
        {
          title: "விவசாய ரசாயன பொருட்கள்",
          description: "உரங்கள், பூச்சிக்கொல்லிகள் மற்றும் விவசாய ரசாயனங்கள் பற்றிய விவரங்கள்"
        }
       ,{
          title: "விவசாய விவரங்கள்",
          description: "பயிர் சாகுபடி, பருவங்கள் மற்றும் சிறந்த நடைமுறைகள் விளக்கப்பட்டுள்ளன"
        }

      ]
    },
    english: {
      title: "Welcome to Backbone",
      subtitle: "Your trusted companion for all things agriculture.",
      cards: [
        {
          title: "Creator Details",
          description: "Personal details of the creators behind this platform."
        },
        {
          title: "Market Prices",
          description: "Track daily mandi prices for crops and commodities."
        },
        {
          title: "Farmer Forum",
          description: "Connect, share knowledge, and get farming support."
        },
        {
          title: "Government Schemes",
          description: "Latest farmer-friendly government initiatives."
        }
        ,
        {
          title: "Weather Forecast",
          description: "Up-to-date weather information for better planning."
        },
                {
          title: "Reminder",
          description: "Additional resources and tools for farmers."
        }
         ,
        {
          title: "Agro Infectors",
          description: "Identify and manage pests, diseases, and crop threats."
        },
        {
          title: "Organic Farming",
          description: "Sustainable, eco-friendly farming methods."
        },
        {
          title: "Inorganic Farming",
          description: "Modern techniques and synthetic inputs for productivity."
        },
        {
          title: "Farming Structure",
          description: "Farm setup, irrigation systems, and storage facilities."
        },
        {
          title: "AgroChemical Products",
          description: "Details about fertilizers, pesticides, and farming chemicals."
        }
        ,{
          title: "Farming Details",
          description: "Crop cultivation, seasons, and best practices explained."
        }

      ]
    }
  };

  const routes = [
    "/creator", "/prices","/forum", "/schemes",
    "/weather", "/reminder" , "/agro-infectors", "/organic-farming",
    "/inorganic-farming", "/farming-structure","/agro-chemicals" ,"/farming-details" 
  ];

  // Load language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'tamil' ? 'english' : 'tamil');
  };

  const currentContent = content[language];

  return (
    <div className="home-container">
      {/* Header with controls */}
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

      {/* Main content */}
      <div className="home-content">
        <h1 className="home-title">{currentContent.title}</h1>
        <p className="home-subtitle">{currentContent.subtitle}</p>
        
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