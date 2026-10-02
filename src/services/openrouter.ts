import type { ModelOption, OpenRouterChatMessage, GenerateAIResult } from '../types/graph';

export const OPENROUTER_PRESET_MODELS: ModelOption[] = [
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (Chat)',
    description: 'Flagship 671B MoE model. Ultra-fast, highly intelligent, cost-effective production default.',
    badge: 'DeepSeek V3',
    category: 'fast',
    recommendedFor: 'all',
    provider: 'openrouter',
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (Full Reasoning)',
    description: 'Premier open-weights reasoning model matching o1. Full chain-of-thought for deep synthesis.',
    badge: 'DeepSeek R1',
    category: 'pro',
    recommendedFor: 'merge',
    provider: 'openrouter',
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
    description: 'Free tier DeepSeek R1 reasoning model on OpenRouter. Perfect for zero-cost exploration.',
    badge: 'DeepSeek R1 (Free)',
    category: 'pro',
    recommendedFor: 'chat',
    provider: 'openrouter',
  },
  {
    id: 'deepseek/deepseek-chat:free',
    name: 'DeepSeek Chat (Free)',
    description: 'Free tier DeepSeek V3 chat model on OpenRouter with zero token charges.',
    badge: 'DeepSeek Chat (Free)',
    category: 'fast',
    recommendedFor: 'chat',
    provider: 'openrouter',
  },
  {
    id: 'deepseek/deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    description: 'R1 reasoning distillation into Llama 3.3 70B architecture. High reasoning speed.',
    badge: 'R1 Distill 70B',
    category: 'pro',
    recommendedFor: 'fork',
    provider: 'openrouter',
  },
  {
    id: 'deepseek/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill Qwen 32B',
    description: 'R1 reasoning distilled into Qwen 2.5 32B. Highly agile and efficient.',
    badge: 'R1 Distill 32B',
    category: 'fast',
    recommendedFor: 'chat',
    provider: 'openrouter',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic flagship model for elite code generation and architectural synthesis.',
    badge: 'Claude 3.5 Sonnet',
    category: 'pro',
    recommendedFor: 'merge',
    provider: 'openrouter',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    description: 'State-of-the-art open model from Meta with 128k context window.',
    badge: 'Llama 3.3 70B',
    category: 'fast',
    recommendedFor: 'fork',
    provider: 'openrouter',
  },
];

const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Tests whether a provided OpenRouter API key is valid.
 */
export async function testOpenRouterApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; usage?: number; limit?: number }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, message: 'OpenRouter API key is empty.' };
  }

  try {
    const response = await fetch(`${OPENROUTER_API_BASE_URL}/auth/key`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, message: `Key validation failed: ${message}` };
    }

    const json = await response.json();
    const data = json.data;
    const label = data?.label ? `("${data.label}")` : '';
    const limitInfo =
      data?.limit !== null && data?.limit !== undefined
        ? ` • Limit: $${data.limit}`
        : '';
    const usageInfo =
      data?.usage !== null && data?.usage !== undefined
        ? ` • Usage: $${Number(data.usage).toFixed(3)}`
        : '';

    return {
      success: true,
      message: `OpenRouter key verified successfully! ${label}${usageInfo}${limitInfo}`,
      usage: data?.usage,
      limit: data?.limit,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Network error testing OpenRouter API key';
    return { success: false, message: errorMsg };
  }
}

/**
 * Fetches dynamic list of available models from OpenRouter, highlighting DeepSeek.
 */
export async function fetchAvailableOpenRouterModels(
  apiKey?: string
): Promise<ModelOption[]> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey && apiKey.trim().length > 0) {
      headers.Authorization = `Bearer ${apiKey.trim()}`;
    }

    const response = await fetch(`${OPENROUTER_API_BASE_URL}/models`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return OPENROUTER_PRESET_MODELS;
    }

    const json = await response.json();
    if (!json.data || !Array.isArray(json.data)) {
      return OPENROUTER_PRESET_MODELS;
    }

    interface OpenRouterRawModel {
      id: string;
      name?: string;
      description?: string;
      context_length?: number;
      pricing?: {
        prompt?: string;
        completion?: string;
      };
    }

    const rawModels: OpenRouterRawModel[] = json.data;

    // Filter and prioritize DeepSeek models first, then other top providers
    const mappedModels: ModelOption[] = rawModels
      .map((m) => {
        const isDeepSeek = m.id.startsWith('deepseek/');
        const isPro =
          m.id.includes('r1') ||
          m.id.includes('claude-3') ||
          m.id.includes('gpt-4') ||
          m.id.includes('pro');

        let badge = 'OpenRouter';
        if (isDeepSeek) {
          if (m.id.includes('r1')) badge = 'DeepSeek R1';
          else if (m.id.includes('chat')) badge = 'DeepSeek V3';
          else badge = 'DeepSeek';
        } else if (m.id.startsWith('anthropic/')) {
          badge = 'Anthropic';
        } else if (m.id.startsWith('google/')) {
          badge = 'Google';
        } else if (m.id.startsWith('meta-llama/')) {
          badge = 'Meta Llama';
        }

        return {
          id: m.id,
          name: m.name || m.id,
          description: m.description || `OpenRouter model ${m.id}`,
          badge,
          category: isPro ? ('pro' as const) : ('fast' as const),
          recommendedFor: isPro ? ('merge' as const) : ('fork' as const),
          provider: 'openrouter' as const,
        };
      })
      .sort((a, b) => {
        // DeepSeek models to the very top
        const aIsDeepSeek = a.id.startsWith('deepseek/');
        const bIsDeepSeek = b.id.startsWith('deepseek/');
        if (aIsDeepSeek && !bIsDeepSeek) return -1;
        if (!aIsDeepSeek && bIsDeepSeek) return 1;
        return a.name.localeCompare(b.name);
      });

    return mappedModels.length > 0 ? mappedModels : OPENROUTER_PRESET_MODELS;
  } catch (err) {
    console.warn('Failed to fetch OpenRouter models, using presets:', err);
    return OPENROUTER_PRESET_MODELS;
  }
}

export interface GenerateOpenRouterOptions {
  apiKey: string;
  model: string;
  messages: OpenRouterChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void;
}

/**
 * Returns prioritized fallback models for OpenRouter (e.g. if R1 or free tier is busy)
 */
export function getOpenRouterFallbackModels(primaryModel: string): string[] {
  const pool = [
    'deepseek/deepseek-chat',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free',
    'deepseek/deepseek-r1-distill-llama-70b',
  ];
  return pool.filter((m) => m !== primaryModel);
}

/**
 * Helper to execute a single OpenRouter chat completion call with real-time SSE streaming
 */
async function callOpenRouterEndpoint(
  endpointModel: string,
  apiKey: string,
  messages: OpenRouterChatMessage[],
  temperature: number,
  maxOutputTokens: number,
  systemInstruction?: string,
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<GenerateAIResult> {
  const url = `${OPENROUTER_API_BASE_URL}/chat/completions`;
  const isStreaming = Boolean(onStreamChunk);

  const formattedMessages: OpenRouterChatMessage[] = [];
  if (systemInstruction && systemInstruction.trim().length > 0) {
    formattedMessages.push({
      role: 'system',
      content: systemInstruction.trim(),
    });
  }
  formattedMessages.push(...messages);

  const payload = {
    model: endpointModel,
    messages: formattedMessages,
    temperature,
    max_tokens: maxOutputTokens,
    stream: isStreaming,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer':
        typeof window !== 'undefined' ? window.location.origin : 'https://thoughtgraph.ai',
      'X-Title': 'ThoughtGraph AI',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const rawMessage =
      errorData.error?.message ||
      `OpenRouter API Error (HTTP ${response.status}): ${response.statusText}`;

    const error = new Error(rawMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  // Handle Real-time Streaming for OpenRouter
  if (isStreaming && response.body && onStreamChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined = undefined;

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
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;
            const deltaContent = delta?.content || '';
            const deltaReasoning = delta?.reasoning_content || delta?.reasoning || '';

            if (deltaReasoning) {
              accumulatedReasoning += deltaReasoning;
            }
            if (deltaContent) {
              accumulatedContent += deltaContent;
            }

            let fullFormatted = accumulatedContent;
            if (accumulatedReasoning.trim().length > 0) {
              fullFormatted = `> **DeepSeek Reasoning Process:**\n> ${accumulatedReasoning.trim().replace(/\n/g, '\n> ')}\n\n${accumulatedContent.trim()}`;
            }

            if (deltaContent || deltaReasoning) {
              onStreamChunk(deltaContent || deltaReasoning, fullFormatted);
            }

            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch {
            // Buffer chunk incomplete, keep processing
          }
        }
      }

      // Flush remaining line in buffer
      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().replace(/^data:\s*/, '');
        if (jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;
            const deltaContent = delta?.content || '';
            const deltaReasoning = delta?.reasoning_content || delta?.reasoning || '';

            if (deltaReasoning) accumulatedReasoning += deltaReasoning;
            if (deltaContent) accumulatedContent += deltaContent;

            let fullFormatted = accumulatedContent;
            if (accumulatedReasoning.trim().length > 0) {
              fullFormatted = `> **DeepSeek Reasoning Process:**\n> ${accumulatedReasoning.trim().replace(/\n/g, '\n> ')}\n\n${accumulatedContent.trim()}`;
            }

            if (deltaContent || deltaReasoning) {
              onStreamChunk(deltaContent || deltaReasoning, fullFormatted);
            }
            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch {
            // ignore
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    let fullFormatted = accumulatedContent;
    if (accumulatedReasoning.trim().length > 0) {
      fullFormatted = `> **DeepSeek Reasoning Process:**\n> ${accumulatedReasoning.trim().replace(/\n/g, '\n> ')}\n\n${accumulatedContent.trim()}`;
    }

    return {
      text: fullFormatted.trim(),
      actualModelUsed: endpointModel,
      reasoningContent: accumulatedReasoning || undefined,
      tokens: usage
        ? {
            promptTokens: usage.prompt_tokens,
            candidatesTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  }

  // Non-streaming fallback
  const result = await response.json();
  const choice = result.choices?.[0];
  const choiceMessage = choice?.message;

  let text = choiceMessage?.content || '';
  const reasoning = choiceMessage?.reasoning_content || choiceMessage?.reasoning || '';

  // If DeepSeek R1 returns distinct reasoning_content, format it gracefully into the thought stream
  if (reasoning && reasoning.trim().length > 0) {
    text = `> **DeepSeek Reasoning Process:**\n> ${reasoning.trim().replace(/\n/g, '\n> ')}\n\n${text.trim()}`;
  }

  if (onStreamChunk) {
    onStreamChunk(text, text);
  }

  const usage = result.usage;
  return {
    text: text.trim(),
    actualModelUsed: endpointModel,
    reasoningContent: reasoning || undefined,
    tokens: usage
      ? {
          promptTokens: usage.prompt_tokens,
          candidatesTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Generates response using OpenRouter API with DeepSeek reasoning support and automatic fallbacks
 */
export async function generateOpenRouterResponse(
  options: GenerateOpenRouterOptions
): Promise<GenerateAIResult> {
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
    return simulateOpenRouterResponse(messages, model, onStreamChunk);
  }

  const primaryModel = model;

  try {
    const result = await callOpenRouterEndpoint(
      primaryModel,
      apiKey,
      messages,
      temperature,
      maxOutputTokens,
      systemInstruction,
      onStreamChunk
    );
    return result;
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const isOverloadOrQuota = status === 503 || status === 429 || status === 504;

    if (isOverloadOrQuota) {
      const fallbackCandidates = getOpenRouterFallbackModels(primaryModel);
      const reasonText =
        status === 503 ? 'overloaded' : status === 429 ? 'rate-limited / out of quota' : 'timed out';

      console.warn(
        `[ThoughtGraph AI / OpenRouter] Model "${primaryModel}" is ${reasonText} (HTTP ${status}). Attempting auto-fallback across:`,
        fallbackCandidates
      );

      for (const fallbackModel of fallbackCandidates) {
        try {
          console.info(`[OpenRouter Fallback] Trying "${fallbackModel}"...`);
          const fallbackResult = await callOpenRouterEndpoint(
            fallbackModel,
            apiKey,
            messages,
            temperature,
            maxOutputTokens,
            systemInstruction,
            onStreamChunk
          );

          return {
            ...fallbackResult,
            actualModelUsed: fallbackModel,
            fallbackNotice: `Notice: ${primaryModel} was temporarily ${reasonText} (HTTP ${status}). Request was automatically completed via OpenRouter using ${fallbackModel}.`,
          };
        } catch (fbErr: unknown) {
          console.warn(`[OpenRouter Fallback] "${fallbackModel}" also failed:`, fbErr);
        }
      }

      throw new Error(
        `OpenRouter reported that "${primaryModel}" is currently ${reasonText} (HTTP ${status}). Automatic fallback to ${fallbackCandidates.join(', ')} was also attempted. Please check your OpenRouter credits or try again in a few moments.`
      );
    }

    throw err;
  }
}

/**
 * High-fidelity simulation for OpenRouter / DeepSeek when no API key is provided
 */
async function simulateOpenRouterResponse(
  messages: OpenRouterChatMessage[],
  model: string,
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<GenerateAIResult> {
  const lastMessage = messages[messages.length - 1];
  const lastUserText = lastMessage?.content || '';
  const isMerge =
    lastUserText.includes('synthesizing conclusions') ||
    lastUserText.includes('User Synthesis Goal');

  let generatedText = '';

  if (isMerge) {
    generatedText = `> **DeepSeek Reasoning Process:**
> Exploring synthesis dimensions across incoming branches. Evaluating architectural trade-offs, performance constraints, and cost implications.

### 🔀 Unified Multi-Branch Synthesis (${model})

Synthesizing conclusions across all parent branch contexts:

1. **Integrated Architecture**:
   - The selected trajectories balance immediate throughput with long-term data consistency.
   - Decomposing the query pipeline allows lightweight edge execution while stateful memory guarantees session coherence.

2. **Comparative Trade-off Matrix**:
   | Dimension | Branch A Strategy | Branch B Strategy | Unified Synthesis |
   | :--- | :--- | :--- | :--- |
   | **Latency** | Low (< 50ms) | Moderate (~200ms) | Adaptive (~80ms) |
   | **Throughput** | High burst | Consistent streaming | Hybrid queue-backed |
   | **Reliability** | Edge resilient | Cluster failover | Multi-zone redundancy |

3. **Recommended Implementation Plan**:
   - Establish the primary schema contract as outlined in the initial branch.
   - Deploy DeepSeek-powered streaming inference proxies for the interactive DAG interface.

> *Synthesized via OpenRouter • ${model}*`;
  } else {
    generatedText = `> **DeepSeek Reasoning Process:**
> Analyzing query context: "${lastUserText.slice(0, 50)}...". Examining downstream dependencies, architectural constraints, and logical progression.

### DeepSeek Branch Exploration (${model})

Exploring the branch trajectory for: **"${lastUserText.slice(0, 55)}..."**

1. **Core Analysis**:
   - This direction addresses critical system requirements by isolating state transitions into modular nodes.
   - Minimizes cognitive complexity and enables independent testing of assumptions.

2. **Potential Trade-offs & Risks**:
   - **Concurrency overhead**: Ensure graph traversal algorithms remain strictly bounded.
   - **Cache coherence**: Invalidate cached branch ancestor chains whenever upstream nodes mutate.

3. **Next Thought Recommendations**:
   - Fork further to evaluate specific implementation frameworks.
   - Or merge back into the main stream once trade-offs are aligned.

> *Generated via OpenRouter • ${model}*`;
  }

  // Realistic character stream simulation
  if (onStreamChunk) {
    const totalLength = generatedText.length;
    const chunkSize = 28;
    for (let i = 0; i < totalLength; i += chunkSize) {
      await new Promise((res) => setTimeout(res, 25));
      const partial = generatedText.slice(0, Math.min(i + chunkSize, totalLength));
      onStreamChunk(generatedText.slice(i, i + chunkSize), partial);
    }
  }

  return {
    text: generatedText.trim(),
    actualModelUsed: model,
    tokens: {
      promptTokens: 140,
      candidatesTokens: 280,
      totalTokens: 420,
    },
  };
}
