'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function preprocessLatex(text: string): string {
  if (!text) return '';
  let result = text;

  // 1. Unescape double backslashes copied from AI JSON/code (e.g. \\[ -> \[, \\] -> \], \\frac -> \frac)
  result = result.replace(/\\\\([a-zA-Z\[\]\(\)])/g, '\\$1');

  // 2. Replace display math delimiters \[ ... \] with $$ ... $$
  result = result.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // 2.5 Convert un-escaped bracketed math [ math ] containing LaTeX commands or equations (e.g. [ d = vt ], [ \boxed{d = 180\ \text{km}} ]) to $$ math $$
  result = result.replace(/(^|[^\]\)])\[\s*([^\[\]]+?)\s*\](?!\s*[\(\[])/g, (match, prefix, inner) => {
    const trimmedInner = inner.trim();
    const containsLatex = /\\(?:text|boxed|qquad|quad|times|frac|dfrac|tfrac|cfrac|sqrt|sum|int|lim|vec|alpha|beta|gamma|theta|pi|infty|cdot|partial|approx|le|ge|neq)/i.test(trimmedInner);
    const containsEquation = /[a-zA-Z0-9]\s*=\s*[a-zA-Z0-9]/.test(trimmedInner);

    if (containsLatex || containsEquation) {
      return `${prefix}\n\n$$\n${trimmedInner}\n$$\n\n`;
    }
    return match;
  });

  // 3. Replace inline math delimiters \( ... \) with $ ... $
  result = result.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, math) => `$${math.trim()}$`);

  // 4. Convert ```math or ```latex code blocks to $$ ... $$
  result = result.replace(/```(?:math|latex|tex|katex)\s*\n([\s\S]*?)\n```/gi, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // 5. Wrap raw \begin{env} ... \end{env} blocks in $$ if not already wrapped
  result = result.replace(
    /(^|[^\$])(\\begin\{(?:equation\*?|align\*?|gather\*?|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|aligned)\}[\s\S]*?\\end\{(?:equation\*?|align\*?|gather\*?|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|aligned)\})/gm,
    (match, prefix, math) => {
      if (prefix === '$') return match;
      return `${prefix}\n\n$$\n${math.trim()}\n$$\n\n`;
    }
  );

  // 6. Automatically wrap unwrapped math equations/fractions pasted directly from AI chat (e.g. \frac{a}{b} or f(x) = \frac{1}{2})
  const lines = result.split('\n');
  let inBlock = false;

  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$$')) {
      inBlock = !inBlock;
      return line;
    }
    if (inBlock) return line;

    // Check if line contains unwrapped fraction or math command (\frac, \dfrac, \tfrac, \cfrac, \sqrt, \int, \sum, \lim)
    const hasMathCmd = /\\(?:f|d|t|c)?frac|\\sqrt|\\int|\\sum|\\lim|\\partial|\\int_/i.test(line);
    const hasDollar = line.includes('$');

    if (hasMathCmd && !hasDollar) {
      // If the line is a standalone formula or function definition like "\frac{a}{b}" or "f(x) = \frac{x^2+1}{2}"
      if (trimmed.startsWith('\\') || trimmed.includes('=') || trimmed.startsWith('f(') || trimmed.startsWith('y=')) {
        return `\n$$\n${trimmed}\n$$\n`;
      }
      // If embedded in prose text, wrap \frac{...}{...} in $...$
      return line.replace(/(\\(?:f|d|t|c)?frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, (_, m) => `$${m}$`);
    }
    return line;
  });

  result = processedLines.join('\n');

  // 7. Normalize single dollar math with internal padding spaces: "$ \frac{a}{b} $" -> "$\frac{a}{b}$"
  // (single-line only, so it never eats the newlines around $$ display blocks)
  result = result.replace(/(^|[\s(])\$[ \t]+(\S[^$\n]*?)[ \t]+\$(?=$|[\s.,;:!?)])/gm, (_, pre, m) => `${pre}$${m}$`);

  return result;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const processedContent = preprocessLatex(content);

  return (
    <div className={`prose prose-slate max-w-none text-on-surface text-sm leading-relaxed break-words space-y-2 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-on-surface mt-3 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-on-surface mt-2.5 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold text-on-surface mt-2 mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 leading-relaxed text-on-surface/90">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 pl-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 pl-2">{children}</ol>,
          li: ({ children }) => <li className="text-on-surface">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/60 pl-3 py-1 my-2 bg-primary/5 rounded-r text-on-surface-variant italic">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const codeText = String(children).replace(/\n$/, '');
            const isMathLang = /language-(math|latex|tex|katex)/i.test(className || '');
            if (isMathLang) {
              try {
                const html = katex.renderToString(codeText, { displayMode: true, throwOnError: false });
                return <div className="my-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
              } catch {
                // fallback to regular code block if katex render fails
              }
            }
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono text-xs">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-2 border border-slate-800">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-outline-variant/60 rounded-xl">
              <table className="min-w-full text-xs text-left border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="bg-surface-container-high px-3 py-2 font-bold border-b border-outline-variant/60 text-on-surface">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 border-b border-outline-variant/40 text-on-surface">{children}</td>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
