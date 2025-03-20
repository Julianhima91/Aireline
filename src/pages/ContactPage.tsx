import React from 'react';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Na Kontaktoni</h1>
            <p className="text-lg text-gray-600">
              Jemi këtu për t'ju ndihmuar me çdo pyetje që keni
            </p>
          </div>

          {/* Office Locations */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Tirana Office */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Zyra në Tiranë</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    Tiranë, Tek kryqëzimi i Rrugës Muhamet Gjollesha me Myslym Shyrin
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a href="tel:+355694767427" className="text-blue-600 hover:text-blue-800 transition-colors">
                    +355 694 767 427
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">E Hënë - E Shtunë: 09:00 - 19:00</span>
                </div>
              </div>

              <div className="w-full h-[300px] rounded-lg overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4053.628431047907!2d19.80204687678945!3d41.32344189995802!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x135031aa439cd9f9%3A0x3adc4758df5bcb79!2sHima%20Travel%20Agjensi%20Udhetimi%20%26%20Turistike%20-%20Bileta%20Avioni%20Tirane!5e1!3m2!1sen!2s!4v1741726786173!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* Durrës Office */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Zyra në Durrës</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    Rruga Aleksander Goga, Përballë Shkollës Eftali Koci
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a href="tel:+355699868907" className="text-blue-600 hover:text-blue-800 transition-colors">
                    +355 699 868 907
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">E Hënë - E Shtunë: 09:00 - 19:00</span>
                </div>
              </div>

              <div className="w-full h-[300px] rounded-lg overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d348.09744179985995!2d19.445203970239138!3d41.3227227708329!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x134fdb581e5f506d%3A0x4d645fcf267865b9!2sBileta%20Avioni%20-%20Agjenci%20Udh%C3%ABtimi%20Hima%20Travel!5e1!3m2!1sen!2s!4v1741726913501!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Kontaktoni me Ne</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Email</h3>
                <a 
                  href="mailto:kontakt@himatravel.com"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  kontakt@himatravel.com
                </a>
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Telefon</h3>
                <div className="space-y-2">
                  <a 
                    href="tel:+355694767427"
                    className="block text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    +355 694 767 427 (Tiranë)
                  </a>
                  <a 
                    href="tel:+355699868907"
                    className="block text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    +355 699 868 907 (Durrës)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}