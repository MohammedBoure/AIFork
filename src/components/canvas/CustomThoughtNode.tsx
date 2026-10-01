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
  MessageSquare,
  RotateCw,
  Pencil,
} from 'lucide-react';
import type { ThoughtNodeData } from '../../types/graph';
import { CodeBlock } from '../ui/CodeBlock';
import { Badge } from '../ui/Badge';
import { getModelBadgeInfo, formatTimestamp, copyToClipboard } from '../../utils/formatters';
import { useNodeActions } from './useNodeActions';
import { useLanguage } from '../../i18n/useLanguage';

export const CustomThoughtNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const { t } = useLanguage();
  const nodeData = data as unknown as ThoughtNodeData;
  const {
    onFork,
    onOpenFocusFlow,
    onToggleMergeSelect,
    onDeleteNode,
    onInspectNode,
    onRetryNode,
    onUpdateNodeContent,
    selectedForMergeIds,
    activeParentId,
  } = useNodeActions();

  const isSelectedForMerge = selectedForMergeIds.includes(id);
  const isActiveForkParent = activeParentId === id;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const handleToggleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setEditContent(nodeData.content || '');
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

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
      className={`group relative rounded-2xl w-[360px] sm:w-[380px] bg-zinc-950/95 border backdrop-blur-xl transition-all duration-200 shadow-2xl ${
        selected
          ? 'border-white ring-2 ring-white/30 shadow-white/10'
          : isActiveForkParent
          ? 'border-zinc-200 ring-4 ring-zinc-500/20 shadow-zinc-800/40'
          : isSelectedForMerge
          ? 'border-purple-400 ring-4 ring-purple-500/25 shadow-purple-900/30'
          : isUser
          ? 'border-zinc-800 hover:border-zinc-500'
          : 'border-zinc-800 hover:border-zinc-400'
      }`}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-zinc-100 !border-2 !border-zinc-950 transition-transform group-hover:scale-125"
      />
      {/* Left Handle (for horizontal DAG) */}
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="!w-3 !h-3 !bg-zinc-100 !border-2 !border-zinc-950 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Generating Progress Shimmer Bar */}
      {isGenerating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-500 via-white to-zinc-500 animate-pulse rounded-t-2xl overflow-hidden" />
      )}

      {/* Node Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/40 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          {/* Role Badge */}
          {isUser ? (
            <Badge variant="secondary" icon={<User className="w-3 h-3 text-zinc-300" />} className="bg-zinc-900 text-zinc-200 border-zinc-700">
              User Thought
            </Badge>
          ) : nodeData.isMergeNode ? (
            <Badge variant="purple" icon={<Merge className="w-3 h-3 text-purple-300" />}>
              Synthesis Node
            </Badge>
          ) : (
            <Badge variant="secondary" icon={<Sparkles className="w-3 h-3 text-zinc-100" />} className="bg-zinc-800 text-white border-zinc-600">
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
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-white border border-zinc-600">
              Active Fork
            </span>
          )}
          {isSelectedForMerge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-900/50 text-purple-200 border border-purple-700">
              Merge Pick
            </span>
          )}
        </div>
      </div>

      {/* Branch Title if present */}
      {nodeData.branchLabel && (
        <div className="px-3.5 pt-2 text-[11px] font-semibold text-zinc-400 uppercase font-mono tracking-wider flex items-center gap-1">
          <GitFork className="w-3 h-3 transform -rotate-90" />
          <span>{nodeData.branchLabel}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="p-3.5 text-xs text-zinc-200 max-h-72 overflow-y-auto leading-relaxed scrollbar-thin nodrag select-text selectable-text">
        {isEditing ? (
          <div className="nodrag nopan space-y-2 select-text" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1 border-b border-zinc-800">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Pencil className="w-3 h-3 text-zinc-300" />
                <span>{t.canvas.editPromptTitle}</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">{t.canvas.editPromptHint}</span>
            </div>

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              dir="auto"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed resize-y font-sans transition-colors bidi-auto"
              placeholder={t.canvas.editPromptPlaceholder}
            />

            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNodeContent(id, editContent, true);
                    setIsEditing(false);
                  }}
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] font-semibold transition-colors shadow-sm"
                  title={t.canvas.saveAndRerun}
                >
                  <Sparkles className="w-3 h-3 text-zinc-950" />
                  <span>{t.canvas.saveAndRerun}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNodeContent(id, editContent, false);
                    setIsEditing(false);
                  }}
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-medium transition-colors"
                  title={t.canvas.saveOnly}
                >
                  <Check className="w-3 h-3 text-zinc-300" />
                  <span>{t.canvas.saveOnly}</span>
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditContent(nodeData.content || '');
                  setIsEditing(false);
                }}
                type="button"
                className="px-2 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-[11px] transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        ) : isGenerating && !nodeData.content ? (
          <div className="flex items-center gap-2 text-zinc-400 py-3">
            <Sparkles className="w-4 h-4 animate-spin text-zinc-100" />
            <span className="text-xs">{t.canvas.generating}</span>
          </div>
        ) : isError ? (
          <div className="p-3 rounded-xl bg-zinc-900 border border-rose-800/80 text-rose-300 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold text-rose-200">{t.canvas.generationNotice}</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                  {nodeData.error || 'Failed to generate response'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const isDeepSeek = nodeData.modelUsed?.includes('deepseek') || nodeData.modelUsed?.includes('/');
                  const fastModel = isDeepSeek ? 'deepseek/deepseek-chat' : 'gemini-2.5-flash';
                  onRetryNode(id, fastModel);
                }}
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] font-semibold transition-colors shadow-sm"
                title={t.canvas.retryFast}
              >
                <Sparkles className="w-3 h-3 text-zinc-950" />
                <span>
                  {t.canvas.retryFast}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetryNode(id);
                }}
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-medium transition-colors"
              >
                <RotateCw className="w-3 h-3 text-zinc-400" />
                <span>{t.common.retry}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="prose-custom text-zinc-200 select-text selectable-text cursor-text" dir="auto">
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
      <div className="px-3.5 py-2 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          {nodeData.createdAt && (
            <span className="flex items-center gap-1" title={new Date(nodeData.createdAt).toLocaleString()}>
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{formatTimestamp(nodeData.createdAt)}</span>
            </span>
          )}
          {nodeData.tokens && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-400" title="Gemini Token Usage">
              <Coins className="w-3 h-3 text-zinc-500" />
              <span>{nodeData.tokens.totalTokens || nodeData.tokens.candidatesTokens} tokens</span>
            </span>
          )}
        </div>

        {/* Quick Node Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Focus Flow / Full View Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFocusFlow(id);
            }}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Focus Flow (Full View as Conversation)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {/* Edit Prompt Button */}
          <button
            onClick={handleToggleEdit}
            type="button"
            className={`p-1 rounded transition-colors ${
              isEditing
                ? 'bg-white text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="تعديل الـ Prompt / Edit Prompt"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Copy thought content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspectNode(id);
            }}
            type="button"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
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
            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Node Action Controls (Fork / Merge) */}
      <div className="p-2 border-t border-zinc-800/80 bg-zinc-950/70 rounded-b-2xl flex items-center justify-between gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFork(id);
          }}
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
          title={t.canvas.forkBranch}
        >
          <GitFork className="w-3.5 h-3.5 text-zinc-300 transform -rotate-90" />
          <span>{t.canvas.forkBranch}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMergeSelect(id);
          }}
          type="button"
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
            isSelectedForMerge
              ? 'bg-zinc-800 border-zinc-500 text-white font-semibold'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
          }`}
          title={isSelectedForMerge ? t.canvas.removeFromMerge : t.canvas.pickForMerge}
        >
          <Merge className="w-3.5 h-3.5 text-zinc-300" />
          <span>{isSelectedForMerge ? t.canvas.removeFromMerge : t.canvas.pickForMerge}</span>
        </button>
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-zinc-100 !border-2 !border-zinc-950 transition-transform group-hover:scale-125"
      />
      {/* Right Handle (for horizontal DAG) */}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!w-3 !h-3 !bg-zinc-100 !border-2 !border-zinc-950 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
});

CustomThoughtNode.displayName = 'CustomThoughtNode';
