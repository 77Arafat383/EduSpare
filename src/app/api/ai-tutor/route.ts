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

/** UI model id -> real provider model ids.
 * Tailored specifically for fast, accurate Question & Answer study without heavy agentic loops.
 */
const MODEL_MAP: Record<string, ModelTarget> = {
  // OpenAI GPT Models (Fast, reliable study Q&A)
  'gpt-4o-mini': { openrouter: 'openai/gpt-4o-mini', openai: 'gpt-4o-mini', preferred: ['openrouter', 'openai'] },
  'gpt-5.6-luna': { openrouter: 'openai/gpt-4o-mini', openai: 'gpt-4o-mini', preferred: ['openrouter', 'openai'] },
  'gpt-4o': { openrouter: 'openai/gpt-4o', openai: 'gpt-4o', preferred: ['openrouter', 'openai'] },

  // Google Gemini (Fast, smart Q&A)
  'gemini-flash': { openrouter: 'google/gemini-2.5-flash', gemini: 'gemini-3.8-flash', preferred: ['openrouter', 'gemini'] },
  'gemini-3.8-flash': { openrouter: 'google/gemini-2.5-flash', gemini: 'gemini-3.8-flash', preferred: ['openrouter', 'gemini'] },

  // Google Gemma (Pure open-source Q&A)
  'gemma': { openrouter: 'google/gemma-3-27b-it', preferred: ['openrouter'] },
  'gemma-2': { openrouter: 'google/gemma-2-27b-it', preferred: ['openrouter'] },

  // DeepSeek Chat (Direct Conversational Q&A, non-agentic)
  'deepseek-chat': { openrouter: 'deepseek/deepseek-chat', preferred: ['openrouter'] },
  'deepseek-r1': { openrouter: 'deepseek/deepseek-chat', preferred: ['openrouter'] },

  // Meta Llama 3.3 (High quality open weights Q&A)
  'llama-3.3': { openrouter: 'meta-llama/llama-3.3-70b-instruct', preferred: ['openrouter'] },

  // Groq GPT-OSS 120B (Ultra-fast Q&A on Groq hardware)
  'gpt-oss-120b': { groq: 'openai/gpt-oss-120b', openrouter: 'openai/gpt-4o-mini', preferred: ['groq', 'openrouter'] },

  // Anthropic Claude
  'claude-3.5-sonnet': { openrouter: 'anthropic/claude-sonnet-4', anthropic: 'claude-3-5-sonnet-20241022', preferred: ['openrouter', 'anthropic'] },
};

const DEFAULT_TARGET = MODEL_MAP['gpt-4o-mini'];

/** Generic fallback models used when the requested model's provider isn't configured. */
const GENERIC_MODEL: Record<Provider, string> = {
  openrouter: 'openai/gpt-4o-mini',
  groq: 'openai/gpt-oss-120b',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-3.8-flash',
  anthropic: 'claude-3-5-haiku-20241022',
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
      temperature: 0.3,
      max_tokens: 1200,
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
  const candidateModels = [
    model.startsWith('gemini') || model.startsWith('gemma') ? model : 'gemini-3.8-flash',
    'gemini-3.8-flash',
    'gemma-4-31b-it',
  ];
  const uniqueModels = Array.from(new Set(candidateModels));

  let lastError: Error | null = null;
  for (const m of uniqueModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: messages.map((msg) => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })),
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        lastError = new Error(`${res.status} [${m}] ${errorText}`);
        // If 404 or 503, try next candidate model
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const nonThoughtParts = parts.filter((p: any) => !p.thought);
      let text = (nonThoughtParts.length > 0 ? nonThoughtParts : parts)
        .map((p: any) => p.text || '')
        .join('')
        .trim();

      // Clean any residual reasoning/thought tags
      text = text
        .replace(/<thought>[\s\S]*?<\/thought>\s*/gi, '')
        .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
        .trim();

      if (text) return text;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate response from Google AI');
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
  const configured = (Object.keys(keys) as Provider[]).filter((p) => !!keys[p]);
  return NextResponse.json({
    configured: configured.length > 0,
    providers: configured,
    geminiActive: !!keys.gemini,
    openaiActive: !!keys.openai,
    groqActive: !!keys.groq,
    anthropicActive: !!keys.anthropic,
    openrouterActive: !!keys.openrouter,
    recommendedModel: keys.gemini ? 'gemini-3.8-flash' : keys.openai ? 'gpt-4o' : keys.groq ? 'llama-3.3' : 'gemini-3.8-flash',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, action, taskTitle, category, notes, history } = body;
    const modelId: string = typeof body.model === 'string' ? body.model : 'gemini-3.8-flash';

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
            '**AI Tutor is not connected yet.**\n\nAdd your API key to `.env` or `.env.local`:\n\n' +
            '- `GEMINI_API_KEY` (Free & Active on Google AI Studio)\n' +
            '- `OPENAI_API_KEY` (OpenAI GPT-4o)\n' +
            '- `GROQ_API_KEY` (Free ultra-fast Gemma & Llama)\n' +
            '- `ANTHROPIC_API_KEY` (Claude 3.5 Sonnet)\n' +
            '- `OPENROUTER_API_KEY` (Universal access)\n\n' +
            'See `.env` or `.env.example` for details.',
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
    for (let i = 0; i < order.length; i++) {
      const provider = order[i];
      const key = keys[provider]!;
      const providerModel = (target[provider] as string | undefined) || GENERIC_MODEL[provider];
      try {
        const text = await withTimeout(callProvider(provider, key, providerModel, system, messages), 45_000);
        return NextResponse.json({
          result: text,
          provider,
          model: providerModel,
          requestedModel: modelId,
          switched: i > 0,
          switchedNotice: i > 0
            ? `Auto-switched to ${provider.toUpperCase()} (${providerModel}) because primary provider hit rate/quota limits.`
            : undefined,
        });
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
          '**Rate limit reached or AI service unavailable for this model.**\n\n' +
          'You can switch to another model (such as Gemini 3.8 Flash, Gemma 2, or Llama 3.3) using the model switcher or the ⋮ menu.',
        details: errors,
      },
      { status: 502 }
    );
  } catch (error) {
    console.error('AI Tutor Route Error:', error);
    return NextResponse.json({ error: 'AI Tutor service encountered an error' }, { status: 500 });
  }
}
