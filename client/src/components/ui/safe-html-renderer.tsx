import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SafeHtmlRendererProps {
  content: string;
  className?: string;
}

function htmlToMarkdown(html: string): string {
  // Convert common HTML tags to Markdown
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Handle code blocks first (before inline code)
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n')
    // Handle inline code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
    })
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
    // Clean up extra whitespace and newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function SafeHtmlRenderer({ content, className = "" }: SafeHtmlRendererProps) {
  // If content looks like HTML, convert it to Markdown
  const isHtml = /<[^>]+>/.test(content);
  const markdownContent = isHtml ? htmlToMarkdown(content) : content;

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize components if needed
          h1: ({children}) => <h1 className="text-3xl font-bold mb-4 text-slate-800">{children}</h1>,
          h2: ({children}) => <h2 className="text-2xl font-bold mb-3 text-slate-800">{children}</h2>,
          h3: ({children}) => <h3 className="text-xl font-bold mb-2 text-slate-800">{children}</h3>,
          p: ({children}) => <p className="mb-4 text-slate-700 leading-relaxed">{children}</p>,
          ul: ({children}) => <ul className="mb-4 pl-6 space-y-2">{children}</ul>,
          ol: ({children}) => <ol className="mb-4 pl-6 space-y-2">{children}</ol>,
          li: ({children}) => <li className="text-slate-700">{children}</li>,
          strong: ({children}) => <strong className="font-semibold text-slate-800">{children}</strong>,
          code: ({children, className}) => {
            // Check if this is inline code or code block
            const isCodeBlock = className && className.includes('language-');
            if (isCodeBlock) {
              return <code className="block bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm">{children}</code>;
            }
            return <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-slate-800 border">{children}</code>;
          },
          pre: ({children}) => <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4 border">{children}</pre>,
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
}