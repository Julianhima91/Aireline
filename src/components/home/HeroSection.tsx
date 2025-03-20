import React from 'react';

interface HeroSectionProps {
  children: React.ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div
        className="absolute inset-0 bg-center bg-cover z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=3000&q=80')"
        }}
      >
        <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[2px]" />
      </div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
         Kombinime unike fluturimesh me çmime të pakrahasueshme!
        </h1>
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}