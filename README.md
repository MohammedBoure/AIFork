# ThoughtGraph AI 🧠🔀

> A visual, non-linear, branching thought organizer and ideation canvas powered by the **Google Gemini API**.

Instead of traditional linear chat interfaces, **ThoughtGraph AI** treats conversation as a **Directed Acyclic Graph (DAG)** of interconnected nodes with per-branch model customization, strict branch context isolation, and multi-path synthesis merging.

---

## 🌟 Core Features

### 1. Visual Node Canvas (DAG Interface)
- Built on top of **React Flow** (`@xyflow/react`).
- Full pan, zoom, fit-view, and interactive minimap.
- Automated graph alignment with **Dagre** layout engine (supports both **Top-to-Bottom** and **Left-to-Right** orientations).
- Custom node UI displaying:
  - Role Badges (`User Thought` / `Gemini AI` / `Multi-Branch Synthesis`).
  - Active Model Tag badge (e.g., `gemini-2.5-flash`, `gemini-2.5-pro`).
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
