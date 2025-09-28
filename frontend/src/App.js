import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import CreatorDetail from "./pages/CreatorDetails/CreatorDetails.js"; 
import Tractor from "./pages/CreatorDetails/Tractor.js"; 
import AgromedicalProducts from "./pages/CreatorDetails/AgromedicalProducts.js";
import CultivatingField from "./pages/CreatorDetails/CultivatingField.js";

function App() {
  return (
    
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/creator" element={<CreatorDetail />} />
        <Route path="/tractor" element={<Tractor />} />
        <Route path="/AgromedicalProducts" element={<AgromedicalProducts />} />
        <Route path="/CultivatingField" element={<CultivatingField />} />
      </Routes>
    </Router>
  );
}

export default App;
