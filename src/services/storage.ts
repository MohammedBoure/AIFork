import type { SerializedGraph, AppSettings, ThoughtFlowNode, ThoughtFlowEdge } from '../types/graph';
import { getBranchAncestors } from '../utils/contextResolver';

const STORAGE_KEYS = {
  GRAPH: 'thoughtgraph_ai_active_graph',
  SETTINGS: 'thoughtgraph_ai_settings',
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
