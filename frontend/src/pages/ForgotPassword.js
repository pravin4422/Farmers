import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ForgotPassword.css";
import api from "../api"; 

function ForgotPassword() {
  const [language, setLanguage] = useState("english");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

 
  const content = {
    tamil: {
      title: "கடவுச்சொல்லை மறந்தீர்களா?",
      emailPlaceholder: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
      resetButton: "கடவுச்சொல்லை மீட்டமைக்கவும்",
      success: "கடவுச்சொல்லை மீட்டமைக்கும் இணைப்பு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.",
      error: "மீட்டமைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
    },
    english: {
      title: "Forgot Password",
      emailPlaceholder: "Enter your email",
      resetButton: "Reset Password",
      success: "Password reset link has been sent to your email.",
      error: "Reset failed. Please try again."
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () =>
    setLanguage(language === "tamil" ? "english" : "tamil");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/forgot-password", { email });
      alert(res.data.message || content[language].success);
      setEmail("");
      navigate("/login"); 
    } catch (err) {
      alert(err.response?.data?.error || content[language].error);
    }
  };

  const currentContent = content[language];

  return (
    <div className={`forgot-container ${language === 'tamil' ? 'tamil-lang' : ''}`}>
      <div className="forgot-header">
        <div className="theme-language-controls">
          <button
            onClick={toggleLanguage}
            className="control-btn language-btn"
            aria-label={`Switch to ${
              language === "tamil" ? "English" : "Tamil"
            }`}
          >
            {language === "tamil" ? "EN" : "தமிழ்"}
          </button>
        </div>
      </div>

     
      <div className="forgot-content">
        <h2 className="forgot-title">{currentContent.title}</h2>
        <form className="forgot-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={currentContent.emailPlaceholder}
            className="forgot-input email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="forgot-button reset-button">
            {currentContent.resetButton}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
