import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
  try {
    // Initialize array to store all routes
    let allRoutes = [];
    let page = 0;
    const pageSize = 1000; // Supabase's max page size
    let hasMore = true;

    // Fetch all routes using pagination
    while (hasMore) {
      const { data: routes, error, count } = await supabase
        .from('seo_location_connections')
        .select(`
          template_url,
          from_location:from_location_id(
            type, city, state, nga_format
          ),
          to_location:to_location_id(
            type, city, state, per_format
          )
        `, { count: 'exact' })
        .eq('status', 'active')
        .not('template_url', 'is', null)
        .order('template_url')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (routes) {
        allRoutes = allRoutes.concat(routes);
      }

      // Check if we need to fetch more
      hasMore = routes && routes.length === pageSize;
      page++;

      console.log(`Fetched ${routes?.length || 0} routes (page ${page}). Total so far: ${allRoutes.length}`);
    }

    console.log(`Total routes fetched: ${allRoutes.length}`);

    // Generate XML
    const baseUrl = 'https://biletaavioni.himatravel.com';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  ${allRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.template_url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
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
