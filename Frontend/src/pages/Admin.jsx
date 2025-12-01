import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import '../components/Admin.css'
import Dashboard from "./Dashboard";
import TeamManagement from "./TeamManagement";

const Admin = () => {
  return (
      <div className="admin-layout">
        <Sidebar />

        <div className="admin-main">
          <Header />

          <main className="admin-content">
            <Suspense fallback={<div>Loading...</div>}>
       
                <Outlet path="/dashboard" element={<Dashboard />} />
                <Outlet path="/team" element={<TeamManagement />} />
                {/* <Route path="/work" element={<WorkManagementPage />} /> */}
                {/* <Route path="/reports" element={<ReportsPage />} /> */}

            </Suspense>
          </main>
        </div>
      </div>
  );
};

export default Admin;
