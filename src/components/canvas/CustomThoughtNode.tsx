import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  User,
  Sparkles,
  GitFork,
  Merge,
  Trash2,
  Copy,
  Check,
  Maximize2,
  AlertCircle,
  Clock,
  Coins,
} from 'lucide-react';
import type { ThoughtNodeData } from '../../types/graph';
import { CodeBlock } from '../ui/CodeBlock';
import { Badge } from '../ui/Badge';
import { getModelBadgeInfo, formatTimestamp, copyToClipboard } from '../../utils/formatters';
import { useNodeActions } from './useNodeActions';

export const CustomThoughtNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const nodeData = data as unknown as ThoughtNodeData;
  const {
    onFork,
    onToggleMergeSelect,
    onDeleteNode,
    onInspectNode,
    selectedForMergeIds,
    activeParentId,
  } = useNodeActions();

  const isSelectedForMerge = selectedForMergeIds.includes(id);
  const isActiveForkParent = activeParentId === id;

  const [copied, setCopied] = useState(false);
  const isUser = nodeData.role === 'user';
  const isGenerating = nodeData.status === 'generating';
  const isError = nodeData.status === 'error';
  const modelInfo = getModelBadgeInfo(nodeData.modelUsed);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(nodeData.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl w-[360px] sm:w-[380px] bg-slate-900/95 border backdrop-blur-xl transition-all duration-200 shadow-xl ${
        isActiveForkParent
          ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-blue-900/30'
          : isSelectedForMerge
          ? 'border-purple-500 ring-4 ring-purple-500/25 shadow-purple-900/30'
          : isUser
          ? 'border-slate-700/80 hover:border-blue-500/60'
          : 'border-indigo-900/60 hover:border-purple-500/60'
      }`}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-950 transition-transform group-hover:scale-125"
      />
      {/* Left Handle (for horizontal DAG) */}
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-950 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Generating Progress Shimmer Bar */}
      {isGenerating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse rounded-t-2xl overflow-hidden" />
      )}

      {/* Node Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          {/* Role Badge */}
          {isUser ? (
            <Badge variant="primary" icon={<User className="w-3 h-3 text-blue-400" />}>
              User Thought
            </Badge>
          ) : nodeData.isMergeNode ? (
            <Badge variant="purple" icon={<Merge className="w-3 h-3 text-purple-400" />}>
              Synthesis Node
            </Badge>
          ) : (
            <Badge variant="secondary" icon={<Sparkles className="w-3 h-3 text-purple-400" />}>
              Gemini AI
            </Badge>
          )}

          {/* Model Tag Badge */}
          {!isUser && nodeData.modelUsed && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${modelInfo.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${modelInfo.dotClass}`}></span>
              <span className="truncate max-w-[120px]">{nodeData.modelUsed}</span>
            </span>
          )}
        </div>

        {/* State Badges & Indicators */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActiveForkParent && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Active Fork
            </span>
          )}
          {isSelectedForMerge && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Merge Pick
            </span>
          )}
        </div>
      </div>

      {/* Branch Title if present */}
      {nodeData.branchLabel && (
        <div className="px-3.5 pt-2 text-[11px] font-semibold text-blue-400/90 uppercase tracking-wider flex items-center gap-1">
          <GitFork className="w-3 h-3 transform -rotate-90" />
          <span>{nodeData.branchLabel}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="p-3.5 text-xs text-slate-200 max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
        {isGenerating && !nodeData.content ? (
          <div className="flex items-center gap-2 text-slate-400 py-3">
            <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
            <span className="text-xs">Generating thoughtful response...</span>
          </div>
        ) : isError ? (
          <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Generation Error</p>
              <p className="text-[11px] text-rose-400/90 mt-0.5">{nodeData.error || 'Failed to generate response'}</p>
            </div>
          </div>
        ) : (
          <div className="prose-custom">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {nodeData.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Node Footer: Metadata (Time, Tokens) */}
      <div className="px-3.5 py-2 border-t border-slate-800/60 bg-slate-950/30 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          {nodeData.createdAt && (
            <span className="flex items-center gap-1" title={new Date(nodeData.createdAt).toLocaleString()}>
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{formatTimestamp(nodeData.createdAt)}</span>
            </span>
          )}
          {nodeData.tokens && (
            <span className="flex items-center gap-1 font-mono text-[10px]" title="Gemini Token Usage">
              <Coins className="w-3 h-3 text-amber-500/80" />
              <span>{nodeData.tokens.totalTokens || nodeData.tokens.candidatesTokens} tokens</span>
            </span>
          )}
        </div>

        {/* Quick Node Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy thought content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspectNode(id);
            }}
            type="button"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Inspect details & branch history"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(id);
            }}
            type="button"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Node Action Controls (Fork / Merge) */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/70 rounded-b-2xl flex items-center justify-between gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFork(id);
          }}
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
        >
          <GitFork className="w-3.5 h-3.5 text-blue-400 transform -rotate-90" />
          <span>Fork Branch</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMergeSelect(id);
          }}
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
            isSelectedForMerge
              ? 'bg-purple-600/30 border-purple-500 text-purple-200'
              : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border-purple-500/20'
          }`}
        >
          <Merge className="w-3.5 h-3.5 text-purple-400" />
          <span>{isSelectedForMerge ? 'Selected' : 'Merge Pick'}</span>
        </button>
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-950 transition-transform group-hover:scale-125"
      />
      {/* Right Handle (for horizontal DAG) */}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-950 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
});

CustomThoughtNode.displayName = 'CustomThoughtNode';
