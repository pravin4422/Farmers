import React, { useState, useEffect } from "react";
import "../CSS/Login.css"; // Import CSS

function Login() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('tamil');

  // Language content
  const content = {
    tamil: {
      title: "உள்நுழைவு",
      usernamePlaceholder: "பயனர் பெயர்",
      passwordPlaceholder: "கடவுச்சொல்",
      loginButton: "உள்நுழைவு",
      forgotPassword: "கடவுச்சொல்லை மறந்தீர்களா?"
    },
    english: {
      title: "Login",
      usernamePlaceholder: "Username",
      passwordPlaceholder: "Password",
      loginButton: "Login",
      forgotPassword: "Forgot Password?"
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
    <div className={`login-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header with controls */}
      <div className="login-header">
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

      {/* Main login content */}
      <div className="login-content">
        <h2 className="login-title">{currentContent.title}</h2>
        <form className="login-form">
          <input 
            type="text" 
            placeholder={currentContent.usernamePlaceholder} 
            className="login-input username-input"
            required 
          />
          <input 
            type="password" 
            placeholder={currentContent.passwordPlaceholder} 
            className="login-input password-input"
            required 
          />
          <button type="submit" className="login-button">
            {currentContent.loginButton}
          </button>
        </form>
        {/* Forgot Password link */}
        <p className="forgot-password">
          <a href="/forgot-password" className="forgot-password-link">
            {currentContent.forgotPassword}
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;