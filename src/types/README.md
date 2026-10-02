# `src/types/` Directory

This directory contains TypeScript type definitions and interfaces for ThoughtGraph AI.

## Files
- `graph.ts`: Core data structures including `ThoughtNodeData` (role, content, modelUsed, parentIds, createdAt), `ThoughtFlowNode`, `ThoughtFlowEdge`, `ModelOption`, `AIProvider` (`openrouter` | `gemini`), `ApiKeyItem` (multi-key storage with custom labels and provider tracking), `AppSettings` (with dual-engine API keys, named `apiKeys` list, active key pointers, and auto-quota failover toggle), `GraphSessionMeta`, `GraphSession`, `SerializedGraph`, `OpenRouterChatMessage`, `GeminiChatMessage`, and `GenerateAIResult` (with `switchedKey` reporting).
- `mermaid.d.ts`: TypeScript module declaration and interfaces for the `mermaid` diagramming engine (`MermaidConfig`, `RenderResult`).
