'use client';

import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ClipboardPaste,
  Palette,
  Type,
  CheckSquare,
  Table as TableIcon,
  Minus,
  ChevronDown,
  Info,
  Sigma,
  Command,
} from 'lucide-react';
import { preprocessLatex } from '../common/MarkdownRenderer';

interface NotionBlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/**
 * Convert Markdown text into styled rich HTML with KaTeX equations & Notion-style blocks
 */
export function markdownToNotionHtml(markdown: string): string {
  if (!markdown) return '';

  const isHtml = /<([a-z]+)[^>]*>[\s\S]*<\/\1>/i.test(markdown) || /<br\s*\/?>/i.test(markdown);
  if (isHtml) return markdown;

  let text = preprocessLatex(markdown);
  const rawLines = text.split(/\r?\n/);
  const outputBlocks: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const renderInline = (str: string): string => {
    // 1. Math: $$ ... $$ display math
    let s = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
      try {
        return `<span class="katex-display my-2 block select-all" contenteditable="false">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })}</span>`;
      } catch {
        return `$$${tex}$$`;
      }
    });

    // 2. Math: $ ... $ inline math
    s = s.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
      try {
        return `<span class="katex-inline inline-block px-1 select-all" contenteditable="false">${katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })}</span>`;
      } catch {
        return `$${tex}$`;
      }
    });

    // 3. Bold: **text** or __text__
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // 4. Italic: *text* or _text_
    s = s.replace(/(^|[^\*])\*([^\*]+?)\*([^\*]|$)/g, '$1<em>$2</em>$3');
    s = s.replace(/(^|[^_])_([^_]+?)_([^_]|$)/g, '$1<em>$2</em>$3');

    // 5. Inline code: `code`
    s = s.replace(/`([^`]+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono text-xs">$1</code>');

    // 6. Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-primary underline font-medium">$1</a>');

    return s;
  };

  const closeList = () => {
    if (inList) {
      outputBlocks.push(`</${inList}>`);
      inList = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Code blocks ```
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        closeList();
        inCodeBlock = true;
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        outputBlocks.push(
          `<pre class="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs my-2.5 overflow-x-auto"><code>${codeBlockContent.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Display math lines: $$ ... $$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 2) {
      closeList();
      const tex = trimmed.slice(2, -2).trim();
      try {
        const rendered = katex.renderToString(tex, { displayMode: true, throwOnError: false });
        outputBlocks.push(`<div class="katex-display my-2" contenteditable="false">${rendered}</div>`);
      } catch {
        outputBlocks.push(`<p class="my-1.5 font-mono text-xs">$$${tex}$$</p>`);
      }
      continue;
    }

    // Empty line
    if (!trimmed) {
      closeList();
      outputBlocks.push('<p><br></p>');
      continue;
    }

    // Headings
    if (/^#\s+/.test(trimmed)) {
      closeList();
      outputBlocks.push(`<h1 class="text-xl font-black text-on-surface mt-4 mb-2">${renderInline(trimmed.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      closeList();
      outputBlocks.push(`<h2 class="text-lg font-bold text-on-surface mt-3 mb-1.5 border-b border-outline-variant/30 pb-1">${renderInline(trimmed.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (/^###\s+/.test(trimmed)) {
      closeList();
      outputBlocks.push(`<h3 class="text-base font-bold text-on-surface mt-2.5 mb-1">${renderInline(trimmed.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }

    // Callout boxes
    if (/^>\s*ℹ️/.test(trimmed) || /^>\s*\[!INFO\]/i.test(trimmed)) {
      closeList();
      const body = trimmed.replace(/^>\s*(?:ℹ️|\[!INFO\])\s*/i, '');
      outputBlocks.push(`<div class="flex items-start gap-2.5 p-3.5 my-3 bg-primary/10 border-l-4 border-primary rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>ℹ️ Info:</strong> <span>${renderInline(body)}</span></div>`);
      continue;
    }
    if (/^>\s*💡/.test(trimmed) || /^>\s*\[!TIP\]/i.test(trimmed)) {
      closeList();
      const body = trimmed.replace(/^>\s*(?:💡|\[!TIP\])\s*/i, '');
      outputBlocks.push(`<div class="flex items-start gap-2.5 p-3.5 my-3 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>💡 Tip:</strong> <span>${renderInline(body)}</span></div>`);
      continue;
    }
    if (/^>\s*⚠️/.test(trimmed) || /^>\s*\[!WARNING\]/i.test(trimmed)) {
      closeList();
      const body = trimmed.replace(/^>\s*(?:⚠️|\[!WARNING\])\s*/i, '');
      outputBlocks.push(`<div class="flex items-start gap-2.5 p-3.5 my-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>⚠️ Warning:</strong> <span>${renderInline(body)}</span></div>`);
      continue;
    }

    // Blockquote
    if (/^>\s+/.test(trimmed)) {
      closeList();
      outputBlocks.push(`<blockquote class="border-l-4 border-primary/70 pl-3.5 py-1 text-outline italic my-2 bg-surface-container-low/40 rounded-r-lg">${renderInline(trimmed.replace(/^>\s+/, ''))}</blockquote>`);
      continue;
    }

    // Checklists: - [ ] item or - [x] item
    if (/^-\s*\[([ xX])\]\s+/.test(trimmed)) {
      closeList();
      const checked = /^-\s*\[[xX]\]/.test(trimmed);
      const itemText = trimmed.replace(/^-\s*\[[ xX]\]\s+/, '');
      outputBlocks.push(`<div class="flex items-center gap-2 my-1.5"><input type="checkbox" ${checked ? 'checked' : ''} class="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary" /><span class="text-xs sm:text-sm">${renderInline(itemText)}</span></div>`);
      continue;
    }

    // Bullet List (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      if (inList !== 'ul') {
        closeList();
        outputBlocks.push('<ul class="list-disc pl-5 my-1.5 space-y-1">');
        inList = 'ul';
      }
      outputBlocks.push(`<li class="leading-relaxed">${renderInline(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    // Numbered List (1. )
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inList !== 'ol') {
        closeList();
        outputBlocks.push('<ol class="list-decimal pl-5 my-1.5 space-y-1">');
        inList = 'ol';
      }
      outputBlocks.push(`<li class="leading-relaxed">${renderInline(trimmed.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      closeList();
      outputBlocks.push('<hr class="my-4 border-t border-outline-variant/60" />');
      continue;
    }

    // Regular paragraph
    closeList();
    outputBlocks.push(`<p class="my-1.5 leading-relaxed">${renderInline(trimmed)}</p>`);
  }

  closeList();
  return outputBlocks.join('');
}

/**
 * Convert HTML content back to standard Markdown + LaTeX
 */
export function notionHtmlToMarkdown(html: string): string {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract KaTeX annotations
    const annotations = doc.querySelectorAll('annotation[encoding*="tex"], annotation[encoding*="latex"]');
    annotations.forEach((ann) => {
      const tex = ann.textContent?.trim();
      if (tex) {
        const container = ann.closest('.katex-display, .katex, math, .math') || ann.parentElement;
        if (container) {
          const isDisplay = container.classList.contains('katex-display') || container.tagName.toLowerCase() === 'div';
          const replacement = isDisplay ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`;
          const textNode = doc.createTextNode(replacement);
          container.parentNode?.replaceChild(textNode, container);
        }
      }
    });

    function walk(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const elem = node as HTMLElement;
      const tag = elem.tagName.toLowerCase();
      const childrenText = Array.from(elem.childNodes).map(walk).join('');

      // Checkbox
      if (tag === 'input' && elem.getAttribute('type') === 'checkbox') {
        const isChecked = (elem as HTMLInputElement).checked;
        return isChecked ? '- [x] ' : '- [ ] ';
      }

      // Callout box detection
      if (tag === 'div' && (elem.className.includes('bg-primary') || elem.className.includes('bg-emerald') || elem.className.includes('bg-amber'))) {
        const isWarning = elem.className.includes('bg-amber');
        const isTip = elem.className.includes('bg-emerald');
        const prefix = isWarning ? '> ⚠️ ' : isTip ? '> 💡 ' : '> ℹ️ ';
        return `\n\n${prefix}${childrenText.trim()}\n\n`;
      }

      switch (tag) {
        case 'h1':
          return `\n\n# ${childrenText.trim()}\n\n`;
        case 'h2':
          return `\n\n## ${childrenText.trim()}\n\n`;
        case 'h3':
          return `\n\n### ${childrenText.trim()}\n\n`;
        case 'h4':
          return `\n\n#### ${childrenText.trim()}\n\n`;
        case 'strong':
        case 'b':
          return childrenText.trim() ? `**${childrenText.trim()}**` : '';
        case 'em':
        case 'i':
          return childrenText.trim() ? `*${childrenText.trim()}*` : '';
        case 'u':
          return childrenText.trim() ? `<u>${childrenText.trim()}</u>` : '';
        case 'del':
        case 's':
        case 'strike':
          return childrenText.trim() ? `~~${childrenText.trim()}~~` : '';
        case 'code':
          if (elem.parentElement?.tagName.toLowerCase() === 'pre') {
            return childrenText;
          }
          return childrenText.trim() ? `\`${childrenText.trim()}\`` : '';
        case 'pre':
          return `\n\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`;
        case 'blockquote':
          return `\n\n> ${childrenText.trim().replace(/\n/g, '\n> ')}\n\n`;
        case 'a':
          const href = elem.getAttribute('href');
          return href ? `[${childrenText.trim()}](${href})` : childrenText;
        case 'ul':
        case 'ol':
          return `\n\n${childrenText.trim()}\n\n`;
        case 'li':
          const parentTag = elem.parentElement?.tagName.toLowerCase();
          const prefix = parentTag === 'ol' ? '1. ' : '- ';
          return `${prefix}${childrenText.trim()}\n`;
        case 'hr':
          return '\n\n---\n\n';
        case 'p':
        case 'div':
          return `\n${childrenText.trim()}\n`;
        case 'br':
          return '\n';
        case 'span':
          return childrenText;
        case 'table':
          return `\n\n${childrenText.trim()}\n\n`;
        case 'tr':
          return `| ${childrenText.trim()} |\n`;
        case 'th':
        case 'td':
          return `${childrenText.trim()} | `;
        default:
          return childrenText;
      }
    }

    const converted = walk(doc.body).replace(/\n{3,}/g, '\n\n').trim();
    if (converted && converted.length > 0) {
      return converted;
    }
  } catch (err) {
    console.warn('HTML to Markdown conversion error:', err);
  }

  return html;
}

export const NotionBlogEditor: React.FC<NotionBlogEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type / for slash commands or paste Markdown & LaTeX math formulas ($E=mc^2$)...',
  minHeight = '320px',
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const [selectedFont, setSelectedFont] = useState('Inter, sans-serif');
  const [selectedFontSize, setSelectedFontSize] = useState('14px');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const fontPickerRef = useRef<HTMLDivElement | null>(null);
  const sizePickerRef = useRef<HTMLDivElement | null>(null);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) {
        setShowFontPicker(false);
      }
      if (sizePickerRef.current && !sizePickerRef.current.contains(e.target as Node)) {
        setShowFontSizePicker(false);
      }
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync editor HTML when value prop changes externally
  useEffect(() => {
    if (editorRef.current && !isTypingRef.current) {
      const richHtml = markdownToNotionHtml(value);
      if (editorRef.current.innerHTML !== richHtml) {
        editorRef.current.innerHTML = richHtml || '';
      }
    }
  }, [value]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const syncHtmlToMarkdown = () => {
    if (!editorRef.current) return;
    isTypingRef.current = true;
    const currentHtml = editorRef.current.innerHTML;
    const markdown = notionHtmlToMarkdown(currentHtml);
    onChange(markdown);
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  };

  const handleEditorInput = () => {
    syncHtmlToMarkdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '/') {
      setShowSlashMenu(true);
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.innerHTML = (editor.innerHTML || '') + html;
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      editor.innerHTML = (editor.innerHTML || '') + html;
      return;
    }

    range.deleteContents();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node: ChildNode | null = null;
    let lastNode: ChildNode | null = null;
    while ((node = tempDiv.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    range.insertNode(frag);

    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboard = e.clipboardData;
    const plainText = clipboard.getData('text/plain');
    const html = clipboard.getData('text/html');

    let richSnippet = '';
    if (plainText && (plainText.includes('**') || plainText.includes('- ') || plainText.includes('#') || plainText.includes('$') || !html)) {
      richSnippet = markdownToNotionHtml(plainText);
    } else if (html) {
      richSnippet = html;
    } else {
      richSnippet = markdownToNotionHtml(plainText);
    }

    if (!richSnippet) return;

    insertHtmlAtCursor(richSnippet);
    syncHtmlToMarkdown();
    showToast('✨ Formatted & pasted!');
  };

  // Exec commands for formatting
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncHtmlToMarkdown();
  };

  const handleInsertMath = (customTex?: string) => {
    const formula = customTex || window.prompt('Enter LaTeX Inline Math formula (e.g. E = mc^2 or \\int_0^1 x dx):', 'E = mc^2');
    if (!formula) return;
    try {
      const rendered = katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
      const mathHtml = `<span class="katex-inline inline-block px-1 select-all" contenteditable="false">${rendered}</span>&nbsp;`;
      insertHtmlAtCursor(mathHtml);
      syncHtmlToMarkdown();
    } catch {
      insertHtmlAtCursor(`$${formula}$`);
      syncHtmlToMarkdown();
    }
  };

  const handleInsertMathBlock = (customTex?: string) => {
    const formula = customTex || window.prompt(
      'Enter LaTeX Display Math Block formula (e.g. \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}):',
      '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
    );
    if (!formula) return;
    try {
      const rendered = katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
      const mathHtml = `<div class="katex-display my-3 select-all" contenteditable="false">${rendered}</div><p><br></p>`;
      insertHtmlAtCursor(mathHtml);
      syncHtmlToMarkdown();
    } catch {
      insertHtmlAtCursor(`<p class="my-2 font-mono text-xs">$$${formula}$$</p>`);
      syncHtmlToMarkdown();
    }
  };

  const handleInsertCallout = (type: 'info' | 'warning' | 'tip' = 'info') => {
    let calloutHtml = '';
    if (type === 'warning') {
      calloutHtml = `<div class="flex items-start gap-2.5 p-3.5 my-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>⚠️ Warning:</strong> <span>Important key concept...</span></div><p><br></p>`;
    } else if (type === 'tip') {
      calloutHtml = `<div class="flex items-start gap-2.5 p-3.5 my-3 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>💡 Study Tip:</strong> <span>Key formula or shortcut note...</span></div><p><br></p>`;
    } else {
      calloutHtml = `<div class="flex items-start gap-2.5 p-3.5 my-3 bg-primary/10 border-l-4 border-primary rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>ℹ️ Info:</strong> <span>Definition or reference detail...</span></div><p><br></p>`;
    }
    insertHtmlAtCursor(calloutHtml);
    syncHtmlToMarkdown();
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table class="w-full my-3 border-collapse border border-outline-variant/60 text-xs sm:text-sm rounded-xl overflow-hidden">
        <thead>
          <tr class="bg-surface-container-high border-b border-outline-variant/60">
            <th class="p-2 border-r border-outline-variant/60 font-bold text-left">Header 1</th>
            <th class="p-2 border-r border-outline-variant/60 font-bold text-left">Header 2</th>
            <th class="p-2 font-bold text-left">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-outline-variant/40">
            <td class="p-2 border-r border-outline-variant/40">Item A</td>
            <td class="p-2 border-r border-outline-variant/40">Value A</td>
            <td class="p-2">Description A</td>
          </tr>
          <tr>
            <td class="p-2 border-r border-outline-variant/40">Item B</td>
            <td class="p-2 border-r border-outline-variant/40">Value B</td>
            <td class="p-2">Description B</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    insertHtmlAtCursor(tableHtml);
    syncHtmlToMarkdown();
  };

  const handleInsertDivider = () => {
    insertHtmlAtCursor('<hr class="my-4 border-t border-outline-variant/60" /><p><br></p>');
    syncHtmlToMarkdown();
  };

  const handleInsertChecklist = () => {
    insertHtmlAtCursor('<div class="flex items-center gap-2 my-1.5"><input type="checkbox" class="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary" /><span class="text-xs sm:text-sm"> Action checklist item...</span></div>');
    syncHtmlToMarkdown();
  };

  const applyTextColor = (color: string) => {
    executeCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const applyHighlightColor = (color: string) => {
    executeCommand('hiliteColor', color);
    setShowColorPicker(false);
  };

  const applyFontFamily = (fontFamily: string, fontLabel: string) => {
    setSelectedFont(fontLabel);
    executeCommand('fontName', fontFamily);
    setShowFontPicker(false);
  };

  const applyFontSize = (sizePx: string, sizeLabel: string) => {
    setSelectedFontSize(sizeLabel);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const wrapper = document.createElement('span');
      wrapper.style.fontSize = sizePx;
      const range = sel.getRangeAt(0);
      range.surroundContents(wrapper);
      syncHtmlToMarkdown();
    } else {
      executeCommand('fontSize', '4');
    }
    setShowFontSizePicker(false);
  };

  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const formattedHtml = markdownToNotionHtml(text);
      insertHtmlAtCursor(formattedHtml);
      syncHtmlToMarkdown();
      showToast('✨ Formatted & pasted!');
    } catch {
      editorRef.current?.focus();
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Toast Notice Toast Banner if present */}
      {toastMessage && (
        <div className="flex items-center justify-end">
          <span className="text-[11px] text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg animate-in fade-in">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Notion Workspace Formatting Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 px-3 py-2 bg-surface-lowest rounded-2xl border border-outline-variant/60 shadow-xs text-outline text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Slash Menu Trigger */}
          <div ref={slashMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowSlashMenu(!showSlashMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary hover:text-white transition-colors text-[11px] border border-primary/20"
              title="Open Notion Slash Commands Menu"
            >
              <Command className="w-3.5 h-3.5" />
              <span>/ Slash Commands</span>
            </button>

            {showSlashMenu && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-surface-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 max-h-72 overflow-y-auto">
                <p className="px-2.5 py-1 text-[10px] font-bold text-outline uppercase tracking-wider">
                  Insert Notion Block
                </p>

                <button
                  type="button"
                  onClick={() => {
                    executeCommand('formatBlock', '<h1>');
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <Heading1 className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Heading 1</p>
                    <p className="text-[10px] text-outline">Large section title</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    executeCommand('formatBlock', '<h2>');
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <Heading2 className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Heading 2</p>
                    <p className="text-[10px] text-outline">Medium section heading</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    executeCommand('formatBlock', '<h3>');
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <Heading3 className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Heading 3</p>
                    <p className="text-[10px] text-outline">Small sub-heading</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    executeCommand('insertUnorderedList');
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <List className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Bullet List</p>
                    <p className="text-[10px] text-outline">Unordered bullet items</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    executeCommand('insertOrderedList');
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <ListOrdered className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Numbered List</p>
                    <p className="text-[10px] text-outline">Sequential numbered items</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleInsertChecklist();
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Checklist</p>
                    <p className="text-[10px] text-outline">Task item with checkbox</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleInsertCallout('info');
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <Info className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Callout Box</p>
                    <p className="text-[10px] text-outline">Highlighted info callout banner</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleInsertMathBlock();
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <Sigma className="w-4 h-4 text-purple-600" />
                  <div className="text-left">
                    <p className="font-bold">LaTeX Math Formula</p>
                    <p className="text-[10px] text-outline">Equations & Math formulas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleInsertTable();
                    setShowSlashMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high rounded-xl"
                >
                  <TableIcon className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="font-bold">Table Grid</p>
                    <p className="text-[10px] text-outline">Data table layout</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Font Family */}
          <div ref={fontPickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowFontPicker(!showFontPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors font-medium border border-outline-variant/30 text-[11px]"
              title="Font Family"
            >
              <Type className="w-3.5 h-3.5 text-primary" />
              <span className="max-w-[70px] truncate">{selectedFont.split(',')[0]}</span>
              <ChevronDown className="w-3 h-3 text-outline" />
            </button>
            {showFontPicker && (
              <div className="absolute left-0 top-full mt-1 z-50 w-44 bg-surface-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-xl shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95">
                {[
                  { label: 'Sans-Serif (Inter)', font: 'Inter, sans-serif' },
                  { label: 'Serif (Georgia)', font: 'Georgia, serif' },
                  { label: 'Monospace (Code)', font: 'monospace' },
                  { label: 'Casual (Comic)', font: 'Comic Sans MS, cursive' },
                ].map((f) => (
                  <button
                    key={f.font}
                    type="button"
                    onClick={() => applyFontFamily(f.font, f.label)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-surface-container-high transition-colors"
                    style={{ fontFamily: f.font }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div ref={sizePickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowFontSizePicker(!showFontSizePicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors font-medium border border-outline-variant/30 text-[11px]"
              title="Font Size"
            >
              <span>{selectedFontSize}</span>
              <ChevronDown className="w-3 h-3 text-outline" />
            </button>
            {showFontSizePicker && (
              <div className="absolute left-0 top-full mt-1 z-50 w-32 bg-surface-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-xl shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95">
                {[
                  { label: 'Small', size: '12px' },
                  { label: 'Normal', size: '14px' },
                  { label: 'Large', size: '18px' },
                  { label: 'Title', size: '24px' },
                ].map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => applyFontSize(s.size, s.label)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-surface-container-high transition-colors"
                  >
                    {s.label} ({s.size})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Bold, Italic, Underline, Strikethrough */}
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* Color & Highlight */}
          <div ref={colorPickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
              title="Text Color & Highlight"
            >
              <Palette className="w-3.5 h-3.5 text-primary" />
              <ChevronDown className="w-3 h-3 text-outline" />
            </button>
            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-surface-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95">
                <div>
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5">Text Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { color: '#000000', label: 'Default' },
                      { color: '#003EC7', label: 'Blue' },
                      { color: '#059669', label: 'Green' },
                      { color: '#7C3AED', label: 'Purple' },
                      { color: '#E11D48', label: 'Rose' },
                      { color: '#D97706', label: 'Amber' },
                      { color: '#0891B2', label: 'Cyan' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => applyTextColor(c.color)}
                        className="w-5 h-5 rounded-full border border-outline-variant/40 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-t border-outline-variant/30 pt-2">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5">Background Highlight</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { color: 'transparent', label: 'None' },
                      { color: '#FEF08A', label: 'Yellow' },
                      { color: '#A7F3D0', label: 'Green' },
                      { color: '#BFDBFE', label: 'Blue' },
                      { color: '#FBCFE8', label: 'Pink' },
                      { color: '#DDD6FE', label: 'Lavender' },
                    ].map((h) => (
                      <button
                        key={h.color}
                        type="button"
                        onClick={() => applyHighlightColor(h.color)}
                        className="w-5 h-5 rounded-full border border-outline-variant/40 hover:scale-110 transition-transform flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: h.color }}
                        title={h.label}
                      >
                        {h.color === 'transparent' && '✕'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h1>')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h3>')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertChecklist}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Checkbox Checklist"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* Quote, Callout, Table, Divider */}
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Quote Block"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleInsertCallout('info')}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors text-primary font-bold"
            title="Insert Callout Info Box"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Insert Table Grid"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertDivider}
            className="p-1.5 rounded-lg hover:bg-surface-container-low hover:text-on-surface transition-colors"
            title="Insert Horizontal Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* LaTeX Math Buttons */}
          <button
            type="button"
            onClick={() => handleInsertMath()}
            className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-lg hover:bg-surface-container-low hover:text-primary transition-colors border border-outline-variant/40"
            title="Insert Inline LaTeX Math ($...$)"
          >
            $ Math
          </button>
          <button
            type="button"
            onClick={() => handleInsertMathBlock()}
            className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-lg hover:bg-surface-container-low hover:text-purple-600 transition-colors border border-outline-variant/40"
            title="Insert Display Math Block ($$...$$)"
          >
            $$ Block
          </button>
        </div>


      </div>

      {/* Quick LaTeX Formula Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono text-outline select-none">
        <span className="text-[10px] font-bold text-outline uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sigma className="w-3 h-3 text-primary" /> Formulas:
        </span>
        {[
          { label: 'Fraction', tex: '\\frac{a}{b}' },
          { label: 'Square Root', tex: '\\sqrt{x}' },
          { label: 'Integral', tex: '\\int_0^\\infty f(x)dx' },
          { label: 'Summation', tex: '\\sum_{i=1}^n x_i' },
          { label: 'Einstein', tex: 'E = mc^2' },
          { label: 'Infinity', tex: '\\infty' },
          { label: 'Pi / Theta', tex: '\\pi, \\theta' },
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => handleInsertMath(chip.tex)}
            className="px-2 py-0.5 rounded-lg bg-surface-container-low border border-outline-variant/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors shrink-0 font-mono text-[11px]"
            title={`Insert ${chip.label}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Notion Unified WYSIWYG Editable Document Surface */}
      <div className="relative rounded-2xl bg-surface-container-low border border-outline-variant/60 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary focus-within:bg-surface-lowest transition-all">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          style={{ minHeight }}
          className="w-full p-4 sm:p-5 text-on-surface text-sm leading-relaxed outline-none max-h-[550px] overflow-y-auto font-sans"
        />
        {!value && (
          <div className="absolute top-5 left-5 pointer-events-none text-outline/50 text-sm font-mono italic">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
