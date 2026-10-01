import dagre from 'dagre';
import { Position } from '@xyflow/react';
import type { ThoughtFlowNode, ThoughtFlowEdge } from '../types/graph';

const NODE_WIDTH = 380;
const NODE_HEIGHT = 260;

/**
 * Calculates automated positions for nodes and edges using dagre DAG layout.
 * Supports Left-to-Right ('LR') or Top-to-Bottom ('TB').
 */
export function getLayoutedElements(
  nodes: ThoughtFlowNode[],
  edges: ThoughtFlowEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: ThoughtFlowNode[]; edges: ThoughtFlowEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    align: 'DL',
    nodesep: isHorizontal ? 80 : 120,
    ranksep: isHorizontal ? 140 : 160,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    const contentLength = node.data.content ? node.data.content.length : 0;
    const estimatedHeight = Math.min(Math.max(NODE_HEIGHT, 180 + Math.floor(contentLength / 3)), 600);

    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: estimatedHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes: ThoughtFlowNode[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const contentLength = node.data.content ? node.data.content.length : 0;
    const estimatedHeight = Math.min(Math.max(NODE_HEIGHT, 180 + Math.floor(contentLength / 3)), 600);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - estimatedHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Calculates an offset position for a new child node when added dynamically.
 * Prevents overlapping with existing siblings.
 */
export function calculateChildPosition(
  parentIds: string[],
  nodes: ThoughtFlowNode[],
  edges: ThoughtFlowEdge[]
): { x: number; y: number } {
  if (parentIds.length === 0) {
    if (nodes.length === 0) return { x: 250, y: 150 };
    const maxX = Math.max(...nodes.map((n) => n.position.x));
    return { x: maxX + NODE_WIDTH + 60, y: 150 };
  }

  // If multiple parents (e.g. Merge node)
  if (parentIds.length > 1) {
    const parentNodes = nodes.filter((n) => parentIds.includes(n.id));
    if (parentNodes.length > 0) {
      const avgX = parentNodes.reduce((sum, n) => sum + n.position.x, 0) / parentNodes.length;
      const maxY = Math.max(...parentNodes.map((n) => n.position.y));
      return { x: avgX, y: maxY + NODE_HEIGHT + 140 };
    }
  }

  // Single parent
  const parentNode = nodes.find((n) => n.id === parentIds[0]);
  if (!parentNode) {
    return { x: 250, y: 250 };
  }

  // Find existing children of this parent
  const existingChildEdges = edges.filter((e) => e.source === parentNode.id);
  const siblingCount = existingChildEdges.length;

  const xOffset = (siblingCount - 0.5) * (NODE_WIDTH + 40);
  const yOffset = NODE_HEIGHT + 130;

  return {
    x: parentNode.position.x + (siblingCount === 0 ? 0 : xOffset),
    y: parentNode.position.y + yOffset,
  };
}
