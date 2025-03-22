
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
  try {
    // Fetch all active route connections with template URLs
    const { data: routes, error } = await supabase
      .from('seo_location_connections')
      .select('template_url')
      .eq('status', 'active')
      .not('template_url', 'is', null)
      .order('template_url');

    if (error) throw error;

    // Generate XML
    const baseUrl = 'https://biletaavioni.himatravel.com';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${(routes || []).map(route => `
  <url>
    <loc>${baseUrl}${route.template_url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    // Set headers and send response
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1 hour cache
    res.status(200).send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
}
