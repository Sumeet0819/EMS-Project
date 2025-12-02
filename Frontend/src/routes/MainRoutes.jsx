import React, { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { asyncCurrentuser } from "../store/actions/userActions";

// Pages
import Auth from "../pages/Auth";
import AdminPage from "../pages/AdminPage";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

const MainRoutes = () => {
  const dispatch = useDispatch();

  // Load user from localStorage on app mount
  useEffect(() => {
    dispatch(asyncCurrentuser());
  }, [dispatch]);

  return (
    <Routes>
      {/* Auth Route */}
      <Route path="/" element={<Auth />} />

      {/* Admin Route */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Employee Route */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default MainRoutes;
