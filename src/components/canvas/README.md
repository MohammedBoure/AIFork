# `src/components/canvas/` Directory

This directory contains visual canvas components powered by `@xyflow/react`.

## Files
- `ThoughtCanvas.tsx`: Main React Flow canvas wrapper handling node rendering, background grid dots, minimap, drag-and-drop, right-click context menu events, keyboard shortcuts (`Delete`/`Backspace`) for nodes and edges, and batch operations.
- `CustomThoughtNode.tsx`: Custom DAG node component featuring role badges (`User` / `AI`), active model tag, markdown formatting, syntax highlighting, Focus View button, adaptive error retry controls, inline prompt editing, selectable text, action buttons, and dynamically adaptive connection handles that orient according to layout direction and connected nodes.
- `CustomEdge.tsx`: Stylized DAG edge renderer with smoothstep, bezier, and straight routing options, arrow markers, purple glow for merge paths, white halo selection state, and interactive `EdgeLabelRenderer` delete button.
- `CanvasControls.tsx`: Floating canvas toolbar providing zoom in/out, fit-view, layout orientation toggle (Top-to-Bottom / Left-to-Right), and minimap toggles.
- `ContextMenu.tsx`: Floating right-click context menu with bilingual options for nodes (fork, focus flow & edit, merge, copy, inspect, delete, batch delete selected), and empty canvas (genesis thought, auto layout, fit view, sessions history).
- `BatchActionBar.tsx`: Floating dock activated during single or multi-node selections supporting batch merge synthesis, batch copying, markdown export, and bulk deletion.
- `NodeActionsContextInstance.ts`: React Context definition for canvas node action dispatches including `onUpdateNodeContent` and `onDeleteEdge`.
- `NodeActionsContext.tsx`: React Context provider (`NodeActionsProvider`) distributing handlers to nested custom graph nodes cleanly without prop drilling.
- `useNodeActions.ts`: React hook allowing custom nodes to access forking, prompt editing, merging, focus flow, deletion, and inspection actions.
