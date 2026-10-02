import type {
  AppSettings,
  ThoughtFlowNode,
  GenerateAIResult,
  ModelOption,
  AIProvider,
} from '../types/graph';
import {
  resolveOpenRouterContext,
  resolveGeminiContext,
  buildOpenRouterMergePrompt,
  buildMergeSynthesisPrompt,
} from '../utils/contextResolver';
import {
  generateOpenRouterResponse,
  OPENROUTER_PRESET_MODELS,
  fetchAvailableOpenRouterModels,
} from './openrouter';
import {
  generateGeminiResponse,
  DEFAULT_PRESET_MODELS,
  fetchAvailableGeminiModels,
} from './gemini';
import { saveSettings } from './storage';

/**
 * Determines whether a given model ID should be routed to OpenRouter
 */
export function isModelOpenRouter(modelId: string, settingsProvider: string): boolean {
  if (modelId.startsWith('deepseek/') || modelId.includes('/')) {
    return true;
  }
  return settingsProvider === 'openrouter';
}

/**
 * Fetches default available models for the current active provider
 */
export function getPresetModelsForProvider(provider: string): ModelOption[] {
  if (provider === 'openrouter') {
    return OPENROUTER_PRESET_MODELS;
  }
  return DEFAULT_PRESET_MODELS;
}

/**
 * Fetches remote models from the active provider API
 */
export async function fetchRemoteModelsForProvider(
  provider: string,
  apiKey: string,
  openRouterApiKey: string
): Promise<ModelOption[]> {
  if (provider === 'openrouter') {
    return fetchAvailableOpenRouterModels(openRouterApiKey);
  }
  return fetchAvailableGeminiModels(apiKey);
}

/**
 * Detects whether an error is caused by rate limiting or quota exhaustion (HTTP 429).
 */
export function isQuotaExhaustedError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('insufficient_quota') ||
    msg.includes('credit balance is too low') ||
    msg.includes('exceeded your current quota')
  );
}

/**
 * Executes an AI operation with automatic failover to alternative configured API keys
 * if the active key exhausts its quota (HTTP 429).
 */
async function runWithQuotaFailover(
  settings: AppSettings,
  provider: AIProvider,
  executeCall: (apiKey: string) => Promise<GenerateAIResult>
): Promise<GenerateAIResult> {
  const currentKey = provider === 'openrouter' ? settings.openRouterApiKey : settings.apiKey;
  try {
    return await executeCall(currentKey);
  } catch (err: unknown) {
    if (!isQuotaExhaustedError(err) || settings.autoSwitchKeyOnQuota === false) {
      throw err;
    }

    const candidateKeys = (settings.apiKeys || []).filter(
      (k) => k.provider === provider && k.key.trim() !== currentKey.trim() && k.key.trim().length > 0
    );

    if (candidateKeys.length === 0) {
      throw err;
    }

    console.warn(`[ThoughtGraph AI] Key quota limit reached. Auto-switching across ${candidateKeys.length} alternate key(s)...`);

    let lastErr = err;
    for (const altKey of candidateKeys) {
      try {
        console.info(`[ThoughtGraph AI] Attempting fallback with key "${altKey.name}"...`);
        const result = await executeCall(altKey.key);

        // Update settings in storage
        const updatedSettings: AppSettings = {
          ...settings,
          ...(provider === 'openrouter'
            ? { openRouterApiKey: altKey.key, activeOpenRouterKeyId: altKey.id }
            : { apiKey: altKey.key, activeGeminiKeyId: altKey.id }),
        };
        saveSettings(updatedSettings);

        const switchNotice = `Notice: Primary key reached quota limits (HTTP 429). Automatically switched to key "${altKey.name}".`;
        return {
          ...result,
          fallbackNotice: result.fallbackNotice ? `${result.fallbackNotice} • ${switchNotice}` : switchNotice,
          switchedKey: altKey,
        };
      } catch (failoverErr) {
        console.warn(`[ThoughtGraph AI] Alternate key "${altKey.name}" failed:`, failoverErr);
        lastErr = failoverErr;
      }
    }

    throw lastErr;
  }
}

/**
 * Executes an AI completion for expanding a branch
 */
export async function executeAIBranchCompletion(
  settings: AppSettings,
  modelId: string,
  userNodeId: string,
  nodes: ThoughtFlowNode[],
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<GenerateAIResult> {
  const useOpenRouter = isModelOpenRouter(modelId, settings.provider);
  const provider: AIProvider = useOpenRouter ? 'openrouter' : 'gemini';

  return runWithQuotaFailover(settings, provider, async (activeKey) => {
    if (useOpenRouter) {
      const contextMessages = resolveOpenRouterContext(userNodeId, nodes);
      return generateOpenRouterResponse({
        apiKey: activeKey,
        model: modelId,
        messages: contextMessages,
        systemInstruction: settings.systemInstruction,
        temperature: settings.temperature,
        maxOutputTokens: settings.maxOutputTokens,
        onStreamChunk,
      });
    }

    // Google Gemini API
    const contextMessages = resolveGeminiContext(userNodeId, nodes);
    return generateGeminiResponse({
      apiKey: activeKey,
      model: modelId,
      messages: contextMessages,
      systemInstruction: settings.systemInstruction,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      onStreamChunk,
    });
  });
}

/**
 * Executes a multi-branch synthesis completion
 */
export async function executeAIMergeSynthesis(
  settings: AppSettings,
  modelId: string,
  selectedNodes: ThoughtFlowNode[],
  allNodes: ThoughtFlowNode[],
  synthesisPrompt: string,
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<GenerateAIResult> {
  const useOpenRouter = isModelOpenRouter(modelId, settings.provider);
  const provider: AIProvider = useOpenRouter ? 'openrouter' : 'gemini';
  const nodesMap = new Map(allNodes.map((n) => [n.id, n]));

  return runWithQuotaFailover(settings, provider, async (activeKey) => {
    if (useOpenRouter) {
      const { messages } = buildOpenRouterMergePrompt(
        selectedNodes,
        nodesMap,
        synthesisPrompt
      );
      return generateOpenRouterResponse({
        apiKey: activeKey,
        model: modelId,
        messages,
        systemInstruction: settings.systemInstruction,
        temperature: settings.temperature,
        maxOutputTokens: settings.maxOutputTokens,
        onStreamChunk,
      });
    }

    // Google Gemini API
    const { messages } = buildMergeSynthesisPrompt(
      selectedNodes,
      nodesMap,
      synthesisPrompt
    );
    return generateGeminiResponse({
      apiKey: activeKey,
      model: modelId,
      messages,
      systemInstruction: settings.systemInstruction,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      onStreamChunk,
    });
  });
}

/**
 * Executes a retry on a single failed node
 */
export async function executeAIRetry(
  settings: AppSettings,
  modelId: string,
  node: ThoughtFlowNode,
  allNodes: ThoughtFlowNode[],
  onStreamChunk?: (chunkText: string, fullAccumulatedText: string) => void
): Promise<GenerateAIResult> {
  const parentId = node.data.parentIds?.[0];
  const useOpenRouter = isModelOpenRouter(modelId, settings.provider);
  const provider: AIProvider = useOpenRouter ? 'openrouter' : 'gemini';

  return runWithQuotaFailover(settings, provider, async (activeKey) => {
    if (useOpenRouter) {
      const contextMessages = parentId
        ? resolveOpenRouterContext(parentId, allNodes)
        : [{ role: 'user' as const, content: node.data.content || 'Continue exploration' }];

      return generateOpenRouterResponse({
        apiKey: activeKey,
        model: modelId,
        messages: contextMessages,
        systemInstruction: settings.systemInstruction,
        temperature: settings.temperature,
        maxOutputTokens: settings.maxOutputTokens,
        onStreamChunk,
      });
    }

    // Google Gemini
    const contextMessages = parentId
      ? resolveGeminiContext(parentId, allNodes)
      : [{ role: 'user' as const, parts: [{ text: node.data.content || 'Continue exploration' }] }];

    return generateGeminiResponse({
      apiKey: activeKey,
      model: modelId,
      messages: contextMessages,
      systemInstruction: settings.systemInstruction,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      onStreamChunk,
    });
  });
}
