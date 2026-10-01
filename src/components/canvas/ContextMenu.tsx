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
  FileText,
} from 'lucide-react';
import type { ContextMenuState } from '../../types/graph';

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
  onOpenTemplates: () => void;
  isSelectedForMerge: boolean;
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
  onOpenTemplates,
  isSelectedForMerge,
}) => {
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
      className="fixed z-50 w-56 rounded-xl bg-zinc-950/95 border border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-xl p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {isNode && menuState.nodeId ? (
        <>
          <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
            <span>Node Actions</span>
            <span className="text-zinc-600 truncate max-w-[80px]">
              {menuState.nodeId.slice(0, 10)}
            </span>
          </div>

          <button
            onClick={() => {
              onForkNode(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <GitFork className="w-3.5 h-3.5 text-zinc-300 transform -rotate-90" />
            <span>تفريغ مسار / Fork Branch</span>
          </button>

          <button
            onClick={() => {
              onOpenFocusFlow(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-100" />
            <span className="font-medium">المحادثة والتعديل / Focus Flow</span>
          </button>

          <button
            onClick={() => {
              onToggleMergeSelect(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <Merge className="w-3.5 h-3.5 text-zinc-300" />
            <span>{isSelectedForMerge ? 'إزالة من الدمج / Remove Merge' : 'تحديد للدمج / Pick for Merge'}</span>
          </button>

          <button
            onClick={() => {
              onCopyNodeContent(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span>نسخ المحتوى / Copy Content</span>
          </button>

          <button
            onClick={() => {
              onInspectNode(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Inspect Details</span>
          </button>

          <div className="h-[1px] bg-zinc-800/80 my-1" />

          <button
            onClick={() => {
              onDeleteNode(menuState.nodeId!);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Node</span>
          </button>
        </>
      ) : (
        <>
          <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500 border-b border-zinc-800/80 mb-1">
            Canvas Menu
          </div>

          <button
            onClick={() => {
              onNewGenesisThought();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>New Genesis Thought</span>
          </button>

          <button
            onClick={() => {
              onAutoLayout('TB');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
            <span>Auto Layout (Top-Down)</span>
          </button>

          <button
            onClick={() => {
              onAutoLayout('LR');
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
            <span>Auto Layout (Left-Right)</span>
          </button>

          <button
            onClick={() => {
              onFitView();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <Maximize className="w-3.5 h-3.5 text-zinc-400" />
            <span>Fit All in View</span>
          </button>

          <div className="h-[1px] bg-zinc-800/80 my-1" />

          <button
            onClick={() => {
              onOpenTemplates();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-900 transition-colors text-left"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Load Starter Template</span>
          </button>
        </>
      )}
    </div>
  );
};
