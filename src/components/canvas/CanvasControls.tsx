import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  MapPin,
  ArrowDownUp,
  ArrowLeftRight,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

interface CanvasControlsProps {
  onAutoLayout: (direction: 'TB' | 'LR') => void;
  layoutDirection: 'TB' | 'LR';
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  onAutoLayout,
  layoutDirection,
  showMinimap,
  onToggleMinimap,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const toggleDirection = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    onAutoLayout(nextDir);
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl text-zinc-600 dark:text-zinc-400">
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
        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
        title={`Switch layout: currently ${layoutDirection === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}`}
        type="button"
      >
        {layoutDirection === 'TB' ? (
          <ArrowDownUp className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        ) : (
          <ArrowLeftRight className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        )}
      </button>

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
