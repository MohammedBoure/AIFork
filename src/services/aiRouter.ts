import type {
  AppSettings,
  ThoughtFlowNode,
  GenerateAIResult,
  ModelOption,
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

  if (useOpenRouter) {
    const contextMessages = resolveOpenRouterContext(userNodeId, nodes);
    return generateOpenRouterResponse({
      apiKey: settings.openRouterApiKey,
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
    apiKey: settings.apiKey,
    model: modelId,
    messages: contextMessages,
    systemInstruction: settings.systemInstruction,
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    onStreamChunk,
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
  const nodesMap = new Map(allNodes.map((n) => [n.id, n]));

  if (useOpenRouter) {
    const { messages } = buildOpenRouterMergePrompt(
      selectedNodes,
      nodesMap,
      synthesisPrompt
    );
    return generateOpenRouterResponse({
      apiKey: settings.openRouterApiKey,
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
    apiKey: settings.apiKey,
    model: modelId,
    messages,
    systemInstruction: settings.systemInstruction,
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    onStreamChunk,
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

  if (useOpenRouter) {
    const contextMessages = parentId
      ? resolveOpenRouterContext(parentId, allNodes)
      : [{ role: 'user' as const, content: node.data.content || 'Continue exploration' }];

    return generateOpenRouterResponse({
      apiKey: settings.openRouterApiKey,
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
    apiKey: settings.apiKey,
    model: modelId,
    messages: contextMessages,
    systemInstruction: settings.systemInstruction,
    temperature: settings.temperature,
    maxOutputTokens: settings.maxOutputTokens,
    onStreamChunk,
  });
}
