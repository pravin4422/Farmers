import React from "react";
import { Link, useNavigate } from "react-router-dom";
import '../css/Navbar.css';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("displayName");
    localStorage.removeItem("user");
    
    setUser(null);
    
    navigate("/dashboard");
  };

  const handleHomeClick = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/home");
    }
  };

  const handleProfileClick = () => {
    console.log('Profile clicked, user:', user);
    navigate('/user-profile');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Backbone</h2>
        <div className="nav-buttons">
          <button className="nav-btn" onClick={handleHomeClick}>Home</button>

          {user ? (
            <>
              <div className="profile-icon" onClick={handleProfileClick} title="Profile">
                {(user.displayName || user.email).charAt(0).toUpperCase()}
              </div>
              <button className="login-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/signup"><button className="nav-btn">Signup</button></Link>
              <Link to="/login"><button className="login-btn">Login</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;