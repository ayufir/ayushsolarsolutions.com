import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import History from './pages/admin/History';
import Tasks from './pages/admin/Tasks';

import EmployeeLogin from './pages/employee/Login';
import Tracking from './pages/employee/Tracking';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/employee/login" element={<EmployeeLogin />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute roleRequired="admin">
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="history" element={<History />} />
              <Route path="tasks" element={<Tasks />} />
            </Routes>
          </ProtectedRoute>
        } />

        {/* Employee Routes */}
        <Route path="/employee/*" element={
          <ProtectedRoute roleRequired="employee">
            <Routes>
              <Route path="tracking" element={<Tracking />} />
            </Routes>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
