import dagre from 'dagre';
import { Position } from '@xyflow/react';
import type { ThoughtFlowNode, ThoughtFlowEdge } from '../types/graph';

export const NODE_WIDTH = 380;
export const NODE_HEIGHT = 260;

/**
 * Calculates automated positions for nodes and edges using dagre DAG layout.
 * Supports Left-to-Right ('LR') or Top-to-Bottom ('TB').
 * Uses balanced median alignment so linear branches stay strictly in a straight line
 * (Top-to-Bottom nodes appear vertically stacked directly under each other;
 * Left-to-Right nodes appear horizontally directly to the side).
 */
export function getLayoutedElements(
  nodes: ThoughtFlowNode[],
  edges: ThoughtFlowEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: ThoughtFlowNode[]; edges: ThoughtFlowEdge[] } {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 90 : 120,
    ranksep: isHorizontal ? 120 : 130,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    const isCollapsed = Boolean(node.data.isCollapsed);
    const contentLength = node.data.content ? node.data.content.length : 0;
    // Clamped realistic height calculation matching max-h-72 (288px) + header + actions, or compact container (120px)
    const estimatedHeight = isCollapsed
      ? 120
      : Math.min(Math.max(220, 180 + Math.floor(contentLength / 4)), 400);

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
    const isCollapsed = Boolean(node.data.isCollapsed);
    const contentLength = node.data.content ? node.data.content.length : 0;
    const estimatedHeight = isCollapsed
      ? 120
      : Math.min(Math.max(220, 180 + Math.floor(contentLength / 4)), 400);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition ? nodeWithPosition.x - NODE_WIDTH / 2 : node.position.x,
        y: nodeWithPosition ? nodeWithPosition.y - estimatedHeight / 2 : node.position.y,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Calculates an offset position for a new child node when added dynamically.
 * In 'TB' mode: single child continues directly underneath the parent (same X axis).
 * In 'LR' mode: single child continues directly sideways to the right (same Y axis).
 * Sibling branches are distributed symmetrically without overlapping.
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
      return { x: 250, y: maxY + 320 };
    } else {
      const maxX = Math.max(...nodes.map((n) => n.position.x));
      return { x: maxX + NODE_WIDTH + 100, y: 150 };
    }
  }

  // If multiple parents (e.g. Merge node)
  if (parentIds.length > 1) {
    const parentNodes = nodes.filter((n) => parentIds.includes(n.id));
    if (parentNodes.length > 0) {
      if (isHorizontal) {
        const maxX = Math.max(...parentNodes.map((n) => n.position.x));
        const avgY = parentNodes.reduce((sum, n) => sum + n.position.y, 0) / parentNodes.length;
        return { x: maxX + NODE_WIDTH + 120, y: avgY };
      } else {
        const avgX = parentNodes.reduce((sum, n) => sum + n.position.x, 0) / parentNodes.length;
        const maxY = Math.max(...parentNodes.map((n) => n.position.y));
        return { x: avgX, y: maxY + 320 };
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
    // Sideways flow (LR): parent to right, siblings spread vertically
    const xOffset = NODE_WIDTH + 120;
    // Sibling 0: exact same horizontal line (y = parent.y)
    // Sibling 1+: spread symmetrically alternating top and bottom
    const yOffset =
      siblingCount === 0
        ? 0
        : (siblingCount % 2 === 1 ? Math.ceil(siblingCount / 2) : -Math.ceil(siblingCount / 2)) * 320;

    return {
      x: parentNode.position.x + xOffset,
      y: parentNode.position.y + yOffset,
    };
  } else {
    // Forward flow (TB): parent to bottom, siblings spread horizontally
    // Sibling 0: exact same vertical line (x = parent.x) -> strictly under each other
    // Sibling 1+: spread symmetrically alternating right and left
    const yOffset = 320;
    const xOffset =
      siblingCount === 0
        ? 0
        : (siblingCount % 2 === 1 ? Math.ceil(siblingCount / 2) : -Math.ceil(siblingCount / 2)) *
          (NODE_WIDTH + 100);

    return {
      x: parentNode.position.x + xOffset,
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
