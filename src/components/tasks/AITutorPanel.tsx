'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Cpu,
  MoreVertical,
  Brain,
  BookOpen,
  ShieldCheck,
  FilePlus,
} from 'lucide-react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface AITutorPanelProps {
  taskTitle: string;
  category: string;
  notes?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  modelId?: string;
  switchedNotice?: string;
  isError?: boolean;
  failedModel?: string;
  originalPrompt?: string;
}

const AI_STUDY_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Free Google Q&A',
    provider: 'Google AI (Free)',
    icon: Sparkles,
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS (120B)',
    tag: 'Free Groq Ultra-Fast',
    provider: 'Groq (Free)',
    icon: Bot,
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    id: 'llama-3.3',
    name: 'Llama 3.3 (70B)',
    tag: 'Free Meta Q&A',
    provider: 'Meta / Groq (Free)',
    icon: ShieldCheck,
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  {
    id: 'gemma',
    name: 'Gemma 3 (27B)',
    tag: 'Free Open Q&A',
    provider: 'Google Open (Free)',
    icon: Cpu,
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    tag: 'DeepSeek Direct Q&A',
    provider: 'DeepSeek',
    icon: Brain,
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    tag: 'OpenAI Fast Q&A',
    provider: 'OpenAI',
    icon: Bot,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
];


export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  taskTitle,
  category,
  notes,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch('/api/ai-tutor')
      .then((r) => r.json())
      .then((data) => {
        if (data.recommendedModel) {
          setSelectedModel(data.recommendedModel);
        }
      })
      .catch(() => {});
  }, []);

  const initialWelcomeMsg: ChatMessage = {
    id: 'welcome-1',
    sender: 'ai',
    modelId: 'gemini-3.8-flash',
    text: `Hello! How can I assist you with your studies today? You can switch question-and-answer models anytime (GPT, Gemini, Gemma, DeepSeek, Llama, Groq) using the chips or the 3-dot icon (⋮).`,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMsg]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = async (customPrompt?: string, actionType?: string, modelOverride?: string) => {
    const userText = (customPrompt || prompt).trim();
    if (!userText || loading) return;

    const currentModel = modelOverride || selectedModel;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setPrompt('');
    setLoading(true);

    try {
      // Send the prior conversation (excluding the static welcome bubble) so the
      // tutor keeps context across follow-up questions.
      const history = messages
        .filter((m) => m.id !== 'welcome-1' && !m.isError)
        .slice(-12)
        .map((m) => ({ role: m.sender === 'ai' ? 'assistant' : 'user', content: m.text }));

      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType || 'custom',
          prompt: userText,
          taskTitle,
          category,
          notes,
          model: currentModel,
          history,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const isError = !res.ok || (data.error && !data.result);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        modelId: data.model || currentModel,
        switchedNotice: data.switchedNotice,
        isError,
        failedModel: isError ? currentModel : undefined,
        originalPrompt: isError ? userText : undefined,
        text:
          data.result ||
          (data.error ? `**${data.error}**` : 'I encountered an issue generating a response. Please try again or switch to another model.'),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Tutor error:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        modelId: currentModel,
        isError: true,
        failedModel: currentModel,
        originalPrompt: userText,
        text: 'Sorry, I failed to reach the AI Tutor service. Please check your internet connection or switch to another model.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertToWorkspace = (id: string, text: string) => {
    window.dispatchEvent(new CustomEvent('eduspare:insert-notes', { detail: { text } }));
    setInsertedId(id);
    setTimeout(() => setInsertedId(null), 2000);
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  const activeModelObj = AI_STUDY_MODELS.find((m) => m.id === selectedModel) || AI_STUDY_MODELS[0];

  const renderContent = (inFullScreen: boolean) => (
    <div
      className={`bg-surface-lowest dark:bg-slate-950 border border-outline-variant/60 shadow-xl flex flex-col space-y-3 transition-all duration-200 ${inFullScreen
        ? 'fixed inset-0 z-[99999] w-screen h-screen p-4 sm:p-6 shadow-2xl bg-surface-lowest dark:bg-slate-950 border-none rounded-none'
        : 'relative p-3 sm:p-4 rounded-2xl sm:rounded-3xl h-[520px] sm:h-[650px] lg:h-[720px] max-h-[82vh]'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-on-surface truncate">EduSpare AI Tutor</h4>
              <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                Online
              </span>
            </div>
            <p className="text-[10px] text-outline font-medium truncate max-w-[190px]">
              {taskTitle} ({category})
            </p>
          </div>
        </div>

        {/* Toolbar controls: Full Screen Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleFullScreen}
            className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors"
            title={inFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
          >
            {inFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Chat Messages Stream Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-3.5 rounded-2xl bg-surface-lowest/70 border border-outline-variant/30 text-xs shadow-inner">
        {messages.map((msg) => {
          const msgModel = AI_STUDY_MODELS.find((m) => m.id === msg.modelId) || activeModelObj;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${msg.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gradient-to-tr from-primary/20 to-indigo-500/20 text-primary border border-primary/30'
                  }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble Container */}
              <div
                className={`group relative max-w-[90%] p-3.5 rounded-2xl space-y-1.5 ${msg.sender === 'user'
                  ? 'bg-primary text-white rounded-tr-none shadow-sm'
                  : 'bg-surface-container text-on-surface rounded-tl-none border border-outline-variant/40 shadow-sm'
                  }`}
              >
                {/* AI Model Badge Header for AI Responses */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5 mb-1 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 ${msgModel.badgeColor}`}>
                      <msgModel.icon className="w-3 h-3" />
                      {msgModel.name} {msgModel.tag}
                    </span>
                  </div>
                )}

                {/* Auto-switch notice if rate limit triggered fallback */}
                {msg.switchedNotice && (
                  <div className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{msg.switchedNotice}</span>
                  </div>
                )}

                {/* Message Content: Markdown formatting for AI teacher responses */}
                {msg.sender === 'ai' ? (
                  <div className="text-on-surface">
                    <MarkdownRenderer content={msg.text} />
                  </div>
                ) : (
                  <p className="whitespace-pre-line leading-relaxed font-medium text-xs">
                    {msg.text}
                  </p>
                )}

                {/* Rate Limit / Error: Quick Model Switcher Actions */}
                {msg.isError && (
                  <div className="mt-2.5 pt-2 border-t border-rose-500/20 space-y-1.5">
                    <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      ⚡ Rate limit exceeded on this model. Switch to continue immediately:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {AI_STUDY_MODELS.filter((m) => m.id !== msg.failedModel).slice(0, 3).map((alt) => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(alt.id);
                            if (msg.originalPrompt) {
                              handleSendMessage(msg.originalPrompt, 'custom', alt.id);
                            }
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-surface-lowest hover:bg-primary/10 hover:text-primary hover:border-primary border border-outline-variant/60 transition-all flex items-center gap-1 shadow-xs"
                        >
                          <alt.icon className="w-3 h-3 text-primary" />
                          Switch to {alt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions for AI responses: Insert directly to Workspace & Copy */}
                {msg.sender === 'ai' && (
                  <div className="flex items-center justify-end gap-1.5 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleInsertToWorkspace(msg.id, msg.text)}
                      className="px-2 py-0.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1 text-[10px] font-semibold border border-outline-variant/40 shadow-xs transition-colors"
                      title="Insert directly into Study Workspace notes"
                    >
                      {insertedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Added to Notes!</span>
                        </>
                      ) : (
                        <>
                          <FilePlus className="w-3 h-3 text-primary" />
                          <span>Insert to Workspace</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="px-2 py-0.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1 text-[10px] font-semibold border border-outline-variant/40 shadow-xs transition-colors"
                      title="Copy Markdown Text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2.5 p-3.5 bg-surface-container text-on-surface rounded-2xl rounded-tl-none max-w-[85%] border border-outline-variant/40 animate-pulse shadow-sm">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-on-surface">
                {activeModelObj.name} is thinking...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multi-line Chat Input Form with 3-Dot Model Selector Menu */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-end gap-2 shrink-0 pt-1 relative"
      >
        <div className="flex-1 relative flex flex-col">
          {/* Floating Model Selection Popover Menu */}
          {showModelMenu && (
            <div
              ref={modelMenuRef}
              className="absolute bottom-full mb-2 right-0 z-30 w-72 bg-surface-lowest border border-outline-variant/60 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 space-y-1.5"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-outline-variant/30">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-primary" /> Select AI Study Model
                </span>
                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  Active
                </span>
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
                {AI_STUDY_MODELS.map((model) => {
                  const isSelected = selectedModel === model.id;
                  const IconComp = model.icon;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border ${isSelected
                        ? 'bg-primary/10 text-primary border-primary/40 shadow-sm'
                        : 'hover:bg-surface-container-high text-on-surface border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1 rounded-lg shrink-0 ${model.badgeColor}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-xs leading-tight truncate">{model.name}</p>
                          <p className="text-[9px] text-outline truncate">{model.tag}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Integrated Textarea Container with Top Bar for Active Model Badge & Quick Switchers */}
          <div className="relative flex flex-col bg-surface-lowest border border-outline-variant/60 focus-within:ring-2 focus-within:ring-primary rounded-xl shadow-inner overflow-hidden">
            {/* Top Toolbar inside input box */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-outline-variant/30 bg-surface-container-low/40">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar min-w-0">
                <span className={`px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 text-[10px] shrink-0 ${activeModelObj.badgeColor}`}>
                  <activeModelObj.icon className="w-3 h-3" />
                  {activeModelObj.name}
                </span>

                {/* Quick Model Switcher Chips */}
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  {AI_STUDY_MODELS.filter((m) => m.id !== selectedModel).slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-outline hover:text-primary hover:bg-surface-container-high transition-colors shrink-0"
                      title={`Switch to ${m.name}`}
                    >
                      {m.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Dot Menu Icon Button */}
              <button
                type="button"
                onClick={() => setShowModelMenu(!showModelMenu)}
                className={`p-1 rounded-lg transition-all flex items-center gap-1 shrink-0 ${showModelMenu
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-outline hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                title="Switch AI Study Model (⋮)"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Input Textarea */}
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${activeModelObj.name}`}
              className="w-full px-3.5 py-2.5 text-xs bg-transparent focus:outline-none text-on-surface placeholder:text-outline/70 font-medium resize-none min-h-[68px] max-h-[140px] leading-relaxed"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="p-3.5 bg-primary text-white rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all shadow-md flex items-center justify-center shrink-0"
          title={`Send message to ${activeModelObj.name}`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  if (isFullScreen && mounted) {
    return createPortal(renderContent(true), document.body);
  }

  return renderContent(false);
};
