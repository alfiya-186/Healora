import React from 'react';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all pages
import LandingPage from './pages/LandingPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import NutritionistDashboard from './pages/NutritionistDashboard.jsx';
import ClinicManagerDashboard from './pages/ClinicManagerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import BookConsultationPage from './pages/BookConsultationPage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Dashboards */}
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/nutritionist-dashboard" element={<NutritionistDashboard />} />
        <Route path="/manager-dashboard" element={<ClinicManagerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
        
        <Route path="/book-consultation" element={<BookConsultationPage />} />
      </Routes>
    </Router>
  );
}

export default App;