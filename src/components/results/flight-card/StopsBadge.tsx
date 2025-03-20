import React from 'react';
import { Plane } from 'lucide-react';

interface StopsBadgeProps {
  stops: number;
  isRoundTrip?: boolean;
}

export function StopsBadge({ stops, isRoundTrip = false }: StopsBadgeProps) {
  const getStopLabel = () => {
    if (stops === 0) return 'Direct';
    if (stops === 1) return '1 Stop';
    return `${stops} Stops`;
  };

  const getStopColor = () => {
    if (stops === 0) return 'bg-emerald-100 text-emerald-800';
    if (stops === 1) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStopColor()}`}>
      <Plane className="w-3 h-3 mr-1" />
      {getStopLabel()}
      {isRoundTrip && stops === 0 && ' (both ways)'}
    </div>
  );
}