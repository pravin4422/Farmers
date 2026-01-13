import React, { useState, useEffect } from "react";
import "../CSS/ResetPassword.css";
import api from "../api";

function ResetPassword() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("tamil");
  const [formData, setFormData] = useState({ token: "", newPassword: "" });

  const content = {
    tamil: {
      title: "கடவுச்சொல்லை மீட்டமைக்கவும்",
      tokenPlaceholder: "மீட்டமைப்பு குறியீட்டை உள்ளிடவும்",
      passwordPlaceholder: "புதிய கடவுச்சொல்",
      resetButton: "மீட்டமை",
      success: "கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது!",
      error: "மீட்டமைப்பு தோல்வி. மீண்டும் முயற்சிக்கவும்."
    },
    english: {
      title: "Reset Password",
      tokenPlaceholder: "Enter Reset Token",
      passwordPlaceholder: "New Password",
      resetButton: "Reset",
      success: "Password updated successfully!",
      error: "Reset failed. Please try again."
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedLanguage = localStorage.getItem("language");

    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.body.className = isDarkMode ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleLanguage = () => {
    setLanguage(language === "tamil" ? "english" : "tamil");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/reset-password", formData);
      alert(res.data.message || content[language].success);
      setFormData({ token: "", newPassword: "" }); 
    } catch (err) {
      alert(err.response?.data?.message || content[language].error);
    }
  };

  const currentContent = content[language];

  return (
    <div className={`reset-container ${isDarkMode ? "dark" : "light"}`}>
      {/* Header with theme & language controls */}
      <div className="reset-header">
        <div className="theme-language-controls">
          <button
            onClick={toggleTheme}
            className="control-btn theme-btn"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
          </button>
          <button
            onClick={toggleLanguage}
            className="control-btn language-btn"
            aria-label={`Switch to ${language === "tamil" ? "English" : "Tamil"}`}
          >
            {language === "tamil" ? "EN" : "தமிழ்"}
          </button>
        </div>
      </div>

      <div className="reset-content">
        <h2 className="reset-title">{currentContent.title}</h2>
        <form className="reset-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="token"
            placeholder={currentContent.tokenPlaceholder}
            className="reset-input"
            value={formData.token}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="newPassword"
            placeholder={currentContent.passwordPlaceholder}
            className="reset-input"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />
          <button type="submit" className="reset-button">
            {currentContent.resetButton}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
