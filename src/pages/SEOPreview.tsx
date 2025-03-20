import React, { useState } from 'react';
import { 
  HeaderComponent, 
  FlightSearchComponent, 
  PricingTableComponent,
  RouteInfoComponent,
  FAQComponent,
  RelatedDestinationsComponent,
  FooterComponent
} from '../components/seo/seo-component-templates';

export default function SEOPreview() {
  const [previewData] = useState({
    city: 'Tirana',
    state: 'Albania',
    nga_city: 'Nga Tirana',
    per_city: 'Për Romë',
    nga_state: 'Nga Shqipëria',
    per_state: 'Për Itali'
  });

  // Sample price data for preview
  const samplePrices = [
    {
      airline: "Wizz Air",
      date: "2025-07-15",
      price: 79
    },
    {
      airline: "Ryanair",
      date: "2025-07-18",
      price: 85
    },
    {
      airline: "Air Albania",
      date: "2025-07-20",
      price: 95
    }
  ];

  // Sample route data for preview
  const sampleRouteInfo = {
    airlines: ["Wizz Air", "Ryanair", "Air Albania"],
    duration: "1h 40m",
    isDirect: true
  };

  // Sample FAQ data for preview
  const sampleFAQs = [
    {
      question: "Sa kushton një biletë nga Tirana në Romë?",
      answer: "Çmimet për fluturime nga Tirana në Romë fillojnë nga 79€ dhe mund të arrijnë deri në 150€, në varësi të sezonit dhe disponueshmërisë. Rekomandohet rezervimi i hershëm për të siguruar çmimet më të mira."
    },
    {
      question: "Sa zgjat fluturimi nga Tirana në Romë?",
      answer: "Fluturimi direkt nga Tirana në Romë zgjat rreth 1 orë e 40 minuta. Kohëzgjatja mund të ndryshojë nëse zgjidhni një fluturim me ndalesa."
    },
    {
      question: "Cilat kompani ajrore operojnë në këtë rrugë?",
      answer: "Kompanitë kryesore që operojnë fluturime nga Tirana në Romë janë Wizz Air, Ryanair dhe Air Albania. Secila kompani ofron shërbime dhe çmime të ndryshme."
    },
    {
      question: "A ka fluturime direkte nga Tirana në Romë?",
      answer: "Po, ka fluturime direkte nga Tirana në Romë. Këto fluturime operohen rregullisht nga disa kompani ajrore dhe janë zgjedhja më e përshtatshme për udhëtarët."
    },
    {
      question: "Kur duhet të rezervoj biletën time?",
      answer: "Rekomandohet të rezervoni biletën tuaj të paktën 2-3 muaj përpara për të gjetur çmimet më të mira. Gjatë sezonit të lartë (verë dhe festa), është mirë të rezervoni edhe më herët."
    }
  ];

  // Sample related destinations data for preview
  const sampleDestinations = [
    {
      city1: "Tirana",
      city2: "Milan",
      link: "/bileta-avioni-tirana-ne-milan"
    },
    {
      city1: "Tirana",
      city2: "Paris",
      link: "/bileta-avioni-tirana-ne-paris"
    },
    {
      city1: "Rome",
      city2: "Barcelona",
      link: "/bileta-avioni-rome-ne-barcelona"
    },
    {
      city1: "Tirana",
      city2: "London",
      link: "/bileta-avioni-tirana-ne-london"
    },
    {
      city1: "Rome",
      city2: "Vienna",
      link: "/bileta-avioni-rome-ne-vienna"
    },
    {
      city1: "Tirana",
      city2: "Istanbul",
      link: "/bileta-avioni-tirana-ne-istanbul"
    }
  ];

  // Sample footer links for preview
  const sampleFooterLinks = [
    {
      text: "Tirana - London",
      url: "/bileta-avioni-tirana-ne-london",
      category: "Popular"
    },
    {
      text: "Tirana - Paris",
      url: "/bileta-avioni-tirana-ne-paris",
      category: "Popular"
    },
    {
      text: "Tirana - Istanbul",
      url: "/bileta-avioni-tirana-ne-istanbul",
      category: "Popular"
    },
    {
      text: "Linjat Ajrore",
      url: "/linjat-ajrore",
      category: "Quick"
    },
    {
      text: "FAQ",
      url: "/pyetjet-e-bera-shpesh",
      category: "Quick"
    },
    {
      text: "Kontakti",
      url: "/kontakt",
      category: "Quick"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5 sm:px-6">
        <h1 className="text-lg font-medium leading-6 text-gray-900">
          SEO Components Preview
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Preview and test SEO components with dynamic placeholders
        </p>
      </div>

      {/* Components Preview */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Flight Search Component Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Flight Search Component</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tests the flight search form with dynamic city placeholders
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <FlightSearchComponent
              fromCity={previewData.nga_city}
              toCity={previewData.per_city}
            />
          </div>
        </div>

        {/* Route Information Component Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Route Information Component</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tests the route information display with sample data
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <RouteInfoComponent
              fromCity={previewData.nga_city}
              toCity={previewData.per_city}
              airlines={sampleRouteInfo.airlines}
              duration={sampleRouteInfo.duration}
              isDirect={sampleRouteInfo.isDirect}
            />
          </div>
        </div>

        {/* FAQ Component Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">FAQ Component</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tests the FAQ accordion with sample questions
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <FAQComponent
              fromCity={previewData.nga_city}
              toCity={previewData.per_city}
              questions={sampleFAQs}
            />
          </div>
        </div>

        {/* Related Destinations Component Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Related Destinations Component</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tests the related destinations display with sample routes
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <RelatedDestinationsComponent
              fromCity={previewData.nga_city}
              toCity={previewData.per_city}
              destinations={sampleDestinations}
            />
          </div>
        </div>

        {/* Pricing Table Component Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Pricing Table Component</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tests the pricing table with sample flight data
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <PricingTableComponent
              fromCity={previewData.nga_city}
              toCity={previewData.per_city}
              prices={samplePrices}
            />
          </div>
        </div>

        {/* Header Component Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Header Component</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tests different title and subtitle combinations with placeholders
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {/* Example 1: City to City */}
            <div className="mb-12 border-b border-gray-100 pb-12">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                City to City Example
              </h3>
              <HeaderComponent
                title={`Bileta Avioni ${previewData.nga_city} në ${previewData.per_city}`}
                subtitle="Rezervoni fluturimet tuaja me çmimet më të mira të garantuara!"
              />
            </div>

            {/* Example 2: State to State */}
            <div className="mb-12 border-b border-gray-100 pb-12">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                State to State Example
              </h3>
              <HeaderComponent
                title={`Fluturime ${previewData.nga_state} në ${previewData.per_state}`}
                subtitle="Gjeni dhe krahasoni çmimet më të mira për udhëtimin tuaj!"
              />
            </div>

            {/* Example 3: City to State */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                City to State Example
              </h3>
              <HeaderComponent
                title={`Bileta Avioni ${previewData.nga_city} në ${previewData.per_state}`}
                subtitle="Rezervoni online me çmimet më të ulëta të garantuara!"
              />
            </div>
          </div>
        </div>

        {/* Footer Component Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Footer Component</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tests the SEO footer with dynamic links and content
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <FooterComponent
              fromCity={previewData.nga_city}
              toCity={previewData.per_city}
              seoText={`Rezervoni biletat tuaja për fluturime të lira nga ${previewData.nga_city} në ${previewData.per_city}. Ne ofrojmë çmimet më të mira dhe shërbimin më të mirë për udhëtarët tanë.`}
              links={sampleFooterLinks}
            />
          </div>
        </div>
      </div>
    </div>
  );
}