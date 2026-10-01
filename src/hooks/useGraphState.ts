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

  const [nodes, setNodes] = useState<ThoughtFlowNode[]>(() =>
    JSON.parse(JSON.stringify(initialData.nodes))
  );
  const [edges, setEdges] = useState<ThoughtFlowEdge[]>(() =>
    JSON.parse(JSON.stringify(initialData.edges))
  );
  const [activeParentId, setActiveParentId] = useState<string | null>(initialData.activeParentId || null);
  const [selectedForMergeIds, setSelectedForMergeIds] = useState<string[]>([]);

  // Focus Flow (Full View as Conversation) State
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [isFocusFlowOpen, setIsFocusFlowOpen] = useState(false);

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

  // Open Focus Flow (Full View as Conversation)
  const handleOpenFocusFlow = useCallback((nodeId: string) => {
    setFocusNodeId(nodeId);
    setIsFocusFlowOpen(true);
  }, []);

  const handleCloseFocusFlow = useCallback(() => {
    setIsFocusFlowOpen(false);
  }, []);

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
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, []);

  // Delete single node and associated edges
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (activeParentId === nodeId) setActiveParentId(null);
    if (focusNodeId === nodeId) setFocusNodeId(null);
    setSelectedForMergeIds((prev) => prev.filter((id) => id !== nodeId));
    addToast('info', 'Node deleted from canvas.');
  }, [activeParentId, focusNodeId, addToast]);

  // Batch delete selected nodes
  const handleBatchDelete = useCallback((nodeIds: string[]) => {
    const idSet = new Set(nodeIds);
    setNodes((nds) => nds.filter((n) => !idSet.has(n.id)));
    setEdges((eds) => eds.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)));
    if (activeParentId && idSet.has(activeParentId)) setActiveParentId(null);
    if (focusNodeId && idSet.has(focusNodeId)) setFocusNodeId(null);
    setSelectedForMergeIds([]);
    addToast('info', `Deleted ${nodeIds.length} nodes from canvas.`);
  }, [activeParentId, focusNodeId, addToast]);

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

  // Load a template or imported graph with deep copy
  const handleLoadGraph = useCallback((graph: SerializedGraph) => {
    const cleanNodes = JSON.parse(JSON.stringify(graph.nodes));
    const cleanEdges = JSON.parse(JSON.stringify(graph.edges));
    setNodes(cleanNodes);
    setEdges(cleanEdges);
    setActiveParentId(graph.activeParentId || (cleanNodes[0]?.id ?? null));
    setFocusNodeId(graph.activeParentId || (cleanNodes[0]?.id ?? null));
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
    async (userPrompt: string, modelId: string, parentOverride?: string) => {
      if (!userPrompt.trim() || isGenerating) return;

      setIsGenerating(true);

      const timestamp = Date.now();
      const userNodeId = `node-user-${timestamp}`;
      const assistantNodeId = `node-ai-${timestamp + 1}`;

      const targetParent = parentOverride !== undefined ? parentOverride : activeParentId;
      const parentIds = targetParent ? [targetParent] : [];

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
          branchLabel: targetParent ? 'Forked Branch' : 'Root Idea',
        },
      };

      // 2. Create User Edge
      const newEdges: ThoughtFlowEdge[] = [];
      if (targetParent) {
        newEdges.push({
          id: `edge-${targetParent}-${userNodeId}`,
          source: targetParent,
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

      const updatedNodes = [...nodes, userNode, assistantNode];
      const allEdges = [...edges, ...newEdges, aiEdge];

      setNodes(updatedNodes);
      setEdges(allEdges);
      setActiveParentId(assistantNodeId);
      setFocusNodeId(assistantNodeId);

      try {
        const contextMessages = resolveGeminiContext(userNodeId, [...nodes, userNode]);

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

        const actualModel = result.actualModelUsed || modelId;

        setNodes((nds) =>
          nds.map((n) =>
            n.id === assistantNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    content: result.text,
                    modelUsed: actualModel,
                    status: 'idle',
                    tokens: result.tokens,
                  },
                }
              : n
          )
        );

        if (result.fallbackNotice) {
          addToast('info', result.fallbackNotice);
        }

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
   * Retry generating an error node
   */
  const handleRetryNode = useCallback(
    async (nodeId: string, overrideModelId?: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || isGenerating) return;

      const modelId = overrideModelId || node.data.modelUsed || settings.defaultModel;
      setIsGenerating(true);

      // Reset node status to generating
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  modelUsed: modelId,
                  status: 'generating',
                  error: undefined,
                },
              }
            : n
        )
      );

      try {
        const parentId = node.data.parentIds?.[0];
        const contextMessages = parentId
          ? resolveGeminiContext(parentId, nodes)
          : [{ role: 'user' as const, parts: [{ text: node.data.content || 'Continue' }] }];

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
                n.id === nodeId
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

        const actualModel = result.actualModelUsed || modelId;

        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    content: result.text,
                    modelUsed: actualModel,
                    status: 'idle',
                    tokens: result.tokens,
                  },
                }
              : n
          )
        );

        if (result.fallbackNotice) {
          addToast('info', result.fallbackNotice);
        } else {
          addToast('success', `Generated successfully with ${actualModel}!`);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Retry failed';
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
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
    [nodes, isGenerating, settings, addToast]
  );

  /**
   * Multi-Branch Synthesis (Merge Execution)
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

      const { messages } = buildMergeSynthesisPrompt(
        selectedNodes,
        nodesMap,
        synthesisPrompt
      );

      const mergePos = calculateChildPosition(selectedForMergeIds, nodes, edges);

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

      const mergeEdges: ThoughtFlowEdge[] = selectedForMergeIds.map((parentId) => ({
        id: `edge-merge-${parentId}-${mergeNodeId}`,
        source: parentId,
        target: mergeNodeId,
        type: settings.edgeType || 'smoothstep',
        animated: true,
        style: { stroke: '#e4e4e7', strokeWidth: 2.5 },
        data: { isMergeEdge: true },
      }));

      setNodes((nds) => [...nds, mergeNode]);
      setEdges((eds) => [...eds, ...mergeEdges]);
      setActiveParentId(mergeNodeId);
      setFocusNodeId(mergeNodeId);
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

    // Focus Flow
    focusNodeId,
    isFocusFlowOpen,
    handleOpenFocusFlow,
    handleCloseFocusFlow,

    // Modals
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
    handleBatchDelete,
    handleRetryNode,
    handleAutoLayout,
    handleSaveSettings,
    handleLoadGraph,
    handleResetCanvas,
    handleAddThought,
    handleConfirmMerge,
    setShowMinimap,
  };
}
