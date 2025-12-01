import React from "react";
import { Route, Routes } from "react-router-dom";
import Auth from "../pages/Auth";
import Admin from "../pages/AdminPage";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

const MainRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Admin />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employee"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default MainRoutes;
