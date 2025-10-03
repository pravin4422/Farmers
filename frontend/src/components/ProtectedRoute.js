// src/components/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // ✅ matches Login.js
  const location = useLocation();

  if (!token) {
    // Redirect to login and remember where user came from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If token exists, allow access
  return children;
};

export default ProtectedRoute;
