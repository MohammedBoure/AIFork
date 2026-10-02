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
  onOpenTemplates: () => void;
  onOpenSessions?: () => void;
  onBatchDelete: (nodeIds: string[]) => void;
  onDeleteEdge?: (edgeId: string) => void;
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
  onOpenTemplates,
  onOpenSessions,
  onBatchDelete,
  onDeleteEdge,
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

  // Global Keyboard shortcuts for deleting selected nodes and edges
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
  }, [multiSelectedNodeIds, edges, onBatchDelete, onDeleteEdge]);

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
        color: '#71717a',
      },
    }),
    []
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
      selectedForMergeIds,
      activeParentId,
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
      selectedForMergeIds,
      activeParentId,
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
      <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-black select-none">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
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
            color="#27272a"
          />

          {showMinimap && (
            <MiniMap
              zoomable
              pannable
              nodeStrokeWidth={2}
              nodeColor={(node) => {
                const data = node.data as { role?: string; isMergeNode?: boolean };
                if (data?.isMergeNode) return '#a855f7';
                return data?.role === 'user' ? '#e4e4e7' : '#71717a';
              }}
              maskColor="rgba(9, 9, 11, 0.8)"
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                border: '1px solid #27272a',
                borderRadius: '12px',
                backgroundColor: '#09090b',
              }}
            />
          )}
        </ReactFlow>

        <CanvasControls
          onAutoLayout={onAutoLayout}
          layoutDirection={layoutDirection}
          showMinimap={showMinimap}
          onToggleMinimap={onToggleMinimap}
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
          onOpenTemplates={onOpenTemplates}
          onOpenSessions={onOpenSessions}
          isSelectedForMerge={
            Boolean(contextMenu.nodeId && selectedForMergeIds.includes(contextMenu.nodeId))
          }
          multiSelectedCount={multiSelectedNodeIds.length}
          onBatchDeleteSelected={() => onBatchDelete(multiSelectedNodeIds)}
        />
      </div>
    </NodeActionsProvider>
  );
};
