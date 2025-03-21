import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<string | null>(null);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        // First try to get from system_settings
        const { data: settings, error: settingsError } = await supabase
          .from('system_settings')
          .select('description')
          .eq('setting_name', 'sitemap_xml')
          .single();

        if (!settingsError && settings?.description) {
          setSitemap(settings.description);
          return;
        }

        // If no cached sitemap, generate one
        const { data: routes, error: routesError } = await supabase
          .from('seo_location_connections')
          .select('template_url, updated_at')
          .eq('status', 'active')
          .not('template_url', 'is', null)
          .order('template_url');

        if (routesError) throw routesError;

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
    <lastmod>${new Date(route.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

        setSitemap(xml);

        // Cache the generated sitemap
        await supabase
          .from('system_settings')
          .upsert({
            setting_name: 'sitemap_xml',
            setting_value: true,
            description: xml
          }, {
            onConflict: 'setting_name'
          });

      } catch (err) {
        console.error('Error generating sitemap:', err);
      }
    };

    fetchSitemap();
  }, []);

  // Set XML content type
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Type';
    meta.content = 'application/xml';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return sitemap ? (
    <pre style={{ display: 'none' }}>{sitemap}</pre>
  ) : null;
}
