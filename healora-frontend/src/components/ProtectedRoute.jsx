import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      // Role mismatch: redirect to the user's authorized home dashboard
      if (userRole === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
      if (userRole === 'MANAGER') return <Navigate to="/manager-dashboard" replace />;
      if (userRole === 'NUTRITIONIST') return <Navigate to="/nutritionist-dashboard" replace />;
      return <Navigate to="/patient-dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;