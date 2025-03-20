import React from 'react';

interface SearchErrorBoxProps {
  error: string | null;
}

export function SearchErrorBox({ error }: SearchErrorBoxProps) {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
      {error}
    </div>
  );
}