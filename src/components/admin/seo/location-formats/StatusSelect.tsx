import React from 'react';
import { Location } from './types';

interface StatusSelectProps {
  status: Location['status'];
  onChange: (status: string) => void;
  disabled: boolean;
}

export function StatusSelect({ status, onChange, disabled }: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        px-3 py-1 rounded-full text-sm font-medium
        ${status === 'ready' ? 'bg-green-100 text-green-800' : 
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'}
      `}
    >
      <option value="ready">✅ OK to be used</option>
      <option value="pending">⏳ Waiting</option>
      <option value="disabled">❌ Not needed</option>
    </select>
  );
}