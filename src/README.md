# `src/` Directory

This is the primary application source directory for ThoughtGraph AI.

## Architecture & Subdirectories
- `components/`: UI components categorized into `canvas`, `prompt`, `settings`, `modals`, and `ui`.
- `hooks/`: State management hooks (`useGraphState.ts`) coordinating nodes, branches, and API integration.
- `services/`: External API calls (`gemini.ts`), persistence & serialization (`storage.ts`), and pre-built DAG templates (`mockData.ts`).
- `types/`: TypeScript definitions (`graph.ts`) defining `ThoughtNodeData`, graph states, and Gemini payloads.
- `utils/`: Algorithmic modules for branch context resolution (`contextResolver.ts`), DAG auto-layout (`dagLayout.ts`), and formatting helpers (`formatters.ts`).

## Top-Level Files
- `App.tsx`: Root React component orchestrating the canvas, prompt bar, modals, and React Flow provider.
- `main.tsx`: Entry point mounting the React root into the DOM.
- `index.css`: Global styles including Tailwind CSS imports, React Flow theme variables, and markdown prose styles.
- `App.css`: Auxiliary styling overrides.
