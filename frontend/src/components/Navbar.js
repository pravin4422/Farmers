import React from "react";
import { Link, useNavigate } from "react-router-dom";
import '../css/Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token"); // check login

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove token
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="logo">Backbone</h2>
        <div className="nav-buttons">
          <Link to="/"><button className="nav-btn">Home</button></Link>

          {isLoggedIn ? (
            <>
              <Link to="/creator"><button className="nav-btn">Creator</button></Link>
              <Link to="/prices"><button className="nav-btn">Prices</button></Link>
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
}

export default Navbar;
