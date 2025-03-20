import { describe, test, expect, beforeEach, vi } from 'vitest';
import { validateSearchParams, mockSearchResponse, calculateExpectedPriceStability, shouldHaveCache, isCacheValid } from '../utils/testHelpers';
import { supabase } from '../lib/supabase';
import { refreshFlightData, shouldRefreshCache, shouldUseCache } from '../utils/flightData';
import axios from 'axios';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock axios
vi.mock('axios');

describe('Flight Search System Tests', () => {
  const validSearchParams = {
    fromLocation: 'London',
    toLocation: 'Paris',
    fromCode: 'LHR',
    toCode: 'CDG',
    departureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    returnDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days from now
    tripType: 'roundTrip' as const,
    travelClass: '1',
    stops: '0',
    passengers: {
      adults: 1,
      children: 0,
      infantsInSeat: 0,
      infantsOnLap: 0
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search Parameters Validation', () => {
    test('validates complete search parameters', () => {
      const errors = validateSearchParams(validSearchParams);
      expect(errors).toHaveLength(0);
    });

    test('requires departure location', () => {
      const params = { ...validSearchParams, fromLocation: '', fromCode: '' };
      const errors = validateSearchParams(params);
      expect(errors).toContain('Departure location is required');
    });

    test('requires at least one adult passenger', () => {
      const params = {
        ...validSearchParams,
        passengers: { ...validSearchParams.passengers, adults: 0 }
      };
      const errors = validateSearchParams(params);
      expect(errors).toContain('At least one adult passenger is required');
    });

    test('validates return date for round trips', () => {
      const params = { ...validSearchParams, returnDate: null };
      const errors = validateSearchParams(params);
      expect(errors).toContain('Return date is required for round trips');
    });
  });

  describe('Price Stability Level', () => {
    test('calculates HIGH stability for dates > 60 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 61);
      const stability = calculateExpectedPriceStability(futureDate.toISOString());
      expect(stability).toBe('HIGH');
    });

    test('calculates MEDIUM stability for dates 31-60 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      const stability = calculateExpectedPriceStability(futureDate.toISOString());
      expect(stability).toBe('MEDIUM');
    });

    test('calculates LOW stability for dates <= 30 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const stability = calculateExpectedPriceStability(futureDate.toISOString());
      expect(stability).toBe('LOW');
    });
  });

  describe('Caching Logic', () => {
    test('enables caching for flights within 7 days', () => {
      const nearFutureDate = new Date();
      nearFutureDate.setDate(nearFutureDate.getDate() + 5);
      expect(shouldHaveCache(nearFutureDate.toISOString())).toBe(true);
    });

    test('disables caching for flights beyond 7 days', () => {
      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 10);
      expect(shouldHaveCache(farFutureDate.toISOString())).toBe(false);
    });

    test('validates cache expiration', () => {
      const futureExpiration = new Date();
      futureExpiration.setHours(futureExpiration.getHours() + 1);
      expect(isCacheValid(futureExpiration.toISOString())).toBe(true);

      const pastExpiration = new Date();
      pastExpiration.setHours(pastExpiration.getHours() - 1);
      expect(isCacheValid(pastExpiration.toISOString())).toBe(false);
    });
  });

  describe('Flight Data Refresh', () => {
    test('refreshes data when cache is expired', async () => {
      const batchId = 'test-batch-id';
      
      // Mock axios response
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          best_flights: [
            {
              price: 100,
              flights: [{
                departure_airport: { id: 'LHR', time: new Date().toISOString() },
                arrival_airport: { id: 'CDG', time: new Date().toISOString() }
              }]
            }
          ],
          other_flights: []
        }
      });

      // Set up Supabase mock
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate
      } as any);

      await refreshFlightData(validSearchParams, batchId);

      // Verify Supabase calls
      expect(supabase.from).toHaveBeenCalledWith('saved_searches');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateEq).toHaveBeenCalledWith('batch_id', batchId);

      // Verify update data structure
      const updateData = mockUpdate.mock.calls[0][0];
      expect(updateData).toHaveProperty('results');
      expect(updateData).toHaveProperty('cached_results');
      expect(updateData).toHaveProperty('cached_until');
    });

    test('determines cache refresh need correctly', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      expect(shouldRefreshCache(futureDate.toISOString())).toBe(false);

      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      expect(shouldRefreshCache(pastDate.toISOString())).toBe(true);
    });

    test('determines cache usage based on departure date', () => {
      const nearFutureDate = new Date();
      nearFutureDate.setDate(nearFutureDate.getDate() + 5);
      expect(shouldUseCache(nearFutureDate.toISOString())).toBe(true);

      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 30);
      expect(shouldUseCache(farFutureDate.toISOString())).toBe(false);
    });
  });
});