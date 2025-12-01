import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // If no user found, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If role is required and user role doesn't match, redirect to login
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has correct role, render children
  return children;
};

export default ProtectedRoute;
