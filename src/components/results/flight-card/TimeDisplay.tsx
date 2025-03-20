import React from 'react';

interface TimeDisplayProps {
  time: string;
  showNextDay?: boolean;
  isArrival?: boolean;
}

export function TimeDisplay({ time, showNextDay = false, isArrival = false }: TimeDisplayProps) {
  const date = new Date(time);
  const formattedTime = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="relative">
      <div className="text-lg font-semibold">{formattedTime}</div>
      {showNextDay && (
        <div className={`absolute ${isArrival ? '-right-6' : '-left-6'} top-0 text-xs font-medium text-red-600`}>
          +1
        </div>
      )}
    </div>
  );
}