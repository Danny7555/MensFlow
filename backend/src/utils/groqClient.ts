import { logAIInteraction, AIFeature } from './aiLogger';
import { CircuitBreaker } from './circuitBreaker';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const groqBreaker = new CircuitBreaker({
  name: 'groq-api',
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
});

export interface GroqCallParams {
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  maxTokens: number;
  model?: string;
}

export interface GroqCallResult {
  content: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  success: boolean;
  error?: string;
  latencyMs: number;
  model: string;
}

export async function callGroq(params: GroqCallParams): Promise<GroqCallResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      content: null,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      success: false,
      error: 'GROQ_API_KEY not configured',
      latencyMs: 0,
      model: params.model || 'llama-3.3-70b-versatile',
    };
  }

  const model = params.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const start = Date.now();

  try {
    const response = await groqBreaker.call(() => fetch(GROQ_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
      signal: AbortSignal.timeout(30000),
    }));

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: null,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        latencyMs,
        model,
      };
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const content = data?.choices?.[0]?.message?.content?.trim() || null;
    const usage = data?.usage;
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = usage?.total_tokens ?? 0;

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens,
      success: true,
      latencyMs,
      model,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    return {
      content: null,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      success: false,
      error: error?.message || String(error),
      latencyMs,
      model,
    };
  }
}

export async function callGroqWithLogging(
  feature: AIFeature,
  userId: string | undefined,
  params: GroqCallParams,
): Promise<GroqCallResult> {
  const result = await callGroq(params);

  logAIInteraction({
    feature,
    userId,
    model: result.model,
    success: result.success,
    error: result.error,
    latencyMs: result.latencyMs,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
  });

  return result;
}
