# `src/hooks/` Directory

This directory contains custom React state hooks orchestrating graph manipulation, Gemini API calls, layout updates, and modal controls.

## Files
- `useGraphState.ts`: Primary application state hook managing React Flow nodes and edges, active fork parent tracking, prompt editing and child re-generation (`handleUpdateNodeContent`), error retry dispatch with fallback cascade, multi-branch merge selections, incremental streaming node generation, and auto-persistence to localStorage.
