export default async function handler(req, res) {
  const totalPages = 8; // Number of pages you need (each contains 10,000 links)
  const baseUrl = 'https://biletaavioni.himatravel.com';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${Array.from({ length: totalPages }).map((_, i) => `
  <sitemap>
    <loc>${baseUrl}/sitemaps/page-${i + 1}.xml</loc>
  </sitemap>`).join('')}
</sitemapindex>`;

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xml);
}
