import React from 'react';
import { marked } from 'marked';

interface SEOContentRendererProps {
  content: string;
  className?: string;
}

export function SEOContentRenderer({ content, className = '' }: SEOContentRendererProps) {
  // Create a ref for the content container
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Effect to handle dynamic content after render
  React.useEffect(() => {
    if (!contentRef.current) return;

    // Get all links in the content
    const links = contentRef.current.getElementsByTagName('a');
    
    // Add target="_blank" and rel="noopener noreferrer" to external links
    Array.from(links).forEach(link => {
      if (link.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className={`prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}