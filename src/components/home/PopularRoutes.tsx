import React, { useState, useEffect } from 'react';
import { Plane, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Route {
  id: string;
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

export function PopularRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_location_connections')
        .select(`
          id,
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
        .limit(6);

      if (error) throw error;
      setRoutes(data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load popular routes');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteClick = (route: Route) => {
    if (route.template_url) {
      navigate(route.template_url);
    }
  };

  if (loading) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Destinacionet me te kerkuara</h2>
          <p className="mt-2 text-base text-gray-600">
            Zbuloni Destinacionet tona më të kërkuara.
          </p>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => {
            const fromName = route.from_location.nga_format || 
              (route.from_location.type === 'city' 
                ? `nga ${route.from_location.city}` 
                : `nga ${route.from_location.state}`);
            
            const toName = route.to_location.per_format || 
              (route.to_location.type === 'city' 
                ? `per ${route.to_location.city}` 
                : `per ${route.to_location.state}`);
            
            return (
              <button
                key={route.id}
                onClick={() => handleRouteClick(route)}
                className="group bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors duration-200 w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Plane className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <span>{fromName}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span>{toName}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}