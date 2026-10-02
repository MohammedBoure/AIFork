import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  MapPin,
  ArrowDownUp,
  ArrowLeftRight,
  Undo2,
  Redo2,
  Package,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useLanguage } from '../../i18n/useLanguage';

interface CanvasControlsProps {
  onAutoLayout: (direction: 'TB' | 'LR') => void;
  layoutDirection: 'TB' | 'LR';
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onToggleCollapseAll?: () => void;
  allCollapsed?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  onAutoLayout,
  layoutDirection,
  showMinimap,
  onToggleMinimap,
  onToggleCollapseAll,
  allCollapsed = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const { t } = useLanguage();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const toggleDirection = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    onAutoLayout(nextDir);
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl text-zinc-600 dark:text-zinc-400">
      {/* Undo & Redo Canvas Controls */}
      {onUndo && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
          title="تراجع / Undo (Ctrl+Z)"
          type="button"
        >
          <Undo2 className="w-4 h-4" />
        </button>
      )}

      {onRedo && (
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
          title="إعادة / Redo (Ctrl+Y)"
          type="button"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      )}

      {(onUndo || onRedo) && <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 my-0.5" />}
      <button
        onClick={() => zoomIn()}
        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
        title="Zoom In"
        type="button"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={() => zoomOut()}
        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
        title="Zoom Out"
        type="button"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={() => fitView({ padding: 0.2, duration: 400 })}
        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
        title="Fit All Nodes in View"
        type="button"
      >
        <Maximize className="w-4 h-4" />
      </button>

      <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 my-0.5" />

      {/* Auto-layout direction toggle */}
      <button
        onClick={toggleDirection}
        className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
        title={layoutDirection === 'TB' ? t.layout.toggleTooltipTB : t.layout.toggleTooltipLR}
        type="button"
      >
        {layoutDirection === 'TB' ? (
          <ArrowDownUp className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        ) : (
          <ArrowLeftRight className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        )}
      </button>

      {/* Containerize All / Expand All Toggle */}
      {onToggleCollapseAll && (
        <button
          onClick={onToggleCollapseAll}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            allCollapsed
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
          }`}
          title={allCollapsed ? t.containers.expandAll : t.containers.containerizeAll}
          type="button"
        >
          <Package className="w-4 h-4" />
        </button>
      )}

      {/* Minimap toggle */}
      <button
        onClick={onToggleMinimap}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          showMinimap
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold'
            : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
        }`}
        title="Toggle MiniMap"
        type="button"
      >
        <MapPin className="w-4 h-4" />
      </button>
    </div>
  );
};
