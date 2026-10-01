import React from 'react';
import {
  GitFork,
  Settings,
  Download,
  LayoutGrid,
  FileText,
  RotateCcw,
  KeyRound,
  Merge,
  MessageSquare,
} from 'lucide-react';
import { Badge } from './Badge';

interface NavbarProps {
  nodeCount: number;
  edgeCount: number;
  activeParentTitle?: string | null;
  activeParentId: string | null;
  hasApiKey: boolean;
  provider?: string;
  selectedForMergeCount: number;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenTemplates: () => void;
  onAutoLayout: () => void;
  onResetCanvas: () => void;
  onOpenMergeModal: () => void;
  onOpenFocusFlow?: (nodeId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  nodeCount,
  edgeCount,
  activeParentTitle,
  activeParentId,
  hasApiKey,
  provider = 'openrouter',
  selectedForMergeCount,
  onOpenSettings,
  onOpenExport,
  onOpenTemplates,
  onAutoLayout,
  onResetCanvas,
  onOpenMergeModal,
  onOpenFocusFlow,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Stats */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-white/5">
            <GitFork className="w-4 h-4 text-zinc-950 transform -rotate-90" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                ThoughtGraph <span className="text-zinc-400 font-mono">AI</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 font-mono border border-zinc-800">
                DAG v1.1
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
            <span>{nodeCount} Nodes</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span>{edgeCount} Branches</span>
        </div>

        {/* Active Fork Indicator */}
        {activeParentTitle && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200">
            <GitFork className="w-3 h-3 text-zinc-400 transform -rotate-90" />
            <span className="text-zinc-500">Forking from:</span>
            <span className="font-medium max-w-[180px] truncate text-white">
              {activeParentTitle}
            </span>
            {activeParentId && onOpenFocusFlow && (
              <button
                onClick={() => onOpenFocusFlow(activeParentId)}
                className="ml-1 p-0.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                title="Open Focus Flow for this branch"
              >
                <MessageSquare className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Merge Button if 2+ selected */}
        {selectedForMergeCount >= 2 && (
          <button
            onClick={onOpenMergeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-md transition-all animate-pulse"
          >
            <Merge className="w-3.5 h-3.5" />
            <span>Merge ({selectedForMergeCount})</span>
          </button>
        )}

        {/* Focus Flow quick button if active parent exists */}
        {activeParentId && onOpenFocusFlow && (
          <button
            onClick={() => onOpenFocusFlow(activeParentId)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs transition-colors border border-zinc-800"
            title="Focus on active branch as conversation"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-100" />
            <span>Focus Flow</span>
          </button>
        )}

        {/* Auto Layout */}
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs transition-colors border border-zinc-800"
          title="Auto-organize DAG layout"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Auto Layout</span>
        </button>

        {/* Starter Templates */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs transition-colors border border-zinc-800"
          title="Load pre-built thought graphs"
        >
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        {/* Export / Import */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs transition-colors border border-zinc-800"
          title="Export JSON, Markdown, or Import"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Reset */}
        <button
          onClick={onResetCanvas}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors border border-zinc-800"
          title="Clear canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-[1px] bg-zinc-800 mx-1"></div>

        {/* API Status Pill */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
        >
          {hasApiKey ? (
            <Badge variant="secondary" className="px-1.5 py-0 bg-zinc-800 text-white border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1 inline-block"></span>
              {provider === 'openrouter' ? 'OpenRouter • DeepSeek' : 'Gemini Live'}
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-1.5 py-0 bg-zinc-900 text-zinc-400 border-zinc-800">
              <KeyRound className="w-2.5 h-2.5 mr-1 text-zinc-400" />
              Demo Mode
            </Badge>
          )}
          <Settings className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
        </button>
      </div>
    </header>
  );
};
