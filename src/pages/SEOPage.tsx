import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/seo/seo-component-templates/SEOHead';
import {
  HeaderComponent,
  FlightSearchComponent,
  PricingTableComponent,
  StateCityPricingComponent,
  StatePricingComponent,
  RouteInfoComponent,
  StateRouteInfoComponent,
  FAQComponent,
  StateFAQComponent,
  RelatedDestinationsComponent,
  FooterComponent
} from '../components/seo/seo-component-templates';

interface TemplateData {
  seo_title: string;
  meta_description: string;
  template_type: {
    name: string;
    slug: string;
  };
}

interface TemplateComponent {
  component_name: string;
  display_order: number;
  status: 'active' | 'inactive';
}

interface Location {
  id: string;
  type: string;
  city: string | null;
  state: string;
  nga_format: string | null;
  per_format: string | null;
}

interface LocationData {
  from_location: Location;
  to_location: Location;
}

interface FlightPrice {
  airline: string;
  flight_date: string;
  total_price: number;
}

export default function SEOPage() {
  const { params } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [components, setComponents] = useState<TemplateComponent[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [flightPrices, setFlightPrices] = useState<FlightPrice[]>([]);
  const [priceTitle, setPriceTitle] = useState<string | null>(null);

  useEffect(() => {
    fetchPageData();
  }, [params]);

  const replacePlaceholders = (text: string, locationData: LocationData): string => {
    if (!text) return '';

    let result = text;

    result = result.replace(/{nga_city}/g, 
      locationData.from_location.nga_format || 
      `${locationData.from_location.city}`
    );
    result = result.replace(/{per_city}/g, 
      locationData.to_location.per_format || 
      `${locationData.to_location.city}`
    );
    result = result.replace(/{nga_state}/g, 
      locationData.from_location.nga_format || 
      `${locationData.from_location.state}`
    );
    result = result.replace(/{per_state}/g, 
      locationData.to_location.per_format || 
      `${locationData.to_location.state}`
    );

    return result;
  };

  const getIataCode = async (city: string | null): Promise<string | null> => {
    if (!city) return null;

    try {
      const { data, error } = await supabase
        .from('airports')
        .select('iata_code')
        .eq('city', city);

      if (error) throw error;
      if (!data?.length) return null;

      const mainAirports = data.filter(airport => 
        !airport.iata_code.includes('X') && 
        airport.iata_code.length === 3
      );

      return (mainAirports[0] || data[0])?.iata_code || null;
    } catch (err) {
      console.error(`Error getting IATA code for ${city}:`, err);
      return null;
    }
  };

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentPath = window.location.pathname;
      console.log('Fetching data for path:', currentPath);

      let connection;

      const { data: initialConnection, error: connError } = await supabase
        .from('seo_location_connections')
        .select(`
          *,
          from_location:from_location_id(
            id, type, city, state, nga_format
          ),
          to_location:to_location_id(
            id, type, city, state, per_format
          ),
          template_type:template_type_id(
            id, name, slug
          )
        `)
        .eq('template_url', currentPath)
        .eq('status', 'active')
        .single();

      if (connError || !initialConnection) {
        const pathWithoutSlash = currentPath.replace(/\/$/, '');
        console.log('Trying path without trailing slash:', pathWithoutSlash);

        const { data: altConnection, error: altError } = await supabase
          .from('seo_location_connections')
          .select(`
            *,
            from_location:from_location_id(
              id, type, city, state, nga_format
            ),
            to_location:to_location_id(
              id, type, city, state, per_format
            ),
            template_type:template_type_id(
              id, name, slug
            )
          `)
          .eq('template_url', pathWithoutSlash)
          .eq('status', 'active')
          .single();

        if (altError || !altConnection) {
          console.error('Page data not found for:', currentPath);
          setError('Page data not found');
          setLoading(false);
          return;
        }

        console.log('Using alternative connection:', altConnection);
        connection = altConnection;
      } else {
        connection = initialConnection;
      }

      setLocationData({
        from_location: connection.from_location,
        to_location: connection.to_location
      });

      const fromIata = await getIataCode(connection.from_location.city);
      const toIata = await getIataCode(connection.to_location.city);

      console.log('Retrieved IATA codes:', fromIata, '->', toIata);

      if (fromIata && toIata) {
        console.log('Fetching prices for route:', fromIata, '->', toIata);

        const { data: prices, error: pricesError } = await supabase
          .from('processed_flight_prices')
          .select('airline, flight_date, total_price')
          .eq('origin', fromIata)
          .eq('destination', toIata)
          .order('total_price', { ascending: true })
          .limit(10);

        if (pricesError) {
          console.error('Error fetching prices:', pricesError);
          throw pricesError;
        }

        console.log('Retrieved prices:', prices?.length || 0, 'results');
        setFlightPrices(prices || []);
      }

      const { data: template, error: templateError } = await supabase
        .from('seo_page_templates')
        .select('*')
        .eq('template_type_id', connection.template_type.id)
        .single();

      if (templateError) throw templateError;
      if (!template) throw new Error('Template not found');

      const { data: templateComponents, error: componentsError } = await supabase
        .from('seo_template_components')
        .select('*')
        .eq('template_id', template.id)
        .eq('status', 'active')
        .order('display_order');

      if (componentsError) throw componentsError;

      const formattedTitle = replacePlaceholders(template.seo_title, {
        from_location: connection.from_location,
        to_location: connection.to_location
      });

      setPriceTitle(replacePlaceholders('{nga_city} {per_state}', {
        from_location: connection.from_location,
        to_location: connection.to_location
      }));

      const formattedDescription = replacePlaceholders(template.meta_description, {
        from_location: connection.from_location,
        to_location: connection.to_location
      });

      setTemplateData({
        seo_title: formattedTitle,
        meta_description: formattedDescription,
        template_type: connection.template_type,
      });

      setComponents(templateComponents || []);

      document.title = formattedTitle;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', formattedDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = formattedDescription;
        document.head.appendChild(meta);
      }

    } catch (err) {
      console.error('Error fetching page data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const renderComponent = (component: TemplateComponent) => {
    if (!locationData) return null;

    const fromCity = locationData.from_location.city || locationData.from_location.state;
    const toCity = locationData.to_location.city || locationData.to_location.state;

    switch (component.component_name) {
      case 'SEOHead':
        return (
          <SEOHead
            title={templateData?.seo_title ?? ''}
            description={templateData?.meta_description ?? ''}
            canonicalUrl={window.location.pathname}
            fromCity={locationData.from_location.city || undefined}
            toCity={locationData.to_location.city || undefined}
            fromState={locationData.from_location.state}
            toState={locationData.to_location.state}
          />
        );

      case 'HeaderComponent':
        return (
          <HeaderComponent
            title={templateData?.seo_title ?? ''}
            subtitle={templateData?.meta_description ?? ''}
            className="mb-8"
          />
        );

      case 'FlightSearchComponent':
        return (
          <FlightSearchComponent
            fromCity={fromCity}
            toCity={toCity}
            className="mb-8"
          />
        );

      case 'PricingTableComponent':
        return (
          <PricingTableComponent
            fromCity={fromCity}
            toCity={toCity}
            prices={flightPrices.map(price => ({
              airline: price.airline,
              date: price.flight_date,
              price: price.total_price
            }))}
            title={priceTitle}
            className="mb-8"
          />
        );

      case 'StateCityPricingComponent':
        return (
          <StateCityPricingComponent
            fromLocation={locationData.from_location}
            toLocation={locationData.to_location}
            title={priceTitle}
            className="mb-8"
          />
        );

      case 'StatePricingComponent':
        return (
          <StatePricingComponent
            fromLocation={locationData.from_location}
            toLocation={locationData.to_location}
            title={priceTitle}
            className="mb-8"
          />
        );

      case 'RouteInfoComponent':
        return (
          <RouteInfoComponent
            fromCity={fromCity}
            toCity={toCity}
            airlines={Array.from(new Set(flightPrices.map(p => p.airline)))}
            duration="1h 40m"
            title={priceTitle}
            isDirect={true}
            className="mb-8"
          />
        );

      case 'StateRouteInfoComponent':
        return (
          <StateRouteInfoComponent
            fromLocation={locationData.from_location}
            toLocation={locationData.to_location}
            title={priceTitle}
            className="mb-8"
          />
        );

      case 'FAQComponent':
        const minPrice = Math.min(...flightPrices.map(p => p.total_price));
        const maxPrice = Math.max(...flightPrices.map(p => p.total_price));
        
        return (
          <FAQComponent
            fromCity={fromCity}
            toCity={toCity}
            questions={[
              {
                question: `Sa kushton një biletë ${priceTitle}?`,
                answer: `Çmimet për fluturime ${priceTitle} fillojnë nga ${minPrice}€ dhe mund të arrijnë deri në ${maxPrice}€, në varësi të sezonit dhe disponueshmërisë.`,
              },
              {
                question: `si mund te rezervojme bileta ${priceTitle}?`,
                answer: `Biletat ${priceTitle} mund ti rezervoni duke kontaktuar me stafin tone.`,
              },
              {
                question: `Cilat kompani ajrore operojnë në këtë rrugë?`,
                answer: `Kompanitë kryesore që operojnë fluturime ${priceTitle} janë ${Array.from(new Set(flightPrices.map(p => p.airline))).join(', ')}.`,
              },
              {
                question: `A ka fluturime direkte ${priceTitle}?`,
                answer: `Kontaktoni me stafin tone tone per tu informuar rreth fluturimeve per bileta avioni ${priceTitle}.`,
              },
              {
                question: `Kur duhet të rezervoj biletën time?`,
                answer: `Rekomandohet të rezervoni biletën tuaj të paktën 2-3 muaj përpara për të gjetur çmimet më të mira. Gjatë sezonit të lartë (verë dhe festa), është mirë të rezervoni edhe më herët.`,
              }
            ]}
            title={priceTitle}
            className="mb-8"
          />
        );

      case 'StateFAQComponent':
        return (
          <StateFAQComponent
            fromLocation={locationData.from_location}
            toLocation={locationData.to_location}
            title={priceTitle}
            className="mb-8"
          />
        );

      case 'RelatedDestinationsComponent':
        return (
          <RelatedDestinationsComponent
            fromLocation={locationData.from_location}
            toLocation={locationData.to_location}
            title={priceTitle}
            className="mb-8"
          />
        );

      case 'FooterComponent':
        return (
          <FooterComponent
            fromCity={fromCity}
            toCity={toCity}
            seoText={`Rezervoni biletat tuaja për fluturime të lira nga ${fromCity} në ${toCity}. Ne ofrojmë çmimet më të mira dhe shërbimin më të mirë për udhëtarët tanë.`}
            links={[
              {
                text: 'Tirana - London',
                url: '/bileta-avioni-tirana-ne-london',
                category: 'Popular',
              },
              {
                text: 'Tirana - Paris',
                url: '/bileta-avioni-tirana-ne-paris',
                category: 'Popular',
              },
              { text: 'FAQ', url: '/pyetjet-e-bera-shpesh', category: 'Quick' },
            ]}
            className="mt-12"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  if (error || !templateData || !locationData) {
    return (
      <div className="min-h-screen bg-[#F7FAFC]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-3xl font-semibold text-[#2D3748] mb-4">
              Page Not Found
            </h1>
            <p className="text-[#4A5568]">
              {error || 'The requested page could not be found.'}
            </p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] font-['Inter']">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {components
          .sort((a, b) => a.display_order - b.display_order)
          .map((component) => (
            <React.Fragment key={component.component_name}>
              {renderComponent(component)}
            </React.Fragment>
          ))}
      </div>
      <GlobalFooter />
    </div>
  );
}