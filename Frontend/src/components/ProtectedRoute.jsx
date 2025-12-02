import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  // Get employee from localStorage
  const employee = JSON.parse(localStorage.getItem("employee") || "null");

  console.log("ProtectedRoute - Employee:", employee);
  console.log("ProtectedRoute - Required Role:", requiredRole);
  console.log("ProtectedRoute - Employee Role:", employee?.role);

  // If no employee found, redirect to login
  if (!employee) {
    console.log("No employee found, redirecting to /");
    return <Navigate to="/" replace />;
  }

  // If role is required and employee role doesn't match, redirect to login
  if (requiredRole && employee.role !== requiredRole) {
    console.log(
      `Role mismatch: ${employee.role} !== ${requiredRole}, redirecting to /`
    );
    return <Navigate to="/" replace />;
  }

  // Employee is authenticated and has correct role, render children
  console.log("ProtectedRoute - Access granted");
  return children;
};

export default ProtectedRoute;
