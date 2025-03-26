import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const page = parseInt(req.query.page || '1', 10);
  const pageSize = 10000;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: routes, error } = await supabase
    .from('seo_location_connections')
    .select('template_url', { count: 'exact' })
    .eq('status', 'active')
    .not('template_url', 'is', null)
    .order('template_url', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).send('Error fetching data');
  }

  const baseUrl = 'https://biletaavioni.himatravel.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
  <url>
    <loc>${baseUrl}${route.template_url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xml);
}
