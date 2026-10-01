import React from 'react';
import { NodeActionsContext } from './NodeActionsContextInstance';
import type { NodeActionsContextValue } from './NodeActionsContextInstance';

export const NodeActionsProvider: React.FC<{
  value: NodeActionsContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <NodeActionsContext.Provider value={value}>
      {children}
    </NodeActionsContext.Provider>
  );
};
