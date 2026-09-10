'use client';

import React, { useState, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { MaterialItem } from '@/types/eduspare';
import { MarkdownRenderer, preprocessLatex } from '../common/MarkdownRenderer';
import {
  FileText,
  CheckCircle2,
  Edit3,
  Save,
  Plus,
  X,
  Eye,
  Download,
  FilePlus,
  Pencil,
  MoreVertical,
  Trash2,
} from 'lucide-react';

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
}

/** Convert copied rich HTML (e.g. a rendered AI answer) back to Markdown + TeX. */
function htmlToMarkdown(html: string): string {
  if (typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // KaTeX keeps the original TeX source in <annotation encoding="application/x-tex">.
  doc.querySelectorAll('.katex-display, .katex').forEach((node) => {
    if (node.parentElement?.closest('.katex-display, .katex') && node.parentElement.closest('.katex-display, .katex') !== node) return;
    const ann = node.querySelector('annotation[encoding="application/x-tex"]');
    if (!ann) return;
    const tex = (ann.textContent || '').trim();
    const isDisplay = node.classList.contains('katex-display') || !!node.closest('.katex-display');
    node.replaceWith(doc.createTextNode(isDisplay ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`));
  });

  const walk = (node: Node, listDepth = 0): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = () => Array.from(el.childNodes).map((c) => walk(c, listDepth)).join('');

    switch (tag) {
      case 'br': return '\n';
      case 'h1': return `\n\n# ${inner().trim()}\n\n`;
      case 'h2': return `\n\n## ${inner().trim()}\n\n`;
      case 'h3': return `\n\n### ${inner().trim()}\n\n`;
      case 'h4': case 'h5': case 'h6': return `\n\n#### ${inner().trim()}\n\n`;
      case 'p': case 'div': case 'section': case 'article': return `\n\n${inner().trim()}\n\n`;
      case 'strong': case 'b': { const t = inner().trim(); return t ? `**${t}**` : ''; }
      case 'em': case 'i': { const t = inner().trim(); return t ? `*${t}*` : ''; }
      case 'code':
        if (el.parentElement?.tagName.toLowerCase() === 'pre') return el.textContent || '';
        return `\`${el.textContent || ''}\``;
      case 'pre': {
        const code = el.querySelector('code');
        const lang = (code?.className.match(/language-([\w-]+)/) || [])[1] || '';
        return `\n\n\`\`\`${lang}\n${(el.textContent || '').replace(/\n$/, '')}\n\`\`\`\n\n`;
      }
      case 'blockquote':
        return `\n\n${inner().trim().split('\n').map((l) => `> ${l}`).join('\n')}\n\n`;
      case 'ul': case 'ol': {
        const ordered = tag === 'ol';
        let i = 0;
        const items = Array.from(el.children)
          .filter((c) => c.tagName.toLowerCase() === 'li')
          .map((li) => {
            i += 1;
            const body = Array.from(li.childNodes).map((c) => walk(c, listDepth + 1)).join('').trim().replace(/\n{2,}/g, '\n');
            return `${'  '.repeat(listDepth)}${ordered ? `${i}.` : '-'} ${body}`;
          });
        return `\n\n${items.join('\n')}\n\n`;
      }
      case 'li': return inner();
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr')).map((tr) =>
          Array.from(tr.children).map((td) => walk(td, listDepth).trim().replace(/\|/g, '\\|'))
        );
        if (!rows.length) return '';
        const header = rows[0];
        const out = [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`];
        rows.slice(1).forEach((r) => out.push(`| ${r.join(' | ')} |`));
        return `\n\n${out.join('\n')}\n\n`;
      }
      case 'a': { const href = el.getAttribute('href'); const t = inner().trim(); return href ? `[${t}](${href})` : t; }
      case 'hr': return '\n\n---\n\n';
      case 'script': case 'style': return '';
      default: return inner();
    }
  };

  return walk(doc.body)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isSaved, setIsSaved] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize Notion Pages from initialNotes (supports JSON array or plain text)
  useEffect(() => {
    if (!initialNotes) {
      setPages([
        {
          id: 'page-1',
          title: 'Main Notes',
          content: '# Study Notes\n\n- Copied notes and AI tutor formulas will render Markdown & LaTeX automatically!\n- Example LaTeX Math: $E = mc^2$ and $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$',
        },
      ]);
      setActivePageId('page-1');
      return;
    }

    try {
      const parsed = JSON.parse(initialNotes);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        setPages(parsed);
        setActivePageId(parsed[0].id);
        return;
      }
    } catch (e) {
      // Fallback for legacy plain-text notes
    }

    setPages([
      {
        id: 'page-1',
        title: 'Main Notes',
        content: initialNotes,
      },
    ]);
    setActivePageId('page-1');
  }, [initialNotes]);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const handleContentChange = (newContent: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, content: newContent } : p))
    );
    setIsSaved(false);
  };

  /**
   * Smart paste: anything copied from the AI Tutor chat (Markdown, LaTeX
   * \( \) / \[ \] delimiters, ```math blocks, raw \frac{}{} equations, or the
   * rendered HTML of a message) is normalised into the same Markdown + $math$
   * syntax the renderer understands, so it formats automatically in preview.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboard = e.clipboardData;
    let text = clipboard.getData('text/plain');
    const html = clipboard.getData('text/html');

    // If the user copied rendered output (selection in the chat bubble),
    // recover the original TeX from KaTeX's <annotation> nodes and basic
    // structure (headings, lists, code, emphasis) from the HTML.
    if (html && (!text || /katex|<(h[1-6]|ul|ol|pre|code|strong|em|table)\b/i.test(html))) {
      const fromHtml = htmlToMarkdown(html);
      if (fromHtml.trim()) text = fromHtml;
    }

    if (!text) return;

    const formatted = preprocessLatex(text)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');

    if (!formatted) return;

    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    // Keep block math / headings on their own lines.
    const needsLeadingBreak = before.length > 0 && !before.endsWith('\n') && /^(\$\$|#|-|\*|\d+\.|```|>)/.test(formatted);
    const insert = (needsLeadingBreak ? '\n' : '') + formatted;
    const next = before + insert + after;

    handleContentChange(next);
    const caret = before.length + insert.length;
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.selectionStart = ta.selectionEnd = caret;
        ta.focus();
      }
    });
  };

  // Renaming: allow empty string while typing so user can backspace & erase previous name completely!
  const handleRenamePage = (id: string, newTitle: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title: newTitle } : p))
    );
    setIsSaved(false);
  };

  // On blur or Enter: fallback to 'Untitled Page' if empty
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
      content: '## New Notion Page\n\nStart typing notes or paste LaTeX math equations from AI chat...',
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newId);
    setIsSaved(false);
  };

  const handleDeletePage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (pages.length <= 1) return; // Keep at least one page
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
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 12px; overflow-x: auto; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #64748b; font-style: italic; }
  </style>
</head>
<body>
  <h1>${page.title}</h1>
  <div style="white-space: pre-wrap; font-family: monospace; font-size: 13px; margin-top: 20px;">${page.content}</div>
</body>
</html>`;
  };

  // Download Note directly as PDF file (.pdf)
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

  // Export & Add CURRENT Note directly to Study Materials as a PDF resource (.pdf)
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
    };
    reader.readAsDataURL(blob);
  };

  return (
    <div className="space-y-3 bg-surface-lowest p-5 rounded-3xl border border-outline-variant/60 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Study Workspace</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stateful Save Button / Saved Badge in fixed position */}
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

            {/* 3-Dot Options Menu - Scoped to Current Active Page */}
            {isMenuOpen && activePage && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-50 w-52 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl p-1.5 space-y-1 opacity-100 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setViewMode(viewMode === 'edit' ? 'preview' : 'edit');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-colors"
                >
                  {viewMode === 'edit' ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>Preview {activePage.title}</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      <span>Edit {activePage.title}</span>
                    </>
                  )}
                </button>

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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 select-none">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          return (
            <div
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isActive
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
                  className={`p-0.5 rounded-md transition-colors shrink-0 ${isActive
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
          title="Create new Notion page"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Page</span>
        </button>
      </div>

      {/* Editor / Preview Panel Container */}
      {activePage && (
        <div className="relative">
          {viewMode === 'edit' ? (
            <textarea
              ref={textareaRef}
              rows={12}
              value={activePage.content}
              onChange={(e) => handleContentChange(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type notes, Markdown, or paste LaTeX math equations directly from AI Tutor..."
              className="w-full p-4 rounded-2xl bg-surface-container-low text-on-surface text-xs sm:text-sm font-mono border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-lowest leading-relaxed transition-all resize-y"
            />
          ) : (
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 min-h-[260px] text-on-surface overflow-x-auto leading-relaxed">
              <MarkdownRenderer
                className="text-xs sm:text-sm"
                content={activePage.content || '*No content in this page yet.*'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
