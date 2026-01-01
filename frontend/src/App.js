import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Dashboard from "./pages/Dashboard.js";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Prices from "./pages/Prices";
import Forum from "./pages/Forums/Forum.js";

// Protected Pages
import CreatorDetail from "./pages/CreatorDetails/CreatorDetails.js";
import Tractor from "./pages/CreatorDetails/Tractor.js";
import AgromedicalProducts from "./pages/CreatorDetails/AgromedicalProducts.js";
import CultivatingField from "./pages/CreatorDetails/CultivatingField.js";
import Schemes from "./pages/Schemes/Scheme.js";
import Weather from "./pages/weather/weather.js";
import Reminder from "./pages/Reminders/reminder.js";
import AgroChemical from "./pages/Agrochemicals/AgroChemical.js";
import AiChat from "./pages/AiChat.js";
import UserProfile from "./pages/UserProfile.js";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  const [user, setUser] = useState(null);

  // ✅ Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    const displayName = localStorage.getItem("displayName");

    if (token && email) {
      setUser({ token, email, displayName: displayName || email });
    }
  }, []);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar user={user} setUser={setUser} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/home" element={<Home />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/forum" element={<Forum />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/home" replace /> : <Login setUser={setUser} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/home" replace /> : <Signup setUser={setUser} />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ✅ Protected Routes */}
        <Route
          path="/creator"
          element={
            <ProtectedRoute>
              <CreatorDetail user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tractor"
          element={
            <ProtectedRoute>
              <Tractor user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agromedicalproducts"
          element={
            <ProtectedRoute>
              <AgromedicalProducts user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cultivatingfield"
          element={
            <ProtectedRoute>
              <CultivatingField user={user} />
            </ProtectedRoute>
          }
        />
           <Route
          path="/schemes"
          element={
            <ProtectedRoute>
              <Schemes user={user} />
            </ProtectedRoute>
          }
        />
                <Route
          path="/weather"
          element={
            <ProtectedRoute>
              <Weather user={user} />
            </ProtectedRoute>
          }
        />
          <Route
          path="/reminder"
          element={
            <ProtectedRoute>
              <Reminder user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agro-chemicals"
          element={
            <ProtectedRoute>
              <AgroChemical user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <ProtectedRoute>
              <AiChat user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-profile"
          element={
            <ProtectedRoute>
              <UserProfile user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <UserProfile user={user} />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
