# `src/utils/` Directory

This directory contains algorithmic helpers, DAG layout calculations, context resolution logic, and presentation formatters.

## Files
- `contextResolver.ts`: Traverses DAG parent references to isolate branch history up to the root, constructs alternating Gemini chat turns, converts branch trees into OpenAI/OpenRouter message format for DeepSeek, and prepares multi-branch synthesis prompts.
- `dagLayout.ts`: Uses `dagre` to perform top-to-bottom and left-to-right automated layout, calculates direction-aware offset positions for newly spawned branch nodes, and detects circular dependency cycles (`wouldCreateCycle`) to maintain strict DAG integrity.
- `formatters.ts`: Formats timestamps, generates model badge styling (with DeepSeek and OpenRouter recognition), and provides safe clipboard copy helpers.
