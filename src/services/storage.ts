import type {
  SerializedGraph,
  AppSettings,
  ThoughtFlowNode,
  ThoughtFlowEdge,
  GraphSessionMeta,
  GraphSession,
} from '../types/graph';
import { getBranchAncestors } from '../utils/contextResolver';
import { STARTER_TEMPLATES } from './mockData';

const STORAGE_KEYS = {
  GRAPH: 'thoughtgraph_ai_active_graph',
  SETTINGS: 'thoughtgraph_ai_settings',
  SESSIONS_INDEX: 'thoughtgraph_ai_sessions_index',
  ACTIVE_SESSION_ID: 'thoughtgraph_ai_active_session_id',
  SESSION_PREFIX: 'thoughtgraph_ai_session_',
};

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'openrouter',
  openRouterApiKey: '',
  apiKey: '',
  defaultModel: 'deepseek/deepseek-chat',
  defaultMergeModel: 'deepseek/deepseek-r1',
  temperature: 0.7,
  maxOutputTokens: 2048,
  systemInstruction: 'You are an insightful thinking partner in a visual non-linear thought graph. Provide clear, structured, well-formatted markdown responses with concrete trade-offs, code examples where appropriate, and actionable recommendations.',
  customModels: [],
  autoLayoutOnAdd: true,
  edgeType: 'smoothstep',
  theme: 'monochrome',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      provider: parsed.provider || (parsed.openRouterApiKey ? 'openrouter' : parsed.apiKey ? 'gemini' : 'openrouter'),
      openRouterApiKey: parsed.openRouterApiKey || '',
    };
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function saveGraphState(
  nodes: ThoughtFlowNode[],
  edges: ThoughtFlowEdge[],
  activeParentId: string | null,
  title: string = 'Untitled Ideation Graph'
): void {
  try {
    const graphData: SerializedGraph = {
      version: '1.0.0',
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes,
      edges,
      activeParentId,
    };
    localStorage.setItem(STORAGE_KEYS.GRAPH, JSON.stringify(graphData));
  } catch (err) {
    console.error('Failed to persist graph state:', err);
  }
}

export function loadGraphState(): SerializedGraph | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRAPH);
    if (!raw) return null;
    return JSON.parse(raw) as SerializedGraph;
  } catch (err) {
    console.error('Failed to load graph state:', err);
    return null;
  }
}

/**
 * Extract a human-readable preview from the initial user thought
 */
export function extractPreviewText(nodes: ThoughtFlowNode[]): string {
  const firstUserNode = nodes.find((n) => n.data.role === 'user');
  const target = firstUserNode || nodes[0];
  if (!target || !target.data?.content) return 'جلسة فارغة جديدة...';
  return target.data.content.slice(0, 100).replace(/\s+/g, ' ');
}

/**
 * Get active session ID
 */
export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
  } catch {
    return null;
  }
}

/**
 * Set active session ID
 */
export function setActiveSessionId(sessionId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId);
  } catch (err) {
    console.error('Failed to set active session ID:', err);
  }
}

/**
 * Load the sessions index list, migrating existing active graph if first time
 */
export function loadSessionsIndex(): GraphSessionMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS_INDEX);
    if (raw) {
      const parsed = JSON.parse(raw) as GraphSessionMeta[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
      }
    }

    // First time migration: convert existing active graph into the initial session
    const existingActive = loadGraphState();
    const initialSessionId = `session-${Date.now()}`;
    const initialNodes = existingActive?.nodes || STARTER_TEMPLATES.ai_architecture.nodes;
    const initialEdges = existingActive?.edges || STARTER_TEMPLATES.ai_architecture.edges;
    const initialParent = existingActive?.activeParentId ?? (initialNodes[0]?.id || null);
    const initialTitle = existingActive?.title || 'جلسة الأفكار الأولية (Initial Graph)';

    const initialSession: GraphSession = {
      id: initialSessionId,
      title: initialTitle,
      nodeCount: initialNodes.length,
      edgeCount: initialEdges.length,
      createdAt: existingActive?.createdAt || Date.now(),
      updatedAt: existingActive?.updatedAt || Date.now(),
      previewText: extractPreviewText(initialNodes),
      nodes: initialNodes,
      edges: initialEdges,
      activeParentId: initialParent,
    };

    saveSession(initialSession);
    setActiveSessionId(initialSessionId);

    return [{
      id: initialSession.id,
      title: initialSession.title,
      nodeCount: initialSession.nodeCount,
      edgeCount: initialSession.edgeCount,
      createdAt: initialSession.createdAt,
      updatedAt: initialSession.updatedAt,
      previewText: initialSession.previewText,
    }];
  } catch (err) {
    console.error('Failed to load sessions index:', err);
    return [];
  }
}

/**
 * Load a full graph session by ID
 */
export function loadSession(sessionId: string): GraphSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_PREFIX + sessionId);
    if (!raw) return null;
    return JSON.parse(raw) as GraphSession;
  } catch (err) {
    console.error(`Failed to load session ${sessionId}:`, err);
    return null;
  }
}

/**
 * Save a session and update its index metadata
 */
export function saveSession(session: GraphSession): void {
  try {
    // 1. Save session payload
    localStorage.setItem(STORAGE_KEYS.SESSION_PREFIX + session.id, JSON.stringify(session));

    // 2. Update index
    const rawIndex = localStorage.getItem(STORAGE_KEYS.SESSIONS_INDEX);
    let index: GraphSessionMeta[] = [];
    if (rawIndex) {
      try {
        index = JSON.parse(rawIndex);
      } catch {
        index = [];
      }
    }

    const meta: GraphSessionMeta = {
      id: session.id,
      title: session.title,
      nodeCount: session.nodes.length,
      edgeCount: session.edges.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt || Date.now(),
      previewText: extractPreviewText(session.nodes),
    };

    const existingIdx = index.findIndex((s) => s.id === session.id);
    if (existingIdx >= 0) {
      index[existingIdx] = meta;
    } else {
      index.unshift(meta);
    }

    localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(index));

    // 3. Keep active graph backup for backward compatibility
    saveGraphState(session.nodes, session.edges, session.activeParentId, session.title);
  } catch (err) {
    console.error(`Failed to save session ${session.id}:`, err);
  }
}

/**
 * Create a brand new session
 */
export function createSession(
  title?: string,
  initialData?: { nodes: ThoughtFlowNode[]; edges: ThoughtFlowEdge[]; activeParentId?: string | null }
): GraphSession {
  const timestamp = Date.now();
  const id = `session-${timestamp}`;
  const defaultTitle = title || `جلسة أفكار #${new Date(timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

  const nodes = initialData?.nodes || [];
  const edges = initialData?.edges || [];
  const activeParentId = initialData?.activeParentId || (nodes[0]?.id ?? null);

  const newSession: GraphSession = {
    id,
    title: defaultTitle,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    createdAt: timestamp,
    updatedAt: timestamp,
    previewText: extractPreviewText(nodes),
    nodes,
    edges,
    activeParentId,
  };

  saveSession(newSession);
  setActiveSessionId(id);
  return newSession;
}

/**
 * Delete a session by ID
 */
export function deleteSession(sessionId: string): boolean {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_PREFIX + sessionId);
    const rawIndex = localStorage.getItem(STORAGE_KEYS.SESSIONS_INDEX);
    if (rawIndex) {
      const index = JSON.parse(rawIndex) as GraphSessionMeta[];
      const filtered = index.filter((s) => s.id !== sessionId);
      localStorage.setItem(STORAGE_KEYS.SESSIONS_INDEX, JSON.stringify(filtered));
    }
    return true;
  } catch (err) {
    console.error(`Failed to delete session ${sessionId}:`, err);
    return false;
  }
}

/**
 * Duplicate a session
 */
export function duplicateSession(sessionId: string): GraphSession | null {
  const original = loadSession(sessionId);
  if (!original) return null;

  const timestamp = Date.now();
  const duplicatedId = `session-${timestamp}`;
  const duplicated: GraphSession = {
    ...JSON.parse(JSON.stringify(original)),
    id: duplicatedId,
    title: `${original.title} (نسخة)`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveSession(duplicated);
  return duplicated;
}

/**
 * Rename a session
 */
export function renameSession(sessionId: string, newTitle: string): boolean {
  const session = loadSession(sessionId);
  if (!session) return false;

  session.title = newTitle.trim() || session.title;
  session.updatedAt = Date.now();
  saveSession(session);
  return true;
}

export function exportGraphToJson(graph: SerializedGraph): void {
  const jsonStr = JSON.stringify(graph, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = graph.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  a.href = url;
  a.download = `thoughtgraph-${safeTitle}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importGraphFromJson(jsonString: string): SerializedGraph {
  const parsed = JSON.parse(jsonString);

  if (!parsed.nodes || !Array.isArray(parsed.nodes) || !parsed.edges || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid graph format: must contain valid nodes and edges arrays.');
  }

  const nodes = parsed.nodes.map((n: ThoughtFlowNode) => ({
    ...n,
    data: {
      ...n.data,
      parentIds: n.data?.parentIds || [],
      status: 'idle',
    },
  }));

  return {
    version: parsed.version || '1.0.0',
    title: parsed.title || 'Imported Ideation Graph',
    description: parsed.description,
    createdAt: parsed.createdAt || Date.now(),
    updatedAt: Date.now(),
    nodes,
    edges: parsed.edges,
    activeParentId: parsed.activeParentId || (nodes[0]?.id ?? null),
  };
}

export function exportToMarkdown(
  nodes: ThoughtFlowNode[],
  selectedNodeId?: string | null
): string {
  if (selectedNodeId) {
    const nodesMap = new Map(nodes.map((n) => [n.id, n]));
    const branchNodes = getBranchAncestors(selectedNodeId, nodesMap);

    let md = `# ThoughtGraph AI: Branch Export\n\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    branchNodes.forEach((node, index) => {
      const isUser = node.data.role === 'user';
      const roleName = isUser ? '👤 User Thought' : '✨ Gemini Response';
      const modelTag = node.data.modelUsed ? ` \`(${node.data.modelUsed})\`` : '';
      const stepNum = index + 1;

      md += `### Step ${stepNum}: ${roleName}${modelTag}\n\n`;
      md += `${node.data.content}\n\n---\n\n`;
    });

    return md;
  }

  let md = `# ThoughtGraph AI: Full Canvas Export\n\n`;
  md += `*Total Nodes: ${nodes.length} | Exported: ${new Date().toLocaleString()}*\n\n---\n\n`;

  nodes.forEach((node) => {
    const roleName = node.data.role === 'user' ? '👤 User' : '✨ Gemini AI';
    const modelTag = node.data.modelUsed ? ` [${node.data.modelUsed}]` : '';
    const mergeTag = node.data.isMergeNode ? ' 🔀 [Merge Synthesis]' : '';

    md += `## Node: ${node.id} (${roleName}${modelTag}${mergeTag})\n`;
    if (node.data.parentIds.length > 0) {
      md += `*Parents:* ${node.data.parentIds.join(', ')}\n\n`;
    }
    md += `${node.data.content}\n\n---\n\n`;
  });

  return md;
}
