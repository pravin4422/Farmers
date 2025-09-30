import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Prices from "./pages/Prices";
import Forum from "./pages/Forum";
import AboutUs from "./pages/AboutUs";

// Protected Pages
import CreatorDetail from "./pages/CreatorDetails/CreatorDetails";
import Tractor from "./pages/CreatorDetails/Tractor";
import AgromedicalProducts from "./pages/CreatorDetails/AgromedicalProducts";
import CultivatingField from "./pages/CreatorDetails/CultivatingField";

function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    const displayName = localStorage.getItem("displayName");
    
    if (token && email) {
      setUser({ token, email, displayName: displayName || email });
    }
  }, []);

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/about" element={<AboutUs />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login setUser={setUser} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" replace /> : <Signup setUser={setUser} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route
          path="/creator"
          element={
            <ProtectedRoute user={user}>
              <CreatorDetail user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tractor"
          element={
            <ProtectedRoute user={user}>
              <Tractor user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agromedicalproducts"
          element={
            <ProtectedRoute user={user}>
              <AgromedicalProducts user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cultivatingfield"
          element={
            <ProtectedRoute user={user}>
              <CultivatingField user={user} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;