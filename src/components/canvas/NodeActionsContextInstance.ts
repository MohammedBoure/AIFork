import { createContext } from 'react';

export interface NodeActionsContextValue {
  onFork: (nodeId: string) => void;
  onOpenFocusFlow: (nodeId: string) => void;
  onToggleMergeSelect: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onRetryNode: (nodeId: string, overrideModelId?: string) => void;
  onUpdateNodeContent: (nodeId: string, newContent: string, regenerateChildren?: boolean) => void;
  onToggleCollapseNode?: (nodeId: string) => void;
  selectedForMergeIds: string[];
  activeParentId: string | null;
  theme?: 'dark' | 'light' | 'monochrome';
}

export const NodeActionsContext = createContext<NodeActionsContextValue | null>(null);
