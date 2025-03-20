import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { FlightOption } from '../../types/flight';
import { SearchParams } from '../../types/search';
import { formatFlightMessage } from '../../utils/formatFlightMessage';
import { useAuth } from '../AuthContext';
import { supabase, withErrorHandling } from '../../lib/supabase';

interface CopyButtonProps {
  flight: FlightOption;
  searchParams: SearchParams;
  batchId: string;
  className?: string;
}

export function CopyButton({ flight, searchParams, batchId, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    const checkIsAgent = async () => {
      if (!mounted) return;

      try {
        setLoading(true);
        setError(null);
        
        // If no user, definitely not an agent
        if (!user) {
          setIsAgent(false);
          setLoading(false);
          return;
        }

        // Check if user is an agent with retries
        const { data } = await withErrorHandling(
          async () => {
            const { data, error } = await supabase
              .from('sales_agents')
              .select('id, is_active')
              .eq('id', user.id)
              .maybeSingle();

            if (error) throw error;
            return { data };
          },
          { data: null },
          'Failed to check agent status',
          MAX_RETRIES,
          RETRY_DELAY
        );

        if (!mounted) return;

        if (data === null && retryCount < MAX_RETRIES) {
          // Increment retry count and try again
          setRetryCount(prev => prev + 1);
          retryTimeout = setTimeout(checkIsAgent, RETRY_DELAY * (retryCount + 1));
          return;
        }

        setIsAgent(data?.is_active ?? false);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;

        console.error('Error checking agent status:', err);
        setIsAgent(false);
        setError(err instanceof Error ? err.message : 'Failed to verify agent status');
        setLoading(false);

        // If we still have retries left, try again
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          retryTimeout = setTimeout(checkIsAgent, RETRY_DELAY * (retryCount + 1));
        }
      }
    };

    checkIsAgent();

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [user, retryCount]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    
    if (!isAgent) return;

    try {
      const message = await formatFlightMessage(flight, searchParams, batchId);
      await navigator.clipboard.writeText(message);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying message:', err);
      setError('Failed to copy flight details');
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from opening
    setRetryCount(0); // Reset retry count
    setError(null);
    setLoading(true);
  };

  // Show loading state
  if (loading) {
    return (
      <button 
        disabled
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-semibold ${className}`}
      >
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2" />
        Checking status...
      </button>
    );
  }

  // Show error with retry button
  if (error) {
    return (
      <button
        onClick={handleRetry}
        className={`inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition duration-200 ${className}`}
      >
        <AlertCircle className="w-5 h-5 mr-2" />
        Retry
      </button>
    );
  }

  // Only render for active sales agents
  if (!isAgent) return null;

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition duration-200 ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 mr-2 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-5 h-5 mr-2" />
          Copy Details
        </>
      )}
    </button>
  );
}