import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/ai-tutor
 *
 * Real AI backend for the Study Workspace tutor. Every model shown in the UI is
 * mapped to a concrete provider model. Configure at least one key in .env.local:
 *
 *   OPENAI_API_KEY      -> GPT models
 *   ANTHROPIC_API_KEY   -> Claude models
 *   GEMINI_API_KEY      -> Gemini / Gemma models
 *   GROQ_API_KEY        -> Llama / DeepSeek / Gemma (free tier, very fast)
 *   OPENROUTER_API_KEY  -> any model (universal fallback)
 *
 * If the preferred provider for a model has no key (or fails), the request is
 * transparently routed to the next configured provider, so the tutor works with
 * a single key of any kind.
 */

type Role = 'user' | 'assistant';
interface HistoryMessage {
  role: Role;
  content: string;
}
type Provider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter';

interface ModelTarget {
  openai?: string;
  anthropic?: string;
  gemini?: string;
  groq?: string;
  openrouter: string; // always present – universal fallback
  preferred: Provider[];
}

/** UI model id -> real provider model ids. */
const MODEL_MAP: Record<string, ModelTarget> = {
  'gpt-5.6-luna': { openai: 'gpt-4.1', openrouter: 'openai/gpt-4.1', preferred: ['openai', 'openrouter'] },
  'gpt-5.6': { openai: 'gpt-4.1', openrouter: 'openai/gpt-4.1', preferred: ['openai', 'openrouter'] },
  'gpt-5.6-mini': { openai: 'gpt-4.1-mini', openrouter: 'openai/gpt-4.1-mini', preferred: ['openai', 'openrouter'] },
  'gpt-5.5': { openai: 'gpt-4o', openrouter: 'openai/gpt-4o', preferred: ['openai', 'openrouter'] },
  'gpt-5.5-mini': { openai: 'gpt-4o-mini', openrouter: 'openai/gpt-4o-mini', preferred: ['openai', 'openrouter'] },
  'gpt-4o-mini': { openai: 'gpt-4o-mini', openrouter: 'openai/gpt-4o-mini', preferred: ['openai', 'openrouter'] },
  'gemini-3.6-flash': { gemini: 'gemini-2.5-flash', openrouter: 'google/gemini-2.5-flash', preferred: ['gemini', 'openrouter'] },
  'gemini-1.5-flash': { gemini: 'gemini-2.0-flash', openrouter: 'google/gemini-2.0-flash-001', preferred: ['gemini', 'openrouter'] },
  'claude-3.5-sonnet': { anthropic: 'claude-sonnet-4-20250514', openrouter: 'anthropic/claude-sonnet-4', preferred: ['anthropic', 'openrouter'] },
  'deepseek-r1': { groq: 'deepseek-r1-distill-llama-70b', openrouter: 'deepseek/deepseek-r1', preferred: ['groq', 'openrouter'] },
  'gemma-2': { groq: 'gemma2-9b-it', gemini: 'gemma-3-27b-it', openrouter: 'google/gemma-3-27b-it', preferred: ['gemini', 'groq', 'openrouter'] },
  'llama-3.3': { groq: 'llama-3.3-70b-versatile', openrouter: 'meta-llama/llama-3.3-70b-instruct', preferred: ['groq', 'openrouter'] },
};

const DEFAULT_TARGET = MODEL_MAP['gpt-5.6-luna'];

/** Generic fallback models used when the requested model's provider isn't configured. */
const GENERIC_MODEL: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  gemini: 'gemini-2.0-flash',
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'google/gemini-2.0-flash-001',
};

const env = (...names: string[]) => {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
};

const getKeys = (): Record<Provider, string | undefined> => ({
  openai: env('OPENAI_API_KEY', 'NEXT_PUBLIC_OPENAI_API_KEY'),
  anthropic: env('ANTHROPIC_API_KEY', 'NEXT_PUBLIC_ANTHROPIC_API_KEY'),
  gemini: env('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY'),
  groq: env('GROQ_API_KEY', 'NEXT_PUBLIC_GROQ_API_KEY'),
  openrouter: env('OPENROUTER_API_KEY', 'NEXT_PUBLIC_OPENROUTER_API_KEY'),
});

const ACTION_INSTRUCTIONS: Record<string, string> = {
  explain: 'Explain the topic clearly and thoroughly with intuitive examples, then summarise the key idea.',
  quiz: 'Create a short quiz (5 questions, mixed multiple-choice and short answer) followed by an answer key with brief explanations.',
  flashcards: 'Produce 8-10 flashcards as a Markdown table with columns "Front" and "Back".',
  summary: 'Give the key takeaways as a concise bulleted list, most important first.',
  takeaways: 'Give the key takeaways as a concise bulleted list, most important first.',
};

function buildSystemPrompt(taskTitle?: string, category?: string, notes?: string, action?: string) {
  const parts = [
    'You are EduSpare AI Tutor, a friendly and rigorous study assistant for university students.',
    'Answer accurately and pedagogically: define terms, show reasoning step by step, and use examples.',
    'Format all answers in Markdown. Write ALL mathematics in LaTeX: use $...$ for inline math and $$...$$ on their own lines for display equations. Never use \\( \\) or \\[ \\] delimiters and never put math inside code blocks.',
    'Use fenced code blocks with a language tag for code. Keep answers focused; avoid filler.',
  ];
  if (taskTitle) parts.push(`The student is currently working on the task "${taskTitle}" (category: ${category || 'General'}).`);
  if (notes && notes.trim()) {
    let plain = notes;
    try {
      const parsed = JSON.parse(notes);
      if (Array.isArray(parsed)) plain = parsed.map((p: any) => `## ${p.title}\n${p.content}`).join('\n\n');
    } catch {
      /* plain-text notes */
    }
    parts.push(`The student's current study notes (for context, may be incomplete):\n"""\n${plain.slice(0, 6000)}\n"""`);
  }
  if (action && ACTION_INSTRUCTIONS[action]) parts.push(`Requested mode: ${ACTION_INSTRUCTIONS[action]}`);
  return parts.join('\n\n');
}

function sanitizeHistory(raw: unknown): HistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryMessage[] = [];
  for (const m of raw.slice(-20)) {
    const role = m?.role === 'assistant' || m?.sender === 'ai' ? 'assistant' : m?.role === 'user' || m?.sender === 'user' ? 'user' : null;
    const content = typeof m?.content === 'string' ? m.content : typeof m?.text === 'string' ? m.text : '';
    if (role && content.trim()) out.push({ role, content: content.slice(0, 8000) });
  }
  // Providers require alternating roles starting with user – drop leading assistant messages.
  while (out.length && out[0].role === 'assistant') out.shift();
  return out;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`Timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t!);
  }
}

/* ------------------------------------------------------------------ */
/* Provider adapters                                                   */
/* ------------------------------------------------------------------ */

async function callOpenAICompatible(
  url: string,
  key: string,
  model: string,
  system: string,
  messages: HistoryMessage[],
  extraHeaders: Record<string, string> = {}
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...extraHeaders },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  let text: string = data.choices?.[0]?.message?.content ?? '';
  // Reasoning models (DeepSeek R1) may wrap their chain of thought in <think> tags.
  text = text.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();
  if (!text) throw new Error('Empty completion');
  return text;
}

async function callAnthropic(key: string, model: string, system: string, messages: HistoryMessage[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, system, messages, max_tokens: 2048, temperature: 0.4 }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || [])
    .filter((c: any) => c.type === 'text')
    .map((c: any) => c.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Empty completion');
  return text;
}

async function callGemini(key: string, model: string, system: string, messages: HistoryMessage[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    }
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((p: any) => p.text || '')
    .join('')
    .trim();
  if (!text) throw new Error(data.promptFeedback?.blockReason ? `Blocked: ${data.promptFeedback.blockReason}` : 'Empty completion');
  return text;
}

async function callProvider(provider: Provider, key: string, model: string, system: string, messages: HistoryMessage[]) {
  switch (provider) {
    case 'openai':
      return callOpenAICompatible('https://api.openai.com/v1/chat/completions', key, model, system, messages);
    case 'groq':
      return callOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', key, model, system, messages);
    case 'openrouter':
      return callOpenAICompatible('https://openrouter.ai/api/v1/chat/completions', key, model, system, messages, {
        'HTTP-Referer': env('NEXT_PUBLIC_APP_URL') || 'https://eduspare.app',
        'X-Title': 'EduSpare AI Tutor',
      });
    case 'anthropic':
      return callAnthropic(key, model, system, messages);
    case 'gemini':
      return callGemini(key, model, system, messages);
  }
}

/* ------------------------------------------------------------------ */

export async function GET() {
  const keys = getKeys();
  const providers = (Object.keys(keys) as Provider[]).filter((p) => !!keys[p]);
  return NextResponse.json({ configured: providers.length > 0, providers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, action, taskTitle, category, notes, history } = body;
    const modelId: string = typeof body.model === 'string' ? body.model : 'gpt-5.6-luna';

    const userPrompt = (prompt || '').toString().trim();
    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const keys = getKeys();
    const configured = (Object.keys(keys) as Provider[]).filter((p) => !!keys[p]);

    if (configured.length === 0) {
      return NextResponse.json(
        {
          error: 'AI Tutor is not configured.',
          result:
            '**AI Tutor is not connected yet.**\n\nAdd at least one API key to `.env.local` on the server and restart:\n\n' +
            '- `GROQ_API_KEY` (free — Llama / DeepSeek / Gemma)\n- `GEMINI_API_KEY` (free tier — Gemini)\n- `OPENAI_API_KEY`\n- `ANTHROPIC_API_KEY`\n- `OPENROUTER_API_KEY` (all models)\n\n' +
            'See `.env.example` for details.',
        },
        { status: 503 }
      );
    }

    const target = MODEL_MAP[modelId] || DEFAULT_TARGET;
    const system = buildSystemPrompt(taskTitle, category, notes, action);
    const messages: HistoryMessage[] = [...sanitizeHistory(history)];
    // Ensure the latest user prompt is the final message exactly once.
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user' || last.content !== userPrompt) {
      if (last && last.role === 'user') messages.push({ role: 'assistant', content: '(no response)' });
      messages.push({ role: 'user', content: userPrompt });
    }

    // Try the model's preferred providers in order, then any other configured provider.
    const order: Provider[] = [
      ...target.preferred.filter((p) => keys[p]),
      ...configured.filter((p) => !target.preferred.includes(p)),
    ];

    const errors: string[] = [];
    for (const provider of order) {
      const key = keys[provider]!;
      const providerModel = (target[provider] as string | undefined) || GENERIC_MODEL[provider];
      try {
        const text = await withTimeout(callProvider(provider, key, providerModel, system, messages), 45_000);
        return NextResponse.json({ result: text, provider, model: providerModel, requestedModel: modelId });
      } catch (err: any) {
        const msg = `${provider}/${providerModel}: ${String(err?.message || err).slice(0, 300)}`;
        console.warn('[ai-tutor]', msg);
        errors.push(msg);
      }
    }

    return NextResponse.json(
      {
        error: 'All configured AI providers failed.',
        result:
          '**Sorry, I could not reach the AI service right now.**\n\n' +
          'Please try again in a moment or switch to another model from the ⋮ menu.' +
          (process.env.NODE_ENV !== 'production' ? `\n\n\`\`\`\n${errors.join('\n')}\n\`\`\`` : ''),
        details: errors,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error('AI Tutor Route Error:', error);
    return NextResponse.json({ error: 'AI Tutor service encountered an error' }, { status: 500 });
  }
}
