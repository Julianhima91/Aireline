import React from 'react';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { Plane, MapPin, CheckCircle, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Rreth Nesh</h1>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="lead text-xl text-gray-600 mb-8">
                Që nga viti 2011, Hima Travel është bërë një nga agjencitë më të besuara të udhëtimit në Shqipëri, 
                duke ofruar bileta avioni, pushime të organizuara, udhëtime me guida dhe rezervime hoteliere për 
                mijëra klientë çdo vit. Me përvojë mbi një dekadë, ne jemi të përkushtuar për të ofruar shërbime 
                cilësore, çmime konkurruese dhe eksperienca të paharrueshme për udhëtarët tanë.
              </p>

              {/* Destinations Section */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Destinacionet Ku Jemi të Specializuar
                </h2>
                <p className="mb-6">
                  Hima Travel është specialist në organizimin e udhëtimeve dhe pushimeve në disa nga destinacionet 
                  më të kërkuara në botë, duke siguruar akomodime cilësore, paketa all-inclusive dhe itinerare të 
                  personalizuara. Ne kemi një rrjet të gjerë bashkëpunëtorësh ndërkombëtarë, duke garantuar çmime 
                  të përballueshme dhe shërbime të nivelit më të lartë.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇹🇷 Antalia & Bodrum</h3>
                    <p className="text-sm">Resortet më të mira all-inclusive për pushime verore perfekte.</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇪🇬 Sharm El Sheikh & Hurghada</h3>
                    <p className="text-sm">Plazhe tropikale dhe snorkeling i mahnitshëm në Detin e Kuq.</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇬🇷 Greqia</h3>
                    <p className="text-sm">Santorini, Mykonos, Korfuz, Rodos – Ishuj romantikë dhe plazhe me ujë kristal.</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇦🇪 Dubai & Abu Dhabi</h3>
                    <p className="text-sm">Luks, qiellgërvishtës, aventurë në shkretëtirë dhe parqe argëtimi.</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇲🇻 Maldives</h3>
                    <p className="text-sm">Pushime ëndrrash me vila mbi ujë dhe plazhe të virgjëra.</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇪🇸 Barcelona & Ibiza</h3>
                    <p className="text-sm">Histori, kulturë dhe netët më të zjarrta të Europës.</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇹🇭 Tajlanda</h3>
                    <p className="text-sm">Phuket, Bangkok, Koh Samui – Egzotikë, aventura dhe plazhe përrallore.</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🇺🇸 SHBA</h3>
                    <p className="text-sm">New York, Miami, Los Angeles – Udhëtime urbane dhe përvoja unike.</p>
                  </div>
                </div>
              </section>

              {/* Services Section */}
              <section className="bg-white rounded-xl border border-gray-100 p-8 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Shërbimet Tona</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Bileta avioni & autobusi</h3>
                      <p className="text-gray-600">Rezervime për destinacione në mbarë botën.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Paketa turistike me guidë</h3>
                      <p className="text-gray-600">Udhëtime të organizuara në grup ose private.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Hotele & resortet më të mira</h3>
                      <p className="text-gray-600">Akomodime të përzgjedhura me vlerësime të larta.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Viza & siguracione udhëtimi</h3>
                      <p className="text-gray-600">Asistencë për dokumentacionin e nevojshëm.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Na Kontaktoni</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Tirana Office */}
                  <div>
                    <h3 className="font-semibold mb-4">Zyra në Tiranë</h3>
                    <div className="space-y-2 text-gray-600">
                      <p>Tek kryqëzimi i Rrugës Muhamet Gjollesha me Myslym Shyrin</p>
                      <p>Tel: +355 694 767 427</p>
                    </div>
                  </div>
                  {/* Durres Office */}
                  <div>
                    <h3 className="font-semibold mb-4">Zyra në Durrës</h3>
                    <div className="space-y-2 text-gray-600">
                      <p>Rruga Aleksander Goga, Përballë Shkollës Eftali Koci</p>
                      <p>Tel: +355 699 868 907</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}