// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import CreatorDetail from "./pages/CreatorDetails/CreatorDetails";
import Tractor from "./pages/CreatorDetails/Tractor";
import AgromedicalProducts from "./pages/CreatorDetails/AgromedicalProducts";
import CultivatingField from "./pages/CreatorDetails/CultivatingField";

function App() {
  return (
    <BrowserRouter>
      {/* Navbar must be inside BrowserRouter for useNavigate */}
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Creator Details Pages */}
        <Route path="/creator" element={<CreatorDetail />} />
        <Route path="/tractor" element={<Tractor />} />
        <Route path="/agromedicalproducts" element={<AgromedicalProducts />} />
        <Route path="/cultivatingfield" element={<CultivatingField />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
