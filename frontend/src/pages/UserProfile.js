import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [language, setLanguage] = useState('english');
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [profileUserInfo, setProfileUserInfo] = useState(null);
  const [formData, setFormData] = useState({
    agricultureExperience: '',
    age: '',
    address: '',
    mainCrop: '',
    landSize: '',
    educationQualification: '',
    agriEducationExperience: ''
  });

  const content = {
    tamil: {
      title: 'பயனர் சுயவிவரம்',
      subtitle: 'உங்கள் விவசாய விவரங்களை நிர்வகிக்கவும்',
      agricultureExperience: 'விவசாய அனுபவம்',
      age: 'வயது',
      address: 'முகவரி',
      mainCrop: 'முக்கிய பயிர்',
      landSize: 'நில அளவு',
      educationQualification: 'கல்வித் தகுதி',
      agriEducationExperience: 'விவசாய கல்வி அனுபவம்',
      submit: 'சமர்ப்பிக்கவும்',
      update: 'புதுப்பிக்கவும்',
      edit: 'திருத்து',
      cancel: 'ரத்து செய்',
      years: 'ஆண்டுகள்',
      acres: 'ஏக்கர்',
      mandatory: 'கட்டாயம்',
      optional: 'விருப்பம்'
    },
    english: {
      title: 'User Profile',
      subtitle: 'Manage your agricultural details',
      agricultureExperience: 'Agriculture Experience',
      age: 'Age',
      address: 'Address',
      mainCrop: 'Main Crop Cultivating',
      landSize: 'Land Size',
      educationQualification: 'Education Qualification',
      agriEducationExperience: 'Agricultural Education Experience',
      submit: 'Submit',
      update: 'Update',
      edit: 'Edit',
      cancel: 'Cancel',
      years: 'Years',
      acres: 'Acres',
      mandatory: 'Mandatory',
      optional: 'Optional'
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) setLanguage(savedLanguage);
    
    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
    setIsOwnProfile(!userId || userId === currentUserId);
    
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const url = userId 
          ? `http://localhost:5000/api/user-profile/${userId}`
          : 'http://localhost:5000/api/user-profile';
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Handle profile data
        if (response.data.noProfile) {
          // User exists but no profile created
          setHasProfile(false);
          setProfileUserInfo(response.data.userId);
          if (!userId || userId === currentUserId) {
            setIsEditing(true);
          }
        } else {
          // Profile exists
          setFormData(response.data);
          setHasProfile(true);
          
          if (response.data.userId) {
            setProfileUserInfo(response.data.userId);
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.clear();
          navigate('/login');
          return;
        }
        setHasProfile(false);
        if (!userId || userId === currentUserId) {
          setIsEditing(true);
        }
      }
    };
    
    fetchProfile();
  }, [userId, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        navigate('/login');
        return;
      }

      const url = 'http://localhost:5000/api/user-profile';
      const method = hasProfile ? 'put' : 'post';
      
      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(response.data.message || (hasProfile ? 'Profile updated successfully!' : 'Profile created successfully!'));
      setIsEditing(false);
      setHasProfile(true);
      
      const profileResponse = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(profileResponse.data);
      
      // Update profileUserInfo with latest data including validSolutionsCount
      if (profileResponse.data.userId) {
        setProfileUserInfo(profileResponse.data.userId);
      }
      
      // Refresh admin status after profile update
      try {
        const adminResponse = await axios.get('http://localhost:5000/api/common-forum/check-admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (adminResponse.data.isAdmin) {
          localStorage.setItem('isAdmin', 'true');
        } else {
          localStorage.removeItem('isAdmin');
        }
      } catch (adminError) {
        console.error('Error checking admin status:', adminError);
      }
    } catch (error) {
      console.error('Submit error:', error.response || error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.clear();
        navigate('/login');
        return;
      }
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Something went wrong';
      alert('Error: ' + errorMsg);
    }
  };

  const currentContent = content[language];
  const userEmail = localStorage.getItem('userEmail') || 'User';
  const userName = localStorage.getItem('displayName') || userEmail;

  return (
    <div className="profile-page">
      <button onClick={() => setLanguage(language === 'tamil' ? 'english' : 'tamil')} className="language-toggle">
        {language === 'tamil' ? 'EN' : 'தமிழ்'}
      </button>
      
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {(profileUserInfo?.name || userName).charAt(0).toUpperCase()}
          </div>
          <h2>{profileUserInfo?.name || userName}</h2>
          {(profileUserInfo?.email || userEmail) && <p className="profile-email">{profileUserInfo?.email || userEmail}</p>}
          <div style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}>
            🏆 Best Solutions: {profileUserInfo?.validSolutionsCount || 0}
          </div>
          <p className="profile-subtitle">{currentContent.subtitle}</p>
        </div>

        {!isEditing && hasProfile ? (
          <div className="profile-view">
            {isOwnProfile && (
              <div className="profile-actions">
                <button onClick={() => setIsEditing(true)} className="edit-btn">
                  <span></span> {currentContent.edit}
                </button>
              </div>
            )}
            
            <div className="profile-grid">
              <div className="profile-card">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>{currentContent.agricultureExperience}</label>
                  <p>{formData.agricultureExperience} {currentContent.years}</p>
                </div>
              </div>

              <div className="profile-card">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>{currentContent.age}</label>
                  <p>{formData.age} {currentContent.years}</p>
                </div>
              </div>

              <div className="profile-card full-width">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>{currentContent.address}</label>
                  <p>{formData.address}</p>
                </div>
              </div>

              <div className="profile-card">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>{currentContent.mainCrop}</label>
                  <p>{formData.mainCrop}</p>
                </div>
              </div>

              {formData.landSize && (
                <div className="profile-card">
                  <div className="card-icon"></div>
                  <div className="card-content">
                    <label>{currentContent.landSize}</label>
                    <p>{formData.landSize} {currentContent.acres}</p>
                  </div>
                </div>
              )}

              {formData.educationQualification && (
                <div className="profile-card">
                  <div className="card-icon"></div>
                  <div className="card-content">
                    <label>{currentContent.educationQualification}</label>
                    <p>{formData.educationQualification}</p>
                  </div>
                </div>
              )}

              {formData.agriEducationExperience && (
                <div className="profile-card">
                  <div className="card-icon"></div>
                  <div className="card-content">
                    <label>{currentContent.agriEducationExperience}</label>
                    <p>{formData.agriEducationExperience} {currentContent.years}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isOwnProfile ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <span className="label-icon"></span>
                  {currentContent.agricultureExperience} <span className="mandatory">*</span>
                </label>
                <input type="number" name="agricultureExperience" value={formData.agricultureExperience} onChange={handleChange} required min="0" placeholder="0" />
              </div>

              <div className="form-group">
                <label>
                  <span className="label-icon"></span>
                  {currentContent.age} <span className="mandatory">*</span>
                </label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} required min="18" placeholder="18" />
              </div>
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                {currentContent.address} <span className="mandatory">*</span>
              </label>
              <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="Enter your address" />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                {currentContent.mainCrop} <span className="mandatory">*</span>
              </label>
              <input type="text" name="mainCrop" value={formData.mainCrop} onChange={handleChange} required placeholder="e.g., Rice, Wheat" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <span className="label-icon"></span>
                  {currentContent.landSize} <span className="optional">({currentContent.optional})</span>
                </label>
                <input type="number" name="landSize" value={formData.landSize} onChange={handleChange} min="0" step="0.01" placeholder="0.0" />
              </div>

              <div className="form-group">
                <label>
                  <span className="label-icon">🎓</span>
                  {currentContent.educationQualification} <span className="optional">({currentContent.optional})</span>
                </label>
                <input type="text" name="educationQualification" value={formData.educationQualification} onChange={handleChange} placeholder="e.g., High School" />
              </div>
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"></span>
                {currentContent.agriEducationExperience} <span className="optional">({currentContent.optional})</span>
              </label>
              <input type="number" name="agriEducationExperience" value={formData.agriEducationExperience} onChange={handleChange} min="0" placeholder="0" />
            </div>

            <div className="form-actions">
              {hasProfile && (
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">
                  {currentContent.cancel}
                </button>
              )}
              <button type="submit" className="submit-btn">
                {hasProfile ? currentContent.update : currentContent.submit}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <p style={{ textAlign: 'center', padding: '20px', color: '#777' }}>This user hasn't created a profile yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
