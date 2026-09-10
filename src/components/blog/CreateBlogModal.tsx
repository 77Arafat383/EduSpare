'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, FileText, Tag, Upload, Eye, Edit3, Sparkles, Sigma } from 'lucide-react';
import { useEduSpare } from '@/context/EduSpareContext';
import { BlogAttachment, BlogPost } from '@/types/eduspare';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  postToEdit?: BlogPost | null;
  defaultCommunityId?: string;
}

function convertHtmlToMarkdownAndLatex(html: string, fallbackText: string): string {
  if (!html) return fallbackText;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Extract KaTeX / MathJax / MathML LaTeX annotations
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

    // 2. Walk DOM and convert HTML structure into Markdown
    function walk(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const elem = node as HTMLElement;
      const tag = elem.tagName.toLowerCase();
      const childrenText = Array.from(elem.childNodes).map(walk).join('');

      switch (tag) {
        case 'h1':
          return `\n\n# ${childrenText.trim()}\n\n`;
        case 'h2':
          return `\n\n## ${childrenText.trim()}\n\n`;
        case 'h3':
          return `\n\n### ${childrenText.trim()}\n\n`;
        case 'h4':
          return `\n\n#### ${childrenText.trim()}\n\n`;
        case 'h5':
          return `\n\n##### ${childrenText.trim()}\n\n`;
        case 'h6':
          return `\n\n###### ${childrenText.trim()}\n\n`;
        case 'strong':
        case 'b':
          return childrenText.trim() ? `**${childrenText.trim()}**` : '';
        case 'em':
        case 'i':
          return childrenText.trim() ? `*${childrenText.trim()}*` : '';
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
    console.warn('HTML clipboard conversion error:', err);
  }

  return fallbackText;
}

export const CreateBlogModal: React.FC<CreateBlogModalProps> = ({
  isOpen,
  onClose,
  postToEdit,
  defaultCommunityId,
}) => {
  const { createBlog, updateBlog } = useEduSpare();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<BlogAttachment[]>([]);
  const [activeContentTab, setActiveContentTab] = useState<'write' | 'preview'>('write');

  React.useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setContent(postToEdit.content || '');
      setCoverImage(postToEdit.coverImage || '');
      setCommunityId(postToEdit.communityId || defaultCommunityId || '');
      setTagInput(postToEdit.tags ? postToEdit.tags.join(', ') : '');
      setAttachments(postToEdit.attachments || []);
    } else {
      setTitle('');
      setContent('');
      setCoverImage('');
      setCommunityId(defaultCommunityId || '');
      setTagInput('');
      setAttachments([]);
    }
  }, [postToEdit, isOpen, defaultCommunityId]);

  if (!isOpen) return null;

  // Format Detections
  const hasLatex = Boolean(
    content &&
    /\\(?:text|boxed|qquad|quad|times|frac|dfrac|tfrac|cfrac|sqrt|sum|int|lim|vec|alpha|beta|gamma|theta|pi|infty|cdot|partial|approx|le|ge|neq|begin|end)|\$|\\\[|\\\(|\[\s*[a-zA-Z0-9\s\\=+\-*\/^]+\s*\]/i.test(
      content
    )
  );

  const hasMarkdown = Boolean(
    content &&
    /(?:^|\n)(?:#{1,6}\s|\*\s|-\s|\d+\.\s|>|```|\|)|(?:\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/m.test(content)
  );

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');

    if (htmlData) {
      const converted = convertHtmlToMarkdownAndLatex(htmlData, textData);
      if (converted && converted !== textData) {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newContent = content.substring(0, start) + converted + content.substring(end);
        setContent(newContent);

        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + converted.length;
        }, 0);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newAttachments: BlogAttachment[] = [];
    let processedCount = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const sizeMB = file.size / (1024 * 1024);
        const sizeKB = file.size / 1024;
        const sizeStr = sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;

        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: 'pdf',
          url: reader.result as string,
          size: sizeStr,
        });

        processedCount++;
        if (processedCount === fileArray.length) {
          setAttachments((prev) => [...prev, ...newAttachments]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

    if (postToEdit) {
      await updateBlog(postToEdit.id, {
        title,
        content,
        coverImage: coverImage || null,
        tags,
        attachments,
        communityId: communityId || null,
      });
    } else {
      await createBlog({
        title,
        content,
        coverImage: coverImage || null,
        tags,
        attachments,
        communityId: communityId || defaultCommunityId || null,
      });
    }

    setTitle('');
    setContent('');
    setCoverImage('');
    setAttachments([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-[calc(100vw-1.5rem)] sm:w-full max-w-2xl bg-surface-lowest rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant/80 p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <h3 className="text-lg font-bold text-on-surface">{postToEdit ? 'Edit Article' : 'Create New Blog'}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Blog Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Building High-Throughput Real-Time Systems"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Cover Image
            </label>
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-outline-variant/60 group">
                <img loading="lazy" decoding="async" src={coverImage} alt="Cover Preview" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-red-600 transition-colors shadow"
                  title="Remove cover image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-outline-variant/60 rounded-xl cursor-pointer bg-surface-container-low hover:bg-surface-container hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center justify-center pt-3 pb-3">
                  <Upload className="w-6 h-6 text-outline mb-1" />
                  <p className="text-xs text-on-surface font-medium">Click to upload cover image</p>
                  <p className="text-[10px] text-outline">PNG, JPG, WEBP or GIF</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Content Body
                </label>


              </div>

              <button
                type="button"
                onClick={() => setActiveContentTab(activeContentTab === 'write' ? 'preview' : 'write')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-surface-container-high hover:bg-primary/10 text-primary border border-outline-variant/50 transition-all flex items-center gap-1.5 shadow-xs"
              >
                {activeContentTab === 'write' ? (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" /> Write
                  </>
                )}
              </button>
            </div>

            {activeContentTab === 'write' ? (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Paste or write Markdown and LaTeX math formulas (e.g. $E=mc^2$ or \frac{a}{b} or [ d = vt ])..."
                  className="w-full p-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
                />

              </div>
            ) : (
              <div className="w-full min-h-[200px] max-h-[350px] overflow-y-auto p-4 rounded-xl bg-surface-container-low border border-outline-variant/60">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <p className="text-xs text-outline italic">
                    Nothing to preview yet. Paste or write Markdown and LaTeX math formulas in the Write tab!
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Attach Documents
            </label>

            {attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{att.name}</p>
                        <p className="text-[10px] text-outline">{att.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 rounded-lg text-outline hover:text-red-500 hover:bg-surface-container transition-colors shrink-0"
                      title="Remove document"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-outline-variant/60 rounded-xl cursor-pointer bg-surface-container-low hover:bg-surface-container hover:border-primary/50 transition-all text-xs font-medium text-on-surface">
              <Upload className="w-4 h-4 text-outline" />
              <span>Click to attach documents</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="WebSockets, System Architecture"
              className="w-full px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-outline hover:text-on-surface rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-container rounded-xl shadow-md transition-all"
            >
              {postToEdit ? 'Save Changes' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
