import type { SerializedGraph } from '../types/graph';

export const STARTER_TEMPLATES: Record<string, SerializedGraph> = {
  ai_architecture: {
    version: '1.0.0',
    title: 'AI Architecture Decision Tree',
    description: 'Branching exploration comparing Serverless Event-driven vs Stateful Dedicated Cluster with multi-branch synthesis.',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 1,
    activeParentId: 'node-merge-synthesis',
    nodes: [
      {
        id: 'node-root-1',
        type: 'thought',
        position: { x: 380, y: 50 },
        data: {
          id: 'node-root-1',
          role: 'user',
          content: 'How should we architect the backend for our low-latency multimodal AI canvas? We need both rapid burst scaling and stateful session memory for 50,000 concurrent users.',
          parentIds: [],
          createdAt: Date.now() - 7200000,
          status: 'idle',
          branchLabel: 'Root Question',
        },
      },
      // Branch A: Serverless
      {
        id: 'node-branch-a-user',
        type: 'thought',
        position: { x: 60, y: 320 },
        data: {
          id: 'node-branch-a-user',
          role: 'user',
          content: 'Forking Path A: Evaluate a 100% Serverless Event-Driven architecture with Edge Workers and Cloudflare KV/Vector DB for fast cold starts.',
          parentIds: ['node-root-1'],
          createdAt: Date.now() - 6000000,
          status: 'idle',
          branchLabel: 'Branch A: Serverless',
        },
      },
      {
        id: 'node-branch-a-ai',
        type: 'thought',
        position: { x: 60, y: 580 },
        data: {
          id: 'node-branch-a-ai',
          role: 'assistant',
          modelUsed: 'gemini-2.5-flash',
          content: `### Branch A: Serverless Edge Evaluation

**Key Architectural Strengths:**
1. **Zero Idle Overhead:** Pay-per-invocation drastically lowers operational baseline during traffic troughs.
2. **Edge Distribution:** Under 25ms TTFB globally via distributed worker runtimes.
3. **Automatic Elasticity:** Scales smoothly from 0 to 50k requests without capacity planning.

**Critical Bottlenecks:**
- WebSocket state persistence requires external pub/sub (e.g. Ably/Upstash Redis).
- Vector indexing operations on Edge have CPU runtime limits (max 30s).`,
          parentIds: ['node-branch-a-user'],
          createdAt: Date.now() - 5400000,
          status: 'idle',
          branchLabel: 'Serverless Insights',
          tokens: { promptTokens: 110, candidatesTokens: 184, totalTokens: 294 },
        },
      },
      // Branch B: Dedicated Stateful Cluster
      {
        id: 'node-branch-b-user',
        type: 'thought',
        position: { x: 700, y: 320 },
        data: {
          id: 'node-branch-b-user',
          role: 'user',
          content: 'Forking Path B: Evaluate a Dedicated Kubernetes StatefulSet with ElastiCache Redis cluster and dedicated GPU nodes for streaming graph inference.',
          parentIds: ['node-root-1'],
          createdAt: Date.now() - 4800000,
          status: 'idle',
          branchLabel: 'Branch B: Dedicated Cluster',
        },
      },
      {
        id: 'node-branch-b-ai',
        type: 'thought',
        position: { x: 700, y: 580 },
        data: {
          id: 'node-branch-b-ai',
          role: 'assistant',
          modelUsed: 'gemini-2.5-pro',
          content: `### Branch B: Stateful Cluster Evaluation

**Key Architectural Strengths:**
1. **In-Memory Graph State:** Nodes and ancestor DAG paths cached in cluster RAM for sub-5ms traversals.
2. **Persistent Streaming Sockets:** Long-lived bidirectional gRPC/WebSocket channels without reconnection overhead.
3. **Predictable Throughput:** Dedicated compute prevents "noisy neighbor" throttling during model calls.

**Critical Trade-offs:**
- Higher baseline cost ($1,200+/month idle cluster reservation).
- Slower autoscaling response times (3-5 minutes for new node pod scheduling).`,
          parentIds: ['node-branch-b-user'],
          createdAt: Date.now() - 4200000,
          status: 'idle',
          branchLabel: 'Dedicated Insights',
          tokens: { promptTokens: 125, candidatesTokens: 215, totalTokens: 340 },
        },
      },
      // Merged Synthesis Node
      {
        id: 'node-merge-synthesis',
        type: 'thought',
        position: { x: 380, y: 920 },
        data: {
          id: 'node-merge-synthesis',
          role: 'assistant',
          modelUsed: 'gemini-2.5-pro',
          isMergeNode: true,
          content: `### 🔀 Multi-Branch Synthesis: Tiered Hybrid Architecture

Synthesizing conclusions from **Branch A (Serverless Edge)** and **Branch B (Dedicated Cluster)**:

1. **Executive Resolution:**
   Adopt a **Tiered Gateway Hybrid**:
   - **Edge Tier (Cloudflare Workers):** Handles auth, static canvas assets, rate limiting, and client routing.
   - **Stateful Core (Kubernetes + Dragonfly/Redis):** Houses the active DAG session graph and streams Gemini API outputs over persistent WebSockets.

2. **Cost & Latency Matrix:**
   - Cold starts eliminated via warmup pools in the stateful layer.
   - 65% cost reduction compared to a purely dedicated cluster by offloading static graph payloads to edge cache.

3. **Immediate Implementation Step:**
   Initialize the DAG state store using lightweight client-side IndexedDB with WebSocket sync to the streaming bridge.`,
          parentIds: ['node-branch-a-ai', 'node-branch-b-ai'],
          createdAt: Date.now() - 3600000,
          status: 'idle',
          branchLabel: 'Merged Synthesis Resolution',
          tokens: { promptTokens: 380, candidatesTokens: 310, totalTokens: 690 },
        },
      },
    ],
    edges: [
      {
        id: 'e-root-branch-a',
        source: 'node-root-1',
        target: 'node-branch-a-user',
        type: 'smoothstep',
        animated: true,
      },
      {
        id: 'e-branch-a-user-ai',
        source: 'node-branch-a-user',
        target: 'node-branch-a-ai',
        type: 'smoothstep',
      },
      {
        id: 'e-root-branch-b',
        source: 'node-root-1',
        target: 'node-branch-b-user',
        type: 'smoothstep',
        animated: true,
      },
      {
        id: 'e-branch-b-user-ai',
        source: 'node-branch-b-user',
        target: 'node-branch-b-ai',
        type: 'smoothstep',
      },
      {
        id: 'e-merge-a',
        source: 'node-branch-a-ai',
        target: 'node-merge-synthesis',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
      },
      {
        id: 'e-merge-b',
        source: 'node-branch-b-ai',
        target: 'node-merge-synthesis',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 },
      },
    ],
  },

  blank_canvas: {
    version: '1.0.0',
    title: 'New Ideation Canvas',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    activeParentId: 'root-thought-1',
    nodes: [
      {
        id: 'root-thought-1',
        type: 'thought',
        position: { x: 350, y: 150 },
        data: {
          id: 'root-thought-1',
          role: 'user',
          content: 'What is our primary goal or creative thesis for today?',
          parentIds: [],
          createdAt: Date.now(),
          status: 'idle',
          branchLabel: 'Genesis Thought',
        },
      },
    ],
    edges: [],
  },
};
