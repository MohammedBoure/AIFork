# `src/services/` Directory

This directory contains external integrations, data persistence, and starter templates.

## Files
- `aiRouter.ts`: Unified AI dispatcher that dynamically routes requests to OpenRouter (DeepSeek) or Google Gemini based on model format and user settings.
- `openrouter.ts`: Manages OpenRouter API integration, DeepSeek presets (`deepseek-chat`, `deepseek-r1`, free variants), key authentication testing (`testOpenRouterApiKey`), model discovery, and DeepSeek reasoning content formatting.
- `gemini.ts`: Manages Google Gemini API communication, key verification (`testGeminiApiKey`), model listing (`fetchAvailableGeminiModels`), structured content generation (`generateGeminiResponse`), realistic streaming simulation, and automatic fallback cascades on HTTP 503 and 429.
- `storage.ts`: Handles `localStorage` persistence, JSON graph export and import, and Markdown export for single branches or the entire DAG.
- `mockData.ts`: Provides production-quality starter templates (e.g. "AI Architecture Decision Tree") demonstrating visual branching and multi-parent merge synthesis.
