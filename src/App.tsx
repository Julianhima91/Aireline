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
import SitemapPage from './pages/SitemapPage';
import UserSitemapPage from './pages/UserSitemapPage';

// This is the default export used for SSR
export default function App({ seoData, template }: any) {
  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AppRoutes seoData={seoData} template={template} />
      </div>
    </HelmetProvider>
  );
}

// Inner routing component
function AppRoutes({ seoData, template }: any) {
  const { user } = useAuth();
  const isAdmin = user?.email === 'admin@example.com';

  return (
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
      <Route path="/sitemap" element={<UserSitemapPage />} />

      {/* SEO Routes with SSR injection */}
      <Route
        path="/bileta-avioni/:params?"
        element={<SEOPage seoData={seoData} template={template} />}
      />
      <Route
        path="/fluturime/:params?"
        element={<SEOPage seoData={seoData} template={template} />}
      />

      {/* Sitemap Route */}
      <Route path="/sitemap.xml" element={<SitemapPage />} />

      {/* Root Redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
