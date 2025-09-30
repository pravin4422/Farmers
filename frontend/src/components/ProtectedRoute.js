import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, children }) => {
  // Check if user exists in state or localStorage
  const token = localStorage.getItem("token");
  
  if (!user && !token) {
    alert("Please login to access this page");
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;