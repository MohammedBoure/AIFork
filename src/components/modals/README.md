# `src/components/modals/` Directory

This directory contains dialog and modal overlays for graph serialization, starter templates, and node inspection.

## Files
- `ExportImportModal.tsx`: Enables downloading graphs as `.json`, copying JSON to clipboard, downloading Markdown summaries, and uploading/pasting saved DAGs.
- `TemplatesModal.tsx`: Provides pre-configured DAG templates (such as "AI Architecture Decision Tree" and "Blank Ideation Canvas") for quick bootstrapping.
- `NodeDetailModal.tsx`: Fullscreen inspector rendering markdown, code snippets, metadata, token consumption, and the strict ancestry path proving parallel branch isolation.
