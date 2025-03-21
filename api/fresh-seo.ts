// api/fresh-seo.ts
import { createClient } from '@supabase/supabase-js';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import React from 'react';
import App from '../src/App';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: any, res: any) {
  try {
    const path = req.url;

    // Fetch SEO data
    const { data: seoData, error: seoError } = await supabase
      .from('seo_location_connections')
      .select(`
        template_url,
        template_type_id,
        from_location:from_location_id(type, city, state, nga_format),
        to_location:to_location_id(type, city, state, per_format)
      `)
      .eq('template_url', path)
      .eq('status', 'active')
      .single();

    if (seoError || !seoData) {
      return clientSideRender(req, res);
    }

    const { data: template } = await supabase
      .from('seo_page_templates')
      .select('*')
      .eq('template_type_id', seoData.template_type_id)
      .single();

    const helmetContext = {};
    const html = renderToString(
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={path}>
          <App seoData={seoData} template={template} />
        </StaticRouter>
      </HelmetProvider>
    );

    const { helmet } = helmetContext as any;

    const fullHtml = `<!DOCTYPE html>
<html ${helmet.htmlAttributes.toString()}>
  <head>
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.script.toString()}
    <link rel="stylesheet" href="/assets/index.css">
  </head>
  <body ${helmet.bodyAttributes.toString()}>
    <div id="root">${html}</div>
    <script type="module" src="/assets/index.js"></script>
    <script>
      window.__PRELOADED_STATE__ = ${JSON.stringify({ seoData, template })}
    </script>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(fullHtml);
  } catch (err) {
    console.error('SSR Error:', err);
    return clientSideRender(req, res);
  }
}

function clientSideRender(req: any, res: any) {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hima Travel - Bileta Avioni</title>
    <link rel="stylesheet" href="/assets/index.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
