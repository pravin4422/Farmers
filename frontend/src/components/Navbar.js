import React from "react";
import { Link } from "react-router-dom";
import "../CSS/Navbar.css"; 

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="logo">Backbone</h2>
        <div className="nav-buttons">
          <Link to="/"><button className="nav-btn">Home</button></Link>
          <Link to="/signup"><button className="nav-btn">Signup</button></Link>
          <Link to="/login"><button className="login-btn">Login</button></Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
