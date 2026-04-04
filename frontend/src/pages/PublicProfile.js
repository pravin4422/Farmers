import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/UserProfile.css';

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
      <div className="profile-page">
        <div className="profile-container">
          <p style={{ textAlign: 'center', padding: '20px', color: '#777' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p style={{ textAlign: 'center', padding: '20px', color: '#777' }}>Profile not found</p>
          <button onClick={() => navigate(-1)} style={{
            padding: '10px 20px',
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'block',
            margin: '0 auto'
          }}>Go Back</button>
        </div>
      </div>
    );
  }

  const userName = profile.userId?.name || 'User';
  const userEmail = profile.userId?.email;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button onClick={() => navigate(-1)} className="back-btn-top" style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '8px 16px',
          background: '#667eea',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>← Back</button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <h2>{userName}</h2>
          {userEmail && <p className="profile-email">{userEmail}</p>}
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
            🏆 Best Solutions: {profile.userId?.validSolutionsCount || 0}
          </div>
          <p className="profile-subtitle">User Profile Details</p>
        </div>

        {profile.noProfile ? (
          <div className="profile-view">
            <p style={{ textAlign: 'center', padding: '20px', color: '#777' }}>This user hasn't created a profile yet.</p>
          </div>
        ) : (
          <div className="profile-view">
            <div className="profile-grid">
              <div className="profile-card">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>Agriculture Experience</label>
                  <p>{profile.agricultureExperience} years</p>
                </div>
              </div>

              <div className="profile-card">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>Age</label>
                  <p>{profile.age} years</p>
                </div>
              </div>

              <div className="profile-card full-width">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>Address</label>
                  <p>{profile.address}</p>
                </div>
              </div>

              <div className="profile-card">
                <div className="card-icon"></div>
                <div className="card-content">
                  <label>Main Crop Cultivating</label>
                  <p>{profile.mainCrop}</p>
                </div>
              </div>

              {profile.landSize && (
                <div className="profile-card">
                  <div className="card-icon"></div>
                  <div className="card-content">
                    <label>Land Size</label>
                    <p>{profile.landSize} acres</p>
                  </div>
                </div>
              )}

              {profile.educationQualification && (
                <div className="profile-card">
                  <div className="card-icon"></div>
                  <div className="card-content">
                    <label>Education Qualification</label>
                    <p>{profile.educationQualification}</p>
                  </div>
                </div>
              )}

              {profile.agriEducationExperience && (
                <div className="profile-card">
                  <div className="card-icon"></div>
                  <div className="card-content">
                    <label>Agricultural Education Experience</label>
                    <p>{profile.agriEducationExperience} years</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
