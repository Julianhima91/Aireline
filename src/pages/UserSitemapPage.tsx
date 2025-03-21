import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { Plane, Search, MapPin, Calendar, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RouteLink {
  template_url: string;
  from_location: {
    type: string;
    city: string | null;
    state: string;
    nga_format: string | null;
  };
  to_location: {
    type: string;
    city: string | null;
    state: string;
    per_format: string | null;
  };
}

export default function UserSitemapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteLink[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 20;

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_location_connections')
        .select(`
          template_url,
          from_location:from_location_id(
            type, city, state, nga_format
          ),
          to_location:to_location_id(
            type, city, state, per_format
          )
        `)
        .eq('status', 'active')
        .not('template_url', 'is', null)
        .order('template_url');

      if (error) throw error;
      setRoutes(data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter(route => {
    const searchLower = searchTerm.toLowerCase();
    const fromCity = route.from_location.city?.toLowerCase() || '';
    const fromState = route.from_location.state.toLowerCase();
    const toCity = route.to_location.city?.toLowerCase() || '';
    const toState = route.to_location.state.toLowerCase();

    return fromCity.includes(searchLower) ||
           fromState.includes(searchLower) ||
           toCity.includes(searchLower) ||
           toState.includes(searchLower);
  });

  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const paginatedRoutes = filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Të Gjitha Destinacionet
            </h1>
            <p className="text-lg text-gray-600">
              Zbuloni të gjitha destinacionet tona dhe gjeni fluturimin tuaj të ardhshëm
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Kërko destinacione..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Routes Grid */}
          <div className="grid gap-4">
            {paginatedRoutes.map((route, index) => {
              const fromName = route.from_location.type === 'city' 
                ? route.from_location.city 
                : route.from_location.state;
              const toName = route.to_location.type === 'city'
                ? route.to_location.city
                : route.to_location.state;

              return (
                <a
                  key={index}
                  href={route.template_url}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 text-lg font-medium text-gray-900">
                        <span>{fromName}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                        <span>{toName}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {route.from_location.state} → {route.to_location.state}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-full ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
