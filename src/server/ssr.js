import React from 'react';
import { renderToString } from 'react-dom/server';

/**
 * Minimal SSR function that returns some basic HTML.
 * This uses only standard JavaScript (no TypeScript or JSX).
 */
export function renderSEOPage(path, seoData, template) {
  // Instead of writing JSX, use createElement directly
  const element = React.createElement(
    'div',
    null,
    `SSR content for path: ${path}`
  );

  const html = renderToString(element);

  // For demonstration, we’ll just return a simple <title> tag
  const head = `<title>My SSR Page</title>`;

  return { html, head };
}
