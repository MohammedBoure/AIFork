import { useState, useCallback, useEffect } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type {
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import type {
  ThoughtFlowNode,
  ThoughtFlowEdge,
  AppSettings,
  SerializedGraph,
  ModelOption,
} from '../types/graph';
import {
  saveGraphState,
  loadGraphState,
  loadSettings,
  saveSettings,
} from '../services/storage';
import { STARTER_TEMPLATES } from '../services/mockData';
import { getLayoutedElements, calculateChildPosition } from '../utils/dagLayout';
import {
  resolveGeminiContext,
  buildMergeSynthesisPrompt,
} from '../utils/contextResolver';
import {
  generateGeminiResponse,
  DEFAULT_PRESET_MODELS,
  fetchAvailableGeminiModels,
} from '../services/gemini';
import type { ToastMessage } from '../components/ui/Toast';

export function useGraphState() {
  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(DEFAULT_PRESET_MODELS);

  // Initialize graph from saved state or starter template
  const initialData = loadGraphState() || STARTER_TEMPLATES.ai_architecture;

  const [nodes, setNodes] = useState<ThoughtFlowNode[]>(initialData.nodes);
  const [edges, setEdges] = useState<ThoughtFlowEdge[]>(initialData.edges);
  const [activeParentId, setActiveParentId] = useState<string | null>(initialData.activeParentId || null);
  const [selectedForMergeIds, setSelectedForMergeIds] = useState<string[]>([]);

  // Canvas visual state
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [showMinimap, setShowMinimap] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Proactively fetch models on initial mount if API key is present
  useEffect(() => {
    if (settings.apiKey) {
      fetchAvailableGeminiModels(settings.apiKey)
        .then((models) => {
          if (models.length > 0) setAvailableModels(models);
        })
        .catch(() => {});
    }
  }, [settings.apiKey]);

  // Persist graph changes to localStorage
  useEffect(() => {
    saveGraphState(nodes, edges, activeParentId);
  }, [nodes, edges, activeParentId]);

  // Node changes
  const onNodesChange: OnNodesChange<ThoughtFlowNode> = useCallback((changes: NodeChange<ThoughtFlowNode>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as ThoughtFlowNode[]);
  }, []);

  // Edge changes
  const onEdgesChange: OnEdgesChange<ThoughtFlowEdge> = useCallback((changes: EdgeChange<ThoughtFlowEdge>[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds) as ThoughtFlowEdge[]);
  }, []);

  // Connection handler
  const onConnect: OnConnect = useCallback((params: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...params,
          type: settings.edgeType || 'smoothstep',
          animated: true,
        },
        eds
      ) as ThoughtFlowEdge[]
    );
  }, [settings.edgeType]);

  // Fork a node (sets active parent)
  const handleForkNode = useCallback((nodeId: string) => {
    setActiveParentId(nodeId);
    addToast('info', 'Active fork parent updated. Type your thought in the prompt bar below.');
  }, [addToast]);

  // Clear active parent
  const handleClearParent = useCallback(() => {
    setActiveParentId(null);
  }, []);

  // Toggle selection for Merge
  const handleToggleMergeSelect = useCallback((nodeId: string) => {
    setSelectedForMergeIds((prev) => {
      const exists = prev.includes(nodeId);
      if (exists) {
        return prev.filter((id) => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  }, []);

  // Clear merge selections
  const handleClearMergeSelection = useCallback(() => {
    setSelectedForMergeIds([]);
  }, []);

  // Delete node and associated edges
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (activeParentId === nodeId) setActiveParentId(null);
    setSelectedForMergeIds((prev) => prev.filter((id) => id !== nodeId));
    addToast('info', 'Node deleted from canvas.');
  }, [activeParentId, addToast]);

  // Auto-layout
  const handleAutoLayout = useCallback((direction: 'TB' | 'LR' = layoutDirection) => {
    setLayoutDirection(direction);
    setNodes((currentNodes) => {
      setEdges((currentEdges) => {
        const layouted = getLayoutedElements(currentNodes, currentEdges, direction);
        return layouted.edges;
      });
      const layouted = getLayoutedElements(currentNodes, edges, direction);
      return layouted.nodes;
    });
    addToast('success', `Graph aligned (${direction === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}).`);
  }, [edges, layoutDirection, addToast]);

  // Save Settings
  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    addToast('success', 'Settings saved successfully.');
  }, [addToast]);

  // Load a template or imported graph
  const handleLoadGraph = useCallback((graph: SerializedGraph) => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setActiveParentId(graph.activeParentId || (graph.nodes[0]?.id ?? null));
    setSelectedForMergeIds([]);
    addToast('success', `Loaded "${graph.title}".`);
  }, [addToast]);

  // Reset Canvas to Blank
  const handleResetCanvas = useCallback(() => {
    handleLoadGraph(STARTER_TEMPLATES.blank_canvas);
    addToast('info', 'Canvas reset to new blank workspace.');
  }, [handleLoadGraph, addToast]);

  /**
   * Core Branching Execution:
   * Adds User Node -> Resolves isolated branch context -> Calls Gemini API -> Adds/Updates Assistant Node
   */
  const handleAddThought = useCallback(
    async (userPrompt: string, modelId: string) => {
      if (!userPrompt.trim() || isGenerating) return;

      setIsGenerating(true);

      const timestamp = Date.now();
      const userNodeId = `node-user-${timestamp}`;
      const assistantNodeId = `node-ai-${timestamp + 1}`;

      const parentIds = activeParentId ? [activeParentId] : [];

      // Calculate placement position
      const userPos = calculateChildPosition(parentIds, nodes, edges);
      const aiPos = {
        x: userPos.x,
        y: userPos.y + 240,
      };

      // 1. Create User Node
      const userNode: ThoughtFlowNode = {
        id: userNodeId,
        type: 'thought',
        position: userPos,
        data: {
          id: userNodeId,
          role: 'user',
          content: userPrompt,
          parentIds,
          createdAt: timestamp,
          status: 'idle',
          branchLabel: activeParentId ? 'Forked Branch' : 'Root Idea',
        },
      };

      // 2. Create User Edge
      const newEdges: ThoughtFlowEdge[] = [];
      if (activeParentId) {
        newEdges.push({
          id: `edge-${activeParentId}-${userNodeId}`,
          source: activeParentId,
          target: userNodeId,
          type: settings.edgeType || 'smoothstep',
          animated: true,
        });
      }

      // 3. Create Placeholder Assistant Node with Generating status
      const assistantNode: ThoughtFlowNode = {
        id: assistantNodeId,
        type: 'thought',
        position: aiPos,
        data: {
          id: assistantNodeId,
          role: 'assistant',
          content: '',
          modelUsed: modelId,
          parentIds: [userNodeId],
          createdAt: timestamp + 1,
          status: 'generating',
          branchLabel: `${modelId} Response`,
        },
      };

      // Edge from user to assistant
      const aiEdge: ThoughtFlowEdge = {
        id: `edge-${userNodeId}-${assistantNodeId}`,
        source: userNodeId,
        target: assistantNodeId,
        type: settings.edgeType || 'smoothstep',
        animated: true,
      };

      // Update state immediately with user node and loading assistant node
      const updatedNodes = [...nodes, userNode, assistantNode];
      const allEdges = [...edges, ...newEdges, aiEdge];

      setNodes(updatedNodes);
      setEdges(allEdges);
      setActiveParentId(assistantNodeId);

      try {
        // Resolve strict ancestor dialogue context for this branch
        const contextMessages = resolveGeminiContext(userNodeId, [...nodes, userNode]);

        // Call Gemini API with streaming chunk updates
        const result = await generateGeminiResponse({
          apiKey: settings.apiKey,
          model: modelId,
          messages: contextMessages,
          systemInstruction: settings.systemInstruction,
          temperature: settings.temperature,
          maxOutputTokens: settings.maxOutputTokens,
          onStreamChunk: (_, fullText) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === assistantNodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        content: fullText,
                      },
                    }
                  : n
              )
            );
          },
        });

        // Finalize assistant node
        setNodes((nds) =>
          nds.map((n) =>
            n.id === assistantNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    content: result.text,
                    status: 'idle',
                    tokens: result.tokens,
                  },
                }
              : n
          )
        );

        if (settings.autoLayoutOnAdd) {
          setTimeout(() => {
            handleAutoLayout();
          }, 150);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate branch response';
        setNodes((nds) =>
          nds.map((n) =>
            n.id === assistantNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'error',
                    error: errorMsg,
                  },
                }
              : n
          )
        );
        addToast('error', errorMsg);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      activeParentId,
      nodes,
      edges,
      isGenerating,
      settings,
      handleAutoLayout,
      addToast,
    ]
  );

  /**
   * Multi-Branch Synthesis (Merge Execution):
   * Synthesizes 2+ selected branch endpoints into a unified resolution node.
   */
  const handleConfirmMerge = useCallback(
    async (synthesisPrompt: string, modelId: string) => {
      if (selectedForMergeIds.length < 2 || isGenerating) return;

      setIsGenerating(true);
      setIsMergeModalOpen(false);

      const timestamp = Date.now();
      const mergeNodeId = `node-merge-${timestamp}`;

      const selectedNodes = nodes.filter((n) => selectedForMergeIds.includes(n.id));
      const nodesMap = new Map(nodes.map((n) => [n.id, n]));

      // Build structured synthesis prompt
      const { messages } = buildMergeSynthesisPrompt(
        selectedNodes,
        nodesMap,
        synthesisPrompt
      );

      // Position merge node centrally below selected parents
      const mergePos = calculateChildPosition(selectedForMergeIds, nodes, edges);

      // Create new merge node
      const mergeNode: ThoughtFlowNode = {
        id: mergeNodeId,
        type: 'thought',
        position: mergePos,
        data: {
          id: mergeNodeId,
          role: 'assistant',
          content: '',
          modelUsed: modelId,
          parentIds: [...selectedForMergeIds],
          createdAt: timestamp,
          status: 'generating',
          isMergeNode: true,
          branchLabel: 'Multi-Branch Synthesis',
        },
      };

      // Edges connecting all selected parents to the new merge node
      const mergeEdges: ThoughtFlowEdge[] = selectedForMergeIds.map((parentId) => ({
        id: `edge-merge-${parentId}-${mergeNodeId}`,
        source: parentId,
        target: mergeNodeId,
        type: settings.edgeType || 'smoothstep',
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2.5 },
        data: { isMergeEdge: true },
      }));

      setNodes((nds) => [...nds, mergeNode]);
      setEdges((eds) => [...eds, ...mergeEdges]);
      setActiveParentId(mergeNodeId);
      setSelectedForMergeIds([]);

      try {
        const result = await generateGeminiResponse({
          apiKey: settings.apiKey,
          model: modelId,
          messages,
          systemInstruction: settings.systemInstruction,
          temperature: settings.temperature,
          maxOutputTokens: settings.maxOutputTokens,
          onStreamChunk: (_, fullText) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === mergeNodeId
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        content: fullText,
                      },
                    }
                  : n
              )
            );
          },
        });

        setNodes((nds) =>
          nds.map((n) =>
            n.id === mergeNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    content: result.text,
                    status: 'idle',
                    tokens: result.tokens,
                  },
                }
              : n
          )
        );

        addToast('success', `Merged ${selectedNodes.length} branches successfully using ${modelId}!`);

        if (settings.autoLayoutOnAdd) {
          setTimeout(() => {
            handleAutoLayout();
          }, 150);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate synthesis response';
        setNodes((nds) =>
          nds.map((n) =>
            n.id === mergeNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: 'error',
                    error: errorMsg,
                  },
                }
              : n
          )
        );
        addToast('error', errorMsg);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      selectedForMergeIds,
      isGenerating,
      nodes,
      edges,
      settings,
      handleAutoLayout,
      addToast,
    ]
  );

  const activeParentNode = nodes.find((n) => n.id === activeParentId);
  const activeParentTitle = activeParentNode
    ? activeParentNode.data.branchLabel ||
      activeParentNode.data.content.slice(0, 35) + (activeParentNode.data.content.length > 35 ? '...' : '')
    : null;

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    activeParentId,
    activeParentTitle,
    selectedForMergeIds,
    layoutDirection,
    showMinimap,
    isGenerating,
    settings,
    availableModels,
    setAvailableModels,
    toasts,
    dismissToast,

    // Modal state
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    isTemplatesOpen,
    setIsTemplatesOpen,
    isMergeModalOpen,
    setIsMergeModalOpen,
    inspectedNodeId,
    setInspectedNodeId,

    // Actions
    handleForkNode,
    handleClearParent,
    handleToggleMergeSelect,
    handleClearMergeSelection,
    handleDeleteNode,
    handleAutoLayout,
    handleSaveSettings,
    handleLoadGraph,
    handleResetCanvas,
    handleAddThought,
    handleConfirmMerge,
    setShowMinimap,
  };
}
