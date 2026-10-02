import React, { useEffect, useRef } from 'react';
import {
  GitFork,
  MessageSquare,
  Merge,
  Copy,
  Maximize2,
  Trash2,
  Sparkles,
  LayoutGrid,
  Maximize,
  Layers,
  Undo2,
  Redo2,
} from 'lucide-react';
import type { ContextMenuState } from '../../types/graph';
import { useLanguage } from '../../i18n/useLanguage';

interface ContextMenuProps {
  menuState: ContextMenuState;
  onClose: () => void;
  onForkNode: (nodeId: string) => void;
  onOpenFocusFlow: (nodeId: string) => void;
  onToggleMergeSelect: (nodeId: string) => void;
  onCopyNodeContent: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onNewGenesisThought: () => void;
  onAutoLayout: (dir: 'TB' | 'LR') => void;
  onFitView: () => void;
  onOpenSessions?: () => void;
  isSelectedForMerge: boolean;
  multiSelectedCount?: number;
  onBatchDeleteSelected?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  menuState,
  onClose,
  onForkNode,
  onOpenFocusFlow,
  onToggleMergeSelect,
  onCopyNodeContent,
  onInspectNode,
  onDeleteNode,
  onNewGenesisThought,
  onAutoLayout,
  onFitView,
  onOpenSessions,
  isSelectedForMerge,
  multiSelectedCount = 0,
  onBatchDeleteSelected,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!menuState.isOpen) return null;

  // Keep menu within viewport
  const x = Math.min(menuState.x, window.innerWidth - 240);
  const y = Math.min(menuState.y, window.innerHeight - 300);

  const isNode = Boolean(menuState.nodeId);

  return (
    <div
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-50 w-56 rounded-xl bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl backdrop-blur-xl p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {multiSelectedCount > 1 && onBatchDeleteSelected && (
        <button
          onClick={() => {
            onBatchDeleteSelected();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 mb-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/40 dark:hover:bg-rose-600 dark:text-rose-300 transition-colors text-left font-medium border border-rose-200 dark:border-rose-900/50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>
            {t.canvas.deleteSelectedNodes} ({multiSelectedCount})
          </span>
        </button>
      )}

      {isNode && menuState.nodeId ? (
        <>
          <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 mb-1 flex items-center justify-between">
            <span>{t.contextMenu.nodeActions}</span>
            <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-[80px]">
              {menuState.nodeId.slice(0, 10)}
            </span>
          </div>

          <button
            onClick={() => {
              onForkNode(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <GitFork className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 transform -rotate-90" />
            <span>{t.canvas.forkBranch}</span>
          </button>

          <button
            onClick={() => {
              onOpenFocusFlow(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            <span className="font-medium">{t.navbar.focusFlow}</span>
          </button>

          <button
            onClick={() => {
              onToggleMergeSelect(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <Merge className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
            <span>{isSelectedForMerge ? t.canvas.removeFromMerge : t.canvas.pickForMerge}</span>
          </button>

          <button
            onClick={() => {
              onCopyNodeContent(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{t.canvas.copyContent}</span>
          </button>

          <button
            onClick={() => {
              onInspectNode(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <Maximize2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{t.canvas.inspectDetails}</span>
          </button>

          <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800/80 my-1" />

          <button
            onClick={() => {
              onDeleteNode(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.canvas.deleteNode}</span>
          </button>
        </>
      ) : (
        <>
          <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800/80 mb-1">
            {t.contextMenu.canvasMenu}
          </div>

          <button
            onClick={() => {
              onNewGenesisThought();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
            <span>{t.contextMenu.newGenesis}</span>
          </button>

          {onUndo && (
            <button
              onClick={() => {
                if (canUndo) onUndo();
                onClose();
              }}
              disabled={!canUndo}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Undo2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>{t.navbar.undo}</span>
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Ctrl+Z</span>
            </button>
          )}

          {onRedo && (
            <button
              onClick={() => {
                if (canRedo) onRedo();
                onClose();
              }}
              disabled={!canRedo}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Redo2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>{t.navbar.redo}</span>
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Ctrl+Y</span>
            </button>
          )}

          <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800/80 my-1" />

          <button
            onClick={() => {
              onAutoLayout('TB');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{t.contextMenu.autoLayoutTopDown}</span>
          </button>

          <button
            onClick={() => {
              onAutoLayout('LR');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{t.contextMenu.autoLayoutLeftRight}</span>
          </button>

          <button
            onClick={() => {
              onFitView();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
          >
            <Maximize className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>{t.contextMenu.fitView}</span>
          </button>

          {onOpenSessions && (
            <>
              <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800/80 my-1" />
              <button
                onClick={() => {
                  onOpenSessions();
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left font-medium"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                <span>{t.contextMenu.sessionsHistory}</span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};
