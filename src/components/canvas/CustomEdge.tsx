import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { useNodeActions } from './useNodeActions';
import { useLanguage } from '../../i18n/useLanguage';

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const { t } = useLanguage();
  const { onDeleteEdge, theme = 'dark' } = useNodeActions();
  const edgeType = (data as { edgeType?: string })?.edgeType || 'smoothstep';
  const isMergeEdge = (data as { isMergeEdge?: boolean })?.isMergeEdge || false;

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (edgeType === 'bezier') {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else if (edgeType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    });
  }

  // In light theme, selected edge is dark zinc #09090b, in dark theme pure white #ffffff
  const isLight = theme === 'light';
  const strokeColor = selected
    ? (isLight ? '#09090b' : '#ffffff')
    : isMergeEdge
    ? (isLight ? '#9333ea' : '#c084fc')
    : (isLight ? '#64748b' : '#71717a');

  const strokeWidth = selected ? 2.8 : isMergeEdge ? 2.5 : 2;

  return (
    <>
      {/* Outer ambient glow */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: selected ? (isLight ? '#09090b' : '#ffffff') : strokeColor,
          strokeWidth: strokeWidth + (selected ? 8 : 4),
          strokeOpacity: selected ? 0.35 : 0.12,
          transition: 'all 0.2s ease',
        }}
      />

      {/* Main edge stroke */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isMergeEdge ? '5 5' : undefined,
          transition: 'all 0.2s ease',
        }}
      />

      {/* Interactive Delete Relationship Button on edge label position */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan group/edge-btn"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDeleteEdge) {
                onDeleteEdge(id);
              }
            }}
            className={`flex items-center justify-center rounded-full p-1 border transition-all duration-200 cursor-pointer ${
              selected
                ? 'bg-rose-600 border-white text-white opacity-100 scale-110 shadow-lg ring-2 ring-rose-500/50'
                : 'bg-white dark:bg-zinc-950/95 hover:bg-rose-600 border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white text-zinc-600 dark:text-zinc-400 hover:text-white opacity-0 group-hover/edge-btn:opacity-100 hover:opacity-100 scale-90 hover:scale-110 shadow-md'
            }`}
            title={t.canvas.deleteRelationship || 'Delete Relationship'}
            aria-label="Delete relationship"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
