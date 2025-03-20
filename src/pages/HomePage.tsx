import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { HeroSection } from '../components/home/HeroSection';
import { SearchModule } from '../components/home/SearchModule';
import { PopularRoutes } from '../components/home/PopularRoutes';
import { City } from '../types/search';
import { formatDateForAPI } from '../utils/format';
import { Award, Clock, Shield, Phone, Search, ArrowRight } from 'lucide-react';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripType, setTripType] = useState<'roundTrip' | 'oneWay'>('roundTrip');
  const [fromCity, setFromCity] = useState<City | null>(null);
  const [toCity, setToCity] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [passengers, setPassengers] = useState({
    adults: 1,
    children: 0,
    infants: 0
  });

  const handleSearch = async () => {
    try {
      // Input validation
      if (!fromCity || !toCity) {
        throw new Error('Please select departure and arrival cities');
      }
      if (!departureDate) {
        throw new Error('Please select a departure date');
      }
      if (tripType === 'roundTrip' && !returnDate) {
        throw new Error('Please select a return date for round-trip flights');
      }

      setLoading(true);
      setError(null);

      console.log(`Starting ${tripType} search from ${fromCity.code} to ${toCity.code}`);
      
      const batchId = uuidv4();
      const searchParams = {
        fromLocation: fromCity.name,
        toLocation: toCity.name,
        fromCode: fromCity.code,
        toCode: toCity.code,
        departureDate: formatDateForAPI(departureDate),
        returnDate: returnDate ? formatDateForAPI(returnDate) : null,
        tripType,
        travelClass: '1',
        stops: '0',
        passengers: {
          adults: passengers.adults,
          children: passengers.children,
          infantsInSeat: 0,
          infantsOnLap: passengers.infants
        }
      };

      // Save search to database
      const { data: savedSearch, error: saveError } = await supabase
        .from('saved_searches')
        .insert([{
          batch_id: batchId,
          user_id: user?.id || null,
          search_params: searchParams,
          results: null,
          cached_results: null,
          cached_until: null,
          price_stability_level: 'MEDIUM'
        }])
        .select()
        .single();

      if (saveError) {
        console.error('Error saving search:', saveError);
        throw new Error('Failed to save search. Please try again.');
      }

      if (!savedSearch) {
        throw new Error('Failed to create search. Please try again.');
      }

      // Store flag in sessionStorage to indicate this is a new search
      sessionStorage.setItem(`search_${batchId}`, 'true');
      
      // Store direct flights preference
      if (directFlightsOnly) {
        sessionStorage.setItem(`direct_${batchId}`, 'true');
      }

      // Navigate to results page with batch_id
      console.log('Navigating to results with batch ID:', batchId);
      window.scrollTo(0, 0);
      navigate(`/results?batch_id=${batchId}`, { 
        replace: true,
        state: { searchParams }
      });

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search for flights');
      setLoading(false);
    }
  };

  const handleContactAgent = () => {
    window.location.href = 'tel:+355695161381';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-700">
      <HeroSection>
        <SearchModule
          onSearch={handleSearch}
          loading={loading}
          error={error}
          tripType={tripType}
          setTripType={setTripType}
          fromCity={fromCity}
          setFromCity={setFromCity}
          toCity={toCity}
          setToCity={setToCity}
          departureDate={departureDate}
          setDepartureDate={setDepartureDate}
          returnDate={returnDate}
          setReturnDate={setReturnDate}
          passengers={passengers}
          setPassengers={setPassengers}
          directFlightsOnly={directFlightsOnly}
          setDirectFlightsOnly={setDirectFlightsOnly}
        />
      </HeroSection>

      <PopularRoutes />

      {/* Trust Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pse të zgjidhni Hima Travel?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Me mbi 12 vjet eksperiencë në industrinë e udhëtimit, ne ofrojmë shërbimin më të mirë dhe çmimet më konkurruese në treg.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="bg-gray-50 rounded-xl p-6 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Eksperiencë e Gjatë</h3>
              <p className="text-gray-600">
                12+ vjet eksperiencë në organizimin e udhëtimeve dhe shitjen e biletave.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Online</h3>
              <p className="text-gray-600">
                Gjeni ofertat me te mira per Bileta Avioni 24/7 Online.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Garanci Çmimi</h3>
              <p className="text-gray-600">
                Ofrojmë çmimet më të mira të garantuara për të gjitha destinacionet.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rezervim i Thjeshtë</h3>
              <p className="text-gray-600">
                Proces i shpejtë dhe i thjeshtë rezervimi online ose me telefon.
              </p>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white text-center">
              <Search className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Kerko Çmimet me te Mira</h3>
              <p className="mb-6">
                Perdor modulin e kerkimit per te gjetur ofertat me te mira per destinacionin tend te preferuar.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg 
                  font-semibold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                Kerko Tani
              </button>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white text-center">
              <Phone className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Kontakto Agjentët Tanë</h3>
              <p className="mb-6">
                Preferon te flasësh me nje nga agjentet tane? Na kontakto direkt ne numrin tone.
              </p>
              <button
                onClick={handleContactAgent}
                className="inline-flex items-center px-6 py-3 bg-white text-green-600 rounded-lg 
                  font-semibold hover:bg-green-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                +355 69 516 1381
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;