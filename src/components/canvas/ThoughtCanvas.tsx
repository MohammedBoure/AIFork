import React, { useMemo } from 'react';
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
import type { ThoughtFlowNode, ThoughtFlowEdge } from '../../types/graph';
import { CustomThoughtNode } from './CustomThoughtNode';
import { CustomEdge } from './CustomEdge';
import { CanvasControls } from './CanvasControls';
import { NodeActionsProvider } from './NodeActionsContext';
import { Merge, X } from 'lucide-react';

interface ThoughtCanvasProps {
  nodes: ThoughtFlowNode[];
  edges: ThoughtFlowEdge[];
  onNodesChange: OnNodesChange<ThoughtFlowNode>;
  onEdgesChange: OnEdgesChange<ThoughtFlowEdge>;
  onConnect: OnConnect;
  activeParentId: string | null;
  selectedForMergeIds: string[];
  onForkNode: (nodeId: string) => void;
  onToggleMergeSelect: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onAutoLayout: (direction: 'TB' | 'LR') => void;
  layoutDirection: 'TB' | 'LR';
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onOpenMergeModal: () => void;
  onClearMergeSelection: () => void;
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
  onToggleMergeSelect,
  onDeleteNode,
  onInspectNode,
  onAutoLayout,
  layoutDirection,
  showMinimap,
  onToggleMinimap,
  onOpenMergeModal,
  onClearMergeSelection,
}) => {
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
        color: '#3b82f6',
      },
    }),
    []
  );

  const actionsContextValue = useMemo(
    () => ({
      onFork: onForkNode,
      onToggleMergeSelect,
      onDeleteNode,
      onInspectNode,
      selectedForMergeIds,
      activeParentId,
    }),
    [
      onForkNode,
      onToggleMergeSelect,
      onDeleteNode,
      onInspectNode,
      selectedForMergeIds,
      activeParentId,
    ]
  );

  return (
    <NodeActionsProvider value={actionsContextValue}>
      <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-950">
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
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#1e293b"
          />

          {showMinimap && (
            <MiniMap
              zoomable
              pannable
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                const data = node.data as { role?: string; isMergeNode?: boolean };
                if (data?.isMergeNode) return '#a855f7';
                return data?.role === 'user' ? '#3b82f6' : '#8b5cf6';
              }}
              maskColor="rgba(8, 12, 20, 0.7)"
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
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

        {selectedForMergeIds.length > 0 && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-slate-900/95 border border-purple-500/40 rounded-xl p-2 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 px-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span className="text-purple-200 font-medium">
                {selectedForMergeIds.length} {selectedForMergeIds.length === 1 ? 'branch' : 'branches'} staged for Merge
              </span>
            </div>

            <button
              onClick={onOpenMergeModal}
              disabled={selectedForMergeIds.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium shadow-md shadow-purple-900/40 transition-all"
              title={selectedForMergeIds.length < 2 ? 'Select at least 2 branches to merge' : 'Open synthesis dialog'}
            >
              <Merge className="w-3.5 h-3.5" />
              <span>{selectedForMergeIds.length < 2 ? 'Pick 1 more' : 'Synthesize'}</span>
            </button>

            <button
              onClick={onClearMergeSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear merge selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </NodeActionsProvider>
  );
};
