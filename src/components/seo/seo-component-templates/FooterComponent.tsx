import React from 'react';
import { Plane, Info, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

interface Link {
  text: string;
  url: string;
  category?: string;
}

interface FooterProps {
  seoText: string;
  links: Link[];
  fromCity?: string;
  toCity?: string;
  className?: string;
}

export function FooterComponent({ 
  seoText, 
  links, 
  fromCity,
  toCity,
  className = '' 
}: FooterProps) {
  // Group links by category
  const groupedLinks = links.reduce((acc, link) => {
    const category = link.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(link);
    return acc;
  }, {} as Record<string, Link[]>);

  return (
    <footer className={`bg-white border-t border-gray-100 ${className}`}>
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold">
                <span className="text-blue-600">Hima</span>
                <span className="text-gray-900">Travel</span>
              </h3>
            </div>
            <div className="prose prose-sm text-gray-600">
              <p>{seoText}</p>
            </div>
          </div>

          {/* Popular Routes */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Linjat me te kerkuara</h4>
            <ul className="space-y-2">
              {groupedLinks['Popular']?.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.url}
                    className="text-gray-600 hover:text-blue-600 text-sm transition-colors flex items-center"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Lidhje të Shpejta</h4>
            <ul className="space-y-2">
              {groupedLinks['Quick']?.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.url}
                    className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Na Kontaktoni</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="tel:+355695161381"
                  className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  +355 69 516 1381
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@flightfinder.com"
                  className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  kontakt@himatravel.com
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Rr.Myslym Shyri, Kryeqzimi me Muhamet Gjolleshen, Tirane<br />
                  Shqiperi
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* SEO Text Block */}
        <div className="border-t border-gray-100 pt-8">
          <div className="prose prose-sm max-w-none text-gray-500">
            {fromCity && toCity && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Informacion per Fluturimin {fromCity} - {toCity}
                    </h5>
                    <p className="text-sm text-gray-600">
                      Gjeni dhe rezervoni fluturime nga {fromCity} ne {toCity} me çmimet me te mira. 
                      Krahasoni ofertat nga kompanite ajrore te ndryshme dhe zgjidhni opsionin me te pershtatshem per ju.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} HimaTravel. Te gjitha te drejtat e rezervuara.
            </p>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privatesia
              </a>
              <a href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Kushtet e Perdorimit
              </a>
              <a href="/cookies" className="text-sm text-gray-500 hover:text-gray-700">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}