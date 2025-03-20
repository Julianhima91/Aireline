import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Location, StatusFilter, TypeFilter } from './types';

interface LocationCache {
  data: Location[];
  timestamp: number;
  count: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 500; // 500ms
const ITEMS_PER_PAGE = 10;

export function useLocationFormats() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<LocationCache | null>(null);
  const loadingRef = useRef(false);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup function for timeouts and subscriptions
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Memoized fetch function with pagination
  const fetchLocations = useCallback(async (
    page: number,
    typeFilter: TypeFilter = 'all',
    statusFilter: StatusFilter = 'all',
    searchTerm: string = '',
    force = false
  ) => {
    // Prevent concurrent fetches
    if (loadingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    // Check cache unless force refresh is requested
    if (!force && cacheRef.current) {
      const now = Date.now();
      if (now - cacheRef.current.timestamp < CACHE_DURATION) {
        console.log('Using cached locations data');
        setLocations(cacheRef.current.data);
        setTotalCount(cacheRef.current.count);
        setLoading(false);
        return;
      }
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      // Calculate pagination range
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Build query
      let query = supabase
        .from('seo_location_formats')
        .select('*', { count: 'exact' });

      // Apply filters
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (searchTerm) {
        query = query.or(`city.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%`);
      }

      // Add pagination
      query = query
        .range(from, to)
        .order('state')
        .order('city', { nullsLast: true });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Update cache
      cacheRef.current = {
        data: data || [],
        count: count || 0,
        timestamp: Date.now()
      };

      setLocations(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Set up real-time subscription with optimized event handling
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    let isSubscribed = true;

    const handleDatabaseChange = () => {
      // Debounce the refresh to prevent multiple rapid updates
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isSubscribed) {
          console.log('States changed, forcing locations refresh...');
          fetchLocations(currentPage, 'all', 'all', '', true);
        }
      }, 1000); // 1 second debounce
    };

    // Create subscription only if not already subscribed
    if (!subscriptionRef.current) {
      subscriptionRef.current = supabase
        .channel('seo_location_formats_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public',
            table: 'seo_enabled_states'
          }, 
          handleDatabaseChange
        )
        .subscribe();

      console.log('Subscription created');
    }

    // Initial fetch only if no data
    if (locations.length === 0) {
      fetchLocations(currentPage, 'all', 'all', '');
    }

    return () => {
      isSubscribed = false;
      clearTimeout(debounceTimer);
    };
  }, [fetchLocations, currentPage, locations.length]);

  const handleStatusChange = useCallback(async (location: Location, newStatus: Location['status']) => {
    try {
      const savingId = location.type === 'city' ? location.city! : location.state;
      setSaving(savingId);
      setError(null);

      const updatedLocation = {
        ...location,
        status: newStatus,
        nga_format: newStatus === 'ready' && !location.nga_format 
          ? `Nga ${location.type === 'city' ? location.city : location.state}`
          : location.nga_format,
        per_format: newStatus === 'ready' && !location.per_format
          ? `Për ${location.type === 'city' ? location.city : location.state}`
          : location.per_format
      };

      // Update existing record by ID
      const { data: savedFormat, error: updateError } = await supabase
        .from('seo_location_formats')
        .update({
          nga_format: updatedLocation.nga_format,
          per_format: updatedLocation.per_format,
          status: updatedLocation.status
        })
        .eq('id', location.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (!savedFormat) throw new Error('Failed to save location format');

      // Update local state
      setLocations(prevLocations => 
        prevLocations.map(loc => 
          (loc.id === location.id)
            ? { ...updatedLocation, id: savedFormat.id }
            : loc
        )
      );

      // Update cache
      if (cacheRef.current) {
        cacheRef.current.data = cacheRef.current.data.map(loc => 
          (loc.id === location.id)
            ? { ...updatedLocation, id: savedFormat.id }
            : loc
        );
      }
    } catch (err) {
      console.error('Error saving location format:', err);
      setError('Failed to save location format. Please try again.');
    } finally {
      setSaving(null);
    }
  }, []);

  const handleSave = useCallback(async (location: Location) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const savingId = location.type === 'city' ? location.city! : location.state;
        setSaving(savingId);
        setError(null);

        // Update existing record by ID
        const { data: savedFormat, error: updateError } = await supabase
          .from('seo_location_formats')
          .update({
            nga_format: location.nga_format,
            per_format: location.per_format,
            status: location.status
          })
          .eq('id', location.id)
          .select()
          .single();

        if (updateError) throw updateError;
        if (!savedFormat) throw new Error('Failed to save location format');

        // Update local state
        setLocations(prevLocations => 
          prevLocations.map(loc => 
            (loc.id === location.id)
              ? { ...location, id: savedFormat.id }
              : loc
          )
        );

        // Update cache
        if (cacheRef.current) {
          cacheRef.current.data = cacheRef.current.data.map(loc => 
            (loc.id === location.id)
              ? { ...location, id: savedFormat.id }
              : loc
          );
        }
      } catch (err) {
        console.error('Error saving location format:', err);
        setError('Failed to save location format. Please try again.');
      } finally {
        setSaving(null);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  return {
    locations,
    loading,
    error,
    saving,
    totalCount,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
    fetchLocations,
    handlePageChange,
    handleStatusChange,
    handleSave,
    setError
  };
}