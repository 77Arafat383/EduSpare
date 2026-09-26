'use client';

import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { MaterialItem } from '@/types/eduspare';
import { preprocessLatex } from '../common/MarkdownRenderer';
import {
  FileText,
  CheckCircle2,
  Save,
  Plus,
  X,
  Download,
  FilePlus,
  Pencil,
  MoreVertical,
  Trash2,
  Sparkles,
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
  Code,
  ClipboardPaste,
  Palette,
  Type,
  Highlighter,
  CheckSquare,
  Table as TableIcon,
  Minus,
  Sigma,
  ChevronDown,
  Info,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
}

/**
 * Convert markdown (from AI Tutor, clipboard, or plain text) into rich HTML
 * with rendered KaTeX equations, headings, bold/italics, bullet lists, etc.
 * just like Notion.
 */
export function markdownToRichHtml(markdown: string): string {
  if (!markdown) return '';

  // If it's already full HTML (e.g. from a previous rich edit session)
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

    // Blockquote
    if (/^>\s+/.test(trimmed)) {
      closeList();
      outputBlocks.push(`<blockquote class="border-l-4 border-primary/70 pl-3.5 py-1 text-outline italic my-2 bg-surface-container-low/40 rounded-r-lg">${renderInline(trimmed.replace(/^>\s+/, ''))}</blockquote>`);
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

    // Regular paragraph
    closeList();
    outputBlocks.push(`<p class="my-1.5 leading-relaxed">${renderInline(trimmed)}</p>`);
  }

  closeList();
  return outputBlocks.join('');
}

interface NotionKeepNotesProps {
  initialNotes?: string | null;
  onSaveNotes: (notes: string) => void;
  onAddResource?: (material: MaterialItem) => void;
}

export const NotionKeepNotes: React.FC<NotionKeepNotesProps> = ({
  initialNotes,
  onSaveNotes,
  onAddResource,
}) => {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [activePageId, setActivePageId] = useState<string>('page-1');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Inter, sans-serif');
  const [selectedFontSize, setSelectedFontSize] = useState('14px');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const fontPickerRef = useRef<HTMLDivElement | null>(null);
  const sizePickerRef = useRef<HTMLDivElement | null>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize pages and convert initial markdown notes to rich HTML
  useEffect(() => {
    if (!initialNotes) {
      const defaultContent = markdownToRichHtml(
        '# Study Notes\n\n- Copied notes, AI tutor formulas, and answers will format automatically!\n- Example LaTeX Math: $E = mc^2$ and $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$\n\nClick anywhere to type or edit notes directly.'
      );
      setPages([
        {
          id: 'page-1',
          title: 'Main Notes',
          content: defaultContent,
        },
      ]);
      setActivePageId('page-1');
      return;
    }

    try {
      const parsed = JSON.parse(initialNotes);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        const enriched = parsed.map((p: NotionPage) => ({
          ...p,
          content: markdownToRichHtml(p.content || ''),
        }));
        setPages(enriched);
        setActivePageId(enriched[0].id);
        return;
      }
    } catch {
      // Legacy plain-text / markdown notes
    }

    setPages([
      {
        id: 'page-1',
        title: 'Main Notes',
        content: markdownToRichHtml(initialNotes),
      },
    ]);
    setActivePageId('page-1');
  }, [initialNotes]);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // Sync editor innerHTML when active page changes (without overriding while typing)
  useEffect(() => {
    if (editorRef.current && activePage && !isTypingRef.current) {
      if (editorRef.current.innerHTML !== activePage.content) {
        editorRef.current.innerHTML = activePage.content || '';
      }
    }
  }, [activePageId, activePage?.content]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    isTypingRef.current = true;
    const newContent = editorRef.current.innerHTML;
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, content: newContent } : p))
    );
    setIsSaved(false);
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  };

  /**
   * Notion-style Smart Paste:
   * Catches pasted text/markdown from AI Tutor or elsewhere,
   * automatically converts it into formatted rich HTML with bold, lists, math,
   * and inserts it right at the user's cursor position without breaking!
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboard = e.clipboardData;
    const plainText = clipboard.getData('text/plain');
    const html = clipboard.getData('text/html');

    // If copying from AI Tutor or markdown source, turn markdown into rich HTML
    let richSnippet = '';
    if (plainText && (plainText.includes('**') || plainText.includes('- ') || plainText.includes('#') || plainText.includes('$') || !html)) {
      richSnippet = markdownToRichHtml(plainText);
    } else if (html) {
      richSnippet = html;
    } else {
      richSnippet = markdownToRichHtml(plainText);
    }

    if (!richSnippet) return;

    // Insert rich HTML at current cursor position
    insertHtmlAtCursor(richSnippet);
    handleEditorInput();
    showToast('✨ Formatted and pasted!');
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
    // Ensure selection is inside editor
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

  // Listen for direct "Insert into Workspace" event from AI Tutor
  useEffect(() => {
    const handleInsertEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ text: string }>;
      const newText = customEvent.detail?.text;
      if (!newText) return;

      const formattedHtml = markdownToRichHtml(newText);

      setPages((prev) =>
        prev.map((p) => {
          if (p.id === activePageId) {
            const separator = p.content ? '<div class="my-3"></div>' : '';
            return {
              ...p,
              content: p.content ? `${p.content}${separator}${formattedHtml}` : formattedHtml,
            };
          }
          return p;
        })
      );

      if (editorRef.current) {
        const separator = editorRef.current.innerHTML ? '<div class="my-3"></div>' : '';
        editorRef.current.innerHTML = `${editorRef.current.innerHTML}${separator}${formattedHtml}`;
      }

      setIsSaved(false);
      showToast('✨ Added from AI Tutor to notes!');
    };

    window.addEventListener('eduspare:insert-notes', handleInsertEvent);
    return () => window.removeEventListener('eduspare:insert-notes', handleInsertEvent);
  }, [activePageId]);

  // Notion-like Formatting Commands
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleInsertMathBlock = () => {
    const formula = window.prompt(
      'Enter LaTeX Display Math Block formula (e.g. \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}):',
      '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
    );
    if (!formula) return;
    try {
      const rendered = katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
      const mathHtml = `<div class="katex-display my-3 select-all" contenteditable="false">${rendered}</div><p><br></p>`;
      insertHtmlAtCursor(mathHtml);
      handleEditorInput();
    } catch {
      insertHtmlAtCursor(`<p class="my-2 font-mono text-xs">$$${formula}$$</p>`);
      handleEditorInput();
    }
  };

  const handleInsertCallout = (type: 'info' | 'warning' | 'tip' = 'info') => {
    let calloutHtml = '';
    if (type === 'warning') {
      calloutHtml = `<div class="flex items-start gap-2.5 p-3.5 my-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>⚠️ Warning:</strong> <span>Important concept or exam note...</span></div><p><br></p>`;
    } else if (type === 'tip') {
      calloutHtml = `<div class="flex items-start gap-2.5 p-3.5 my-3 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>💡 Study Tip:</strong> <span>Key formula or shortcut...</span></div><p><br></p>`;
    } else {
      calloutHtml = `<div class="flex items-start gap-2.5 p-3.5 my-3 bg-primary/10 border-l-4 border-primary rounded-r-2xl text-xs sm:text-sm text-on-surface"><strong>ℹ️ Info:</strong> <span>Definition or reference detail...</span></div><p><br></p>`;
    }
    insertHtmlAtCursor(calloutHtml);
    handleEditorInput();
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
    handleEditorInput();
  };

  const handleInsertDivider = () => {
    insertHtmlAtCursor('<hr class="my-4 border-t border-outline-variant/60" /><p><br></p>');
    handleEditorInput();
  };

  const handleInsertChecklist = () => {
    insertHtmlAtCursor('<div class="flex items-center gap-2 my-1.5"><input type="checkbox" class="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary" /><span class="text-xs sm:text-sm"> Action item checklist...</span></div>');
    handleEditorInput();
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
      handleEditorInput();
    } else {
      executeCommand('fontSize', '4');
    }
    setShowFontSizePicker(false);
  };

  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const formattedHtml = markdownToRichHtml(text);
      insertHtmlAtCursor(formattedHtml);
      handleEditorInput();
      showToast('✨ Formatted and pasted!');
    } catch {
      editorRef.current?.focus();
    }
  };

  const handleRenamePage = (id: string, newTitle: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p))
    );
    setIsSaved(false);
  };

  const handleFinishRename = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, title: p.title.trim() || 'Untitled Page' } : p
      )
    );
    setEditingTitleId(null);
  };

  const handleAddPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage: NotionPage = {
      id: newId,
      title: `Page ${pages.length + 1}`,
      content: '<p>Click here to start writing or paste notes directly from AI Tutor...</p>',
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newId);
    setIsSaved(false);
  };

  const handleDeletePage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (pages.length <= 1) return;
    const nextPages = pages.filter((p) => p.id !== id);
    setPages(nextPages);
    if (activePageId === id) {
      setActivePageId(nextPages[0].id);
    }
    setIsSaved(false);
  };

  const handleSave = () => {
    onSaveNotes(JSON.stringify(pages));
    setIsSaved(true);
    showToast('Saved workspace notes!');
  };

  const generatePdfDocument = (page: NotionPage) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${page.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.4/dist/katex.min.css" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    ul, ol { padding-left: 24px; margin: 12px 0; }
    li { margin-bottom: 4px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto; font-size: 13px; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #64748b; font-style: italic; margin: 12px 0; }
  </style>
</head>
<body>
  <h1>${page.title}</h1>
  <div style="font-size: 14px; margin-top: 20px;">${page.content}</div>
</body>
</html>`;
  };

  const handleDownloadNote = () => {
    if (!activePage) return;
    const pdfHtml = generatePdfDocument(activePage);
    const blob = new Blob([pdfHtml], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePage.title.replace(/[^a-z0-9_-]/gi, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddAsResource = () => {
    if (!activePage || !onAddResource) return;
    const pdfHtml = generatePdfDocument(activePage);
    const blob = new Blob([pdfHtml], { type: 'application/pdf;charset=utf-8' });
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newMat: MaterialItem = {
        id: `mat-note-${Date.now()}`,
        title: `${activePage.title}.pdf`,
        type: 'pdf',
        url: dataUrl || '',
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        notes: 'Exported from Study Workspace Notes',
        createdAt: new Date().toISOString(),
      };
      onAddResource(newMat);
      showToast('Exported to Study Materials!');
    };
    reader.readAsDataURL(blob);
  };

  return (
    <div className="space-y-3 bg-surface-lowest p-4 sm:p-5 rounded-3xl border border-outline-variant/60 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Study Workspace</h4>
            <p className="text-[10px] text-outline">Directly edit & auto-formats like Notion</p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {toastMessage && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-xl animate-in fade-in zoom-in-95">
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Stateful Save Button */}
          {isSaved ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-xl select-none">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-primary rounded-xl shadow-sm transition-all hover:bg-primary-container cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          )}

          {/* 3-Dot Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Workspace options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && activePage && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-50 w-52 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl p-1.5 space-y-1 opacity-100 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (activePageId) setEditingTitleId(activePageId);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-colors truncate"
                >
                  <Pencil className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">Rename {activePage.title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleDownloadNote();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-colors truncate"
                >
                  <Download className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">Download {activePage.title}.pdf</span>
                </button>

                {onAddResource && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleAddAsResource();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl transition-colors truncate"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">Add to Resources</span>
                  </button>
                )}

                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDeletePage(activePageId);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors truncate"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">Delete {activePage.title}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notion Pages Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <div
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface-container-low text-outline hover:text-on-surface hover:bg-surface-container-high border-outline-variant/40'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-primary'}`} />
              {editingTitleId === page.id ? (
                <input
                  type="text"
                  value={page.title}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleRenamePage(page.id, e.target.value)}
                  onBlur={() => handleFinishRename(page.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename(page.id);
                  }}
                  className="w-28 px-1.5 py-0.5 bg-surface-lowest text-on-surface rounded border border-primary/50 text-xs font-bold focus:outline-none"
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTitleId(page.id);
                  }}
                  className="truncate max-w-[130px]"
                  title="Double-click to rename page"
                >
                  {page.title}
                </span>
              )}

              {pages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleDeletePage(page.id, e)}
                  className={`p-0.5 rounded-md transition-colors shrink-0 ${
                    isActive
                      ? 'text-white/80 hover:text-white hover:bg-white/20'
                      : 'text-outline hover:text-rose-600 hover:bg-rose-500/10'
                  }`}
                  title="Delete page"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Notion Page Button */}
        <button
          type="button"
          onClick={handleAddPage}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all shrink-0"
          title="Create new page"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Page</span>
        </button>
      </div>

      {/* Notion-Style Formatting Toolbar with Full Elements */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/60 text-outline text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          {/* 1. Font Family Dropdown */}
          <div ref={fontPickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowFontPicker(!showFontPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors font-medium border border-outline-variant/30 text-[11px]"
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

          {/* 2. Font Size Dropdown */}
          <div ref={sizePickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowFontSizePicker(!showFontSizePicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors font-medium border border-outline-variant/30 text-[11px]"
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

          {/* 3. Text Styles: Bold, Italic, Underline, Strikethrough */}
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* 4. Text Color & Highlight Popover */}
          <div ref={colorPickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
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

          {/* 5. Headings */}
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h1>')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h2>')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h3>')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* 6. Lists & Checklists */}
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertChecklist}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Checkbox Checklist"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* 7. Notion Elements: Quote, Callout, Table, Divider */}
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Quote Block"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleInsertCallout('info')}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors text-primary font-bold"
            title="Insert Callout Box"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Insert Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertDivider}
            className="p-1.5 rounded-lg hover:bg-surface-lowest hover:text-on-surface transition-colors"
            title="Insert Divider Line"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-outline-variant/40 mx-0.5" />

          {/* 8. Equations: Inline Math & Block Math */}
          <button
            type="button"
            onClick={handleInsertMath}
            className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-lg hover:bg-surface-lowest hover:text-primary transition-colors border border-outline-variant/40"
            title="Insert Inline LaTeX Math ($...$)"
          >
            $ Math
          </button>
          <button
            type="button"
            onClick={handleInsertMathBlock}
            className="px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-lg hover:bg-surface-lowest hover:text-purple-600 transition-colors border border-outline-variant/40"
            title="Insert Display Math Block ($$...$$)"
          >
            $$ Block
          </button>
        </div>

        <button
          type="button"
          onClick={handleQuickPaste}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all cursor-pointer shrink-0"
          title="Paste and auto-format from clipboard"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Paste AI Text</span>
        </button>
      </div>

      {/* Notion Unified WYSIWYG Editable Document Surface */}
      <div className="relative rounded-2xl bg-surface-container-low border border-outline-variant/60 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary focus-within:bg-surface-lowest transition-all min-h-[360px]">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onPaste={handlePaste}
          className="w-full p-4 sm:p-5 text-on-surface text-sm leading-relaxed outline-none min-h-[360px] max-h-[650px] overflow-y-auto font-sans"
        />
      </div>
    </div>
  );
};
