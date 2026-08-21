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
  timestamp: string;
  modelId?: string;
}

const AI_STUDY_MODELS = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    tag: 'Google',
    provider: 'Fast & Visual Study Guide',
    icon: Sparkles,
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    tag: 'OpenAI',
    provider: 'Logic & Code Reasoning',
    icon: Bot,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    tag: 'Anthropic',
    provider: 'Academic Writing & Analysis',
    icon: BookOpen,
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    tag: 'DeepSeek',
    provider: 'STEM & Math Reasoning',
    icon: Brain,
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  },
  {
    id: 'gemma-2',
    name: 'Gemma 2 27B',
    tag: 'Google Open',
    provider: 'Academic Research & Textbooks',
    icon: Cpu,
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    id: 'llama-3.3',
    name: 'Llama 3.3 70B',
    tag: 'Meta Open',
    provider: 'Open Academic Knowledge',
    icon: ShieldCheck,
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
];

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  taskTitle,
  category,
  notes,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialWelcomeMsg: ChatMessage = {
    id: 'welcome-1',
    sender: 'ai',
    modelId: 'gemini-1.5-flash',
    text: `Hello! How can I assist you with your studies today? You can switch AI models anytime using the 3-dot icon (⋮) on the chat input box.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const handleSendMessage = async (customPrompt?: string, actionType?: string) => {
    const userText = (customPrompt || prompt).trim();
    if (!userText || loading) return;

    const currentModel = selectedModel;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setPrompt('');
    setLoading(true);

    try {
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
        }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        modelId: currentModel,
        text: data.result || 'I encountered an issue generating a response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Tutor error:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        modelId: currentModel,
        text: 'Sorry, I failed to reach the AI Tutor service. Please check your internet connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  const activeModelObj = AI_STUDY_MODELS.find((m) => m.id === selectedModel) || AI_STUDY_MODELS[0];

  const renderContent = (inFullScreen: boolean) => (
    <div
      className={`bg-surface-lowest dark:bg-slate-950 border border-outline-variant/60 shadow-xl flex flex-col space-y-3 transition-all duration-200 ${
        inFullScreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen p-6 shadow-2xl bg-surface-lowest dark:bg-slate-950 border-none rounded-none'
          : 'relative p-4 rounded-3xl h-[720px] max-h-[82vh]'
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
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gradient-to-tr from-primary/20 to-indigo-500/20 text-primary border border-primary/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble Container */}
              <div
                className={`group relative max-w-[90%] p-3.5 rounded-2xl space-y-1.5 ${
                  msg.sender === 'user'
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
                    <span className="text-[9px] text-outline font-medium">{msgModel.provider}</span>
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

                {/* Timestamp & Copy Button */}
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-[10px]">
                  <span
                    className={`font-mono ${
                      msg.sender === 'user' ? 'text-white/70' : 'text-outline'
                    }`}
                  >
                    {msg.timestamp}
                  </span>

                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-outline hover:text-primary rounded-lg flex items-center gap-1"
                      title="Copy Markdown Text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
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
              <p className="text-[10px] text-outline">Generating study guide via {activeModelObj.provider}</p>
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
              className="absolute bottom-full mb-2 right-0 z-30 w-64 bg-surface-lowest border border-outline-variant/60 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 space-y-1.5"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-outline-variant/30">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-primary" /> Select AI Study Model
                </span>
                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  100% Free
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
                        setSelectedModel(model.id as any);
                        setShowModelMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-primary/10 text-primary border-primary/40 shadow-sm'
                          : 'hover:bg-surface-container-high text-on-surface border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-lg ${model.badgeColor}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xs leading-tight">{model.name}</p>
                          <p className="text-[10px] text-outline font-normal">{model.provider}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Integrated Textarea Container with Top Bar for Active Model Badge & 3-Dot Icon */}
          <div className="relative flex flex-col bg-surface-lowest border border-outline-variant/60 focus-within:ring-2 focus-within:ring-primary rounded-xl shadow-inner overflow-hidden">
            {/* Top Toolbar inside input box */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-outline-variant/30 bg-surface-container-low/40">
              <span className={`px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 text-[10px] ${activeModelObj.badgeColor}`}>
                <activeModelObj.icon className="w-3 h-3" />
                {activeModelObj.name} ({activeModelObj.tag})
              </span>

              {/* 3-Dot Menu Icon Button */}
              <button
                type="button"
                onClick={() => setShowModelMenu(!showModelMenu)}
                className={`p-1 rounded-lg transition-all flex items-center gap-1 ${
                  showModelMenu
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
              placeholder={`Ask ${activeModelObj.name} about ${taskTitle}...`}
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
