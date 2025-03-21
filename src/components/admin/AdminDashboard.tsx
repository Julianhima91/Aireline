import React, { useState } from 'react';
import { Settings, Users, BookOpen, Search, LogOut, Key, Percent, DollarSign, TrendingUp, Sliders, Star, Book, Plane, Globe, Database, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { AdminClientSearches } from './AdminClientSearches';
import { SalesAgentManagement } from './sales/SalesAgentManagement';
import { CommissionRulesManagement } from './commission/CommissionRulesManagement';
import { RouteTrackingDashboard } from './tracking/RouteTrackingDashboard';
import { ManualApiSearch } from './search/ManualApiSearch';
import { SystemSettings } from './settings/SystemSettings';
import { FlightScoringSettings } from './scoring/FlightScoringSettings';
import { AdminDocumentation } from './documentation/AdminDocumentation';
import { AirportsManagement } from './airports/AirportsManagement';
import { SeoPages } from './seo/SeoPages';
import SitemapGeneratorPage from '../../pages/SitemapGeneratorPage';

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  totalSearches: number;
}

interface AdminSettings {
  api_endpoint: string;
  commission_rate: number;
  api_key: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'searches' | 'agents' | 'commission' | 'tracking' | 'api' | 'system' | 'scoring' | 'docs' | 'airports' | 'seo' | 'sitemap'>('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalSearches: 0
  });
  const [settings, setSettings] = useState<AdminSettings>({
    api_endpoint: 'https://serpapi.com',
    commission_rate: 0,
    api_key: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <div className="p-2 bg-blue-100 rounded-full">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'overview'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-5 h-5 mr-3" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('airports')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'airports'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Plane className="w-5 h-5 mr-3" />
            Airports
          </button>

          <button
            onClick={() => setActiveTab('commission')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'commission'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Percent className="w-5 h-5 mr-3" />
            Commission Rules
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'tracking'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="w-5 h-5 mr-3" />
            Route Tracking
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'api'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Search className="w-5 h-5 mr-3" />
            Manual API Search
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'scoring'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star className="w-5 h-5 mr-3" />
            Flight Scoring
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'seo'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-5 h-5 mr-3" />
            SEO Pages
          </button>

          <button
            onClick={() => setActiveTab('sitemap')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'sitemap'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5 mr-3" />
            Sitemap Generator
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'system'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Database className="w-5 h-5 mr-3" />
            System Controls
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'docs'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Book className="w-5 h-5 mr-3" />
            Documentation
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <div className="hidden md:flex space-x-4">
                  <button
                    onClick={() => setActiveTab('searches')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'searches'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Client Searches
                  </button>
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'agents'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sales Agents
                  </button>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
              <StatCard title="Total Bookings" value={stats.totalBookings} icon={BookOpen} />
              <StatCard title="Saved Searches" value={stats.totalSearches} icon={Search} />
            </div>
          )}

          {activeTab === 'airports' && <AirportsManagement />}
          {activeTab === 'searches' && <AdminClientSearches />}
          {activeTab === 'agents' && <SalesAgentManagement />}
          {activeTab === 'commission' && <CommissionRulesManagement />}
          {activeTab === 'tracking' && <RouteTrackingDashboard />}
          {activeTab === 'api' && <ManualApiSearch />}
          {activeTab === 'system' && <SystemSettings />}
          {activeTab === 'scoring' && <FlightScoringSettings />}
          {activeTab === 'docs' && <AdminDocumentation />}
          {activeTab === 'seo' && <SeoPages />}
          {activeTab === 'sitemap' && <SitemapGeneratorPage />}
        </main>
      </div>
    </div>
  );
}
