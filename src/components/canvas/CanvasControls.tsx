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
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-2xl backdrop-blur-md">
      <button
        onClick={() => zoomIn()}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        title="Zoom In"
        type="button"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={() => zoomOut()}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        title="Zoom Out"
        type="button"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={() => fitView({ padding: 0.2, duration: 400 })}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        title="Fit All Nodes in View"
        type="button"
      >
        <Maximize className="w-4 h-4" />
      </button>

      <div className="h-[1px] bg-slate-800 my-0.5" />

      {/* Auto-layout direction toggle */}
      <button
        onClick={toggleDirection}
        className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800/80 transition-colors"
        title={`Switch layout: currently ${layoutDirection === 'TB' ? 'Top-to-Bottom' : 'Left-to-Right'}`}
        type="button"
      >
        {layoutDirection === 'TB' ? (
          <ArrowDownUp className="w-4 h-4 text-blue-400" />
        ) : (
          <ArrowLeftRight className="w-4 h-4 text-purple-400" />
        )}
      </button>

      {/* Minimap toggle */}
      <button
        onClick={onToggleMinimap}
        className={`p-2 rounded-lg transition-colors ${
          showMinimap
            ? 'text-blue-400 bg-blue-500/10'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
        }`}
        title="Toggle MiniMap"
        type="button"
      >
        <MapPin className="w-4 h-4" />
      </button>
    </div>
  );
};
