# `src/hooks/` Directory

This directory contains custom React state hooks orchestrating graph manipulation, Gemini API calls, layout updates, and modal controls.

## Files
- `useGraphState.ts`: Primary application state hook managing React Flow nodes and edges, history snapshots stack for Undo / Redo (<kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd>), persistent linear layout direction ('TB' - forward stacked under each other vs 'LR' - sideways), dynamic Light/Dark theme switching with local persistence, relationship lifecycle (`handleDeleteEdge`, `onConnect`, `onEdgesChange`, `parentIds` synchronization, cycle detection), session lifecycle management, prompt editing and child re-generation, error retry dispatch with fallback cascade, multi-branch merge selections, instant automatic hierarchical graph layout calculation on thought creation, and auto-persistence to localStorage.
