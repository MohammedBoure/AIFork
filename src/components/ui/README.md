# `src/components/ui/` Directory

This directory contains reusable presentation UI components for ThoughtGraph AI.

## Files
- `Navbar.tsx`: Streamlined functional header navigation bar with minimal design (focusing strictly on direct work tools): undo/redo history buttons, active fork parent indicator, sessions history trigger with session count badge, layout direction and auto-align toggle ('Forward' stacked under each other / 'Sideways'), canvas reset, merge synthesis launcher, export/import modal, theme switcher (`Light` / `Dark`), bilingual language toggle (`AR` / `EN`), and settings drawer.
- `CodeBlock.tsx`: Syntax-highlighted code rendering block powered by PrismJS with strict LTR text isolation, language pill badge, one-click clipboard copying, and automatic delegation of `mermaid` blocks to `MermaidBlock`.
- `MermaidBlock.tsx`: Interactive Mermaid diagram renderer component with SVG rendering, zoom in/out/reset controls, diagram vs. raw code view toggle, one-click SVG and code clipboard copying, SVG download, light/dark theme adaptation, and graceful syntax error fallback.
- `Badge.tsx`: Versatile pill badges for roles, active models, merge synthesis status, and execution states.
- `Toast.tsx`: Lightweight notification toast overlay for user feedback.
