'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';

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
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  taskTitle,
  category,
  notes,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hello! I am your EduSpare AI Tutor for "${taskTitle}" (${category}). Ask me any questions, request explanations, or test concepts together!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userText = prompt.trim();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom',
          prompt: userText,
          taskTitle,
          category,
          notes,
        }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.result || 'I encountered an issue generating a response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Tutor error:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I failed to reach the AI Tutor service. Please check your connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-surface-lowest via-surface-container-low to-surface-variant p-4 rounded-3xl border border-primary/20 shadow-sm flex flex-col h-[580px] max-h-[75vh] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">EduSpare AI Tutor</h4>
            <p className="text-[10px] text-outline font-medium truncate max-w-[170px]">
              {taskTitle} ({category})
            </p>
          </div>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          Online
        </span>
      </div>

      {/* Chat Messages Stream Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl bg-surface-lowest/60 border border-outline-variant/30 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                msg.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] p-3 rounded-2xl space-y-1 ${
                msg.sender === 'user'
                  ? 'bg-primary text-white rounded-tr-none shadow-sm'
                  : 'bg-surface-container text-on-surface rounded-tl-none border border-outline-variant/40'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed font-medium text-[11px]">
                {msg.text}
              </p>
              <span
                className={`text-[9px] block text-right font-mono ${
                  msg.sender === 'user' ? 'text-white/70' : 'text-outline'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-surface-container text-on-surface rounded-2xl rounded-tl-none max-w-[80%] border border-outline-variant/40 animate-pulse">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-[11px] font-medium text-outline">
              AI Tutor is thinking...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 shrink-0 pt-1">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Ask AI Tutor about ${taskTitle}...`}
          className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface shadow-inner"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all shadow-sm"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
