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
} from 'lucide-react';
import { Badge } from './Badge';

interface NavbarProps {
  nodeCount: number;
  edgeCount: number;
  activeParentTitle?: string | null;
  hasApiKey: boolean;
  selectedForMergeCount: number;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenTemplates: () => void;
  onAutoLayout: () => void;
  onResetCanvas: () => void;
  onOpenMergeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  nodeCount,
  edgeCount,
  activeParentTitle,
  hasApiKey,
  selectedForMergeCount,
  onOpenSettings,
  onOpenExport,
  onOpenTemplates,
  onAutoLayout,
  onResetCanvas,
  onOpenMergeModal,
}) => {
  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Stats */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-900/30">
            <GitFork className="w-4 h-4 text-white transform -rotate-90" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                ThoughtGraph <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
                DAG v1.0
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>{nodeCount} Nodes</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>{edgeCount} Branches</span>
        </div>

        {/* Active Fork Indicator */}
        {activeParentTitle && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-xs text-blue-300">
            <GitFork className="w-3.5 h-3.5 text-blue-400 transform -rotate-90 flex-shrink-0" />
            <span className="text-slate-400">Forking from:</span>
            <span className="font-medium max-w-[180px] truncate text-blue-200">
              {activeParentTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Merge Button if 2+ selected */}
        {selectedForMergeCount >= 2 && (
          <button
            onClick={onOpenMergeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-purple-900/40 transition-all animate-pulse"
          >
            <Merge className="w-3.5 h-3.5" />
            <span>Merge ({selectedForMergeCount})</span>
          </button>
        )}

        {/* Auto Layout */}
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 text-xs transition-colors border border-slate-800"
          title="Auto-organize DAG layout"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Auto Layout</span>
        </button>

        {/* Starter Templates */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 text-xs transition-colors border border-slate-800"
          title="Load pre-built thought graphs"
        >
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        {/* Export / Import */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 text-xs transition-colors border border-slate-800"
          title="Export JSON, Markdown, or Import"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Reset */}
        <button
          onClick={onResetCanvas}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors border border-slate-800"
          title="Clear canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-[1px] bg-slate-800 mx-1"></div>

        {/* API Status Pill */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs"
        >
          {hasApiKey ? (
            <Badge variant="emerald" className="px-1.5 py-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1 inline-block"></span>
              Gemini Live
            </Badge>
          ) : (
            <Badge variant="amber" className="px-1.5 py-0">
              <KeyRound className="w-2.5 h-2.5 mr-1" />
              Demo Mode
            </Badge>
          )}
          <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
        </button>
      </div>
    </header>
  );
};
