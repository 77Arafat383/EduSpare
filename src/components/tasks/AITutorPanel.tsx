'use client';

import React, { useState } from 'react';
import { Sparkles, BookOpen, HelpCircle, FileText, Send, Loader2 } from 'lucide-react';

interface AITutorPanelProps {
  taskTitle: string;
  category: string;
  notes?: string;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  taskTitle,
  category,
  notes,
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAIQuery = async (actionType?: string, customPrompt?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType || 'custom',
          prompt: customPrompt || prompt,
          taskTitle,
          category,
          notes,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setResponse(data.result);
      }
    } catch (err) {
      console.error('AI Tutor query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-surface-lowest via-surface-container-low to-surface-variant p-5 rounded-3xl border border-primary/20 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">EduSpare AI Tutor</h4>
            <p className="text-[11px] text-outline">Contextual Notebook Assistant for {category}</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          Gemini 3.5 Ready
        </span>
      </div>

      {/* Quick Assistant Presets */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleAIQuery('explain')}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-surface-lowest hover:bg-primary/10 border border-outline-variant/40 text-left transition-colors group"
        >
          <BookOpen className="w-4 h-4 text-primary mb-1 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-on-surface">Explain Topic</div>
          <div className="text-[10px] text-outline">Step-by-step concepts</div>
        </button>

        <button
          onClick={() => handleAIQuery('quiz')}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-surface-lowest hover:bg-primary/10 border border-outline-variant/40 text-left transition-colors group"
        >
          <HelpCircle className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-on-surface">Quiz & Flashcards</div>
          <div className="text-[10px] text-outline">Test key memory</div>
        </button>

        <button
          onClick={() => handleAIQuery('summarize')}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-surface-lowest hover:bg-primary/10 border border-outline-variant/40 text-left transition-colors group"
        >
          <FileText className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-on-surface">Key Takeaways</div>
          <div className="text-[10px] text-outline">Executive summary</div>
        </button>
      </div>

      {/* Output Display Area */}
      {loading ? (
        <div className="p-6 text-center text-xs text-primary font-semibold flex items-center justify-center gap-2 bg-surface-lowest rounded-2xl border border-outline-variant/30">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating contextual explanation for {taskTitle}...
        </div>
      ) : response ? (
        <div className="p-4 bg-surface-lowest rounded-2xl border border-outline-variant/50 text-xs text-on-surface leading-relaxed space-y-2 whitespace-pre-line animate-in fade-in">
          {response}
        </div>
      ) : null}

      {/* Custom Prompt Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim()) handleAIQuery(undefined, prompt);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Ask AI Tutor anything about ${taskTitle}...`}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="p-2 bg-primary text-white rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
