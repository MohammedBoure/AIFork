import { useContext } from 'react';
import { NodeActionsContext } from './NodeActionsContextInstance';
import type { NodeActionsContextValue } from './NodeActionsContextInstance';

export function useNodeActions(): NodeActionsContextValue {
  const ctx = useContext(NodeActionsContext);
  if (!ctx) {
    return {
      onFork: () => {},
      onOpenFocusFlow: () => {},
      onToggleMergeSelect: () => {},
      onDeleteNode: () => {},
      onInspectNode: () => {},
      onRetryNode: () => {},
      onUpdateNodeContent: () => {},
      selectedForMergeIds: [],
      activeParentId: null,
    };
  }
  return ctx;
}
