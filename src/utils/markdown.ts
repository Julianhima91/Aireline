import { marked } from 'marked';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
  headerIds: true, // Add IDs to headers
  mangle: false, // Don't escape HTML
  sanitize: false // Allow HTML
});

// Function to convert markdown to HTML with remark (for better HTML output)
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkHtml)
    .process(markdown);
  return result.toString();
}

// Function to render markdown with marked (for simpler content)
export function renderMarkdown(markdown: string): string {
  return marked(markdown);
}

// Function to extract metadata from markdown frontmatter
export function extractFrontmatter(markdown: string): { 
  content: string; 
  metadata: Record<string, any>;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { 
      content: markdown,
      metadata: {}
    };
  }

  const metadata: Record<string, any> = {};
  const frontmatterLines = match[1].split('\n');

  frontmatterLines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  return {
    content: match[2],
    metadata
  };
}