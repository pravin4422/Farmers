import React from "react";
import "../CSS/Navbar.css"; 

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="logo">Backbone</h2>
         <div className="nav-buttons"> {/* Container for buttons */}
          <button className="nav-btn">Home</button>
          <button className="nav-btn">About Us</button>
          <button className="nav-btn">Signup</button>
          <button className="login-btn">Login</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
