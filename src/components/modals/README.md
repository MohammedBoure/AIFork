# `src/components/modals/` Directory

This directory contains dialog and modal overlays for graph serialization, sessions management, and node inspection.

## Files
- `ExportImportModal.tsx`: Enables downloading graphs as `.json`, copying JSON to clipboard, downloading Markdown summaries, and uploading/pasting saved DAGs.
- `NodeDetailModal.tsx`: Fullscreen inspector rendering markdown, code snippets, metadata, token consumption, full text selection, one-click content copying, and the strict ancestry path proving parallel branch isolation.
- `SessionsModal.tsx`: Full-featured Monochrome modal for managing graph sessions and history: browsing sessions, real-time title/content search, one-click creation, inline renaming, duplication, JSON export, deletion confirmation, and active session switching.
