import React, { useState, useEffect } from "react";
import "../CSS/ForgotPassword.css"; 

function ForgotPassword() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('tamil');

  // Language content
  const content = {
    tamil: {
      title: "கடவுச்சொல்லை மறந்தீர்கள்",
      emailPlaceholder: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
      resetButton: "கடவுச்சொல்லை மீட்டமைக்கவும்"
    },
    english: {
      title: "Forgot Password",
      emailPlaceholder: "Enter your email",
      resetButton: "Reset Password"
    }
  };

  // Load theme and language from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'tamil' ? 'english' : 'tamil');
  };

  const currentContent = content[language];

  return (
    <div className={`forgot-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header with controls */}
      <div className="forgot-header">
        <div className="theme-language-controls">
          <button 
            onClick={toggleTheme} 
            className="control-btn theme-btn"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={toggleLanguage} 
            className="control-btn language-btn"
            aria-label={`Switch to ${language === 'tamil' ? 'English' : 'Tamil'}`}
          >
            {language === 'tamil' ? 'EN' : 'தமிழ்'}
          </button>
        </div>
      </div>

      {/* Main forgot password content */}
      <div className="forgot-content">
        <h2 className="forgot-title">{currentContent.title}</h2>
        <form className="forgot-form">
          <input 
            type="email" 
            placeholder={currentContent.emailPlaceholder} 
            className="forgot-input email-input"
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