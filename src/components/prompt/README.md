# `src/components/prompt/` Directory

This directory contains prompt submission interfaces, branch context banners, per-branch model dropdowns, and synthesis modals.

## Files
- `ForkPromptBar.tsx`: Floating action bar at canvas bottom with dual-theme styling (Light & Dark), active parent node indicator, per-fork model selection dropdown, instant "العرض المباشر / Live Preview" toggle for real-time Markdown and Mermaid diagram rendering, keyboard shortcut submission (<kbd>Enter</kbd> / <kbd>Ctrl+Enter</kbd>), and clean bidirectional (`dir="auto"`) Arabic/English prompt typing without distracting suggestion chips.
- `MergeModal.tsx`: Synthesis dialogue presenting selected branches, dedicated high-reasoning model picker, customizable synthesis prompt presets, and multi-parent merge dispatch.
