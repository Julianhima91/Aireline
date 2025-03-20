import React from 'react';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Kushtet e Perdorimit</h1>
            </div>

            <div className="prose prose-lg max-w-none">
              <p>
                Duke përdorur faqen e internetit të Hima Travel & Tours, ju pranoni të respektoni këto kushte të përdorimit. Ju lutemi t'i lexoni me kujdes para se të përdorni faqen tonë.
              </p>

              <h2>1. Përdorimi i Faqes</h2>
              <p>
                Faqja e internetit e Hima Travel & Tours është krijuar për t'ju ndihmuar të gjeni dhe të rezervoni bileta avioni dhe shërbime të tjera udhëtimi. Duke përdorur këtë faqe, ju pranoni:
              </p>
              <ul>
                <li>Të jepni informacion të saktë dhe të plotë gjatë procesit të rezervimit</li>
                <li>Të përdorni faqen vetëm për qëllime të ligjshme</li>
                <li>Të mos ndërhyni në sigurinë e faqes ose të sistemeve tona</li>
                <li>Të mos përdorni faqen për qëllime komerciale pa autorizimin tonë</li>
              </ul>

              <h2>2. Rezervimet dhe Pagesat</h2>
              <p>
                Kur bëni një rezervim përmes Hima Travel & Tours:
              </p>
              <ul>
                <li>Çmimet janë të shprehura në monedhën e treguar dhe përfshijnë taksat e aplikueshme</li>
                <li>Rezervimi juaj konfirmohet vetëm pas pagesës së plotë</li>
                <li>Disa tarifa dhe kushte specifike mund të aplikohen nga kompanitë ajrore</li>
                <li>Jeni përgjegjës për sigurimin e dokumenteve të nevojshme të udhëtimit</li>
              </ul>

              <h2>3. Politikat e Anulimit</h2>
              <p>
                Kushtet e anulimit ndryshojnë sipas llojit të biletës dhe kompanisë ajrore:
              </p>
              <ul>
                <li>Disa bileta mund të jenë të parimbursueshme</li>
                <li>Ndryshimet e rezervimit mund të kenë tarifa shtesë</li>
                <li>Anulimi duhet të bëhet sipas afateve të përcaktuara</li>
                <li>Rimbursimi, nëse është i mundur, do të bëhet sipas politikave të kompanisë ajrore</li>
              </ul>

              <h2>4. Përgjegjësitë</h2>
              <p>
                Hima Travel & Tours vepron si ndërmjetës midis jush dhe ofruesve të shërbimeve:
              </p>
              <ul>
                <li>Nuk jemi përgjegjës për ndryshimet e orareve nga kompanitë ajrore</li>
                <li>Nuk garantojmë disponueshmërinë e çmimeve të shfaqura</li>
                <li>Rekomandojmë të kontrolloni kushtet specifike të biletës para rezervimit</li>
                <li>Jemi të përkushtuar të ofrojmë informacionin më të saktë të mundshëm</li>
              </ul>

              <h2>5. Të Drejtat e Pronësisë Intelektuale</h2>
              <p>
                Të gjitha materialet në këtë faqe interneti, përfshirë por pa u kufizuar në tekst, imazhe, logo dhe kod, janë pronë e Hima Travel & Tours dhe mbrohen nga ligjet e të drejtave të autorit.
              </p>

              <h2>6. Ndryshimet në Kushtet e Përdorimit</h2>
              <p>
                Hima Travel & Tours rezervon të drejtën të ndryshojë këto kushte në çdo kohë. Ndryshimet do të hyjnë në fuqi menjëherë pas publikimit në faqen tonë të internetit.
              </p>

              <h2>7. Ligji i Aplikueshëm</h2>
              <p>
                Këto kushte përdorimi rregullohen dhe interpretohen në përputhje me ligjet e Republikës së Shqipërisë.
              </p>

              <div className="bg-yellow-50 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt për Kushtet e Përdorimit</h3>
                <p className="text-gray-700">
                  Për çdo pyetje ose paqartësi në lidhje me këto kushte përdorimi, ju lutemi na kontaktoni:
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