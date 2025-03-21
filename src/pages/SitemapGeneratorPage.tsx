import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Loader2, AlertCircle, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SitemapEntry {
  template_url: string;
  updated_at: string;
}

export default function SitemapGeneratorPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sitemap, setSitemap] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generateSitemap = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Fetch all active route connections
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
  ${(routes || []).map((route: SitemapEntry) => `
  <url>
    <loc>${baseUrl}${route.template_url}</loc>
    <lastmod>${new Date(route.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

      // Store in system_settings table
      const { error: settingsError } = await supabase
        .from('system_settings')
        .upsert({
          setting_name: 'sitemap_xml',
          setting_value: true,
          description: xml
        }, {
          onConflict: 'setting_name'
        });

      if (settingsError) throw settingsError;

      setSitemap(xml);
      setLastGenerated(new Date());

    } catch (err) {
      console.error('Error generating sitemap:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate sitemap');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchExistingSitemap = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('description, updated_at')
          .eq('setting_name', 'sitemap_xml')
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // Not found
            await generateSitemap();
          } else {
            throw error;
          }
        } else if (data) {
          setSitemap(data.description);
          setLastGenerated(new Date(data.updated_at));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching sitemap:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sitemap');
        setLoading(false);
      }
    };

    fetchExistingSitemap();
  }, []);

  const handleDownload = () => {
    if (!sitemap) return;

    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Sitemap Generator</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateSitemap}
              disabled={generating}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                generating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Regenerate Sitemap'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!sitemap}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Download XML
            </button>
          </div>
        </div>
        {lastGenerated && (
          <p className="text-sm text-gray-500 mt-2">
            Last generated: {lastGenerated.toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="p-6">
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
            <div className="text-sm text-gray-400">sitemap.xml</div>
            <div className="text-sm text-gray-400">
              {sitemap ? `${(sitemap.length / 1024).toFixed(1)} KB` : '0 KB'}
            </div>
          </div>
          <pre className="p-4 text-sm text-gray-300 overflow-x-auto max-h-[600px] overflow-y-auto">
            {sitemap ? sitemap : 'No sitemap generated yet'}
          </pre>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Public Access</h3>
          <p className="text-sm text-blue-700">
            The sitemap is publicly accessible at:{' '}
            <a 
              href="https://biletaavioni.himatravel.com/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              https://biletaavioni.himatravel.com/sitemap.xml
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
