import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const page = parseInt(req.query.page || '1', 10);
  const urlsPerPage = 10000;
  const batchSize = 1000; // Supabase's max per query
  const totalBatches = urlsPerPage / batchSize;
  const allRoutes = [];

  for (let i = 0; i < totalBatches; i++) {
    const from = ((page - 1) * urlsPerPage) + (i * batchSize);
    const to = from + batchSize - 1;

    const { data: batch, error } = await supabase
      .from('seo_location_connections')
      .select('template_url')
      .eq('status', 'active')
      .not('template_url', 'is', null)
      .order('template_url', { ascending: true })
      .range(from, to);

    if (error) {
      console.error(`Error fetching batch ${i + 1}:`, error);
      return res.status(500).send('Error fetching sitemap data');
    }

    allRoutes.push(...batch);
  }

  const baseUrl = 'https://biletaavioni.himatravel.com';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.template_url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xml);
}
