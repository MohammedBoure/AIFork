# `src/services/` Directory

This directory contains external integrations, data persistence, and starter templates.

## Files
- `gemini.ts`: Manages Google Gemini API communication, key verification (`testGeminiApiKey`), model listing (`fetchAvailableGeminiModels`), structured content generation (`generateGeminiResponse`), realistic streaming simulation, and automatic fallback cascades on HTTP 503 (Overloaded) and HTTP 429 (Quota/Rate Limits) to stable models like `gemini-2.5-flash`.
- `storage.ts`: Handles `localStorage` persistence, JSON graph export and import, and Markdown export for single branches or the entire DAG.
- `mockData.ts`: Provides production-quality starter templates (e.g. "AI Architecture Decision Tree") demonstrating visual branching and multi-parent merge synthesis.
