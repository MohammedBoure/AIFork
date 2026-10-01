# `src/utils/` Directory

This directory contains algorithmic helpers, DAG layout calculations, context resolution logic, and presentation formatters.

## Files
- `contextResolver.ts`: Traverses the DAG parent references to isolate branch history up to the root, constructs alternating Gemini chat turns, and prepares multi-branch synthesis prompts.
- `dagLayout.ts`: Uses `dagre` to perform top-to-bottom and left-to-right automated layout, and calculates offsets for newly spawned branch nodes to avoid overlaps.
- `formatters.ts`: Formats timestamps, generates model badge styling, and provides safe clipboard copy helpers.
