import { PassengerCounts } from '../types/search';
import { supabase } from '../lib/supabase';

interface CommissionRate {
  count: number;
  rate: number;
  total: number;
}

interface CommissionBreakdown {
  standard: {
    adult: CommissionRate;
    child: CommissionRate;
    infant_seat: CommissionRate;
    infant_lap: CommissionRate;
  };
  discounted: {
    adult: CommissionRate;
    child: CommissionRate;
    infant_seat: CommissionRate;
    infant_lap: CommissionRate;
  };
}

interface CommissionResult {
  totalCommission: number;
  discountedCommission: number;
  breakdown: CommissionBreakdown;
  discountApplied: boolean;
  savings: number;
}

// Default commission rates if database call fails
const DEFAULT_COMMISSION_RATES = {
  adult: 20,
  child: 10,
  infant_seat: 10,
  infant_lap: 0
};

// Default group discount thresholds
const DEFAULT_GROUP_DISCOUNTS = [
  { min_count: 2, rate: 15 },
  { min_count: 3, rate: 13.33 },
  { min_count: 4, rate: 15 },
  { min_count: 5, rate: 15 }
];

function calculateAdultGroupRate(adultCount: number, groupDiscounts = DEFAULT_GROUP_DISCOUNTS): number {
  if (adultCount < 2) return DEFAULT_COMMISSION_RATES.adult;

  // Find applicable threshold
  const applicableDiscount = groupDiscounts
    .filter(discount => discount.min_count <= adultCount)
    .sort((a, b) => b.min_count - a.min_count)[0];

  return applicableDiscount?.rate || DEFAULT_COMMISSION_RATES.adult;
}

export async function calculateCommission(passengers: PassengerCounts): Promise<CommissionResult> {
  try {
    // Ensure all passenger counts are numbers
    const validPassengers = {
      adults: Number(passengers.adults) || 0,
      children: Number(passengers.children) || 0,
      infantsInSeat: Number(passengers.infantsInSeat) || 0,
      infantsOnLap: Number(passengers.infantsOnLap) || 0
    };

    // Try to get commission rates from database
    let rates = DEFAULT_COMMISSION_RATES;
    try {
      const { data: commissionRules, error } = await supabase
        .from('commission_rules')
        .select('passenger_type, rate, group_discount_rules')
        .order('passenger_type');

      if (!error && commissionRules) {
        rates = commissionRules.reduce((acc, rule) => ({
          ...acc,
          [rule.passenger_type]: rule.rate
        }), DEFAULT_COMMISSION_RATES);
      }
    } catch (err) {
      console.warn('Failed to fetch commission rules, using defaults:', err);
    }

    // Calculate adult rate with group discount
    const adultRate = calculateAdultGroupRate(validPassengers.adults);

    // Calculate standard commissions
    const standardBreakdown = {
      adult: {
        count: validPassengers.adults,
        rate: rates.adult,
        total: validPassengers.adults * rates.adult
      },
      child: {
        count: validPassengers.children,
        rate: rates.child,
        total: validPassengers.children * rates.child
      },
      infant_seat: {
        count: validPassengers.infantsInSeat,
        rate: rates.infant_seat,
        total: validPassengers.infantsInSeat * rates.infant_seat
      },
      infant_lap: {
        count: validPassengers.infantsOnLap,
        rate: rates.infant_lap,
        total: validPassengers.infantsOnLap * rates.infant_lap
      }
    };

    // Calculate discounted commissions
    const discountedBreakdown = {
      adult: {
        count: validPassengers.adults,
        rate: adultRate,
        total: validPassengers.adults * adultRate
      },
      child: {
        count: validPassengers.children,
        rate: rates.child,
        total: validPassengers.children * rates.child
      },
      infant_seat: {
        count: validPassengers.infantsInSeat,
        rate: rates.infant_seat,
        total: validPassengers.infantsInSeat * rates.infant_seat
      },
      infant_lap: {
        count: validPassengers.infantsOnLap,
        rate: rates.infant_lap,
        total: validPassengers.infantsOnLap * rates.infant_lap
      }
    };

    // Calculate totals
    const standardTotal = Object.values(standardBreakdown)
      .reduce((sum, rate) => sum + rate.total, 0);

    const discountedTotal = Object.values(discountedBreakdown)
      .reduce((sum, rate) => sum + rate.total, 0);

    return {
      totalCommission: standardTotal,
      discountedCommission: discountedTotal,
      breakdown: {
        standard: standardBreakdown,
        discounted: discountedBreakdown
      },
      discountApplied: discountedTotal < standardTotal,
      savings: standardTotal - discountedTotal
    };
  } catch (err) {
    console.error('Error calculating commission:', err);
    // Return safe default values
    return {
      totalCommission: 0,
      discountedCommission: 0,
      breakdown: {
        standard: {
          adult: { count: 0, rate: 0, total: 0 },
          child: { count: 0, rate: 0, total: 0 },
          infant_seat: { count: 0, rate: 0, total: 0 },
          infant_lap: { count: 0, rate: 0, total: 0 }
        },
        discounted: {
          adult: { count: 0, rate: 0, total: 0 },
          child: { count: 0, rate: 0, total: 0 },
          infant_seat: { count: 0, rate: 0, total: 0 },
          infant_lap: { count: 0, rate: 0, total: 0 }
        }
      },
      discountApplied: false,
      savings: 0
    };
  }
}