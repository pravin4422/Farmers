import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import '../css/Login.css';
import api from '../api'; 

function Login({ setUser }) {
  const [language, setLanguage] = useState("english");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Language content
  const content = {
    tamil: {
      title: "உள்நுழைவு",
      emailPlaceholder: "மின்னஞ்சல்",
      passwordPlaceholder: "கடவுச்சொல்",
      loginButton: "உள்நுழைவு",
      forgotPassword: "கடவுச்சொல்லை மறந்தீர்களா?",
      signupText: "கணக்கு இல்லையா? பதிவு செய்யவும்"
    },
    english: {
      title: "Login",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      loginButton: "Login",
      forgotPassword: "Forgot Password?",
      signupText: "Don't have an account? Sign up"
    }
  };

  // Load language from memory (not localStorage)
  useEffect(() => {
    const savedLanguage = sessionStorage.getItem("language");
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  // Save language
  useEffect(() => {
    sessionStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () =>
    setLanguage(language === "tamil" ? "english" : "tamil");

  const currentContent = content[language];

  // Handle input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);

      // Store token & user with CONSISTENT key names
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userEmail", formData.email);
      
      // Extract displayName from backend response
      let displayName = formData.email; // Default to email
      
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        // Get name from backend user object
        displayName = response.data.user.name || 
                     response.data.user.displayName || 
                     response.data.user.username || 
                     formData.email;
        
        localStorage.setItem("displayName", displayName);
      }

      // Update user state in App.js
      setUser({
        token: response.data.token,
        email: formData.email,
        displayName: displayName
      });

      // Redirect
      navigate("/home");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-container ${language === 'tamil' ? 'tamil-lang' : ''}`}>
      {/* Header */}
      <div className="login-header">
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

      {/* Login form */}
      <div className="login-content">
        <h2 className="login-title">{currentContent.title}</h2>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder={currentContent.emailPlaceholder}
            className="login-input email-input"
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            placeholder={currentContent.passwordPlaceholder}
            className="login-input password-input"
            onChange={handleChange}
            required
            disabled={loading}
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Please wait..." : currentContent.loginButton}
          </button>
        </form>

        <p className="forgot-password">
          <a href="/forgot-password" className="forgot-password-link">
            {currentContent.forgotPassword}
          </a>
        </p>

        <p className="signup-link">
          <a href="/signup">
            {currentContent.signupText}
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;