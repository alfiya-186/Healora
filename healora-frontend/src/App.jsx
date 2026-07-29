import React from 'react';
import './index.css'; // <--- THIS BRINGS ALL YOUR COLORS AND STYLES BACK!
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import BookConsultationPage from './pages/BookConsultationPage.jsx';

// ... rest of your code

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/book-consultation" element={<BookConsultationPage />} />
      </Routes>
    </Router>
  );
}

export default App;