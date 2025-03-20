import React from 'react';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Politikat e Privatesise</h1>
            </div>

            <div className="prose prose-lg max-w-none">
              <p>
                Hima Travel & Tours, ju informon se, me qëllim për t'ju ofruar një shërbim sa më të mirë dhe përgjigje të shpejtë ndaj kërkesave tuaja, në platformën onlinë në faqet tona të internetit, kërkohet që klientët apo përdoruesit të japin disa të dhëna personale në formen e aplikimit online për të proceduar me rezervimin online.
              </p>

              <p>
                Hima Travel & Tours disponon faqen zyrtare të internetit www.himatravel.com. Nëpërmjet këtyre faqeve, kompania u vjen në ndihmë klientëve të interesuar për paketa turistike apo cdo lloj shërbimi udhëtimi.
              </p>

              <p>
                Të dhënat tuaja grumbullohen, përpunohen dhe ruhen nga Hima Travel & Tours në përputhje të plotë me parashikimet e ligjit nr. 9887 datë 10.03.2008 "Për Mbrojtjen e të Dhënave Personale". Këto veprime do të kryhen sipas parimit të respektimit dhe garantimit të të drejtave dhe lirive themelore të njeriut dhe në veçanti të drejtës së ruajtjes së jetës private.
              </p>

              <p>
                Dhënia e të dhënave tuaja personale nuk është e detyrueshme, por është kusht i domosdoshëm për të proceduar rezervimin tuaj online.
              </p>

              <h2>1. Perkufizimi i termave</h2>
              <p>
                Në këtë marrëveshje, termat e mëposhtëm do të kenë këtë kuptim:
              </p>
              <ul>
                <li>
                  <strong>Agjenci:</strong> Person juridik i regjistruar i cili kryen veprimtarinë e ofrimit, gjetjes dhe mundësimit të udhëtimeve turistike, biletave të udhëtimit në mënyra të ndryshme transporti si dhe bileta për aktivitete sportive ose kulturore për klientët, në këmbim të pagesës.
                </li>
                <li>
                  <strong>Cookie:</strong> Një pjesë informacioni e dërguar nga një faqe interneti dhe që ruhet në browserin e përdoruesit ndërkohë që përdoruesi sheh faqen e internetit. Çdo herë që një përdorues hap një faqe interneti, browseri dërgon një cookie në serverin e përdoruesit për ta lajmëruar atë për aktivitetin e tij të mëparshëm.
                </li>
              </ul>

              <h2>2. Perdorimi i cookie</h2>
              <ul>
                <li>
                  Faqet e internetit që i përkasin agjencisë, i përdorin cookie për të dalluar vizitorët e faqes njëri nga tjetri. Disa cookie janë të domosdoshëm për mirëfunksionimin e faqeve të internetit të agjencisë, për të lejuar përdoruesit e faqes të bëjnë rezervime online dhe për të mundësuar stafin e agjencisë të marrë e të përpunojë kërkesat e klientëve.
                </li>
                <li>
                  Disa lloje të tjera cookie e ndihmojnë stafin e agjencisë të mundësojë një përvojë të mirë për klientët kur këta vizitojnë faqen e internetit. Cookie japin edhe informacion mbi ofertat e agjencisë.
                </li>
                <li>
                  Cookie përdoren gjithashtu, për të reklamuar në faqen e internetit të agjencisë.
                </li>
              </ul>

              <h2>3. Deklarate mbi privatesine</h2>
              <p>
                Hima Travel & Tours respekton rëndësinë e privatësisë së klientëve të saj. Kjo deklaratë përcakton bazën mbi të cilën mblidhen dhe përpunohen të dhënat e çdo klienti.
              </p>

              <h3>3.1. Mbledhja dhe Ruajtja e të Dhënave</h3>
              <p>
                Hima Travel & Tours siguron çdo klient se të dhënat që mbërrijnë në backoffice apo që klienti nënshkruan personalisht në zyrë, janë të siguruara me anë të një sistemi të sigurtë dhe këto të dhëna përdoren vetëm për efekt të garantimit të rezervimit të klientit.
              </p>

              <h3>3.2. Të dhënat që mblidhen</h3>
              <p>
                Të dhënat e mëposhtme të klientëve mblidhen nga faqja e internetit:
              </p>
              <ul>
                <li>Informacioni që klienti jep në mënyrë që të kryhet rezervimi i udhëtimit</li>
                <li>Informacioni që klienti jep në mënyrë që të bëhet pjesë e një konkursi që reklamohet në faqen e internetit, kur plotëson një pyetësor ose kur raporton një problem</li>
                <li>Detaje të transfertave bankare që klienti kryen për të përfunduar një rezervim</li>
                <li>Nëse klienti kontakton stafin e agjencisë, stafi mund të ruajë adresën e e-mail</li>
              </ul>

              <h2>4. Ruajtja dhe transferimi i te dhenave</h2>
              <ul>
                <li>
                  Të dhënat e mbledhura nga agjencia vetëm për qëllime rezervimi dhe të lëna me vullnet të lirë nga subjekti i të dhënave mund të transferohen ose të ruhen në një vend jashtë Zonës Ekonomike Europiane.
                </li>
                <li>
                  Hima Travel & Tours në bazë të kontratave dhe marrëveshjeve që ka me furnitorë globalë, do të transferojë në database të tyre të dhënat e klientëve, të cilët rezervojnë nëpërmjet faqeve online të kompanisë.
                </li>
                <li>
                  Të gjitha të dhënat e mbledhura nga agjencia do të ruhen në serverat e sigurtë të Hima Travel & Tours.
                </li>
              </ul>

              <h2>5. Anullimi i perpunimit te te dhenave</h2>
              <p>
                Klienti ka të drejtë të kërkojë nga agjencia të njihet me informacionin që mund të jëtë mbledhur për të dhe më pas të mos përpunojë të dhënat personale për qëllime marketingu apo arsye të ndryshme me anë të e-mail ose një kërkese drejtuar kompanisë në adresën e kontaktit.
              </p>

              <h2>6. Pelqimi mbi mbrojtjen e te dhenave personale</h2>
              <p>
                Duke vazhduar përdorimin e faqeve të internetit të Hima Travel & Tours, klienti jep pëlqimin e tij mbi mbledhjen dhe përpunimin e të dhënave nga ana e agjencisë. Të dhënat personale do të ruhen për aq kohë sa ç'është e nevojshme sipas qëllimit kryesor të mbledhjes së tyre.
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt për Privatësinë</h3>
                <p className="text-gray-700">
                  Nese keni pyetje, verejtje, kerkesa apo ankesa ne lidhje me perdorimin e ketyre te dhenave nga ana e Hima Travel & Tours, atehere lutemi te na drejtoheni me shkrim në adresen e mëposhtme:
                </p>
                <p className="mt-4 text-gray-700">
                  <strong>Personi Përgjegjes për Privatesinë:</strong><br />
                  Hima Travel & Tours<br />
                  Rruga Muhamet Gjollesha, perballe hyrjes se rruges Myslym Shyri<br />
                  Tirane, Albania
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}