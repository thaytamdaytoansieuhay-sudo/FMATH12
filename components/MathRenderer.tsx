
import React, { useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content, className = "" }) => {
  
  const processedContent = useMemo(() => {
    if (!content) return "";
    
    let clean = content.normalize('NFC');
    
    // RENDER \neq thành ≠
    clean = clean.replace(/\\+neq/g, '≠');
    
    // Sửa lỗi dấu trừ Unicode và xử lý newline escape
    clean = clean.replace(/[−–—]/g, '-');
    clean = clean.replace(/\\n/g, '\n');

    // Chuẩn hóa LaTeX system delimiters
    clean = clean.replace(/\\\((.*?)\\\)/g, ' $ $1 $ ');
    clean = clean.replace(/\\\[([\s\S]*?)\\\]/g, '\n$$\n$1\n$$\n');

    return clean;
  }, [content]);

  const markdownComponents = useMemo(() => ({
    table: ({node, ...props}: any) => (
      <div className="overflow-x-auto my-8 rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="border-collapse w-full text-sm" {...props} />
      </div>
    ),
    thead: ({node, ...props}: any) => (
      <thead className="bg-slate-50 border-b-2 border-slate-200" {...props} />
    ),
    th: ({node, ...props}: any) => (
      <th className="px-4 py-4 text-left font-bold text-slate-700 uppercase tracking-wider border-r border-slate-100 last:border-0" {...props} />
    ),
    td: ({node, ...props}: any) => (
      <td className="px-4 py-4 text-slate-600 border-t border-r border-slate-100 last:border-0 leading-relaxed" {...props} />
    ),
    tr: ({node, ...props}: any) => (
      <tr className="hover:bg-slate-50/50 transition-colors" {...props} />
    ),
    ol: ({node, ...props}: any) => <ol className="math-list-ol space-y-4 mb-8 text-inherit" {...props} />,
    ul: ({node, ...props}: any) => <ul className="math-list-ul space-y-3 mb-6 text-inherit" {...props} />,
    p: ({node, ...props}: any) => (
      <div className="mb-4 leading-relaxed text-inherit text-lg whitespace-pre-wrap" {...props} />
    ),
    blockquote: ({node, ...props}: any) => (
      <div className="math-note mb-8 text-slate-800" {...props} />
    )
  }), []);

  return (
    <div className={`prose max-w-none break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[[rehypeKatex, { 
            strict: false, 
            throwOnError: false,
            trust: true
        }]]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default memo(MathRenderer);
