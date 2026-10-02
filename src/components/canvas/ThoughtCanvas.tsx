import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  MarkerType,
} from '@xyflow/react';
import type {
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';
import type { ThoughtFlowNode, ThoughtFlowEdge, ContextMenuState } from '../../types/graph';
import { CustomThoughtNode } from './CustomThoughtNode';
import { CustomEdge } from './CustomEdge';
import { CanvasControls } from './CanvasControls';
import { NodeActionsProvider } from './NodeActionsContext';
import { ContextMenu } from './ContextMenu';
import { BatchActionBar } from './BatchActionBar';
import { copyToClipboard } from '../../utils/formatters';

interface ThoughtCanvasProps {
  nodes: ThoughtFlowNode[];
  edges: ThoughtFlowEdge[];
  onNodesChange: OnNodesChange<ThoughtFlowNode>;
  onEdgesChange: OnEdgesChange<ThoughtFlowEdge>;
  onConnect: OnConnect;
  activeParentId: string | null;
  selectedForMergeIds: string[];
  onForkNode: (nodeId: string) => void;
  onOpenFocusFlow: (nodeId: string) => void;
  onToggleMergeSelect: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onRetryNode: (nodeId: string) => void;
  onUpdateNodeContent: (nodeId: string, newContent: string, regenerateChildren?: boolean) => void;
  onAutoLayout: (direction: 'TB' | 'LR') => void;
  layoutDirection: 'TB' | 'LR';
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onOpenMergeModal: () => void;
  onClearMergeSelection: () => void;
  onNewGenesisThought: () => void;
  onOpenSessions?: () => void;
  onBatchDelete: (nodeIds: string[]) => void;
  onDeleteEdge?: (edgeId: string) => void;
  theme?: 'dark' | 'light' | 'monochrome';
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleCollapseNode?: (nodeId: string) => void;
  onToggleCollapseAll?: () => void;
  allCollapsed?: boolean;
}

export const ThoughtCanvas: React.FC<ThoughtCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  activeParentId,
  selectedForMergeIds,
  onForkNode,
  onOpenFocusFlow,
  onToggleMergeSelect,
  onDeleteNode,
  onInspectNode,
  onRetryNode,
  onUpdateNodeContent,
  onAutoLayout,
  layoutDirection,
  showMinimap,
  onToggleMinimap,
  onOpenMergeModal,
  onClearMergeSelection,
  onNewGenesisThought,
  onOpenSessions,
  onBatchDelete,
  onDeleteEdge,
  theme = 'dark',
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onToggleCollapseNode,
  onToggleCollapseAll,
  allCollapsed = false,
}) => {
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Track multi-selected nodes from React Flow and merge selection
  const multiSelectedNodeIds = useMemo(() => {
    const selected = nodes.filter((n) => n.selected).map((n) => n.id);
    return Array.from(new Set([...selected, ...selectedForMergeIds]));
  }, [nodes, selectedForMergeIds]);

  // Global Keyboard shortcuts for deleting selected nodes/edges and Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable ||
          activeEl.closest('input, textarea, [contenteditable="true"]'))
      ) {
        return;
      }

      // Undo / Redo Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (onRedo) {
            e.preventDefault();
            onRedo();
          }
        } else {
          if (onUndo) {
            e.preventDefault();
            onUndo();
          }
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (onRedo) {
          e.preventDefault();
          onRedo();
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // 1. Delete selected nodes if any
        if (multiSelectedNodeIds.length > 0) {
          e.preventDefault();
          onBatchDelete(multiSelectedNodeIds);
          return;
        }

        // 2. Delete selected edges if any
        if (onDeleteEdge) {
          const selectedEdges = edges.filter((edge) => edge.selected);
          if (selectedEdges.length > 0) {
            e.preventDefault();
            selectedEdges.forEach((edge) => onDeleteEdge(edge.id));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [multiSelectedNodeIds, edges, onBatchDelete, onDeleteEdge, onUndo, onRedo]);

  // Static node types object
  const nodeTypes = useMemo(
    () => ({
      thought: CustomThoughtNode,
    }),
    []
  );

  // Static edge types object
  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
      smoothstep: CustomEdge,
    }),
    []
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'custom',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: theme === 'light' ? '#64748b' : '#71717a',
      },
    }),
    [theme]
  );

  const actionsContextValue = useMemo(
    () => ({
      onFork: onForkNode,
      onOpenFocusFlow,
      onToggleMergeSelect,
      onDeleteNode,
      onDeleteEdge,
      onInspectNode,
      onRetryNode,
      onUpdateNodeContent,
      onToggleCollapseNode,
      selectedForMergeIds,
      activeParentId,
      theme,
    }),
    [
      onForkNode,
      onOpenFocusFlow,
      onToggleMergeSelect,
      onDeleteNode,
      onDeleteEdge,
      onInspectNode,
      onRetryNode,
      onUpdateNodeContent,
      onToggleCollapseNode,
      selectedForMergeIds,
      activeParentId,
      theme,
    ]
  );

  // Right-click on a node
  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: ThoughtFlowNode) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  // Right-click on empty canvas pane
  const handlePaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

  const handleCopyNodeContent = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        copyToClipboard(node.data.content);
      }
    },
    [nodes]
  );

  return (
    <NodeActionsProvider value={actionsContextValue}>
      <div
        className={`relative w-full h-[calc(100vh-3.5rem)] overflow-hidden select-none transition-colors duration-200 ${
          theme === 'light' ? 'light bg-slate-50 text-zinc-900' : 'dark bg-black text-zinc-100'
        }`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          colorMode={theme === 'light' ? 'light' : 'dark'}
          className={theme === 'light' ? 'light' : 'dark'}
          style={{
            backgroundColor: theme === 'light' ? '#f8fafc' : '#000000',
          }}
          fitView
          minZoom={0.15}
          maxZoom={2}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          selectionOnDrag={true}
          panOnDrag={[1, 2]} // Pan with middle button or right drag, box select with left drag or shift+left
          deleteKeyCode={['Backspace', 'Delete']}
          onDelete={({ nodes: delNodes, edges: delEdges }) => {
            if (delNodes && delNodes.length > 0) {
              onBatchDelete(delNodes.map((n) => n.id));
            }
            if (delEdges && delEdges.length > 0 && onDeleteEdge) {
              delEdges.forEach((e) => onDeleteEdge(e.id));
            }
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color={theme === 'light' ? '#94a3b8' : '#3f3f46'}
            bgColor={theme === 'light' ? '#f8fafc' : '#000000'}
            style={{
              backgroundColor: theme === 'light' ? '#f8fafc' : '#000000',
            }}
          />

          {showMinimap && (
            <MiniMap
              zoomable
              pannable
              nodeStrokeWidth={2}
              nodeColor={(node) => {
                const data = node.data as { role?: string; isMergeNode?: boolean };
                if (data?.isMergeNode) return '#a855f7';
                return data?.role === 'user'
                  ? theme === 'light'
                    ? '#09090b'
                    : '#e4e4e7'
                  : theme === 'light'
                  ? '#94a3b8'
                  : '#71717a';
              }}
              maskColor={theme === 'light' ? 'rgba(241, 245, 249, 0.7)' : 'rgba(9, 9, 11, 0.8)'}
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #27272a',
                borderRadius: '12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#09090b',
              }}
            />
          )}
        </ReactFlow>

        <CanvasControls
          onAutoLayout={onAutoLayout}
          layoutDirection={layoutDirection}
          showMinimap={showMinimap}
          onToggleMinimap={onToggleMinimap}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
          onToggleCollapseAll={onToggleCollapseAll}
          allCollapsed={allCollapsed}
        />

        {/* Batch Action Dock for Multi-Selection & Quick Deletion */}
        {multiSelectedNodeIds.length >= 1 && (
          <BatchActionBar
            selectedNodeIds={multiSelectedNodeIds}
            nodes={nodes}
            onOpenMergeModal={onOpenMergeModal}
            onBatchDelete={onBatchDelete}
            onClearSelection={onClearMergeSelection}
          />
        )}

        {/* Right-Click Context Menu */}
        <ContextMenu
          menuState={contextMenu}
          onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
          onForkNode={onForkNode}
          onOpenFocusFlow={onOpenFocusFlow}
          onToggleMergeSelect={onToggleMergeSelect}
          onCopyNodeContent={handleCopyNodeContent}
          onInspectNode={onInspectNode}
          onDeleteNode={onDeleteNode}
          onNewGenesisThought={onNewGenesisThought}
          onAutoLayout={onAutoLayout}
          onFitView={() => onAutoLayout(layoutDirection)}
          onOpenSessions={onOpenSessions}
          isSelectedForMerge={
            Boolean(contextMenu.nodeId && selectedForMergeIds.includes(contextMenu.nodeId))
          }
          multiSelectedCount={multiSelectedNodeIds.length}
          onBatchDeleteSelected={() => onBatchDelete(multiSelectedNodeIds)}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>
    </NodeActionsProvider>
  );
};
