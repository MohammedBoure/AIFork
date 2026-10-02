import type { GeminiChatMessage, ModelOption } from '../types/graph';

export const DEFAULT_PRESET_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Most reliable, fastest production model. Highly resilient against server overload.',
    badge: 'Fast & Stable',
    category: 'fast',
    recommendedFor: 'all',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    description: 'Latest hybrid reasoning model. Free tier has limited quota & high load (auto-recovers via 2.5 Flash on 503/429).',
    badge: 'Reasoning (High Load)',
    category: 'pro',
    recommendedFor: 'chat',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning, deep synthesis, and complex multi-perspective resolution.',
    badge: 'Deep Reasoning',
    category: 'pro',
    recommendedFor: 'merge',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Next-gen multimodal, ultra-fast generation suitable for continuous tree expansions.',
    badge: 'Ultra Fast',
    category: 'fast',
    recommendedFor: 'chat',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'High availability fallback model with low latency and global distribution.',
    badge: 'High Availability',
    category: 'fast',
    recommendedFor: 'fork',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Massive 2M token context window for long-context analysis.',
    badge: 'Long Context',
    category: 'pro',
    recommendedFor: 'all',
  },
];

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Tests whether a provided Google Gemini API key is valid.
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string; modelCount?: number }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, message: 'API key is empty.' };
  }

  try {
    const response = await fetch(`${GEMINI_API_BASE_URL}/models?key=${apiKey.trim()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, message };
    }

    const data = await response.json();
    const count = data.models?.length || 0;
    return {
      success: true,
      message: `Key verified successfully! Found ${count} available Gemini models.`,
      modelCount: count,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error testing API key';
    return { success: false, message: errorMsg };
  }
}

/**
 * Fetches dynamic list of available models from Google Gemini API.
 */
export async function fetchAvailableGeminiModels(apiKey: string): Promise<ModelOption[]> {
  if (!apiKey) return DEFAULT_PRESET_MODELS;

  try {
    const response = await fetch(`${GEMINI_API_BASE_URL}/models?key=${apiKey.trim()}`);
    if (!response.ok) {
      return DEFAULT_PRESET_MODELS;
    }

    const data = await response.json();
    if (!data.models || !Array.isArray(data.models)) {
      return DEFAULT_PRESET_MODELS;
    }

    const genModels: ModelOption[] = data.models
      .filter((m: { name?: string; supportedGenerationMethods?: string[] }) => {
        return (
          m.name?.includes('gemini') &&
          m.supportedGenerationMethods?.includes('generateContent')
        );
      })
      .map((m: { name: string; displayName?: string; description?: string }) => {
        const id = m.name.replace('models/', '');
        const isPro = id.includes('pro') || id.includes('3.7');
        return {
          id,
          name: m.displayName || id,
          description: m.description || `Google Gemini model ${id}`,
          badge: isPro ? 'Reasoning' : 'General',
          category: isPro ? ('pro' as const) : ('fast' as const),
          recommendedFor: isPro ? ('merge' as const) : ('fork' as const),
        };
      });

    return genModels.length > 0 ? genModels : DEFAULT_PRESET_MODELS;
  } catch (err) {
    console.warn('Failed to fetch remote models, falling back to presets:', err);
    return DEFAULT_PRESET_MODELS;
  }
}

export interface GenerateGeminiOptions {
  apiKey: string;
  model: string;
  messages: GeminiChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void;
  maxRetries?: number;
}

export interface GenerateGeminiResult {
  text: string;
  actualModelUsed?: string;
  fallbackNotice?: string;
  tokens?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Helper to execute a direct call to a specific model endpoint with real-time SSE streaming
 */
async function callGeminiEndpoint(
  endpointModel: string,
  apiKey: string,
  payload: Record<string, unknown>,
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<GenerateGeminiResult> {
  const cleanModel = endpointModel.replace('models/', '');
  const isStreaming = Boolean(onStreamChunk);
  const action = isStreaming ? 'streamGenerateContent?alt=sse&key=' : 'generateContent?key=';
  const url = `${GEMINI_API_BASE_URL}/models/${cleanModel}:${action}${apiKey.trim()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const rawMessage = errorData.error?.message || '';

    const error = new Error(
      rawMessage || `Gemini API Error (HTTP ${response.status}): ${response.statusText}`
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  // Handle Real-time SSE Streaming
  if (isStreaming && response.body && onStreamChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined = undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const candidate = parsed.candidates?.[0];
            const chunkText =
              candidate?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';

            if (chunkText) {
              accumulatedText += chunkText;
              onStreamChunk(chunkText, accumulatedText);
            }

            if (parsed.usageMetadata) {
              usage = parsed.usageMetadata;
            }
          } catch {
            // Buffer chunk was partial, will be resolved with next lines
          }
        }
      }

      // Flush remaining line in buffer
      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().replace(/^data:\s*/, '');
        try {
          const parsed = JSON.parse(jsonStr);
          const candidate = parsed.candidates?.[0];
          const chunkText =
            candidate?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';

          if (chunkText) {
            accumulatedText += chunkText;
            onStreamChunk(chunkText, accumulatedText);
          }
          if (parsed.usageMetadata) {
            usage = parsed.usageMetadata;
          }
        } catch {
          // ignore
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      text: accumulatedText.trim(),
      actualModelUsed: cleanModel,
      tokens: usage
        ? {
            promptTokens: usage.promptTokenCount,
            candidatesTokens: usage.candidatesTokenCount,
            totalTokens: usage.totalTokenCount,
          }
        : undefined,
    };
  }

  // Standard non-streaming fallback
  const result = await response.json();
  const candidate = result.candidates?.[0];
  const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';

  if (onStreamChunk) {
    onStreamChunk(text, text);
  }

  const usage = result.usageMetadata;
  return {
    text: text.trim(),
    actualModelUsed: cleanModel,
    tokens: usage
      ? {
          promptTokens: usage.promptTokenCount,
          candidatesTokens: usage.candidatesTokenCount,
          totalTokens: usage.totalTokenCount,
        }
      : undefined,
  };
}

/**
 * Returns prioritized fallback models when a model fails with 503 (Overloaded) or 429 (Quota / Rate-Limited).
 */
export function getFallbackModels(primaryModel: string): string[] {
  const clean = primaryModel.replace('models/', '');
  const candidatePool = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  return candidatePool.filter((m) => m !== clean);
}

/**
 * Generates response using Google Gemini API with immediate, intelligent 503 & 429 fallback cascades
 */
export async function generateGeminiResponse(
  options: GenerateGeminiOptions
): Promise<GenerateGeminiResult> {
  const {
    apiKey,
    model,
    messages,
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 2048,
    onStreamChunk,
  } = options;

  if (!apiKey || apiKey.trim().length === 0) {
    return simulateBranchResponse(messages, model, onStreamChunk);
  }

  const primaryModel = model.replace('models/', '');
  const payload: Record<string, unknown> = {
    contents: messages,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  if (systemInstruction && systemInstruction.trim().length > 0) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction.trim() }],
    };
  }

  // 1. Attempt generation with the user's primary selected model
  try {
    const result = await callGeminiEndpoint(primaryModel, apiKey, payload, onStreamChunk);
    return result;
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const isOverloadOrQuota = status === 503 || status === 429;

    // If HTTP 503 (Server Overloaded) or HTTP 429 (Resource Exhausted / Rate-Limited):
    // DO NOT retry the same failing model endpoint. Repeating requests to an overloaded or
    // rate-limited model exacerbates quota exhaustion and triggers cascading 429s.
    // Instead, immediately cascade to proven stable fallback models (e.g. gemini-2.5-flash).
    if (isOverloadOrQuota) {
      const fallbackCandidates = getFallbackModels(primaryModel);
      const failureReason =
        status === 503 ? 'temporarily overloaded (HTTP 503)' : 'rate-limited / out of quota (HTTP 429)';

      console.warn(
        `[ThoughtGraph AI] Model "${primaryModel}" is ${failureReason}. Commencing automatic fallback cascade across:`,
        fallbackCandidates
      );

      for (const fallbackModel of fallbackCandidates) {
        try {
          console.info(`[ThoughtGraph AI] Attempting fallback with "${fallbackModel}"...`);
          const fallbackResult = await callGeminiEndpoint(
            fallbackModel,
            apiKey,
            payload,
            onStreamChunk
          );

          return {
            ...fallbackResult,
            actualModelUsed: fallbackModel,
            fallbackNotice: `Notice: ${primaryModel} was ${failureReason}. Response was automatically generated using ${fallbackModel}.`,
          };
        } catch (fbErr: unknown) {
          console.warn(`[ThoughtGraph AI] Fallback to "${fallbackModel}" failed:`, fbErr);
        }
      }

      // If all fallbacks failed
      const statusLabel = status === 503 ? 'Overloaded (HTTP 503)' : 'Quota / Rate Limited (HTTP 429)';
      throw new Error(
        `Google Gemini servers reported that "${primaryModel}" is ${statusLabel}. Automatic fallback to ${fallbackCandidates.join(', ')} was also attempted. Please check your Gemini API quota or retry in a few moments.`
      );
    }

    // If it's a transient network gateway error (502, 504) or undefined network drop, perform one brief retry
    if (status === 502 || status === 504 || typeof status === 'undefined') {
      await new Promise((res) => setTimeout(res, 1000));
      return await callGeminiEndpoint(primaryModel, apiKey, payload, onStreamChunk);
    }

    // For 400, 403, or other explicit API rejections, rethrow immediately
    throw err;
  }
}

async function simulateBranchResponse(
  messages: GeminiChatMessage[],
  model: string,
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<GenerateGeminiResult> {
  const lastMessage = messages[messages.length - 1];
  const lastUserText = lastMessage?.parts[0]?.text || '';
  const isMerge = lastUserText.includes('synthesizing conclusions') || lastUserText.includes('User Synthesis Goal');

  let generatedText = '';

  if (isMerge) {
    generatedText = `### Unified Synthesis & Resolution

Synthesizing the explored branches using **${model}**:

1. **Strategic Synergy**:
   - The selected branches offer complementary trade-offs. While one path optimizes for rapid execution and low overhead, the other provides robustness and deep architectural resilience.
   - Decoupling the data ingestion tier while maintaining unified storage satisfies both requirements concurrently.

2. **Comparative Trade-offs**:
   | Attribute | Branch A (Rapid Path) | Branch B (Resilient Path) | Unified Hybrid |
   | :--- | :--- | :--- | :--- |
   | **Latency** | < 100ms | ~250ms | ~120ms |
   | **Operational Cost** | Minimal | Medium | Optimized tiering |
   | **Scalability** | Single-region | Distributed | Multi-zone failover |

3. **Recommended Execution Path**:
   - Adopt the modular interface from the first branch as the immediate MVP foundation.
   - Implement the observability and failover mechanisms from the second branch before public rollout.

> *Synthesized via ${model} across all parent branch contexts.*`;
  } else {
    generatedText = `### Branch Analysis: Exploring "${lastUserText.slice(0, 45)}..."

Generated via **${model}**:

1. **Key Insights**:
   - This branch directly tackles the core trade-off presented in the parent context.
   - Decomposing this into discrete stages allows for rapid testing and targeted feedback loops.

2. **Actionable Perspectives**:
   - **Hypothesis**: Verifying user demand with a low-fidelity interactive prototype.
   - **Architecture**: Keeping state localized in client storage before introducing distributed database replication.

\`\`\`typescript
// Suggested Branch Implementation Pattern
interface BranchResult {
  status: 'valid' | 'needs_iteration';
  confidenceScore: number;
}
\`\`\`

> *Tip: You can fork further from here to evaluate alternative implementations or merge with parallel branches.*`;
  }

  let accumulated = '';
  const words = generatedText.split(' ');
  for (const word of words) {
    accumulated += (accumulated ? ' ' : '') + word;
    if (onStreamChunk) {
      onStreamChunk(word + ' ', accumulated);
    }
    await new Promise((res) => setTimeout(res, 20));
  }

  return { text: generatedText, actualModelUsed: model };
}
