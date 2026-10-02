# `src/hooks/` Directory

This directory contains custom React state hooks orchestrating graph manipulation, Gemini API calls, layout updates, and modal controls.

## Files
- `useGraphState.ts`: Primary application state hook managing React Flow nodes and edges, relationship lifecycle (`handleDeleteEdge`, `onConnect`, `onEdgesChange`, `parentIds` synchronization, cycle detection), session lifecycle management, prompt editing and child re-generation, error retry dispatch with fallback cascade, multi-branch merge selections, instant automatic hierarchical graph layout calculation on thought creation, and auto-persistence to localStorage.
