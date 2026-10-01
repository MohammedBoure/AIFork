import React from 'react';
import {
  BaseEdge,
  getSmoothStepPath,
  getBezierPath,
  getStraightPath,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

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
}) => {
  const edgeType = (data as { edgeType?: string })?.edgeType || 'smoothstep';
  const isMergeEdge = (data as { isMergeEdge?: boolean })?.isMergeEdge || false;

  let edgePath = '';

  if (edgeType === 'bezier') {
    [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else if (edgeType === 'straight') {
    [edgePath] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else {
    [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    });
  }

  const strokeColor = isMergeEdge ? '#a855f7' : '#3b82f6';
  const strokeWidth = isMergeEdge ? 2.5 : 2;

  return (
    <>
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: strokeWidth + 4,
          strokeOpacity: 0.15,
        }}
      />
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
    </>
  );
};
