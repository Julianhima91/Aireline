import React, { useState, useEffect } from 'react';
import { Plane, ArrowRight, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { fetchRelatedRoutes } from '../../../utils/relatedRoutes';

interface Location {
  id: string;
  type: string;
  city: string | null;
  state: string;
  nga_format: string | null;
  per_format: string | null;
}

interface RelatedRoute {
  id: string;
  template_url: string;
  from_location: {
    id: string;
    type: string;
    city: string | null;
    state: string;
    nga_format: string | null;
  };
  to_location: {
    id: string;
    type: string;
    city: string | null;
    state: string;
    per_format: string | null;
  };
}

interface RelatedDestinationsProps {
  fromLocation: Location;
  toLocation: Location;
  title?: string;
  className?: string;
}

export function RelatedDestinationsComponent({ 
  fromLocation, 
  toLocation, 
  title,
  className = '' 
}: RelatedDestinationsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedRoutes, setRelatedRoutes] = useState<RelatedRoute[]>([]);

  useEffect(() => {
    if (!fromLocation || !toLocation) {
      setError('Invalid location data');
      setLoading(false);
      return;
    }
    loadRelatedRoutes();
  }, [fromLocation, toLocation]);

  const loadRelatedRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading related routes for:', {
        from: `${fromLocation.type}: ${fromLocation.city || fromLocation.state}`,
        to: `${toLocation.type}: ${toLocation.city || toLocation.state}`
      });

      const routes = await fetchRelatedRoutes({
        type: fromLocation.type as 'city' | 'state',
        city: fromLocation.city || undefined,
        state: fromLocation.state
      }, {
        type: toLocation.type as 'city' | 'state',
        city: toLocation.city || undefined,
        state: toLocation.state
      });

      console.log('Found related routes:', routes);
      setRelatedRoutes(routes || []);

    } catch (err) {
      console.error('Error loading related routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load related destinations');
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = (location: RelatedRoute['from_location'] | RelatedRoute['to_location'], isFrom: boolean): string => {
    if (!location) return '';
    
    if (isFrom) {
      // For "from" locations, use nga_format or construct from city/state
      return location.nga_format || 
        (location.type === 'city' ? `nga ${location.city}` : `nga ${location.state}`);
    } else {
      // For "to" locations, use per_format or construct from city/state
      return location.per_format || 
        (location.type === 'city' ? `per ${location.city}` : `per ${location.state}`);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${className}`}>
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Duke ngarkuar destinacionet e ngjashme...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (relatedRoutes.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">Nuk u gjeten destinacione te ngjashme.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <h3 className="text-xl font-semibold text-[#2D3748]">
          Destinacione te ngjashme me fluturimin {title}
        </h3>
        <p className="text-[#4A5568] mt-2">
          Eksploro me shume opsione fluturimi
        </p>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {relatedRoutes.map((route) => {
          const fromName = getLocationName(route.from_location, true);
          const toName = getLocationName(route.to_location, false);
          
          return (
            <a
              key={route.id}
              href={route.template_url}
              className="group block bg-gray-50 rounded-xl p-6 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm group-hover:bg-blue-100 transition-colors">
                  <Plane className="w-6 h-6 text-[#3182CE]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[#2D3748] font-medium">
                    <span className="truncate">{fromName}</span>
                    <ArrowRight className="w-4 h-4 text-[#4A5568] flex-shrink-0" />
                    <span className="truncate">{toName}</span>
                  </div>
                  <div className="text-sm text-[#3182CE] mt-2 group-hover:text-[#2C5282] flex items-center gap-1">
                    Shiko çmimet
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Mobile List View */}
      <div className="md:hidden divide-y divide-gray-100">
        {relatedRoutes.map((route) => {
          const fromName = getLocationName(route.from_location, true);
          const toName = getLocationName(route.to_location, false);
          
          return (
            <a
              key={route.id}
              href={route.template_url}
              className="flex items-center justify-between p-6 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Plane className="w-5 h-5 text-[#3182CE]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[#2D3748] font-medium">
                    <span>{fromName}</span>
                    <ArrowRight className="w-4 h-4 text-[#4A5568]" />
                    <span>{toName}</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#3182CE]" />
            </a>
          );
        })}
      </div>

      {/* Popular Routes Section */}
      <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-blue-100/50 mt-4">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#3182CE]" />
          <h4 className="font-medium text-[#2D3748]">Linjat me te Kerkuara</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatedRoutes.slice(0, 3).map((route) => {
            const fromName = getLocationName(route.from_location, true);
            const toName = getLocationName(route.to_location, false);
            
            return (
              <a
                key={route.id}
                href={route.template_url}
                className="flex items-center text-[#3182CE] hover:text-[#2C5282] transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-2" />
                <span className="text-sm">
                  {fromName} → {toName}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}