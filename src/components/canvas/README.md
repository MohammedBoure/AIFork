# `src/components/canvas/` Directory

This directory contains visual canvas components powered by `@xyflow/react`.

## Files
- `ThoughtCanvas.tsx`: Main React Flow canvas wrapper handling node rendering, background grid dots, minimap, drag-and-drop, and floating merge dock.
- `CustomThoughtNode.tsx`: Custom DAG node component featuring role badges (`User` / `Gemini AI`), active model tag (`gemini-2.5-flash`, `gemini-2.5-pro`), markdown formatting, syntax highlighting, and action controls (`Fork from here`, `Select for Merge`, `Delete`).
- `CustomEdge.tsx`: Stylized DAG edge renderer with smoothstep, bezier, and straight routing options, arrow markers, and purple glow for merge paths.
- `CanvasControls.tsx`: Floating canvas toolbar providing zoom in/out, fit-view, layout orientation toggle (Top-to-Bottom / Left-to-Right), and minimap toggles.
- `NodeActionsContextInstance.ts`: React Context definition for canvas node action dispatches.
- `NodeActionsContext.tsx`: React Context provider (`NodeActionsProvider`) distributing handlers to nested custom graph nodes cleanly without prop drilling.
- `useNodeActions.ts`: React hook allowing custom nodes to access forking, merging, deletion, and inspection actions.
