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
}

/**
 * User application settings
 */
export interface AppSettings {
  apiKey: string;
  defaultModel: string;
  defaultMergeModel: string;
  temperature: number;
  maxOutputTokens: number;
  systemInstruction: string;
  customModels: string[];
  autoLayoutOnAdd: boolean;
  edgeType: 'smoothstep' | 'bezier' | 'straight';
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
 * Message payload format for Gemini API
 */
export interface GeminiChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Merge action configuration
 */
export interface MergeConfig {
  selectedNodeIds: string[];
  synthesisPrompt: string;
  modelId: string;
}
