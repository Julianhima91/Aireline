import React, { useState, useEffect } from 'react';
import { Plane, AlertTriangle, RefreshCw, ArrowLeft, Clock, Check, Shield, Users, Calendar, MapPin } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  progress?: number;
  onTimeout?: () => void;
  onRetry?: () => void;
  onBack?: () => void;
}

const LOADING_MESSAGES = [
  'Duke kërkuar fluturimet më të mira për ju...',
  'Duke verifikuar disponueshmërinë e kompanive ajrore...',
  'Duke krahasuar çmimet në të gjitha kompanitë ajrore...',
  'Duke kontrolluar fluturimet direkte...',
  'Duke analizuar opsionet më të mira...'
];

const MILESTONES = [
  { percent: 25, message: 'Duke kërkuar fluturimet...' },
  { percent: 50, message: 'Duke verifikuar oraret...' },
  { percent: 75, message: 'Duke finalizuar çmimet më të mira...' },
  { percent: 100, message: 'Pothuajse gati!' }
];

const TRAVEL_FACTS = [
  'A e dinit se fluturimet në mëngjes kanë më pak turbulencë?',
  'Rezervimi 2-3 muaj përpara mund të kursejë deri në 20% të çmimit.',
  'E marta dhe e mërkura janë ditët më të lira për të udhëtuar.',
  'Destinacionet më të lira për të fluturuar ndryshojnë sipas sezonit dhe kërkesës.',
  'Pasagjerët që rezervojnë bileta vajtje-ardhje shpesh përfitojnë tarifa më të ulëta.',
  'Fluturimi me linja ajrore me ndalesa mund të kursejë deri në 30% krahasuar me fluturimet direkte.',
  'Aeroportet më të ngarkuara në botë janë Atlanta, Dubai dhe Londra Heathrow.',
  'Më shumë se 90,000 fluturime ndodhin çdo ditë në botë.',
  'Fluturimet në mesjavë janë shpesh më të lira se ato të fundjavës.',
  'Në shumicen e aeroporteve, kalimi i sigurisë është më i shpejtë në orët e pasdites.',
  'Disa vende kërkojnë që pasaporta juaj të ketë të paktën 6 muaj vlefshmëri përpara hyrjes.',
  'Nëse keni vetëm bagazh dore, mund të kaloni më shpejt në daljen e aeroportit.',
  'Taksitë e prenotuara online janë më të lira se ato të marra direkt nga aeroporti.',
  'Dritaret e avionëve janë të vogla për të reduktuar presionin mbi trupin gjatë fluturimit.',
  'Nëse humbni një bagazh, raportoni menjëherë pasi vonesa mbi 24 orë mund të ndikojë në kompensimin tuaj.',
  'Kombinimi i linjave ajrore të ndryshme mund të jetë më i lirë se një biletë vajtje-ardhje me të njëjtën kompani.',
  'Në Japoni, trenat vonohen mesatarisht vetëm 18 sekonda në vit!',
  'Në Dubai, ekziston një ATM që të jep flori në vend të parave.',
  'Piloti dhe kopiloti hanë vakte të ndryshme për të shmangur helmimet ushqimore.',
  'Mali Everest është kaq i lartë sa disa aeroplanë fluturojnë më poshtë se maja e tij!',
  'Parisi ka më shumë kafene sesa ditë në vit – mbi 1,800!',
  'Në Venedik, mund të marrësh gjobë për ushqyerjen e pëllumbave në sheshin San Marco.',
  'Londra ka mbi 20 tunele sekrete të metrosë të mbyllura për publikun!',
  'Në Islandë, numri i deleve është më i madh se ai i njerëzve!',
  'Në Malajzi ndodhet restoranti më i lartë në botë – Sky Restaurant 2020 në Kuala Lumpur.',
  'Sahara dikur ishte një oqean – miliona vite më parë, kishte ujë dhe jetë detare!',
  'Në Korenë e Jugut, numri 4 është i pafat, prandaj shumë ashensorë nuk kanë katin e katërt!',
  'Në Hong Kong ka më shumë kulla qiell-gërvishtese se në New York!',
  'Në Japoni, ekzistojnë hotele me zero staf njerëzor – gjithçka menaxhohet nga robotë!',
  'Ka një qytet në Norvegji ku dielli nuk perëndon për 76 ditë gjatë verës!',
  'Në Finlandë, mund të gjesh sauna brenda autobusëve dhe madje edhe brenda kabinave telefonike!',
  'Në Indi, ka një tempull të dedikuar për minjtë, dhe ata trajtohen si të shenjtë!',
  'Në San Francisko ka një muze të tërë dedikuar çantave të dorës!',
  'Në Australi, ekziston një rrugë kaq e drejtë dhe e gjatë sa duket sikur nuk ka fund – 146 km pa asnjë kthesë!',
  'Në disa aeroporte, mund të marrësh me qira dhoma gjumi të vogla për një pushim të shpejtë para fluturimit!',
  'Në Tajlandë ndodhet restoranti më i vogël në botë – ka vetëm një tavolinë për dy persona!',
  'Në Indi, treni më i gjatë në botë ka mbi 1,200 metra gjatësi dhe transporton mbi 4,000 pasagjerë në një udhëtim!',
  'Në Islandë, emri yt duhet të miratohet nga një listë zyrtare para se të regjistrohet zyrtarisht!',
  'Në Mongoli, gjysma e popullsisë jeton në çadra tradicionale që quhen "ger"!',
  'Në Hawaii, nuk ka gjarpërinj natyralë – është një nga vendet e pakta pa ta!',
  'Në Kili, mund të vizitosh shkretëtirën Atacama, që është vendi më i thatë në Tokë!',
  'Në Zelandën e Re, numri i deleve është 6-fish më i lartë se ai i njerëzve!',
  'Në Japoni, ka një kafene ku mund të punosh me një sasi të caktuar kafeje falas, por nuk të lejohet të largohesh derisa të përfundosh detyrën tënde!',
  'Në Kanada, ka një liqen që është i mbushur me pika minerale, duke krijuar një pamje sikur është bërë nga mozaikë!',
  'Në Holandë, ka më shumë biçikleta sesa banorë!',
  'Në Afrikën e Jugut, ekziston një restorant brenda një shpelle të vjetër 180,000 vjet!',
  'Në Spanjë, çdo vit mbahet festivali "Tomatina" ku njerëzit luftojnë me domate!',
  'Në Marok, ndodhet një qytet i tërë i lyer me ngjyrë blu – Chefchaouen!',
  'Në Dubai ndodhet ashensori më i shpejtë në botë – të çon në katin e 124 në më pak se 60 sekonda!'
];

export function LoadingState({ 
  message = 'Duke kërkuar fluturimet...', 
  progress, 
  onTimeout,
  onRetry,
  onBack
}: LoadingStateProps) {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [travelFact, setTravelFact] = useState(() => {
    // Initialize with a random fact
    const randomIndex = Math.floor(Math.random() * TRAVEL_FACTS.length);
    return TRAVEL_FACTS[randomIndex];
  });
  const TIMEOUT_DURATION = 30; // 30 seconds

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update travel fact every 5 seconds with a new random fact
  useEffect(() => {
    const interval = setInterval(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * TRAVEL_FACTS.length);
      } while (TRAVEL_FACTS[newIndex] === travelFact); // Ensure we don't show the same fact twice
      
      setTravelFact(TRAVEL_FACTS[newIndex]);
    }, 5000);
    return () => clearInterval(interval);
  }, [travelFact]);

  // Handle timeout
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      
      if (elapsed >= TIMEOUT_DURATION && !timeoutReached) {
        setTimeoutReached(true);
        if (onTimeout) onTimeout();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout]);

  // Get current milestone based on progress
  const getCurrentMilestone = () => {
    if (!progress) return null;
    return MILESTONES.find(m => progress <= m.percent);
  };

  if (timeoutReached) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Na vjen keq, por kërkimi po zgjat shumë
          </h3>
          <p className="text-gray-600 mb-6">
            Ju lutemi provoni përsëri ose ndryshoni parametrat e kërkimit tuaj
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Provo Përsëri
            </button>
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kthehu Mbrapa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
      {/* Animated Plane Window */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative">
            <Plane 
              className="w-16 h-16 text-blue-600 animate-pulse transform -rotate-45" 
            />
          </div>
        </div>
        
        {/* Cloud Animations */}
        <div className="absolute top-1/2 -left-12 w-8 h-8 bg-white rounded-full animate-cloud-1 opacity-80"></div>
        <div className="absolute top-1/4 -right-12 w-10 h-10 bg-white rounded-full animate-cloud-2 opacity-60"></div>
      </div>

      {/* Loading Message */}
      <div className="text-center mb-8 max-w-md">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Prisni pak!
        </h3>
        <p className="text-gray-600 animate-fade-in">
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-md mb-8">
        {progress !== undefined && (
          <>
            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-1 gap-2">
              {MILESTONES.map((milestone, index) => {
                const isComplete = progress >= milestone.percent;
                const isCurrent = getCurrentMilestone()?.percent === milestone.percent;
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-2 text-sm ${
                      isComplete ? 'text-green-600' : 
                      isCurrent ? 'text-blue-600' : 
                      'text-gray-400'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {milestone.message}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Trust Signals */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
          <Shield className="w-4 h-4 text-green-600" />
          Verifikojmë disponueshmërinë në kohë reale
        </div>
      </div>

      {/* Travel Facts */}
      <div className="text-sm text-gray-600 max-w-md text-center animate-fade-in">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p>{travelFact}</p>
        </div>
      </div>

      {/* Timeout Warning */}
      {elapsedTime > 20 && !timeoutReached && (
        <div className="text-sm text-amber-600 animate-pulse mt-4">
          Kërkimi po merr pak më shumë kohë se zakonisht...
        </div>
      )}

      {/* Time Remaining */}
      <div className="text-sm text-gray-500 mt-4">
        {TIMEOUT_DURATION - elapsedTime} sekonda të mbetura
      </div>
    </div>
  );
}