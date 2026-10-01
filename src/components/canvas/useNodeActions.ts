import { useContext } from 'react';
import { NodeActionsContext } from './NodeActionsContextInstance';
import type { NodeActionsContextValue } from './NodeActionsContextInstance';

export function useNodeActions(): NodeActionsContextValue {
  const ctx = useContext(NodeActionsContext);
  if (!ctx) {
    return {
      onFork: () => {},
      onToggleMergeSelect: () => {},
      onDeleteNode: () => {},
      onInspectNode: () => {},
      selectedForMergeIds: [],
      activeParentId: null,
    };
  }
  return ctx;
}
