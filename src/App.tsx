import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useAuth } from './components/AuthContext';
import { Navbar } from './components/Navbar';
import { GlobalFooter } from './components/common/GlobalFooter';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import SEOPage from './pages/SEOPage';
import SEOPreview from './pages/SEOPreview';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiesPage from './pages/CookiesPage';
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AgentLogin } from './components/agent/AgentLogin';
import { AgentRegister } from './components/agent/AgentRegister';

function App() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'admin@example.com';

  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Routes>
          {/* Admin Routes */}
          <Route
            path="/admin/login"
            element={!isAdmin ? <AdminLogin /> : <Navigate to="/admin" replace />}
          />
          <Route
            path="/admin/*"
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" replace />}
          />

          {/* Agent Routes */}
          <Route path="/agent/login" element={<AgentLogin />} />
          <Route path="/agent/register" element={<AgentRegister />} />

          {/* Public Routes */}
          <Route
            path="/home"
            element={
              <>
                <Navbar />
                <HomePage />
                <GlobalFooter />
              </>
            }
          />
          <Route
            path="/results"
            element={
              <>
                <Navbar />
                <ResultsPage />
                <GlobalFooter />
              </>
            }
          />
          <Route
            path="/seo-preview"
            element={
              <>
                <Navbar />
                <SEOPreview />
                <GlobalFooter />
              </>
            }
          />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />

          {/* SEO Routes */}
          <Route path="bileta-avioni/:params?" element={<SEOPage />} />
          <Route path="/fluturime/:params?" element={<SEOPage />} />

          {/* Root route */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </HelmetProvider>
  );
}

export default App;