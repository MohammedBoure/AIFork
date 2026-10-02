# `src/types/` Directory

This directory contains TypeScript type definitions and interfaces for ThoughtGraph AI.

## Files
- `graph.ts`: Core data structures including `ThoughtNodeData` (role, content, modelUsed, parentIds, createdAt), `ThoughtFlowNode`, `ThoughtFlowEdge`, `ModelOption`, `AIProvider` (`openrouter` | `gemini`), `AppSettings` (with OpenRouter and Gemini API keys), `GraphSessionMeta`, `GraphSession`, `SerializedGraph`, `OpenRouterChatMessage`, `GeminiChatMessage`, and `GenerateAIResult`.
- `mermaid.d.ts`: TypeScript module declaration and interfaces for the `mermaid` diagramming engine (`MermaidConfig`, `RenderResult`).
