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

  deepseek_reasoning: {
    version: '1.0.0',
    title: 'DeepSeek R1 vs V3 Architecture Exploration',
    description: 'High-speed DeepSeek V3 execution contrasted with DeepSeek R1 chain-of-thought synthesis on OpenRouter.',
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 1,
    activeParentId: 'ds-merge-synthesis',
    nodes: [
      {
        id: 'ds-root-1',
        type: 'thought',
        position: { x: 380, y: 50 },
        data: {
          id: 'ds-root-1',
          role: 'user',
          content: 'How should we design a globally distributed rate-limiter with 99.999% availability, sub-5ms latency, and strict multi-tenant quotas across 24 edge regions?',
          parentIds: [],
          createdAt: Date.now() - 7200000,
          status: 'idle',
          branchLabel: 'Core Architecture Question',
        },
      },
      // Branch 1: DeepSeek V3
      {
        id: 'ds-branch-v3-user',
        type: 'thought',
        position: { x: 60, y: 320 },
        data: {
          id: 'ds-branch-v3-user',
          role: 'user',
          content: 'Forking Path A (DeepSeek V3): Evaluate Local Token Bucket with asynchronous batch synchronization to regional Redis clusters.',
          parentIds: ['ds-root-1'],
          createdAt: Date.now() - 6000000,
          status: 'idle',
          branchLabel: 'Path A: Local Token Bucket',
        },
      },
      {
        id: 'ds-branch-v3-ai',
        type: 'thought',
        position: { x: 60, y: 580 },
        data: {
          id: 'ds-branch-v3-ai',
          role: 'assistant',
          modelUsed: 'deepseek/deepseek-chat',
          content: `### Branch A: Local Token Bucket with Batch Sync

1. **Ultra-Low Latency (<1ms):**
   - Decisions are evaluated entirely in local memory using atomic CAS (Compare-And-Swap) operations on thread-local buckets.
   - Zero synchronous network hops on the critical request path.

2. **Batched Replication:**
   - Background worker flushes consumed token counts to regional Redis every 100ms.
   - Reduces central Redis QPS by 95%.

3. **Trade-off:**
   - Possibility of a ±5% quota burst during rapid multi-region traffic spikes before batch sync reconciles.`,
          parentIds: ['ds-branch-v3-user'],
          createdAt: Date.now() - 5400000,
          status: 'idle',
          branchLabel: 'DeepSeek V3 Analysis',
          tokens: { promptTokens: 130, candidatesTokens: 210, totalTokens: 340 },
        },
      },
      // Branch 2: DeepSeek R1
      {
        id: 'ds-branch-r1-user',
        type: 'thought',
        position: { x: 700, y: 320 },
        data: {
          id: 'ds-branch-r1-user',
          role: 'user',
          content: 'Forking Path B (DeepSeek R1): Evaluate Sliding Window Log with CRDT (Conflict-free Replicated Data Types) across Edge PoPs.',
          parentIds: ['ds-root-1'],
          createdAt: Date.now() - 4800000,
          status: 'idle',
          branchLabel: 'Path B: CRDT Sliding Log',
        },
      },
      {
        id: 'ds-branch-r1-ai',
        type: 'thought',
        position: { x: 700, y: 580 },
        data: {
          id: 'ds-branch-r1-ai',
          role: 'assistant',
          modelUsed: 'deepseek/deepseek-r1',
          content: `> **DeepSeek Reasoning Process:**
> Rigorously verifying CRDT convergence properties under net-split conditions. Evaluating PN-Counters vs state-based G-Counters.

### Branch B: CRDT Sliding Window Evaluation

1. **Mathematical Consistency Guarantee:**
   - Positive-Negative Counter (PN-Counter) CRDTs guarantee eventual consistency even through inter-region fiber cuts.
   - Deterministic merge algorithm without locks or two-phase commit overhead.

2. **Fault Tolerance:**
   - Nodes can make local updates during partitions; state converges monotonically upon reconnection.

3. **Trade-off:**
   - Higher memory overhead per tenant to maintain vector clock timestamps.`,
          parentIds: ['ds-branch-r1-user'],
          createdAt: Date.now() - 4200000,
          status: 'idle',
          branchLabel: 'DeepSeek R1 Reasoning',
          tokens: { promptTokens: 165, candidatesTokens: 245, totalTokens: 410 },
        },
      },
      // Merge Synthesis Node
      {
        id: 'ds-merge-synthesis',
        type: 'thought',
        position: { x: 380, y: 920 },
        data: {
          id: 'ds-merge-synthesis',
          role: 'assistant',
          modelUsed: 'deepseek/deepseek-r1',
          isMergeNode: true,
          content: `> **DeepSeek Reasoning Process:**
> Synthesizing high-speed local token evaluation with mathematically verified CRDT consistency. Constructing two-tier tiered limiter specification.

### 🔀 Unified Synthesis: Two-Tier Adaptive Limiter

Synthesizing **Branch A (DeepSeek V3 Local Bucket)** and **Branch B (DeepSeek R1 CRDT Log)**:

1. **The Optimal Architectural Resolution:**
   - **Tier 1 (Fast Path):** Local token bucket handles 99% of requests in <1ms without network overhead.
   - **Tier 2 (Global Sync):** CRDT delta synchronization propagates bucket allocations between edge nodes every 50ms without locking.

2. **Comparative Matrix:**
   | Metric | Local Bucket (V3) | CRDT Log (R1) | Hybrid Synthesis |
   | :--- | :--- | :--- | :--- |
   | **Path Latency** | < 1ms | 8–15ms | **< 1.2ms** |
   | **Partition Safety** | Drift risks | Mathematically exact | **Monotonic convergence** |
   | **Compute Cost** | Lowest | Medium | **Optimized ($0.04/M req)** |

3. **Actionable Implementation Steps:**
   - Implement Rust WASM module for local Token Bucket evaluation inside edge workers.
   - Sync counter deltas via OpenRouter-monitored telemetry pipeline.

> *Synthesized via OpenRouter • deepseek/deepseek-r1*`,
          parentIds: ['ds-branch-v3-ai', 'ds-branch-r1-ai'],
          createdAt: Date.now() - 3600000,
          status: 'idle',
          branchLabel: 'DeepSeek R1 Synthesis',
          tokens: { promptTokens: 420, candidatesTokens: 390, totalTokens: 810 },
        },
      },
    ],
    edges: [
      {
        id: 'e-ds-root-a',
        source: 'ds-root-1',
        target: 'ds-branch-v3-user',
        type: 'smoothstep',
        animated: true,
      },
      {
        id: 'e-ds-v3-user-ai',
        source: 'ds-branch-v3-user',
        target: 'ds-branch-v3-ai',
        type: 'smoothstep',
      },
      {
        id: 'e-ds-root-b',
        source: 'ds-root-1',
        target: 'ds-branch-r1-user',
        type: 'smoothstep',
        animated: true,
      },
      {
        id: 'e-ds-r1-user-ai',
        source: 'ds-branch-r1-user',
        target: 'ds-branch-r1-ai',
        type: 'smoothstep',
      },
      {
        id: 'e-ds-merge-a',
        source: 'ds-branch-v3-ai',
        target: 'ds-merge-synthesis',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#ffffff', strokeWidth: 2 },
      },
      {
        id: 'e-ds-merge-b',
        source: 'ds-branch-r1-ai',
        target: 'ds-merge-synthesis',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#ffffff', strokeWidth: 2 },
      },
    ],
  },
};
