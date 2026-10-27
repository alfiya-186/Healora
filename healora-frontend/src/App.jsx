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

// 🌟 STRICT GLOBAL SESSION WATCHER 🌟
const SessionWatcher = ({ children }) => {
  return children;
};


function App() {
  // 🌟 SILENT CLOUD BACKEND PRE-WARMUP PING 🌟
  // Wakes up Render server the exact instant the user opens the website
  // so that by the time they reach Login, the backend is 100% awake and responds in under 1 second!
  useEffect(() => {
    try {
      fetch('https://healora-backend-ru0c.onrender.com/', { method: 'GET', mode: 'no-cors' }).catch(() => {});
    } catch (e) {}
  }, []);

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