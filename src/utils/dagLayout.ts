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
 * Prevents overlapping with existing siblings, respecting Top-to-Bottom ('TB') or Left-to-Right ('LR') direction.
 */
export function calculateChildPosition(
  parentIds: string[],
  nodes: ThoughtFlowNode[],
  edges: ThoughtFlowEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { x: number; y: number } {
  const isHorizontal = direction === 'LR';

  if (parentIds.length === 0) {
    if (nodes.length === 0) return { x: 250, y: 150 };
    if (isHorizontal) {
      const maxY = Math.max(...nodes.map((n) => n.position.y));
      return { x: 250, y: maxY + NODE_HEIGHT + 60 };
    } else {
      const maxX = Math.max(...nodes.map((n) => n.position.x));
      return { x: maxX + NODE_WIDTH + 60, y: 150 };
    }
  }

  // If multiple parents (e.g. Merge node)
  if (parentIds.length > 1) {
    const parentNodes = nodes.filter((n) => parentIds.includes(n.id));
    if (parentNodes.length > 0) {
      if (isHorizontal) {
        const maxX = Math.max(...parentNodes.map((n) => n.position.x));
        const avgY = parentNodes.reduce((sum, n) => sum + n.position.y, 0) / parentNodes.length;
        return { x: maxX + NODE_WIDTH + 140, y: avgY };
      } else {
        const avgX = parentNodes.reduce((sum, n) => sum + n.position.x, 0) / parentNodes.length;
        const maxY = Math.max(...parentNodes.map((n) => n.position.y));
        return { x: avgX, y: maxY + NODE_HEIGHT + 140 };
      }
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

  if (isHorizontal) {
    const yOffset = (siblingCount - 0.5) * (NODE_HEIGHT + 40);
    const xOffset = NODE_WIDTH + 130;
    return {
      x: parentNode.position.x + xOffset,
      y: parentNode.position.y + (siblingCount === 0 ? 0 : yOffset),
    };
  } else {
    const xOffset = (siblingCount - 0.5) * (NODE_WIDTH + 40);
    const yOffset = NODE_HEIGHT + 130;
    return {
      x: parentNode.position.x + (siblingCount === 0 ? 0 : xOffset),
      y: parentNode.position.y + yOffset,
    };
  }
}

/**
 * Checks whether connecting sourceId -> targetId would introduce a cycle in the DAG.
 * Returns true if a path already exists from targetId to sourceId, meaning the edge would create a loop.
 */
export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  edges: ThoughtFlowEdge[]
): boolean {
  if (sourceId === targetId) return true;

  const visited = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceId) return true;
    if (!visited.has(current)) {
      visited.add(current);
      const outgoingEdges = edges.filter((e) => e.source === current);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }
  }

  return false;
}
