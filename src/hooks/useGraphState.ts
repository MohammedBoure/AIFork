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
  GraphSessionMeta,
  GraphSession,
} from '../types/graph';
import {
  loadSettings,
  saveSettings,
  loadSessionsIndex,
  loadSession,
  saveSession,
  createSession,
  deleteSession,
  duplicateSession,
  renameSession,
  getActiveSessionId,
  setActiveSessionId,
  extractPreviewText,
} from '../services/storage';
import { STARTER_TEMPLATES } from '../services/mockData';
import { getLayoutedElements, calculateChildPosition } from '../utils/dagLayout';
import {
  executeAIBranchCompletion,
  executeAIMergeSynthesis,
  executeAIRetry,
  getPresetModelsForProvider,
  fetchRemoteModelsForProvider,
} from '../services/aiRouter';
import type { ToastMessage } from '../components/ui/Toast';

export function useGraphState() {
  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [availableModels, setAvailableModels] = useState<ModelOption[]>(() =>
    getPresetModelsForProvider(settings.provider)
  );

  // Load sessions index (will auto-migrate legacy graph if needed)
  const [sessions, setSessions] = useState<GraphSessionMeta[]>(() => loadSessionsIndex());

  // Determine active session ID
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const activeId = getActiveSessionId();
    if (activeId && loadSession(activeId)) return activeId;
    const initialIndex = loadSessionsIndex();
    if (initialIndex.length > 0 && loadSession(initialIndex[0].id)) return initialIndex[0].id;
    const newSess = createSession('جلسة الأفكار الأولية (Initial Graph)', STARTER_TEMPLATES.ai_architecture);
    return newSess.id;
  });

  const activeSessionData = loadSession(currentSessionId) || createSession();
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>(activeSessionData.title);

  const [nodes, setNodes] = useState<ThoughtFlowNode[]>(() =>
    JSON.parse(JSON.stringify(activeSessionData.nodes))
  );
  const [edges, setEdges] = useState<ThoughtFlowEdge[]>(() =>
    JSON.parse(JSON.stringify(activeSessionData.edges))
  );
  const [activeParentId, setActiveParentId] = useState<string | null>(activeSessionData.activeParentId || null);
  const [selectedForMergeIds, setSelectedForMergeIds] = useState<string[]>([]);

  // Focus Flow (Full View as Conversation) State
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [isFocusFlowOpen, setIsFocusFlowOpen] = useState(false);

  // Canvas visual state
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [showMinimap, setShowMinimap] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal states
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
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

  // Proactively fetch models on initial mount or when credentials/provider change
  const { provider, apiKey, openRouterApiKey } = settings;
  useEffect(() => {
    fetchRemoteModelsForProvider(provider, apiKey, openRouterApiKey)
      .then((models) => {
        if (models && models.length > 0) setAvailableModels(models);
      })
      .catch(() => {});
  }, [provider, apiKey, openRouterApiKey]);

  // Persist current session changes to localStorage
  useEffect(() => {
    const sessionToSave: GraphSession = {
      id: currentSessionId,
      title: currentSessionTitle,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      createdAt: activeSessionData.createdAt || Date.now(),
      updatedAt: Date.now(),
      previewText: extractPreviewText(nodes),
      nodes,
      edges,
      activeParentId,
    };
    saveSession(sessionToSave);
  }, [currentSessionId, currentSessionTitle, nodes, edges, activeParentId, activeSessionData.createdAt]);

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
    if (newSettings.provider !== settings.provider) {
      setAvailableModels(getPresetModelsForProvider(newSettings.provider));
    }
    addToast('success', 'Settings saved successfully.');
  }, [settings.provider, addToast]);

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

  // Reset Canvas to Blank (or create fresh session)
  const handleResetCanvas = useCallback(() => {
    handleLoadGraph(STARTER_TEMPLATES.blank_canvas);
    addToast('info', 'تمت تهيئة الكانفاس لمساحة عمل فارغة جديدة.');
  }, [handleLoadGraph, addToast]);

  // Switch to another session
  const handleSwitchSession = useCallback((sessionId: string) => {
    const targetSession = loadSession(sessionId);
    if (!targetSession) {
      addToast('error', 'تعذر العثور على بيانات الجلسة المطلوبة.');
      return;
    }

    setCurrentSessionId(targetSession.id);
    setCurrentSessionTitle(targetSession.title);
    setNodes(JSON.parse(JSON.stringify(targetSession.nodes)));
    setEdges(JSON.parse(JSON.stringify(targetSession.edges)));
    setActiveParentId(targetSession.activeParentId || null);
    setSelectedForMergeIds([]);
    setActiveSessionId(targetSession.id);
    addToast('info', `تم الانتقال إلى: "${targetSession.title}".`);
  }, [addToast]);

  // Create a new session
  const handleCreateSession = useCallback(
    (title?: string, initialData?: { nodes: ThoughtFlowNode[]; edges: ThoughtFlowEdge[]; activeParentId?: string | null }) => {
      const newSession = createSession(title, initialData);
      setSessions(loadSessionsIndex());
      handleSwitchSession(newSession.id);
      addToast('success', 'تم إنشاء جلسة أفكار جديدة بنجاح.');
      return newSession.id;
    },
    [handleSwitchSession, addToast]
  );

  // Delete a session
  const handleDeleteSession = useCallback((sessionId: string) => {
    const wasActive = sessionId === currentSessionId;
    const success = deleteSession(sessionId);
    if (!success) {
      addToast('error', 'تعذر مسح الجلسة.');
      return;
    }

    const updatedIndex = loadSessionsIndex();
    setSessions(updatedIndex);

    if (wasActive) {
      if (updatedIndex.length > 0) {
        handleSwitchSession(updatedIndex[0].id);
      } else {
        const fresh = createSession('جلسة أفكار جديدة (New Canvas)');
        setSessions(loadSessionsIndex());
        handleSwitchSession(fresh.id);
      }
    }
    addToast('info', 'تم مسح الجلسة بنجاح.');
  }, [currentSessionId, handleSwitchSession, addToast]);

  // Duplicate a session
  const handleDuplicateSession = useCallback((sessionId: string) => {
    const dup = duplicateSession(sessionId);
    if (!dup) {
      addToast('error', 'تعذر تكرار الجلسة.');
      return;
    }
    setSessions(loadSessionsIndex());
    addToast('success', `تم تكرار الجلسة باسم: "${dup.title}".`);
  }, [addToast]);

  // Rename a session
  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    const success = renameSession(sessionId, newTitle);
    if (success) {
      if (sessionId === currentSessionId) {
        setCurrentSessionTitle(newTitle);
      }
      setSessions(loadSessionsIndex());
      addToast('success', 'تم تعديل اسم الجلسة بنجاح.');
    }
  }, [currentSessionId, addToast]);

  // Open and close sessions modal with live index refresh
  const handleOpenSessions = useCallback(() => {
    setSessions(loadSessionsIndex());
    setIsSessionsOpen(true);
  }, []);

  const handleCloseSessions = useCallback(() => {
    setIsSessionsOpen(false);
  }, []);

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
        const result = await executeAIBranchCompletion(
          settings,
          modelId,
          userNodeId,
          [...nodes, userNode],
          (_, fullText) => {
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
          }
        );

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
    async (nodeId: string, overrideModelId?: string, overrideNodes?: ThoughtFlowNode[]) => {
      const activeNodes = overrideNodes || nodes;
      const node = activeNodes.find((n) => n.id === nodeId);
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
        const result = await executeAIRetry(
          settings,
          modelId,
          node,
          activeNodes,
          (_, fullText) => {
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
          }
        );

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
   * Update a node's prompt or text content
   * Optionally re-runs all dependent assistant child nodes with the updated prompt
   */
  const handleUpdateNodeContent = useCallback(
    async (nodeId: string, newContent: string, regenerateChildren: boolean = false) => {
      const trimmed = newContent.trim();
      if (!trimmed) {
        addToast('error', 'لا يمكن حفظ محتوى فارغ.');
        return;
      }

      const updatedNodes = nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                content: trimmed,
              },
            }
          : n
      );

      setNodes(updatedNodes);

      if (regenerateChildren) {
        // Find direct child assistant nodes
        const childEdges = edges.filter((e) => e.source === nodeId);
        const childAssistantNodes = updatedNodes.filter(
          (n) => childEdges.some((e) => e.target === n.id) && n.data.role === 'assistant'
        );

        if (childAssistantNodes.length > 0) {
          addToast('info', 'تم تحديث الـ Prompt. جاري توليد الرد بناءً عليه...');
          for (const childNode of childAssistantNodes) {
            await handleRetryNode(childNode.id, childNode.data.modelUsed, updatedNodes);
          }
        } else {
          addToast('success', 'تم حفظ الـ Prompt المعدل بنجاح.');
        }
      } else {
        addToast('success', 'تم حفظ التعديل بنجاح.');
      }
    },
    [nodes, edges, handleRetryNode, addToast]
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
        const result = await executeAIMergeSynthesis(
          settings,
          modelId,
          selectedNodes,
          nodes,
          synthesisPrompt,
          (_, fullText) => {
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
          }
        );

        const actualModel = result.actualModelUsed || modelId;

        setNodes((nds) =>
          nds.map((n) =>
            n.id === mergeNodeId
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

        addToast('success', `Merged ${selectedNodes.length} branches successfully using ${actualModel}!`);

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

    // Modals & Panels
    isSessionsOpen,
    setIsSessionsOpen,
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

    // Session Management
    sessions,
    currentSessionId,
    currentSessionTitle,
    handleOpenSessions,
    handleCloseSessions,
    handleSwitchSession,
    handleCreateSession,
    handleDeleteSession,
    handleDuplicateSession,
    handleRenameSession,

    // Actions
    handleForkNode,
    handleClearParent,
    handleToggleMergeSelect,
    handleClearMergeSelection,
    handleDeleteNode,
    handleBatchDelete,
    handleRetryNode,
    handleUpdateNodeContent,
    handleAutoLayout,
    handleSaveSettings,
    handleLoadGraph,
    handleResetCanvas,
    handleAddThought,
    handleConfirmMerge,
    setShowMinimap,
  };
}
