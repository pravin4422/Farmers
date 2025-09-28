import React, { useState, useEffect } from "react";
import "../CSS/Signup.css"; // Import CSS

function Signup() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('tamil');

  // Language content
  const content = {
    tamil: {
      title: "பதிவு",
      fullNamePlaceholder: "முழு பெயர்",
      emailPlaceholder: "மின்னஞ்சல்",
      passwordPlaceholder: "கடவுச்சொல்",
      confirmPasswordPlaceholder: "கடவுச்சொல்லை உறுதி செய்யவும்",
      signupButton: "பதிவு"
    },
    english: {
      title: "Signup",
      fullNamePlaceholder: "Full Name",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      confirmPasswordPlaceholder: "Confirm Password",
      signupButton: "Signup"
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
    <div className={`signup-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header with controls */}
      <div className="signup-header">
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

      {/* Main signup content */}
      <div className="signup-content">
        <h2 className="signup-title">{currentContent.title}</h2>
        <form className="signup-form">
          <input 
            type="text" 
            placeholder={currentContent.fullNamePlaceholder} 
            className="signup-input fullname-input"
            required 
          />
          <input 
            type="email" 
            placeholder={currentContent.emailPlaceholder} 
            className="signup-input email-input"
            required 
          />
          <input 
            type="password" 
            placeholder={currentContent.passwordPlaceholder} 
            className="signup-input password-input"
            required 
          />
          <input 
            type="password" 
            placeholder={currentContent.confirmPasswordPlaceholder} 
            className="signup-input confirm-password-input"
            required 
          />
          <button type="submit" className="signup-button">
            {currentContent.signupButton}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;