import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../css/Signup.css'; 
import api from '../api';


function Signup() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('tamil');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Language content
  const content = {
    tamil: {
      title: "பதிவு செய்யவும்",
      namePlaceholder: "பெயர்",
      emailPlaceholder: "மின்னஞ்சல்",
      passwordPlaceholder: "கடவுச்சொல்",
      confirmPasswordPlaceholder: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
      signupButton: "பதிவு செய்யவும்",
      loading: "தயவுசெய்து காத்திருக்கவும்...",
      loginPrompt: "ஏற்கனவே கணக்கு உள்ளதா?",
      loginLink: "உள்நுழைவு",
      passwordMismatch: "கடவுச்சொற்கள் பொருந்தவில்லை",
      passwordMinLength: "கடவுச்சொல் குறைந்தது 6 எழுத்துக்கள் இருக்க வேண்டும்"
    },
    english: {
      title: "Sign Up",
      namePlaceholder: "Full Name",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      confirmPasswordPlaceholder: "Confirm Password",
      signupButton: "Sign Up",
      loading: "Please wait...",
      loginPrompt: "Already have an account?",
      loginLink: "Login",
      passwordMismatch: "Passwords do not match",
      passwordMinLength: "Password must be at least 6 characters"
    }
  };

  // Load theme and language preferences
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

  // Apply theme
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(currentContent.passwordMismatch);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError(currentContent.passwordMinLength);
      return;
    }

    setLoading(true);

    try {
      // Make API call to backend signup endpoint
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      // Store authentication token
      localStorage.setItem('authToken', response.data.token);
      
      // Store user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      // Redirect to dashboard
      navigate('/Login');
      
    } catch (err) {
      // Handle error from backend
      const errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
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

      {/* Main signup content */}
      <div className="login-content">
        <h2 className="login-title">{currentContent.title}</h2>
        
        {/* Error message */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={currentContent.namePlaceholder} 
            className="login-input name-input"
            required
            disabled={loading}
          />
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={currentContent.emailPlaceholder} 
            className="login-input email-input"
            required
            disabled={loading}
          />
          <input 
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={currentContent.passwordPlaceholder} 
            className="login-input password-input"
            required
            minLength={6}
            disabled={loading}
          />
          <input 
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={currentContent.confirmPasswordPlaceholder} 
            className="login-input password-input"
            required
            minLength={6}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? currentContent.loading : currentContent.signupButton}
          </button>
        </form>

        {/* Login link */}
        <p className="signup-prompt">
          {currentContent.loginPrompt}{' '}
          <a href="/login" className="signup-link">
            {currentContent.loginLink}
          </a>
        </p>
      </div>
    </div>
  );
}

export default Signup;