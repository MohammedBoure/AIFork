import type { Node, Edge } from '@xyflow/react';

/**
 * Core node data structure adhering to ThoughtGraph AI specification
 */
export interface ThoughtNodeData extends Record<string, unknown> {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string; // Model used for this specific node
  parentIds: string[];
  createdAt: number;
  status?: 'idle' | 'generating' | 'error';
  error?: string;
  branchLabel?: string;
  isMergeNode?: boolean;
  tokens?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

/**
 * React Flow node wrapped with ThoughtNodeData
 */
export type ThoughtFlowNode = Node<ThoughtNodeData, 'thought'>;

/**
 * React Flow edge with optional metadata
 */
export type ThoughtFlowEdge = Edge<{
  isMergeEdge?: boolean;
  isAnimated?: boolean;
  edgeType?: string;
  [key: string]: unknown;
}>;

/**
 * Supported AI engine providers
 */
export type AIProvider = 'openrouter' | 'gemini';

/**
 * Model description and capabilities
 */
export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge: string;
  contextWindow?: string;
  category: 'fast' | 'pro' | 'experimental' | 'custom';
  recommendedFor?: 'chat' | 'fork' | 'merge' | 'all';
  provider?: AIProvider | 'custom';
}

/**
 * User application settings
 */
export interface AppSettings {
  provider: AIProvider;
  openRouterApiKey: string;
  apiKey: string; // Google Gemini API key
  defaultModel: string;
  defaultMergeModel: string;
  temperature: number;
  maxOutputTokens: number;
  systemInstruction: string;
  customModels: string[];
  autoLayoutOnAdd: boolean;
  edgeType: 'smoothstep' | 'bezier' | 'straight';
  theme: 'monochrome' | 'slate';
}

/**
 * Serialized graph format for import/export
 */
export interface SerializedGraph {
  version: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  nodes: ThoughtFlowNode[];
  edges: ThoughtFlowEdge[];
  activeParentId: string | null;
  settings?: Partial<AppSettings>;
}

/**
 * Standard OpenAI/OpenRouter chat message format
 */
export interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Message payload format for Gemini API
 */
export interface GeminiChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Unified response format across AI providers
 */
export interface GenerateAIResult {
  text: string;
  actualModelUsed?: string;
  fallbackNotice?: string;
  reasoningContent?: string;
  tokens?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Merge action configuration
 */
export interface MergeConfig {
  selectedNodeIds: string[];
  synthesisPrompt: string;
  modelId: string;
}

/**
 * Context menu payload
 */
export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  nodeId?: string;
}

/**
 * Graph session metadata stored in sessions index
 */
export interface GraphSessionMeta {
  id: string;
  title: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: number;
  updatedAt: number;
  previewText?: string;
}

/**
 * Full Graph Session including nodes, edges, and active state
 */
export interface GraphSession extends GraphSessionMeta {
  nodes: ThoughtFlowNode[];
  edges: ThoughtFlowEdge[];
  activeParentId: string | null;
}
