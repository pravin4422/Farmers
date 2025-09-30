import React from "react";
import { Link, useNavigate } from "react-router-dom";
import '../css/Navbar.css';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("displayName");
    localStorage.removeItem("user");
    
    // Update user state
    setUser(null);
    
    // Navigate to login
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="logo">Backbone</h2>
        <div className="nav-buttons">
          <Link to="/"><button className="nav-btn">Home</button></Link>
          <Link to="/about"><button className="nav-btn">About Us</button></Link>

          {user ? (
            <>
              {/* After Login: Show username and Logout */}
              <span className="user-name" style={{ marginRight: '10px', color: 'white', fontWeight: '500' }}>
                {user.displayName || user.email}
              </span>
              <button className="login-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              {/* Before Login: Show Signup and Login */}
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