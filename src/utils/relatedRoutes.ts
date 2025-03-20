import { supabase } from '../lib/supabase';

type LocationType = {
  type: 'city' | 'state';
  city?: string | null;
  state: string;
};

export async function fetchRelatedRoutes(from: LocationType, to: LocationType) {
  try {
    console.log('Fetching related routes for:', { from, to });

    // Get the source location ID
    const { data: fromLocation } = await supabase
      .from('seo_location_formats')
      .select('id')
      .eq('type', from.type)
      .eq('state', from.state)
      .eq(from.type === 'city' ? 'city' : 'state', from.type === 'city' ? from.city : from.state)
      .single();

    if (!fromLocation) {
      console.error('Source location not found');
      return [];
    }

    // Get related routes
    const { data: routes, error } = await supabase
      .from('seo_location_connections')
      .select(`
        id,
        template_url,
        from_location:from_location_id(
          id,
          type,
          city,
          state,
          nga_format
        ),
        to_location:to_location_id(
          id,
          type,
          city,
          state,
          per_format
        )
      `)
      .eq('status', 'active')
      .eq('from_location_id', fromLocation.id)
      .limit(6);

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }

    console.log('Found routes:', routes);
    return routes;

  } catch (error) {
    console.error('Error fetching related routes:', error);
    return [];
  }
}