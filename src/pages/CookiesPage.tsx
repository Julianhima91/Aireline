import React from 'react';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { Cookie } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Cookie className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Politikat e Cookies</h1>
            </div>

            <div className="prose prose-lg max-w-none">
              <p>
                Kjo politikë e cookies shpjegon se çfarë janë cookies dhe si i përdorim ato në faqen tonë të internetit. 
                Duke përdorur faqen tonë, ju pranoni përdorimin e cookies në përputhje me këtë politikë.
              </p>

              <h2>Çfarë janë Cookies?</h2>
              <p>
                Cookies janë skedarë të vegjël teksti që ruhen në pajisjen tuaj (kompjuter, tablet, telefon celular) 
                kur vizitoni faqen tonë të internetit. Ato na ndihmojnë të sigurojmë funksionimin e duhur të faqes, 
                të përmirësojmë performancën dhe t'ju ofrojmë një përvojë më të personalizuar.
              </p>

              <h2>Si i Përdorim Cookies</h2>
              <p>Ne përdorim cookies për qëllimet e mëposhtme:</p>
              
              <h3>Cookies të Domosdoshme</h3>
              <ul>
                <li>Për të mundësuar funksionimin bazë të faqes</li>
                <li>Për të ruajtur statusin e sesionit tuaj të hyrjes</li>
                <li>Për të mbajtur mend zgjedhjet tuaja gjatë kërkimit të fluturimeve</li>
                <li>Për të siguruar funksionalitetin e shportës së rezervimeve</li>
              </ul>

              <h3>Cookies Analitike</h3>
              <ul>
                <li>Për të kuptuar si përdoret faqja jonë</li>
                <li>Për të matur efektivitetin e reklamave tona</li>
                <li>Për të analizuar trendet e kërkimit të fluturimeve</li>
                <li>Për të përmirësuar shërbimet tona bazuar në sjelljen e përdoruesve</li>
              </ul>

              <h3>Cookies të Marketingut</h3>
              <ul>
                <li>Për t'ju shfaqur reklama relevante</li>
                <li>Për të matur suksesin e fushatave tona të marketingut</li>
                <li>Për t'ju ofruar përmbajtje të personalizuar</li>
                <li>Për të ndjekur preferencat tuaja të udhëtimit</li>
              </ul>

              <h2>Menaxhimi i Cookies</h2>
              <p>
                Shumica e shfletuesve të internetit ju lejojnë të kontrolloni cookies përmes preferencave të tyre. 
                Ju mund të:
              </p>
              <ul>
                <li>Shikoni cookies të ruajtura në shfletuesin tuaj</li>
                <li>Fshini të gjitha ose disa cookies</li>
                <li>Bllokoni cookies nga faqe të caktuara</li>
                <li>Bllokoni cookies të palëve të treta</li>
                <li>Bllokoni të gjitha cookies</li>
                <li>Fshini të gjitha cookies kur mbyllni shfletuesin</li>
              </ul>

              <div className="bg-yellow-50 rounded-lg p-6 my-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Kujdes!</h3>
                <p className="text-gray-700">
                  Bllokimi i të gjitha cookies do të ndikojë në funksionalitetin e faqes sonë. 
                  Disa veçori të faqes mund të mos funksionojnë siç duhet nëse çaktivizoni cookies.
                </p>
              </div>

              <h2>Cookies të Palëve të Treta</h2>
              <p>
                Ne përdorim shërbime nga palë të treta që mund të vendosin cookies në pajisjen tuaj. Këto përfshijnë:
              </p>
              <ul>
                <li>Google Analytics për analizën e trafikut</li>
                <li>Shërbimet e reklamimit për reklama të personalizuara</li>
                <li>Platforma të mediave sociale për përmbajtje të integruar</li>
                <li>Shërbime pagese për procesimin e pagesave</li>
              </ul>

              <h2>Përditësimet e Politikës së Cookies</h2>
              <p>
                Ne mund të përditësojmë këtë politikë herë pas here për të reflektuar ndryshimet në përdorimin tonë 
                të cookies. Ndryshimet do të hyjnë në fuqi sapo të publikohen në faqen tonë të internetit.
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt për Politikën e Cookies</h3>
                <p className="text-gray-700">
                  Nëse keni pyetje në lidhje me përdorimin e cookies në faqen tonë, ju lutemi na kontaktoni:
                </p>
                <div className="mt-4 text-gray-700">
                  <strong>Hima Travel & Tours</strong><br />
                  Rruga Muhamet Gjollesha<br />
                  Përballë hyrjes së rrugës Myslym Shyri<br />
                  Tiranë, Shqipëri<br />
                  Email: kontakt@himatravel.com
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