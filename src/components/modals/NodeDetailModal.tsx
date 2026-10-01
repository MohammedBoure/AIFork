import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Sparkles,
  User,
  Clock,
  Coins,
  GitFork,
  Merge,
  ArrowRight,
} from 'lucide-react';
import type { ThoughtFlowNode } from '../../types/graph';
import { CodeBlock } from '../ui/CodeBlock';
import { getModelBadgeInfo } from '../../utils/formatters';
import { getBranchAncestors } from '../../utils/contextResolver';

interface NodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  nodes: ThoughtFlowNode[];
  onFork: (nodeId: string) => void;
  onToggleMergeSelect: (nodeId: string) => void;
  isSelectedForMerge: boolean;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodes,
  onFork,
  onToggleMergeSelect,
  isSelectedForMerge,
}) => {
  if (!isOpen || !nodeId) return null;

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const nodesMap = new Map(nodes.map((n) => [n.id, n]));
  const ancestors = getBranchAncestors(nodeId, nodesMap);
  const isUser = node.data.role === 'user';
  const modelInfo = getModelBadgeInfo(node.data.modelUsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isUser ? (
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base text-white">
                  {node.data.branchLabel || (isUser ? 'User Thought' : 'Gemini Thought Node')}
                </h2>
                {!isUser && node.data.modelUsed && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${modelInfo.badgeClass}`}>
                    {node.data.modelUsed}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">ID: {node.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ancestry Path Bar */}
        <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 flex-shrink-0 font-medium">Ancestry Path:</span>
          {ancestors.map((anc, idx) => (
            <React.Fragment key={anc.id}>
              <span
                className={`px-2 py-0.5 rounded font-mono truncate max-w-[140px] ${
                  anc.id === node.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300'
                }`}
                title={anc.data.content}
              >
                {anc.data.branchLabel || `${anc.data.role === 'user' ? '👤 User' : '✨ AI'}`}
              </span>
              {idx < ancestors.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm leading-relaxed">
          <div className="prose-custom max-w-none">
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
              {node.data.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            {node.data.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(node.data.createdAt).toLocaleString()}</span>
              </span>
            )}
            {node.data.tokens && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{node.data.tokens.totalTokens} Total Tokens</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleMergeSelect(node.id);
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isSelectedForMerge
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border-purple-500/20'
              }`}
            >
              <Merge className="w-3.5 h-3.5" />
              <span>{isSelectedForMerge ? 'Selected for Merge' : 'Pick for Merge'}</span>
            </button>

            <button
              onClick={() => {
                onFork(node.id);
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center gap-1.5"
            >
              <GitFork className="w-3.5 h-3.5 transform -rotate-90" />
              <span>Fork from Here</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
