import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('english');

  const content = {
    tamil: {
      title: "ஸ்மார்ட் விவசாயி தளம்",
      subtitle: "சிறந்த விவசாயத்திற்கு தொழில்நுட்பத்துடன் விவசாயிகளை மேம்படுத்துதல்",
      getStarted: "தொடங்குங்கள்",
      featuresTitle: "எங்கள் அம்சங்கள்",
      features: [
        { icon: "🌱", title: "பயிர் பரிந்துரை", desc: "மண் மற்றும் வானிலை அடிப்படையில் AI-இயங்கும் பயிர் பரிந்துரைகள்" },
        { icon: "💰", title: "சந்தை விலைகள்", desc: "உங்கள் பகுதியில் பயிர்களுக்கான நேரடி சந்தை விலைகள்" },
        { icon: "👥", title: "சமூக மன்றம்", desc: "சக விவசாயிகளுடன் இணைந்து அறிவைப் பகிர்ந்து கொள்ளுங்கள்" },
        { icon: " 🔬", title: "நிபுணர் ஆலோசனை", desc: "விவசாய நிபுணர்களிடமிருந்து வழிகாட்டுதலைப் பெறுங்கள்" },
        { icon: "🌤", title: "வானிலை புதுப்பிப்புகள்", desc: "உங்கள் பண்ணை இடத்திற்கான நேரடி வானிலை முன்னறிவிப்புகள்" },
        { icon: "🏛", title: "அரசாங்க திட்டங்கள்", desc: "சமீபத்திய மானியங்கள் மற்றும் விவசாய திட்டங்களை அணுகவும்" }
      ]
    },
    english: {
      title: "Smart Farmer Platform",
      subtitle: "Empowering farmers with technology for better farming",
      getStarted: "Get Started",
      featuresTitle: "Our Features",
      features: [
        { icon: "🌱", title: "Crop Recommendation", desc: "Get AI-powered crop suggestions based on soil and weather" },
        { icon: "💰", title: "Market Prices", desc: "Live market rates for crops in your area" },
        { icon: "👥", title: "Community Forum", desc: "Connect with fellow farmers and share knowledge" },
        { icon: "🔬", title: "Expert Advice", desc: "Get guidance from agriculture experts" },
        { icon: "🌤", title: "Weather Updates", desc: "Real-time weather forecasts for your farm location" },
        { icon: "🏛", title: "Government Schemes", desc: "Access latest subsidies and farming schemes" }
      ]
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'tamil' ? 'english' : 'tamil');
  };

  const currentContent = content[language];

  return (
    <>
      <div className="landing-container">
        <button onClick={toggleLanguage} className="language-btn">
          {language === 'tamil' ? 'EN' : 'தமிழ்'}
        </button>
        
        <div className="hero-section">
        <h1>{currentContent.title}</h1>
        <p>{currentContent.subtitle}</p>
        <button className="cta-btn" onClick={() => navigate("/login")}>
          {currentContent.getStarted}
        </button>
      </div>

      <div className="features-section">
        <h2>{currentContent.featuresTitle}</h2>
        <div className="features-grid">
          {currentContent.features.map((feature, index) => (
            <div key={index} className="feature-card" onClick={() => navigate("/login")}>
              <span className="icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  );
};

export default Dashboard;
