import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables and ensure they're set
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  try {
    // Initialize array to store all routes
    let allRoutes = [];
    let page = 0;
    const pageSize = 1000; // Maximum number of rows per page
    let hasMore = true;

    // Fetch all routes using pagination
    while (hasMore) {
      const { data: routes, error } = await supabase
        .from('seo_location_connections')
        .select(`
          id,
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
        // Ordering by template_url and then by id ensures a deterministic order.
        .order('template_url', { ascending: true })
        .order('id', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      if (routes) {
        allRoutes = allRoutes.concat(routes);
        console.log(`Fetched ${routes.length} routes (page ${page + 1}). Total so far: ${allRoutes.length}`);
      }

      // Continue paging if the current page is full
      hasMore = routes && routes.length === pageSize;
      page++;
    }

    console.log(`Total routes fetched: ${allRoutes.length}`);

    // Generate XML sitemap
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

    // Set headers and send the XML response
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache for 1 hour
    res.status(200).send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
}
