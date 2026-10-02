import React from 'react';
import {
  GitFork,
  Settings,
  Download,
  RotateCcw,
  KeyRound,
  Merge,
  MessageSquare,
  Layers,
  Languages,
  Undo2,
  Redo2,
  Sun,
  Moon,
  ArrowDownUp,
  ArrowLeftRight,
  Package,
} from 'lucide-react';
import { Badge } from './Badge';
import { useLanguage } from '../../i18n/useLanguage';

interface NavbarProps {
  nodeCount: number;
  edgeCount: number;
  activeParentTitle?: string | null;
  activeParentId: string | null;
  hasApiKey: boolean;
  provider?: string;
  selectedForMergeCount: number;
  sessionCount?: number;
  currentSessionTitle?: string;
  onOpenSessions: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onAutoLayout: () => void;
  layoutDirection?: 'TB' | 'LR';
  onToggleLayoutDirection?: () => void;
  onResetCanvas: () => void;
  onOpenMergeModal: () => void;
  onOpenFocusFlow?: (nodeId: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  allCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  nodeCount,
  edgeCount,
  activeParentTitle,
  activeParentId,
  hasApiKey,
  provider = 'openrouter',
  selectedForMergeCount,
  sessionCount = 1,
  currentSessionTitle,
  onOpenSessions,
  onOpenSettings,
  onOpenExport,
  onAutoLayout,
  layoutDirection = 'TB',
  onToggleLayoutDirection,
  onResetCanvas,
  onOpenMergeModal,
  onOpenFocusFlow,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  theme = 'dark',
  onToggleTheme,
  allCollapsed = false,
  onToggleCollapseAll,
}) => {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30 select-none text-zinc-900 dark:text-zinc-100 shadow-sm dark:shadow-none transition-colors">
      {/* Left: Direct Workspace Management, Undo/Redo & Graph Metrics */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Graph Sessions History Trigger */}
        <button
          onClick={onOpenSessions}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium transition-colors border border-zinc-200 dark:border-zinc-700/80 shadow-sm"
          title={t.sessions.title}
        >
          <Layers className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-200 flex-shrink-0" />
          <span className="font-semibold max-w-[110px] sm:max-w-[160px] truncate">
            {currentSessionTitle || t.navbar.sessions}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            {sessionCount}
          </span>
        </button>

        {/* Undo & Redo History Controls */}
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
            title={language === 'ar' ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            aria-label="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer"
            title={language === 'ar' ? 'إعادة (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            aria-label="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Node & Branch Counts */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 pl-1 border-l border-zinc-200 dark:border-zinc-800">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-300"></span>
            <span>{nodeCount} {t.navbar.nodesCount}</span>
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <span className="font-mono text-[11px]">{edgeCount} {t.navbar.branchesCount}</span>
        </div>

        {/* Active Fork Indicator */}
        {activeParentTitle && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200">
            <GitFork className="w-3 h-3 text-zinc-500 dark:text-zinc-400 transform -rotate-90" />
            <span className="text-zinc-500">{t.navbar.forkingFrom}</span>
            <span className="font-medium max-w-[150px] truncate text-zinc-900 dark:text-white">
              {activeParentTitle}
            </span>
            {activeParentId && onOpenFocusFlow && (
              <button
                onClick={() => onOpenFocusFlow(activeParentId)}
                className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Open Focus Flow for this branch"
              >
                <MessageSquare className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Direct Action Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Merge Button if 2+ selected */}
        {selectedForMergeCount >= 2 && (
          <button
            onClick={onOpenMergeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-semibold shadow-md transition-all animate-pulse"
          >
            <Merge className="w-3.5 h-3.5" />
            <span>{t.navbar.mergeSelected} ({selectedForMergeCount})</span>
          </button>
        )}

        {/* Focus Flow quick button if active parent exists */}
        {activeParentId && onOpenFocusFlow && (
          <button
            onClick={() => onOpenFocusFlow(activeParentId)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs transition-colors border border-zinc-200 dark:border-zinc-800"
            title={t.navbar.focusFlow}
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-200" />
            <span>{t.navbar.focusFlow}</span>
          </button>
        )}

        {/* Layout Direction & Auto-align */}
        <button
          onClick={onToggleLayoutDirection || onAutoLayout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer"
          title={layoutDirection === 'TB' ? t.layout.toggleTooltipTB : t.layout.toggleTooltipLR}
        >
          {layoutDirection === 'TB' ? (
            <ArrowDownUp className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
          ) : (
            <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
          )}
          <span className="hidden md:inline font-medium">
            {layoutDirection === 'TB' ? t.layout.forwardShort : t.layout.sidewaysShort}
          </span>
        </button>

        {/* Toggle Collapse All in Containers */}
        {onToggleCollapseAll && (
          <button
            onClick={onToggleCollapseAll}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors border cursor-pointer ${
              allCollapsed
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-950 dark:border-zinc-100 shadow-sm'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'
            }`}
            title={allCollapsed ? t.containers.expandAllTooltip : t.containers.collapseAllTooltip}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-medium">
              {allCollapsed ? t.containers.expandAllShort : t.containers.collapseAllShort}
            </span>
          </button>
        )}

        {/* Export / Import */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs transition-colors border border-zinc-200 dark:border-zinc-800"
          title={t.navbar.export}
        >
          <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="hidden md:inline">{t.navbar.export}</span>
        </button>

        {/* Reset Canvas */}
        <button
          onClick={onResetCanvas}
          className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
          title={t.navbar.reset}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>

        {/* Theme Switcher Toggle (Light <-> Dark) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer"
            title={theme === 'dark' ? t.common.switchToLight : t.common.switchToDark}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>
        )}

        {/* Language Switcher (AR <-> EN) */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white text-xs transition-colors border border-zinc-200 dark:border-zinc-800 font-medium"
          title={language === 'ar' ? t.common.switchToEn : t.common.switchToAr}
        >
          <Languages className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />
          <span className="font-semibold uppercase text-[11px] tracking-wider">
            {language === 'ar' ? 'English' : 'عربي'}
          </span>
        </button>

        {/* API Status & Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs"
          title={t.navbar.settings}
        >
          {hasApiKey ? (
            <Badge variant="secondary" className="px-1.5 py-0 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block"></span>
              {provider === 'openrouter' ? 'DeepSeek' : 'Gemini'}
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-1.5 py-0 bg-zinc-200 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-800">
              <KeyRound className="w-2.5 h-2.5 mr-1 text-zinc-500 dark:text-zinc-400" />
              {t.navbar.demoMode}
            </Badge>
          )}
          <Settings className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
        </button>
      </div>
    </header>
  );
};
