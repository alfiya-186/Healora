import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Check the current session
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  // 1. If there is no active session, kick them to the login page
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // 2. If they are logged in, but trying to access a dashboard they don't have permission for
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect them to their own correct dashboard
    if (userRole === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'MANAGER') return <Navigate to="/manager-dashboard" replace />;
    if (userRole === 'NUTRITIONIST') return <Navigate to="/nutritionist-dashboard" replace />;
    return <Navigate to="/patient-dashboard" replace />;
  }

  // 3. If session is valid and role is authorized, allow access!
  return children;
};

export default ProtectedRoute;