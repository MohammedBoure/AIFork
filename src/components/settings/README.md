# `src/components/settings/` Directory

This directory contains configuration, API credentials management, and model selection components.

## Files
- `ModelSelector.tsx`: Granular monochrome model selector dropdown supporting preset Google Gemini models (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-pro`, etc.), capability tags, load warnings, and custom model strings.
- `SettingsDrawer.tsx`: Settings panel with API key input, live "Test Connection" validation, "Fetch Available Models" discovery, temperature and token controls, system instructions, and canvas preferences.
