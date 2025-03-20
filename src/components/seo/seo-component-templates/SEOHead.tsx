import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
  imageUrl?: string;
  type?: 'website' | 'article';
  fromCity?: string;
  toCity?: string;
  fromState?: string;
  toState?: string;
}

export function SEOHead({ 
  title, 
  description, 
  canonicalUrl,
  structuredData,
  imageUrl = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80',
  type = 'website',
  fromCity,
  toCity,
  fromState,
  toState
}: SEOHeadProps) {
  const baseUrl = 'https://himatravel.com';
  const fullUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;

  // Generate default structured data if none provided
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TravelAction',
    name: title,
    description,
    url: fullUrl,
    ...(fromCity && toCity && {
      fromLocation: {
        '@type': 'City',
        name: fromCity
      },
      toLocation: {
        '@type': 'City',
        name: toCity
      }
    }),
    ...(fromState && toState && {
      fromLocation: {
        '@type': 'State',
        name: fromState
      },
      toLocation: {
        '@type': 'State',
        name: toState
      }
    }),
    provider: {
      '@type': 'TravelAgency',
      name: 'Hima Travel',
      url: baseUrl
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Hima Travel" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Albanian" />
      <meta name="author" content="Hima Travel" />
      <meta name="geo.region" content="AL" />
      <meta name="geo.placename" content={fromCity || fromState || 'Albania'} />
    </Helmet>
  );
}