
import { FlightOption } from '../types/flight';
import { SearchParams } from '../types/search';

interface SEOData {
  title: string;
  description: string;
  canonicalUrl: string;
  structuredData: Record<string, any>;
}

export function generateFlightSEOData(
  searchParams: SearchParams,
  flights: FlightOption[],
  batchId: string
): SEOData {
  // Get cheapest flight price
  const cheapestPrice = Math.min(...flights.map(f => f.price));
  
  // Get direct flight info
  const hasDirectFlights = flights.some(f => f.flights.length === 1);

  // Generate title
  const title = searchParams.tripType === 'roundTrip'
    ? `Bileta Avioni ${searchParams.fromLocation} - ${searchParams.toLocation} | Vajtje-Ardhje nga ${cheapestPrice}€`
    : `Bileta Avioni ${searchParams.fromLocation} - ${searchParams.toLocation} | Nga ${cheapestPrice}€`;

  // Generate description
  const description = `Rezervoni bileta avioni ${
    searchParams.fromLocation
  } - ${
    searchParams.toLocation
  }${
    hasDirectFlights ? ' me fluturime direkte' : ''
  }. ✈️ Çmime nga ${cheapestPrice}€. ${
    searchParams.tripType === 'roundTrip' ? 'Vajtje-ardhje' : 'Vetëm vajtje'
  }. Rezervoni online!`;

  // Generate canonical URL
  const canonicalUrl = `/results?batch_id=${batchId}`;

  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Flight',
    name: `${searchParams.fromLocation} to ${searchParams.toLocation}`,
    departureAirport: {
      '@type': 'Airport',
      iataCode: searchParams.fromCode,
      name: searchParams.fromLocation
    },
    arrivalAirport: {
      '@type': 'Airport',
      iataCode: searchParams.toCode,
      name: searchParams.toLocation
    },
    departureTime: searchParams.departureDate,
    ...(searchParams.tripType === 'roundTrip' && searchParams.returnDate && {
      returnTime: searchParams.returnDate
    }),
    offers: {
      '@type': 'Offer',
      price: cheapestPrice,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock'
    }
  };

  return {
    title,
    description,
    canonicalUrl,
    structuredData
  };
}

export function generateSEOSitemap(routes: Array<{from: string, to: string}>): string {
  const baseUrl = 'https://biletaavioni.himatravel.com';
  
  const urls = routes.map(route => ({
    loc: `${baseUrl}/bileta-avioni-${route.from.toLowerCase()}-${route.to.toLowerCase()}`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.8
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return xml;
}
