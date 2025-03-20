import { supabase } from '../lib/supabase';
import { markdownToHtml, extractFrontmatter } from './markdown';

interface SEOContent {
  title: string;
  description: string;
  content: string;
  metadata: Record<string, any>;
}

export async function getRouteContent(
  fromLocation: { type: string; city?: string; state: string },
  toLocation: { type: string; city?: string; state: string }
): Promise<SEOContent | null> {
  try {
    // Get content template based on location types
    const { data: template, error: templateError } = await supabase
      .from('seo_content_templates')
      .select('*')
      .eq('from_type', fromLocation.type)
      .eq('to_type', toLocation.type)
      .single();

    if (templateError) throw templateError;
    if (!template) return null;

    // Replace placeholders in content
    let content = template.content;
    
    // Replace location names
    content = content.replace(/\{from_city\}/g, fromLocation.city || '');
    content = content.replace(/\{from_state\}/g, fromLocation.state || '');
    content = content.replace(/\{to_city\}/g, toLocation.city || '');
    content = content.replace(/\{to_state\}/g, toLocation.state || '');

    // Get route statistics
    const { data: stats } = await supabase
      .rpc('get_route_statistics', {
        p_from_city: fromLocation.city,
        p_from_state: fromLocation.state,
        p_to_city: toLocation.city,
        p_to_state: toLocation.state
      });

    // Replace statistics placeholders
    if (stats) {
      content = content.replace(/\{avg_price\}/g, stats.avg_price?.toString() || 'N/A');
      content = content.replace(/\{min_price\}/g, stats.min_price?.toString() || 'N/A');
      content = content.replace(/\{flight_duration\}/g, stats.avg_duration?.toString() || 'N/A');
      content = content.replace(/\{direct_flights\}/g, stats.direct_flights?.toString() || 'N/A');
    }

    // Extract frontmatter and convert content to HTML
    const { content: markdownContent, metadata } = extractFrontmatter(content);
    const htmlContent = await markdownToHtml(markdownContent);

    return {
      title: metadata.title || template.default_title,
      description: metadata.description || template.default_description,
      content: htmlContent,
      metadata
    };
  } catch (err) {
    console.error('Error getting route content:', err);
    return null;
  }
}

export async function getRelatedRoutes(
  fromLocation: { type: string; city?: string; state: string },
  toLocation: { type: string; city?: string; state: string },
  limit: number = 5
): Promise<any[]> {
  try {
    const { data: routes, error } = await supabase
      .from('seo_location_connections')
      .select(`
        *,
        from_location:from_location_id(
          type, city, state, nga_format
        ),
        to_location:to_location_id(
          type, city, state, per_format
        )
      `)
      .or(`from_state.eq.${fromLocation.state},to_state.eq.${toLocation.state}`)
      .neq('id', `${fromLocation.city}-${toLocation.city}`)
      .eq('status', 'active')
      .limit(limit);

    if (error) throw error;
    return routes || [];
  } catch (err) {
    console.error('Error getting related routes:', err);
    return [];
  }
}

export async function getRouteStatistics(
  fromLocation: { type: string; city?: string; state: string },
  toLocation: { type: string; city?: string; state: string }
): Promise<any> {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_route_statistics', {
        p_from_city: fromLocation.city,
        p_from_state: fromLocation.state,
        p_to_city: toLocation.city,
        p_to_state: toLocation.state
      });

    if (error) throw error;
    return stats;
  } catch (err) {
    console.error('Error getting route statistics:', err);
    return null;
  }
}