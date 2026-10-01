import React, { useMemo, useState, useCallback } from 'react';
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
  onAutoLayout: (direction: 'TB' | 'LR') => void;
  layoutDirection: 'TB' | 'LR';
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onOpenMergeModal: () => void;
  onClearMergeSelection: () => void;
  onNewGenesisThought: () => void;
  onOpenTemplates: () => void;
  onBatchDelete: (nodeIds: string[]) => void;
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
  onAutoLayout,
  layoutDirection,
  showMinimap,
  onToggleMinimap,
  onOpenMergeModal,
  onClearMergeSelection,
  onNewGenesisThought,
  onOpenTemplates,
  onBatchDelete,
}) => {
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Track multi-selected nodes from React Flow
  const multiSelectedNodeIds = useMemo(() => {
    const selected = nodes.filter((n) => n.selected).map((n) => n.id);
    // Combine with selectedForMergeIds if any
    return Array.from(new Set([...selected, ...selectedForMergeIds]));
  }, [nodes, selectedForMergeIds]);

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
      onInspectNode,
      onRetryNode,
      selectedForMergeIds,
      activeParentId,
    }),
    [
      onForkNode,
      onOpenFocusFlow,
      onToggleMergeSelect,
      onDeleteNode,
      onInspectNode,
      onRetryNode,
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

        {/* Batch Action Dock for Multi-Selection */}
        {multiSelectedNodeIds.length >= 2 && (
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
          isSelectedForMerge={
            Boolean(contextMenu.nodeId && selectedForMergeIds.includes(contextMenu.nodeId))
          }
        />
      </div>
    </NodeActionsProvider>
  );
};
