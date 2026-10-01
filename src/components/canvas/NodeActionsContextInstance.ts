import { createContext } from 'react';

export interface NodeActionsContextValue {
  onFork: (nodeId: string) => void;
  onToggleMergeSelect: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  selectedForMergeIds: string[];
  activeParentId: string | null;
}

export const NodeActionsContext = createContext<NodeActionsContextValue | null>(null);
