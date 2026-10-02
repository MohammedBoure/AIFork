import { useState, useCallback, useEffect, useRef } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Position,
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

interface HistorySnapshot {
  nodes: ThoughtFlowNode[];
  edges: ThoughtFlowEdge[];
  activeParentId: string | null;
}
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
import { getLayoutedElements, calculateChildPosition, wouldCreateCycle } from '../utils/dagLayout';
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
    const newSess = createSession('Session');
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

  // Canvas visual state: persist orientation across sessions and reloads
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>(() => {
    try {
      const persisted = localStorage.getItem('thoughtgraph_ai_layout_direction') as 'TB' | 'LR' | null;
      if (persisted === 'TB' || persisted === 'LR') return persisted;
    } catch {
      // ignore
    }
    return activeSessionData.layoutDirection || settings.layoutDirection || 'TB';
  });
  const [showMinimap, setShowMinimap] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal states
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);

  // History state for Undo / Redo
  const pastRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const takeSnapshot = useCallback(() => {
    pastRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      activeParentId,
    });
    if (pastRef.current.length > 50) {
      pastRef.current.shift();
    }
    futureRef.current = [];
    setHistoryState({
      canUndo: pastRef.current.length > 0,
      canRedo: false,
    });
  }, [nodes, edges, activeParentId]);

  const { canUndo, canRedo } = historyState;

  // Theme state ('dark' | 'light')
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('thoughtgraph_ai_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return settings.theme === 'light' ? 'light' : 'dark';
  });

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('thoughtgraph_ai_theme', next);
      setSettings((s) => ({ ...s, theme: next }));
      saveSettings({ ...settings, theme: next });
      return next;
    });
  }, [settings]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

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

  // Node changes with automated relationship & active state cleanup
  const onNodesChange: OnNodesChange<ThoughtFlowNode> = useCallback(
    (changes: NodeChange<ThoughtFlowNode>[]) => {
      const removedChanges = changes.filter((c) => c.type === 'remove');
      if (removedChanges.length > 0) {
        const removedIds = new Set(removedChanges.map((c) => c.id));
        setEdges((eds) => eds.filter((e) => !removedIds.has(e.source) && !removedIds.has(e.target)));
        setActiveParentId((prev) => (prev && removedIds.has(prev) ? null : prev));
        setFocusNodeId((prev) => (prev && removedIds.has(prev) ? null : prev));
        setSelectedForMergeIds((prev) => prev.filter((id) => !removedIds.has(id)));
      }
      setNodes((nds) => applyNodeChanges(changes, nds) as ThoughtFlowNode[]);
    },
    []
  );

  // Edge changes with parentIds synchronization
  const onEdgesChange: OnEdgesChange<ThoughtFlowEdge> = useCallback(
    (changes: EdgeChange<ThoughtFlowEdge>[]) => {
      const removedChanges = changes.filter((c) => c.type === 'remove');
      if (removedChanges.length > 0) {
        const removedIds = new Set(removedChanges.map((c) => c.id));
        setEdges((currentEdges) => {
          const removedEdgesList = currentEdges.filter((e) => removedIds.has(e.id));
          if (removedEdgesList.length > 0) {
            setNodes((currentNodes) =>
              currentNodes.map((node) => {
                const incomingRemoved = removedEdgesList.filter((e) => e.target === node.id);
                if (incomingRemoved.length > 0 && node.data.parentIds) {
                  const sourcesToRemove = new Set(incomingRemoved.map((e) => e.source));
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      parentIds: node.data.parentIds.filter((pId) => !sourcesToRemove.has(pId)),
                    },
                  };
                }
                return node;
              })
            );
          }
          return applyEdgeChanges(changes, currentEdges) as ThoughtFlowEdge[];
        });
        return;
      }
      setEdges((eds) => applyEdgeChanges(changes, eds) as ThoughtFlowEdge[]);
    },
    []
  );

  // Delete single edge explicitly and update target node's parentIds
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      takeSnapshot();
      setEdges((currentEdges) => {
        const edgeToDelete = currentEdges.find((e) => e.id === edgeId);
        if (!edgeToDelete) return currentEdges;

        const { source, target } = edgeToDelete;
        setNodes((currentNodes) =>
          currentNodes.map((node) => {
            if (node.id === target && node.data.parentIds) {
              return {
                ...node,
                data: {
                  ...node.data,
                  parentIds: node.data.parentIds.filter((pId) => pId !== source),
                },
              };
            }
            return node;
          })
        );

        return currentEdges.filter((e) => e.id !== edgeId);
      });
      addToast('info', 'Relationship removed.');
    },
    [takeSnapshot, addToast]
  );

  // Connection handler creating new relationships and synchronizing parentIds
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      if (params.source === params.target) {
        addToast('error', 'Cannot connect a node to itself.');
        return;
      }

      // Check if relationship already exists
      const exists = edges.some(
        (e) => e.source === params.source && e.target === params.target
      );
      if (exists) {
        addToast('info', 'Relationship already exists between these nodes.');
        return;
      }

      // Check DAG cycle
      if (wouldCreateCycle(params.source, params.target, edges)) {
        addToast('error', 'Cannot create relationship: This would form a circular loop (DAG requirement).');
        return;
      }

      takeSnapshot();

      const newEdge: ThoughtFlowEdge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined,
        type: settings.edgeType || 'smoothstep',
        animated: true,
      };

      setEdges((eds) => addEdge(newEdge, eds) as ThoughtFlowEdge[]);

      // Append source to target node's parentIds
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === params.target) {
            const currentParents = node.data.parentIds || [];
            if (!currentParents.includes(params.source!)) {
              return {
                ...node,
                data: {
                  ...node.data,
                  parentIds: [...currentParents, params.source!],
                },
              };
            }
          }
          return node;
        })
      );

      addToast('success', 'New relationship connected.');
    },
    [edges, settings.edgeType, takeSnapshot, addToast]
  );

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
    takeSnapshot();
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (activeParentId === nodeId) setActiveParentId(null);
    if (focusNodeId === nodeId) setFocusNodeId(null);
    setSelectedForMergeIds((prev) => prev.filter((id) => id !== nodeId));
    addToast('info', 'Node deleted from canvas.');
  }, [activeParentId, focusNodeId, takeSnapshot, addToast]);

  // Batch delete selected nodes
  const handleBatchDelete = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    takeSnapshot();
    const idSet = new Set(nodeIds);
    setNodes((nds) => nds.filter((n) => !idSet.has(n.id)));
    setEdges((eds) => eds.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)));
    if (activeParentId && idSet.has(activeParentId)) setActiveParentId(null);
    if (focusNodeId && idSet.has(focusNodeId)) setFocusNodeId(null);
    setSelectedForMergeIds((prev) => prev.filter((id) => !idSet.has(id)));
    addToast('info', `Deleted ${nodeIds.length} nodes from canvas.`);
  }, [activeParentId, focusNodeId, takeSnapshot, addToast]);

  // Unified Auto-layout executor with persistent orientation
  const runAutoLayout = useCallback(
    (targetDirection: 'TB' | 'LR' = layoutDirection, recordSnapshot = true, showToast = true) => {
      if (recordSnapshot) {
        takeSnapshot();
      }
      setLayoutDirection(targetDirection);
      try {
        localStorage.setItem('thoughtgraph_ai_layout_direction', targetDirection);
      } catch {
        // ignore
      }
      setSettings((prev) => ({ ...prev, layoutDirection: targetDirection }));

      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          const layouted = getLayoutedElements(currentNodes, currentEdges, targetDirection);
          setTimeout(() => {
            setNodes(layouted.nodes);
          }, 0);
          return layouted.edges;
        });
        return currentNodes;
      });

      if (showToast) {
        addToast(
          'success',
          targetDirection === 'TB'
            ? 'تم ضبط الاتجاه للأمام (عمودي خطي تحت بعض)'
            : 'تم ضبط الاتجاه للجانب (أفقي خطي)'
        );
      }
    },
    [layoutDirection, takeSnapshot, addToast]
  );

  // Auto-layout trigger
  const handleAutoLayout = useCallback(
    (direction?: 'TB' | 'LR') => {
      runAutoLayout(direction || layoutDirection, true, true);
    },
    [layoutDirection, runAutoLayout]
  );

  // Undo previous action
  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current.pop()!;
    futureRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      activeParentId,
    });
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setActiveParentId(previous.activeParentId);
    setHistoryState({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    });
    addToast('info', 'تم التراجع (Undo)');
  }, [nodes, edges, activeParentId, addToast]);

  // Redo previously undone action
  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      activeParentId,
    });
    setNodes(next.nodes);
    setEdges(next.edges);
    setActiveParentId(next.activeParentId);
    setHistoryState({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    });
    addToast('info', 'تمت الإعادة (Redo)');
  }, [nodes, edges, activeParentId, addToast]);

  // Save Settings
  const handleSaveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (newSettings.layoutDirection && newSettings.layoutDirection !== layoutDirection) {
      runAutoLayout(newSettings.layoutDirection, true, false);
    }
    if (newSettings.provider !== settings.provider) {
      setAvailableModels(getPresetModelsForProvider(newSettings.provider));
    }
    addToast('success', 'Settings saved successfully.');
  }, [settings.provider, layoutDirection, runAutoLayout, addToast]);

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
    takeSnapshot();
    setNodes([]);
    setEdges([]);
    setActiveParentId(null);
    setFocusNodeId(null);
    setSelectedForMergeIds([]);
    addToast('info', 'تمت تهيئة الكانفاس لمساحة عمل فارغة جديدة.');
  }, [takeSnapshot, addToast]);

  // Switch to another session
  const handleSwitchSession = useCallback((sessionId: string) => {
    const targetSession = loadSession(sessionId);
    if (!targetSession) {
      addToast('error', 'تعذر العثور على بيانات الجلسة المطلوبة.');
      return;
    }

    pastRef.current = [];
    futureRef.current = [];
    setHistoryState({ canUndo: false, canRedo: false });

    setCurrentSessionId(targetSession.id);
    setCurrentSessionTitle(targetSession.title);
    setNodes(JSON.parse(JSON.stringify(targetSession.nodes)));
    setEdges(JSON.parse(JSON.stringify(targetSession.edges)));
    setActiveParentId(targetSession.activeParentId || null);
    setSelectedForMergeIds([]);
    setActiveSessionId(targetSession.id);
    if (targetSession.layoutDirection) {
      setLayoutDirection(targetSession.layoutDirection);
      try {
        localStorage.setItem('thoughtgraph_ai_layout_direction', targetSession.layoutDirection);
      } catch {
        // ignore
      }
    }
    addToast('info', `تم الانتقال إلى: "${targetSession.title}".`);
  }, [addToast]);

  // Create a new session
  const handleCreateSession = useCallback(
    (title?: string, initialData?: { nodes: ThoughtFlowNode[]; edges: ThoughtFlowEdge[]; activeParentId?: string | null }) => {
      const existingSessions = loadSessionsIndex();
      const sessionTitle = title || (existingSessions.length === 0 ? 'Session' : `Session ${existingSessions.length + 1}`);
      const newSession = createSession(sessionTitle, {
        ...initialData,
        layoutDirection,
      });
      setSessions(loadSessionsIndex());
      handleSwitchSession(newSession.id);
      addToast('success', `Created "${newSession.title}".`);
      return newSession.id;
    },
    [layoutDirection, handleSwitchSession, addToast]
  );

  // Toggle container state (collapse / expand on demand) for an individual node
  const handleToggleCollapseNode = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                isCollapsed: !n.data.isCollapsed,
              },
            }
          : n
      )
    );
  }, []);

  // Toggle container state for all nodes (containerize all or expand all)
  const handleToggleCollapseAll = useCallback(() => {
    setNodes((nds) => {
      const allCollapsed = nds.length > 0 && nds.every((n) => n.data.isCollapsed);
      const targetState = !allCollapsed;
      const updated = nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isCollapsed: targetState,
        },
      }));
      if (settings.autoLayoutOnAdd) {
        const layouted = getLayoutedElements(updated, edges, layoutDirection);
        setTimeout(() => setNodes(layouted.nodes), 0);
      }
      addToast(
        'info',
        targetState
          ? 'تم وضع كافة نصوص الأسئلة والردود في حاويات (إخفاء إلا عند الطلب)'
          : 'تم توسيع كافة الحاويات وعرض النصوص كاملة'
      );
      return updated;
    });
  }, [edges, layoutDirection, settings.autoLayoutOnAdd, addToast]);

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
        const fresh = createSession('Session');
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

      takeSnapshot();
      setIsGenerating(true);

      const timestamp = Date.now();
      const userNodeId = `node-user-${timestamp}`;
      const assistantNodeId = `node-ai-${timestamp + 1}`;

      const targetParent = parentOverride !== undefined ? parentOverride : activeParentId;
      const parentIds = targetParent ? [targetParent] : [];

      // Calculate placement position respecting current layout direction
      const userPos = calculateChildPosition(parentIds, nodes, edges, layoutDirection);
      const isLR = layoutDirection === 'LR';
      const aiPos = isLR
        ? { x: userPos.x + 420, y: userPos.y }
        : { x: userPos.x, y: userPos.y + 300 };

      // 1. Create User Node
      const userNode: ThoughtFlowNode = {
        id: userNodeId,
        type: 'thought',
        position: userPos,
        targetPosition: isLR ? Position.Left : Position.Top,
        sourcePosition: isLR ? Position.Right : Position.Bottom,
        data: {
          id: userNodeId,
          role: 'user',
          content: userPrompt,
          parentIds,
          createdAt: timestamp,
          status: 'idle',
          isCollapsed: Boolean(settings.collapseNodesByDefault),
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
        targetPosition: isLR ? Position.Left : Position.Top,
        sourcePosition: isLR ? Position.Right : Position.Bottom,
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

      const rawNodes = [...nodes, userNode, assistantNode];
      const allEdges = [...edges, ...newEdges, aiEdge];

      // Automatically layout immediately so newly added nodes appear in exact hierarchical order
      let updatedNodes = rawNodes;
      let updatedEdges = allEdges;
      if (settings.autoLayoutOnAdd) {
        const layouted = getLayoutedElements(rawNodes, allEdges, layoutDirection);
        updatedNodes = layouted.nodes;
        updatedEdges = layouted.edges;
      }

      setNodes(updatedNodes);
      setEdges(updatedEdges);
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
                    isCollapsed: Boolean(settings.collapseNodesByDefault),
                  },
                }
              : n
          )
        );

        if (result.switchedKey) {
          const sk = result.switchedKey;
          setSettings((prev) => ({
            ...prev,
            ...(sk.provider === 'gemini'
              ? { apiKey: sk.key, activeGeminiKeyId: sk.id }
              : { openRouterApiKey: sk.key, activeOpenRouterKeyId: sk.id }),
          }));
        }

        if (result.fallbackNotice) {
          addToast('info', result.fallbackNotice);
        }

        if (settings.autoLayoutOnAdd) {
          setTimeout(() => {
            runAutoLayout(layoutDirection, false, false);
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
      layoutDirection,
      takeSnapshot,
      runAutoLayout,
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

        if (result.switchedKey) {
          const sk = result.switchedKey;
          setSettings((prev) => ({
            ...prev,
            ...(sk.provider === 'gemini'
              ? { apiKey: sk.key, activeGeminiKeyId: sk.id }
              : { openRouterApiKey: sk.key, activeOpenRouterKeyId: sk.id }),
          }));
        }

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

      takeSnapshot();

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
    [nodes, edges, handleRetryNode, takeSnapshot, addToast]
  );

  /**
   * Multi-Branch Synthesis (Merge Execution)
   */
  const handleConfirmMerge = useCallback(
    async (synthesisPrompt: string, modelId: string) => {
      if (selectedForMergeIds.length < 2 || isGenerating) return;

      takeSnapshot();
      setIsGenerating(true);
      setIsMergeModalOpen(false);

      const timestamp = Date.now();
      const mergeNodeId = `node-merge-${timestamp}`;

      const selectedNodes = nodes.filter((n) => selectedForMergeIds.includes(n.id));
      const mergePos = calculateChildPosition(selectedForMergeIds, nodes, edges, layoutDirection);

      const isLR = layoutDirection === 'LR';
      const mergeNode: ThoughtFlowNode = {
        id: mergeNodeId,
        type: 'thought',
        position: mergePos,
        targetPosition: isLR ? Position.Left : Position.Top,
        sourcePosition: isLR ? Position.Right : Position.Bottom,
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

      const rawNodes = [...nodes, mergeNode];
      const allEdges = [...edges, ...mergeEdges];

      let finalNodes = rawNodes;
      let finalEdges = allEdges;
      if (settings.autoLayoutOnAdd) {
        const layouted = getLayoutedElements(rawNodes, allEdges, layoutDirection);
        finalNodes = layouted.nodes;
        finalEdges = layouted.edges;
      }

      setNodes(finalNodes);
      setEdges(finalEdges);
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
                    isCollapsed: Boolean(settings.collapseNodesByDefault),
                  },
                }
              : n
          )
        );

        if (result.switchedKey) {
          const sk = result.switchedKey;
          setSettings((prev) => ({
            ...prev,
            ...(sk.provider === 'gemini'
              ? { apiKey: sk.key, activeGeminiKeyId: sk.id }
              : { openRouterApiKey: sk.key, activeOpenRouterKeyId: sk.id }),
          }));
        }

        if (result.fallbackNotice) {
          addToast('info', result.fallbackNotice);
        }

        addToast('success', `Merged ${selectedNodes.length} branches successfully using ${actualModel}!`);

        if (settings.autoLayoutOnAdd) {
          setTimeout(() => {
            runAutoLayout(layoutDirection, false, false);
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
      layoutDirection,
      takeSnapshot,
      runAutoLayout,
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

    // Theme & Undo/Redo
    theme,
    toggleTheme,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,

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
    handleDeleteEdge,
    handleBatchDelete,
    handleRetryNode,
    handleUpdateNodeContent,
    handleAutoLayout,
    handleToggleCollapseNode,
    handleToggleCollapseAll,
    allCollapsed: nodes.length > 0 && nodes.every((n) => n.data.isCollapsed),
    handleSaveSettings,
    handleLoadGraph,
    handleResetCanvas,
    handleAddThought,
    handleConfirmMerge,
    setShowMinimap,
  };
}
