import React, { useEffect } from 'react';
import './index.css';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Import all pages
import LandingPage from './pages/LandingPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import NutritionistDashboard from './pages/NutritionistDashboard.jsx';
import ClinicManagerDashboard from './pages/ClinicManagerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import BookConsultationPage from './pages/BookConsultationPage.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';

// 🌟 STRICT GLOBAL SESSION WATCHER & HISTORY LOCK 🌟
const SessionWatcher = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_role');
    
    const protectedPaths = [
      '/patient-dashboard', 
      '/nutritionist-dashboard', 
      '/manager-dashboard', 
      '/admin-dashboard', 
      '/book-consultation'
    ];

    const authPaths = ['/signin', '/signup'];

    // 1. Block access to dashboards if logged out
    if (!token && protectedPaths.includes(location.pathname)) {
      navigate('/signin', { replace: true });
    }
    
    // 2. Block access to login/signup if already logged in
    if (token && authPaths.includes(location.pathname)) {
      if (userRole === 'ADMIN') navigate('/admin-dashboard', { replace: true });
      else if (userRole === 'MANAGER') navigate('/manager-dashboard', { replace: true });
      else if (userRole === 'NUTRITIONIST') navigate('/nutritionist-dashboard', { replace: true });
      else navigate('/patient-dashboard', { replace: true });
    }

    // 3. THE HISTORY LOCK: Prevent the browser back button / swipe from working at all!
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.href);
    };
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
    
  }, [location.pathname, navigate]);

  return children;
};

function App() {
  return (
    <Router>
      <SessionWatcher>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          <Route path="/patient-dashboard" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/book-consultation" element={<ProtectedRoute allowedRoles={['PATIENT']}><BookConsultationPage /></ProtectedRoute>} />
          <Route path="/nutritionist-dashboard" element={<ProtectedRoute allowedRoles={['NUTRITIONIST']}><NutritionistDashboard /></ProtectedRoute>} />
          <Route path="/manager-dashboard" element={<ProtectedRoute allowedRoles={['MANAGER']}><ClinicManagerDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </SessionWatcher>
    </Router>
  );
}

export default App;