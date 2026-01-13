import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../css/Signup.css'; 
import api from '../api';

function Signup({ setUser }) {
  const [language, setLanguage] = useState('english');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

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

  useEffect(() => {
    const savedLanguage = sessionStorage.getItem('language');
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'tamil' ? 'english' : 'tamil');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(currentContent.passwordMismatch);
      return;
    }

    if (formData.password.length < 6) {
      setError(currentContent.passwordMinLength);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userEmail', formData.email);
      
      localStorage.setItem('displayName', formData.name);
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      setUser({
        token: response.data.token,
        email: formData.email,
        displayName: formData.name
      });

      navigate('/');
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentContent = content[language];

  return (
    <div className={`signup-container ${language === 'tamil' ? 'tamil-lang' : ''}`}>
      <div className="signup-header">
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

      <div className="signup-content">
        <h2 className="signup-title">{currentContent.title}</h2>
        
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form className="signup-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={currentContent.namePlaceholder} 
            className="signup-input name-input"
            required
            disabled={loading}
          />
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={currentContent.emailPlaceholder} 
            className="signup-input email-input"
            required
            disabled={loading}
          />
          <input 
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={currentContent.passwordPlaceholder} 
            className="signup-input password-input"
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
            className="signup-input password-input"
            required
            minLength={6}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="signup-button"
            disabled={loading}
          >
            {loading ? currentContent.loading : currentContent.signupButton}
          </button>
        </form>

        <p className="login-link">
          {currentContent.loginPrompt}{' '}
          <a href="/login">
            {currentContent.loginLink}
          </a>
        </p>
      </div>
    </div>
  );
}

export default Signup;