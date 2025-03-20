import React from 'react';
import { Search } from 'lucide-react';

interface SearchButtonProps {
  loading: boolean;
  onClick: () => void;
}

export function SearchButton({ loading, onClick }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full py-4 rounded-lg font-bold text-lg transition duration-200 ${
        loading 
          ? 'bg-yellow-400/70 cursor-not-allowed'
          : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
      }`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3 inline-block"></div>
          Searching...
        </>
      ) : (
        <>
          <Search className="w-5 h-5 mr-2 inline-block" />
          Kerko Fluturime
        </>
      )}
    </button>
  );
}
