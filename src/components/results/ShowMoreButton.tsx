import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ShowMoreButtonProps {
  visibleCount: number;
  totalCount: number;
  onClick: () => void;
}

export function ShowMoreButton({ visibleCount, totalCount, onClick }: ShowMoreButtonProps) {
  const remainingCount = totalCount - visibleCount;

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
        text-white font-medium py-4 rounded-lg shadow-md hover:shadow-lg 
        transform hover:scale-[1.01] transition-all duration-200
        flex items-center justify-center gap-3"
    >
      <div className="flex items-center gap-2">
        <ChevronDown className="w-5 h-5 animate-bounce" />
        <span className="text-lg">Show {Math.min(remainingCount, 5)} More Flights</span>
      </div>
      <span className="text-orange-200 text-sm">
        ({visibleCount} of {totalCount})
      </span>
    </button>
  );
}