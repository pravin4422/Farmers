// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // check if logged in
  if (!token) {
    alert("Please login first!");
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;
