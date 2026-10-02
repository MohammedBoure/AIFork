# ThoughtGraph AI 🧠🔀

> A visual, non-linear, branching thought organizer and ideation canvas powered by the **Google Gemini API**.

Instead of traditional linear chat interfaces, **ThoughtGraph AI** treats conversation as a **Directed Acyclic Graph (DAG)** of interconnected nodes with per-branch model customization, strict branch context isolation, and multi-path synthesis merging.

---

## 🌟 Core Features

### 1. Visual Node Canvas (DAG Interface)
- Built on top of **React Flow** (`@xyflow/react`).
- Full pan, zoom, fit-view, and interactive minimap.
- **Instant Automatic DAG Layout:** New nodes automatically snap into their mathematically optimal hierarchical position upon addition without requiring manual alignment triggers.
- **Dynamic Adaptive Handles:** Node connection ports dynamically adapt orientation (Top/Bottom vs. Left/Right) matching the active graph orientation ('TB' vs 'LR') and connected nodes.
- **Full Relationship Lifecycle:** Interactive 1-click edge deletion directly from the edge connector, manual edge drawing, strict DAG cycle loop prevention, and continuous `parentIds` context synchronization.
- **Batch Node Deletion & Multi-Selection:** Marquee box selection, Shift-click, floating batch dock, context menu, and keyboard shortcuts (`Delete`/`Backspace`) to delete multiple nodes and relationships simultaneously.
- Custom node UI displaying:
  - Role Badges (`User Thought` / `Gemini AI` / `Multi-Branch Synthesis`).
  - Active Model Tag badge (DeepSeek V3, DeepSeek R1, Gemini 2.5, etc.).
  - Formatted Markdown with GitHub Flavored Markdown tables, lists, and quotes.
  - Syntax-highlighted code blocks with one-click clipboard copying.
  - Creation timestamp and Gemini token consumption metrics.
  - Direct action controls: **Fork Branch**, **Select for Merge**, **Delete**, and **Inspect**.

### 2. Granular Model Selection Per Branch & Fork (Crucial Feature)
- **Global Defaults:** Configure default forking model (`gemini-2.5-flash`) and default synthesis model (`gemini-2.5-pro`) in the Settings Drawer.
- **Per-Fork Model Selector:** The active prompt bar provides an instant dropdown to pick any Google Gemini model (`gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`, or custom models) for that specific branch.
- **Persistent Model Association:** Each node persists its `modelUsed` attribute in the graph data structure.
- **Dedicated Synthesis Model:** When merging branches, a dedicated high-reasoning model is explicitly selectable.

### 3. Context Resolution & Branch Isolation Algorithm
- Traces back parent references (`node.parentIds`) up to the genesis root to construct the exact historical dialogue path.
- Sends **only** this sequential chain of messages to Google Gemini API (`user` ↔ `model`).
- Isolates parallel branches to guarantee zero context bleeding between alternative exploration paths.

### 4. Multi-Branch Synthesis (Merging)
- Select 2 or more leaf or intermediate nodes across different branches.
- Opens the **Multi-Branch Synthesis Modal** to review incoming branch points.
- Automatically generates a structured multi-path comparison and resolution prompt.
- Executes synthesis using the chosen high-reasoning model and connects all selected parent nodes to the new synthesis node.

### 5. API Key Management & Connectivity Testing
- Secure `localStorage` storage of Google Gemini API key.
- **Test Connection** button verifying key validity against Google Gemini endpoint.
- **Fetch Available Models** dynamically populates the model selector directly from Google's API.
- **Built-in Demo / Simulator Mode:** Try out branching and synthesis immediately even without an API key.

### 6. Graph Sessions & History Manager 🗂️
- Comprehensive session manager to save, organize, and switch between multiple thought graphs.
- **Instant Creation & Search:** Create new sessions with a single click and filter saved sessions by title or content in real time.
- **Inline Renaming & Duplication:** Rename graphs inline and duplicate complex branching structures for experiments.
- **Export & Delete Safety:** Export any session to JSON, with deletion confirmation dialogs.
- **Isolated Storage:** Each session safely persists its nodes, edges, active fork parent, and metadata under dedicated keys in `localStorage`.

### 7. Bilingual Arabic & English Support (i18n) 🌍
- Full native support for **Arabic (العربية)** and **English**.
- **Instant Toggle:** One-click language switcher in the Navbar and dedicated settings in the Settings Drawer.
- **Bidirectional Typography:** Dynamic document synchronization (`dir="rtl"` / `dir="ltr"` and `lang="ar"` / `lang="en"`) with Cairo Arabic font and bidi-aware text editing.
- **Complete UI Coverage:** All navigation controls, node badges, menus, prompts, modals, and tooltips are localized.

### 8. Inline Prompt Editing & Focus Flow
- Edit any user thought prompt directly within its canvas node or inside the linear **Focus Flow** conversation stream.
- Re-run AI generation automatically on edit or save text only.
- Strict isolation prevents prompt changes on one branch from altering sibling branches.

### 9. Undo & Redo History System ↩️↪️
- Full historical snapshots tracking graph transformations, node creations, updates, deletions, and connections.
- **Keyboard Shortcuts:** Fast undo with <kbd>Ctrl+Z</kbd> (<kbd>Cmd+Z</kbd>) and redo with <kbd>Ctrl+Y</kbd> or <kbd>Ctrl+Shift+Z</kbd>.
- **Visual Toolbar:** Dedicated Undo and Redo buttons in the Navbar with real-time disabled state detection.

### 10. Light & Dark Themes (Monochrome Design) ☀️🌙
- **Seamless 1-Click Toggle:** Switch between Dark and crisp Light mode via the Navbar toggle button.
- **Complete Canvas Adaptation:** Nodes, background grid dots, minimap, controls, modals, and prompt bars automatically re-theme.
- **Clean Direct-Work Workspace:** Removed brand names, logos, starter suggestions, and templates in favor of a minimalist, focused thinking canvas.

### 11. Interactive Mermaid Diagrams Support 📊
- **Visual Diagram Rendering:** Code blocks with `mermaid` syntax automatically render as SVG diagrams (flowcharts, sequence diagrams, class diagrams, state diagrams, ERDs, and mindmaps).
- **Interactive Controls:** Zoom In, Zoom Out, and Reset Zoom to inspect detailed architectures and mindmaps.
- **Diagram & Code Toggle:** Seamlessly switch between the rendered SVG visualization and raw Mermaid syntax.
- **Export & Clipboard:** 1-click Copy SVG to clipboard, 1-click Download SVG file, and 1-click Copy Mermaid code.
- **Light & Dark Adaptation:** Automatic real-time re-rendering matching active theme with Cairo font for Arabic labels.
- **Syntax Error Protection:** Friendly error banner with raw code fallback prevents UI crashes on syntax typos.

### 12. Instant Markdown Live Preview ("العرض المباشر") 👁️
- **Prompt Bar Live Preview:** Preview Markdown formatting, lists, tables, and Mermaid diagrams before forking a new branch.
- **Focus Flow Live Preview:** Real-time preview available for both linear conversation replies and inline message edits.
- **Node Inline Edit Preview:** Preview prompt edits right on the canvas node card before saving or re-running.
- **Arabic & Code Isolation:** Native bidirectional support (`dir="auto"`, `unicode-bidi: plaintext`, Cairo font), full selectable text, and strict LTR isolation for PrismJS code blocks.

---

## 🏗️ Directory Architecture

```
AIFork/
├── public/                 # Static assets and icons
│   └── README.md
├── src/
│   ├── assets/             # Logos and banners
│   │   └── README.md
│   ├── components/         # UI components
│   │   ├── canvas/         # React Flow canvas, custom nodes, custom edges
│   │   │   └── README.md
│   │   ├── focus/          # Linear conversation Focus Flow modal
│   │   │   └── README.md
│   │   ├── prompt/         # Fork prompt bar, merge modal
│   │   │   └── README.md
│   │   ├── settings/       # Settings drawer, model selector
│   │   │   └── README.md
│   │   ├── modals/         # Sessions modal, Export/Import, templates, inspector
│   │   │   └── README.md
│   │   ├── ui/             # Navbar, code blocks, badges, toasts
│   │   │   └── README.md
│   │   └── README.md
│   ├── hooks/              # Custom React state hooks (useGraphState)
│   │   └── README.md
│   ├── i18n/               # Internationalization dictionary & LanguageContext
│   │   └── README.md
│   ├── services/           # OpenRouter/DeepSeek, Gemini, session storage, templates
│   │   └── README.md
│   ├── types/              # TypeScript data interfaces (ThoughtNodeData, sessions)
│   │   └── README.md
│   ├── utils/              # Context resolution, dagre layout, formatters
│   │   └── README.md
│   ├── App.tsx             # Root application orchestrator
│   ├── index.css           # Global stylesheet with Tailwind CSS & React Flow themes
│   ├── main.tsx            # React application entry point
│   └── README.md
├── index.html              # HTML entry template
├── package.json            # Project manifest and dependencies
├── vite.config.ts          # Vite build configuration with Tailwind CSS plugin
└── README.md               # Root documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation & Run

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

---

## 📄 License
MIT License.
