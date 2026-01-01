import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/PublicProfile.css';

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  console.log('PublicProfile component loaded with userId:', userId);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching profile for userId:', userId);
        console.log('Using token:', token ? 'Token exists' : 'No token');
        
        const response = await axios.get(`http://localhost:5000/api/user-profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Profile response:', response.data);
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-container">
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-container">
          <p className="error-text">Profile not found</p>
          <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  const userName = profile.userId?.name || 'User';
  const userEmail = profile.userId?.email;

  return (
    <div className="public-profile-page">
      <div className="public-profile-container">
        <button onClick={() => navigate(-1)} className="back-btn-top">← Back</button>
        
        <div className="public-profile-header">
          <div className="public-profile-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <h2>{userName}</h2>
          {userEmail && <p className="public-profile-email">{userEmail}</p>}
        </div>

        {profile.noProfile ? (
          <div className="no-profile-message">
            <p>This user hasn't created a profile yet.</p>
          </div>
        ) : (
          <div className="public-profile-grid">
            <div className="public-profile-card">
              <div className="card-icon">🌾</div>
              <div className="card-content">
                <label>Agriculture Experience</label>
                <p>{profile.agricultureExperience} years</p>
              </div>
            </div>

            <div className="public-profile-card">
              <div className="card-icon">👤</div>
              <div className="card-content">
                <label>Age</label>
                <p>{profile.age} years</p>
              </div>
            </div>

            <div className="public-profile-card full-width">
              <div className="card-icon">📍</div>
              <div className="card-content">
                <label>Address</label>
                <p>{profile.address}</p>
              </div>
            </div>

            <div className="public-profile-card">
              <div className="card-icon">🌱</div>
              <div className="card-content">
                <label>Main Crop</label>
                <p>{profile.mainCrop}</p>
              </div>
            </div>

            {profile.landSize && (
              <div className="public-profile-card">
                <div className="card-icon">🏞️</div>
                <div className="card-content">
                  <label>Land Size</label>
                  <p>{profile.landSize} acres</p>
                </div>
              </div>
            )}

            {profile.educationQualification && (
              <div className="public-profile-card">
                <div className="card-icon">🎓</div>
                <div className="card-content">
                  <label>Education</label>
                  <p>{profile.educationQualification}</p>
                </div>
              </div>
            )}

            {profile.agriEducationExperience && (
              <div className="public-profile-card">
                <div className="card-icon">📚</div>
                <div className="card-content">
                  <label>Agricultural Education</label>
                  <p>{profile.agriEducationExperience} years</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
