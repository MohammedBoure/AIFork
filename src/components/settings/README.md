# `src/components/settings/` Directory

This directory contains configuration, API credentials management, and model selection components.

## Files
- `ModelSelector.tsx`: Granular monochrome model selector dropdown supporting OpenRouter (DeepSeek V3, DeepSeek R1, Free tier) and Google Gemini models, capability tags, load warnings, and custom model strings.
- `SettingsDrawer.tsx`: Dual-engine settings panel supporting OpenRouter.ai (DeepSeek) and Google Gemini with Multi-Key API management (custom key labeling, active key 1-click switcher, individual connection testing, deletion, masked previews), automatic quota limit failover toggle (HTTP 429), dynamic model fetching, temperature controls, system instructions, canvas preferences (auto-layout on add, edge curves, default linear layout direction - Forward stacked under each other / Sideways, and default container mode to hide question and response text until requested), and bilingual interface language preferences (Arabic / English).
