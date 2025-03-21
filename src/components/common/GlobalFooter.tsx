import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              <div className="relative w-full h-[70px]">
                <img alt="logo" src="https://himatravel.com/wp-content/uploads/2020/11/logo-768x277.png" className="max-w-[200px] absolute -left-7"/>
              </div>
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Agjencia juaj e besuar për bileta avioni dhe shërbime turistike që nga viti 2011.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Lidhje të Shpejta</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Rreth Nesh</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Na Kontaktoni</Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Karriera</Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Sitemap</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Mbështetje</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Na Kontaktoni</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Privatësia</Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Kushtet e Përdorimit</Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Politika e Cookies</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-blue-600" />
                <a href="tel:+355694767427" className="hover:text-blue-600 transition-colors">+355 694 767 427</a>
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                <a href="mailto:kontakt@himatravel.com" className="hover:text-blue-600 transition-colors">kontakt@himatravel.com</a>
              </li>
              <li className="flex items-start text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-1 text-blue-600 flex-shrink-0" />
                <span>Tiranë, Tek kryqëzimi i Rrugës Muhamet Gjollesha me Myslym Shyrin</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © 2011 - {currentYear} Hima Travel. Të gjitha të drejtat e rezervuara.
            </p>
            <p className="text-xs text-gray-500 text-center md:text-right">
              Çmimet dhe disponueshmëria mund të ndryshojnë. Mund të aplikohen kushte shtesë.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
