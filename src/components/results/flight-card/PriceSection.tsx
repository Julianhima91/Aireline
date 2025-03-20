import React from 'react';
import { useAuth } from '../../../components/AuthContext';
import { supabase, withErrorHandling } from '../../../lib/supabase';

interface PriceSectionProps {
  basePrice: number;
  passengers: {
    adults: number;
    children: number;
    infantsInSeat: number;
    infantsOnLap: number;
  };
  totalPrice: number;
  priceBreakdown?: {
    base_price: number;
    commission_amount: number;
    total_price: number;
    discounts?: {
      type: string;
      amount: number;
    }[];
  };
}

export function PriceSection({ basePrice, passengers, totalPrice, priceBreakdown }: PriceSectionProps) {
  const { user } = useAuth();
  const [isAgentOrAdmin, setIsAgentOrAdmin] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsAgentOrAdmin(false);
        return;
      }

      try {
        // Check if user is admin
        if (user.email === 'admin@example.com') {
          setIsAgentOrAdmin(true);
          return;
        }

        // Check if user is an active agent with retries
        const { data } = await withErrorHandling(
          async () => {
            const { data, error } = await supabase
              .from('sales_agents')
              .select('is_active')
              .eq('id', user.id)
              .maybeSingle();

            if (error) throw error;
            return { data };
          },
          { data: null },
          'Failed to check agent status'
        );

        setIsAgentOrAdmin(data?.is_active ?? false);
        setError(null);
      } catch (err) {
        console.error('Error checking agent status:', err);
        setIsAgentOrAdmin(false);
        setError(err instanceof Error ? err.message : 'Failed to verify agent status');
      }
    };

    checkUserRole();
  }, [user]);

  // For unauthenticated users or non-agent/admin users, show only the final price
  if (!isAgentOrAdmin) {
    return (
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">
          {Math.floor(totalPrice)} EUR
        </p>
        <p className="text-sm text-gray-500">Cmimi ne Total</p>
      </div>
    );
  }

  // For agents and admins, show the full breakdown
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500">Base Price:</div>
      <p className="text-lg font-semibold">{Math.floor(basePrice)} EUR</p>
      
      {priceBreakdown?.commission_amount > 0 && (
        <>
          <div className="text-sm text-gray-500 mt-2">Service Fee:</div>
          <p className="text-lg font-semibold text-blue-600">
            +{Math.floor(priceBreakdown.commission_amount)} EUR
          </p>
        </>
      )}

      {priceBreakdown?.discounts && priceBreakdown.discounts.length > 0 && (
        <>
          <div className="text-sm text-gray-500 mt-2">Discounts:</div>
          {priceBreakdown.discounts.map((discount, index) => (
            <p key={index} className="text-lg font-semibold text-green-600">
              -{Math.floor(discount.amount)} EUR ({discount.type})
            </p>
          ))}
        </>
      )}
      
      <div className="border-t border-gray-200 mt-2 pt-2">
        <p className="text-2xl font-bold text-blue-600">
          {Math.floor(totalPrice)} EUR
        </p>
        <p className="text-sm text-gray-500">Cmimi ne Total</p>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}