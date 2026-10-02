# `src/components/canvas/` Directory

This directory contains visual canvas components powered by `@xyflow/react`.

## Files
- `ThoughtCanvas.tsx`: Main React Flow canvas wrapper handling node rendering, background grid dots, minimap, drag-and-drop, right-click context menu events, keyboard shortcuts (<kbd>Delete</kbd>/<kbd>Backspace</kbd> for nodes/edges, <kbd>Ctrl+Z</kbd>/<kbd>Ctrl+Y</kbd> for Undo/Redo), batch operations, and full Light/Dark canvas theme adaptation.
- `CustomThoughtNode.tsx`: Custom DAG node component featuring dual-theme styling (Light & Dark), dynamic role badges that adapt accurately to the active model family (`DeepSeek AI`, `Gemini AI`, `User Thought`, `Synthesis Node`), active model tag, markdown formatting, syntax highlighting, Mermaid diagram rendering, Focus View button, adaptive error retry controls, inline prompt editing with instant "العرض المباشر / Live Preview" toggle, real-time live streaming token display with pulsating typing cursor, selectable text, action buttons, and dynamically adaptive connection handles that orient according to layout direction and connected nodes.
- `CustomEdge.tsx`: Stylized DAG edge renderer with smoothstep, bezier, and straight routing options, dynamic theme-aware stroke colors (high contrast in both light and dark modes), arrow markers, purple glow for merge paths, and dual-themed interactive `EdgeLabelRenderer` delete button.
- `CanvasControls.tsx`: Floating canvas toolbar styled to match the elegant monochrome theme, providing undo/redo actions, zoom in/out, fit-view, layout orientation toggle (Top-to-Bottom / Left-to-Right), and minimap toggles.
- `ContextMenu.tsx`: Floating right-click context menu with dual-theme styling and bilingual options for nodes (fork, focus flow & edit, merge, copy, inspect, delete, batch delete selected), and empty canvas (genesis thought, undo, redo, auto layout, fit view, sessions history).
- `BatchActionBar.tsx`: Floating dock with dual-theme styling activated during single or multi-node selections supporting batch merge synthesis, batch copying, markdown export, and bulk deletion.
- `NodeActionsContextInstance.ts`: React Context definition for canvas node action dispatches including `onUpdateNodeContent`, `onDeleteEdge`, and active `theme`.
- `NodeActionsContext.tsx`: React Context provider (`NodeActionsProvider`) distributing handlers to nested custom graph nodes cleanly without prop drilling.
- `useNodeActions.ts`: React hook allowing custom nodes to access forking, prompt editing, merging, focus flow, deletion, and inspection actions.
