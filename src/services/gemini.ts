import type { GeminiChatMessage, ModelOption } from '../types/graph';

export const DEFAULT_PRESET_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fastest, highly cost-effective model optimized for low-latency ideation and rapid branching.',
    badge: 'Fast & Versatile',
    category: 'fast',
    recommendedFor: 'fork',
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
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Massive 2M token context window, deep analytical capability across long documents.',
    badge: 'Long Context',
    category: 'pro',
    recommendedFor: 'all',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'High frequency and lightweight reasoning for quick iterations.',
    badge: 'Lightweight',
    category: 'fast',
    recommendedFor: 'chat',
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
        const isPro = id.includes('pro');
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
}

/**
 * Generates response using Google Gemini API or provides rich simulation fallback if no key is configured.
 */
export async function generateGeminiResponse(
  options: GenerateGeminiOptions
): Promise<{ text: string; tokens?: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number } }> {
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

  const endpointModel = model.replace('models/', '');
  const url = `${GEMINI_API_BASE_URL}/models/${endpointModel}:generateContent?key=${apiKey.trim()}`;

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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Gemini API Error (HTTP ${response.status}): ${response.statusText}`;
    throw new Error(message);
  }

  const result = await response.json();
  const candidate = result.candidates?.[0];
  const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';

  if (onStreamChunk) {
    onStreamChunk(text, text);
  }

  const usage = result.usageMetadata;
  return {
    text: text.trim(),
    tokens: usage ? {
      promptTokens: usage.promptTokenCount,
      candidatesTokens: usage.candidatesTokenCount,
      totalTokens: usage.totalTokenCount,
    } : undefined,
  };
}

async function simulateBranchResponse(
  messages: GeminiChatMessage[],
  model: string,
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<{ text: string }> {
  const lastMessage = messages[messages.length - 1];
  const lastUserText = lastMessage?.parts[0]?.text || '';
  const isMerge = lastUserText.includes('synthesizing conclusions') || lastUserText.includes('User Synthesis Goal');

  let generatedText = '';

  if (isMerge) {
    generatedText = `### Unified Synthesis & Resolution

Synthesizing the explored branches using **${model}**:

1. **Strategic Synergy**:
   - The selected branches offer complementary trade-offs. While one path optimizes for rapid execution and low overhead, the other provides robustness and deep architectural resilience.
   - By decoupling the data ingestion tier while maintaining unified storage, both goals can be satisfied concurrently.

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

  return { text: generatedText };
}
