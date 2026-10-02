# `src/` Directory

This is the primary application source directory for ThoughtGraph AI.

## Architecture & Subdirectories
- `components/`: UI components categorized into `canvas`, `prompt`, `settings`, `modals`, `focus`, and `ui`.
- `hooks/`: State management hooks (`useGraphState.ts`) coordinating nodes, branches, session history, and API integration.
- `i18n/`: Bilingual internationalization framework (`LanguageContext.tsx`, `translations.ts`) for seamless Arabic and English rendering.
- `services/`: Unified AI router (`aiRouter.ts`), OpenRouter & DeepSeek client (`openrouter.ts`), Google Gemini client (`gemini.ts`), and session persistence & serialization (`storage.ts`).
- `types/`: TypeScript definitions (`graph.ts`) defining `ThoughtNodeData`, graph states, sessions, provider configurations, and chat payloads.
- `utils/`: Algorithmic modules for branch context resolution (`contextResolver.ts`), DAG auto-layout (`dagLayout.ts`), and formatting helpers (`formatters.ts`).

## Top-Level Files
- `App.tsx`: Root React component orchestrating the canvas, prompt bar, modals, React Flow provider, and LanguageProvider.
- `main.tsx`: Entry point mounting the React root into the DOM.
- `index.css`: Global styles including Tailwind CSS imports, React Flow theme variables, and markdown prose styles.
- `App.css`: Auxiliary styling overrides.
