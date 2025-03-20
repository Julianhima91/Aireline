import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQProps {
  fromCity: string;
  toCity: string;
  questions: FAQ[];
  title?: string;
  className?: string;
}

export function FAQComponent({ fromCity, toCity, questions, title, className = '' }: FAQProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const generateWhatsAppMessage = () => {
    const message = [
      'Pershendetje!',
      '',
      'Ju lutem mund te me ndihmoni me informacion per bilete avioni?',
      '',
      `Nga: ${fromCity}`,
      `Per: ${toCity}`,
      '',
      'Faleminderit!'
    ].join('\n');

    return encodeURIComponent(message);
  };

  const handleContact = () => {
    const message = generateWhatsAppMessage();
    window.open(`https://api.whatsapp.com/send/?phone=355695161381&text=${message}`, '_blank');
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <h3 className="text-xl font-semibold text-[#2D3748]">
          Pyetjet me te shpeshta per fluturimin {title}
        </h3>
        <p className="text-[#4A5568] mt-2">
          Gjeni pergjigjet per pyetjet tuaja me te shpeshta
        </p>
      </div>

      {/* FAQ List */}
      <div className="divide-y divide-gray-100">
        {questions.map((faq, index) => (
          <div key={index} className="group">
            <button
              onClick={() => toggleQuestion(index)}
              className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center pr-4">
                <div className="p-2 bg-blue-50 rounded-lg mr-4 group-hover:bg-blue-100 transition-colors">
                  <HelpCircle className="w-5 h-5 text-[#3182CE]" />
                </div>
                <span className="text-left font-medium text-[#2D3748] group-hover:text-[#1A365D]">
                  {faq.question}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-[#4A5568] transform transition-transform duration-300 ${
                  expandedIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Answer Panel */}
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${expandedIndex === index ? 'max-h-96' : 'max-h-0'}
              `}
            >
              <div className="px-8 py-6 bg-gray-50">
                <div className="pl-11 text-[#4A5568] leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-blue-100/50 mt-4">
        <p className="text-[#2D3748]">
          Nuk gjeni pergjigjen qe kerkoni?{' '}
          <button 
            onClick={handleContact}
            className="font-medium text-[#3182CE] hover:text-[#2C5282] underline decoration-2 decoration-blue-200 hover:decoration-blue-400 transition-all"
          >
            Na kontaktoni
          </button>
        </p>
      </div>
    </div>
  );
}