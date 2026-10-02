# `src/services/` Directory

This directory contains external integrations and data persistence.

## Files
- `aiRouter.ts`: Unified AI dispatcher that dynamically routes requests to OpenRouter (DeepSeek) or Google Gemini based on model format and user settings with token streaming support, rate-limit detection (`isQuotaExhaustedError`), and automatic failover across named secondary API keys with a 3-second cooldown on quota exhaustion (HTTP 429).
- `openrouter.ts`: Manages OpenRouter API integration, DeepSeek presets (`deepseek-chat`, `deepseek-r1`, free variants), key authentication testing (`testOpenRouterApiKey`), model discovery, real-time SSE streaming (`stream: true`), and DeepSeek reasoning content formatting.
- `gemini.ts`: Manages Google Gemini API communication, key verification (`testGeminiApiKey`), model listing (`fetchAvailableGeminiModels`), real-time SSE token streaming (`streamGenerateContent?alt=sse`), realistic streaming simulation, and automatic fallback cascades on HTTP 503 and 429.
- `storage.ts`: Handles session management (`loadSessionsIndex`, `loadSession`, `saveSession`, `createSession`, `deleteSession`, `duplicateSession`, `renameSession`), auto-migration of legacy keys to named multi-key collections, active key synchronization, `localStorage` persistence, JSON graph export and import, and Markdown export for single branches or the entire DAG.
