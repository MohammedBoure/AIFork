# `src/utils/` Directory

This directory contains algorithmic helpers, DAG layout calculations, context resolution logic, and presentation formatters.

## Files
- `contextResolver.ts`: Traverses DAG parent references to isolate branch history up to the root, constructs alternating Gemini chat turns, converts branch trees into OpenAI/OpenRouter message format for DeepSeek, and prepares multi-branch synthesis prompts.
- `dagLayout.ts`: Uses `dagre` with balanced median alignment to enforce clean, linear top-to-bottom ('TB' - forward stacked directly under each other) and left-to-right ('LR' - sideways) automated layout, dynamically scales node dimension calculations based on container collapsed states (`isCollapsed`), calculates direction-aware offset positions for newly spawned branch nodes, and detects circular dependency cycles (`wouldCreateCycle`) to maintain strict DAG integrity.
- `formatters.ts`: Formats timestamps, generates model badge styling (with DeepSeek and OpenRouter recognition), and provides safe clipboard copy helpers.
