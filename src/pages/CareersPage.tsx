import React from 'react';
import { Navbar } from '../components/Navbar';
import { GlobalFooter } from '../components/common/GlobalFooter';
import { Users, Briefcase, Globe, Target, Award, Send, Mail, Calculator } from 'lucide-react';

export default function CareersPage() {
  const handleApply = () => {
    const subject = encodeURIComponent('Aplikim për Punë - Hima Travel');
    const body = encodeURIComponent('Përshëndetje,\n\nPo aplikoj për pozicionin...');
    window.location.href = `mailto:kontakt@himatravel.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <div className="relative bg-blue-600 text-white py-16 md:py-24">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80"
              alt="Travel background"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 mix-blend-multiply" />
          </div>

          <div className="relative container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Bashkohu me Hima Travel – Zbulo Mundësitë Tona për Karrierë!
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Je pasionant për udhëtimet dhe ke përvojë në turizëm? Kërkojmë njerëz me eksperiencë, 
                energji dhe kreativitet për t'u bërë pjesë e ekipit tonë!
              </p>
              <button
                onClick={handleApply}
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg 
                  font-semibold hover:bg-blue-50 transition-colors duration-200 transform hover:scale-105"
              >
                <Send className="w-5 h-5 mr-2" />
                Apliko Tani
              </button>
            </div>
          </div>
        </div>

        {/* Why Join Us Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Në Hima Travel, nuk është vetëm punë – është një eksperiencë!
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-blue-50 rounded-xl p-6 transform hover:-translate-y-1 transition-transform duration-200">
                <Globe className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Agjenci e Njohur
                </h3>
                <p className="text-gray-600">
                  Jemi një nga agjencitë më të njohura në Shqipëri që nga viti 2011
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 transform hover:-translate-y-1 transition-transform duration-200">
                <Users className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ambient Dinamik
                </h3>
                <p className="text-gray-600">
                  Ambienti ynë është dinamik, kreativ dhe me mundësi zhvillimi
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 transform hover:-translate-y-1 transition-transform duration-200">
                <Briefcase className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ekspertë Turizmi
                </h3>
                <p className="text-gray-600">
                  Puno me ekspertët më të mirë të turizmit dhe udhëto në destinacionet më të njohura
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 transform hover:-translate-y-1 transition-transform duration-200">
                <Target className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Pagë Konkurruese
                </h3>
                <p className="text-gray-600">
                  Pagë e konkurrueshme & bonuse për performancën
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Pozicionet që Kërkojmë Aktualisht
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Travel Advisor Position */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Këshilltar/e Udhëtimesh & Rezervimesh
                    </h3>
                    <div className="space-y-2 text-gray-600 mb-4">
                      <p>• Eksperiencë në shitjen e paketave turistike dhe bileta avioni</p>
                      <p>• Njohuri në te gjuheve te huaja</p>
                      <p>• Aftësi të shkëlqyera komunikuese dhe shitëse</p>
                    </div>
                    <button
                      onClick={handleApply}
                      className="text-blue-600 font-medium hover:text-blue-800"
                    >
                      Apliko për këtë pozicion →
                    </button>
                  </div>
                </div>
              </div>

              {/* Marketing Specialist Position */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Specialist Marketingu për Turizëm
                    </h3>
                    <div className="space-y-2 text-gray-600 mb-4">
                      <p>• Eksperiencë në menaxhimin e fushatave sociale</p>
                      <p>• Aftësi për të krijuar përmbajtje vizuale</p>
                      <p>• Njohuri të Facebook, Instagram dhe Google Ads</p>
                    </div>
                    <button
                      onClick={handleApply}
                      className="text-blue-600 font-medium hover:text-blue-800"
                    >
                      Apliko për këtë pozicion →
                    </button>
                  </div>
                </div>
              </div>

              {/* Finance Specialist Position */}
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Specialist Finance
                    </h3>
                    <div className="space-y-2 text-gray-600 mb-4">
                      <p>• Menaxhimi i detyrave ditore financiare</p>
                      <p>• Kontroll i detajuar në CRM dhe sistemet bankare</p>
                      <p>• Monitorimi i arkës dhe transaksioneve</p>
                      <p>• Eksperiencë në kontabilitet dhe financa</p>
                    </div>
                    <button
                      onClick={handleApply}
                      className="text-blue-600 font-medium hover:text-blue-800"
                    >
                      Apliko për këtë pozicion →
                    </button>
                  </div>
                </div>
              </div>

              {/* Open Position Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Apliko për një Pozicion të Hapur
                    </h3>
                    <p className="text-blue-100 mb-4">
                      Nuk gjeni pozicionin e duhur? Na tregoni për aftësitë tuaja dhe 
                      se si mund të kontribuoni në suksesin e Hima Travel.
                    </p>
                    <button
                      onClick={handleApply}
                      className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg 
                        font-medium hover:bg-blue-50 transition-colors"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Dërgo Aplikimin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Apply Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Si të Aplikosh?</h2>
              
              <div className="bg-blue-50 rounded-xl p-8 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Dërgo CV dhe Letër Motivimi
                </h3>
                <div className="flex justify-center mb-6">
                  <a
                    href="mailto:kontakt@himatravel.com"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg 
                      font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    kontakt@himatravel.com
                  </a>
                </div>
                <p className="text-gray-600">
                  Ose na vizito në zyrat tona për një bisedë të lirë!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Zyra në Tiranë</h4>
                  <p className="text-gray-600">
                    Kryqëzimi i Rrugës Muhamet Gjollesha me Myslym Shyrin
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Zyra në Durrës</h4>
                  <p className="text-gray-600">
                    Rruga Aleksandër Goga, përballë Shkollës Eftali Koçi
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <p className="text-xl text-blue-600 font-medium">
                  Nëse je gati për një karrierë plot mundësi dhe pasion për turizmin, 
                  Hima Travel është vendi i duhur për ty! 🚀
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}