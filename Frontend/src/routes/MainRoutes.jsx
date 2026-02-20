import React, { useEffect, Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { asyncCurrentuser } from "../store/actions/userActions";
import ProtectedRoute from "../components/ProtectedRoute";
import Loader from "../components/Loader";

// Lazy load Pages
const Auth = lazy(() => import("../pages/Auth"));
const AdminPage = lazy(() => import("../pages/AdminPage"));
const EmployeeDashboard = lazy(() => import("../pages/EmployeeDashboard"));

const MainRoutes = () => {
  const dispatch = useDispatch();

  // Load user from localStorage on app mount
  useEffect(() => {
    dispatch(asyncCurrentuser());
  }, [dispatch]);

  return (
    <Suspense fallback={<Loader />}>
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
    </Suspense>
  );
};

export default MainRoutes;
