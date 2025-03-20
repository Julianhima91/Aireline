import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { FlightOption } from '../types/flight';
import { SearchParams } from '../types/search';
import { formatFlightMessage } from '../utils/formatFlightMessage';
import { useAuth } from './AuthContext';
import { supabase, withErrorHandling } from '../lib/supabase';

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
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const checkIsAgent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If no user, definitely not an agent
        if (!user) {
          if (mounted) {
            setIsAgent(false);
            setLoading(false);
          }
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
          'Failed to check agent status'
        );

        if (mounted) {
          setIsAgent(data?.is_active ?? false);
          setError(null);
        }
      } catch (err) {
        console.error('Error checking agent status:', err);
        if (mounted) {
          setIsAgent(false);
          setError(err instanceof Error ? err.message : 'Failed to verify agent status');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkIsAgent();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleCopy = async () => {
    if (!isAgent) return;

    try {
      const message = formatFlightMessage(flight, searchParams, batchId);
      await navigator.clipboard.writeText(message);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying message:', err);
      setError('Failed to copy flight details');
    }
  };

  // Don't render anything while checking agent status
  if (loading) return null;

  // Don't render if there was an error checking status
  if (error) {
    console.warn('Agent status check error:', error);
    return null;
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