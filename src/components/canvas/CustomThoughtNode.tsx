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
  Eye,
  Cpu,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ThoughtNodeData } from '../../types/graph';
import { CodeBlock } from '../ui/CodeBlock';
import { Badge } from '../ui/Badge';
import { getModelBadgeInfo, formatTimestamp, copyToClipboard } from '../../utils/formatters';
import { useNodeActions } from './useNodeActions';
import { useLanguage } from '../../i18n/useLanguage';

export const CustomThoughtNode: React.FC<NodeProps> = memo(
  ({ id, data, selected, targetPosition, sourcePosition }) => {
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
      onToggleCollapseNode,
      selectedForMergeIds,
      activeParentId,
    } = useNodeActions();

    const isSelectedForMerge = selectedForMergeIds.includes(id);
    const isActiveForkParent = activeParentId === id;

    // Detect horizontal Left-to-Right orientation
    const isLR = targetPosition === Position.Left || sourcePosition === Position.Right;

    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditPreview, setIsEditPreview] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [localCollapsed, setLocalCollapsed] = useState<boolean | null>(null);

    const isCollapsed = localCollapsed !== null ? localCollapsed : Boolean(nodeData.isCollapsed);

    const handleToggleCollapse = (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextState = !isCollapsed;
      setLocalCollapsed(nextState);
      if (onToggleCollapseNode) {
        onToggleCollapseNode(id);
      }
    };

    const handleToggleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing) {
        setEditContent(nodeData.content || '');
        setIsEditPreview(false);
        setIsEditing(true);
      } else {
        setIsEditing(false);
        setIsEditPreview(false);
      }
    };

    const isUser = nodeData.role === 'user';
    const isGenerating = nodeData.status === 'generating';
    const isError = nodeData.status === 'error';
    const modelInfo = getModelBadgeInfo(nodeData.modelUsed);

    const getAiRoleLabel = () => {
      const model = (nodeData.modelUsed || '').toLowerCase();
      if (model.includes('deepseek')) return 'DeepSeek AI';
      if (model.includes('gemini')) return 'Gemini AI';
      if (model.includes('claude')) return 'Claude AI';
      if (model.includes('gpt') || model.includes('openai')) return 'OpenAI';
      if (model.includes('llama')) return 'Llama AI';
      if (model.includes('mistral')) return 'Mistral AI';
      if (model.includes('qwen')) return 'Qwen AI';
      if (model.includes('/')) {
        const rawVendor = model.split('/')[0];
        return `${rawVendor.charAt(0).toUpperCase() + rawVendor.slice(1)} AI`;
      }
      return t.common.ai || 'AI Assistant';
    };

    const aiRoleLabel = getAiRoleLabel();
    const isDeepSeekOrOpenRouter =
      (nodeData.modelUsed || '').includes('deepseek') || (nodeData.modelUsed || '').includes('/');

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
        className={`group relative rounded-2xl w-[360px] sm:w-[380px] bg-white/95 dark:bg-zinc-950/95 border backdrop-blur-xl transition-all duration-200 shadow-xl ${
          selected
            ? 'border-zinc-900 dark:border-white ring-2 ring-zinc-900/30 dark:ring-white/30 shadow-black/10 dark:shadow-white/10'
            : isActiveForkParent
            ? 'border-zinc-900 dark:border-zinc-200 ring-4 ring-zinc-500/20 shadow-zinc-800/20'
            : isSelectedForMerge
            ? 'border-purple-500 dark:border-purple-400 ring-4 ring-purple-500/25 shadow-purple-900/20'
            : isUser
            ? 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-500'
            : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400'
        }`}
      >
        {/* Primary Target Handle (Adapts dynamically to layout: Left in LR, Top in TB) */}
        <Handle
          type="target"
          position={isLR ? Position.Left : Position.Top}
          className="!w-3.5 !h-3.5 !bg-zinc-700 dark:!bg-zinc-200 hover:!bg-black dark:hover:!bg-white !border-2 !border-white dark:!border-zinc-950 transition-all group-hover:scale-125 shadow-md z-10"
          title={t.canvas.dragToConnect || 'Target relationship handle'}
        />

        {/* Auxiliary Target Handle (allowing cross-axis connections) */}
        <Handle
          type="target"
          id={isLR ? 'top' : 'left'}
          position={isLR ? Position.Top : Position.Left}
          className="!w-2.5 !h-2.5 !bg-zinc-400 hover:!bg-black dark:hover:!bg-white !border-2 !border-white dark:!border-zinc-950 opacity-40 hover:opacity-100 group-hover:opacity-80 transition-all hover:scale-125 z-10"
          title={t.canvas.dragToConnect || 'Auxiliary target handle'}
        />

      {/* Generating Progress Shimmer Bar */}
      {isGenerating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-500 via-white to-zinc-500 animate-pulse rounded-t-2xl overflow-hidden" />
      )}

      {/* Node Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/40 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          {/* Role Badge */}
          {isUser ? (
            <Badge variant="secondary" icon={<User className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />} className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700">
              {t.common.you || 'User Thought'}
            </Badge>
          ) : nodeData.isMergeNode ? (
            <Badge variant="purple" icon={<Merge className="w-3 h-3 text-purple-600 dark:text-purple-300" />}>
              Synthesis Node
            </Badge>
          ) : (
            <Badge variant="secondary" icon={isDeepSeekOrOpenRouter ? <Cpu className="w-3 h-3 text-white" /> : <Sparkles className="w-3 h-3 text-white" />} className="bg-zinc-900 dark:bg-zinc-800 text-white border-zinc-700 dark:border-zinc-600">
              {aiRoleLabel}
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
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-600">
              Active Fork
            </span>
          )}
          {isSelectedForMerge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
              Merge Pick
            </span>
          )}

          {/* Quick Container Toggle Button */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            className={`p-1 rounded-md text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
              isCollapsed ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''
            }`}
            title={isCollapsed ? t.containers.showOnDemand : t.containers.collapseIntoContainer}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Branch Title if present */}
      {nodeData.branchLabel && (
        <div className="px-3.5 pt-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase font-mono tracking-wider flex items-center gap-1">
          <GitFork className="w-3 h-3 transform -rotate-90" />
          <span>{nodeData.branchLabel}</span>
        </div>
      )}

      {/* Content Area: Collapsed Container or Expanded Full Content */}
      {isCollapsed && !isGenerating ? (
        <div className="p-3 select-none">
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-750 bg-zinc-50/90 dark:bg-zinc-900/60 p-3 flex flex-col gap-2.5 transition-all hover:border-zinc-400 dark:hover:border-zinc-600 shadow-inner">
            {/* Container Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                <Package className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>{isUser ? t.containers.questionContainer : t.containers.responseContainer}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300/60 dark:border-zinc-700/60">
                {(nodeData.content || '').length} {t.containers.characters}
              </span>
            </div>

            {/* Faded preview */}
            {Boolean(nodeData.content) && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 italic font-sans px-0.5" dir="auto">
                "{nodeData.content.slice(0, 65).replace(/[\r\n]+/g, ' ')}{nodeData.content.length > 65 ? '...' : ''}"
              </p>
            )}

            {/* Expand on Demand Action */}
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title={t.containers.showOnDemand}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.containers.showOnDemand}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 text-xs text-zinc-800 dark:text-zinc-200 max-h-72 overflow-y-auto leading-relaxed scrollbar-thin nodrag select-text selectable-text">
          {/* Quick Collapse to Container bar */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center gap-1">
              <Package className="w-3 h-3 text-zinc-400" />
              <span>{isUser ? t.containers.questionContainer : t.containers.responseContainer}</span>
            </span>
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t.containers.collapseIntoContainer}
            >
              <ChevronUp className="w-3 h-3" />
              <span>{t.containers.collapseIntoContainer}</span>
            </button>
          </div>
        {isEditing ? (
          <div className="nodrag nopan space-y-2 select-text" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pb-1 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Pencil className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                <span>{t.canvas.editPromptTitle}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditPreview(!isEditPreview);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    isEditPreview
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'
                      : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                  }`}
                  title={isEditPreview ? t.markdown.editMode : t.markdown.livePreview}
                >
                  {isEditPreview ? (
                    <>
                      <Pencil className="w-2.5 h-2.5" />
                      <span>{t.markdown.editMode}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-2.5 h-2.5" />
                      <span>{t.markdown.livePreview}</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">{t.canvas.editPromptHint}</span>
              </div>
            </div>

            {isEditPreview ? (
              <div
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 min-h-[90px] max-h-56 overflow-y-auto prose-custom select-text selectable-text text-zinc-800 dark:text-zinc-200 text-xs"
                dir="auto"
              >
                {editContent.trim() ? (
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
                    {editContent}
                  </ReactMarkdown>
                ) : (
                  <p className="text-zinc-400 italic text-xs py-1">{t.markdown.emptyPreview}</p>
                )}
              </div>
            ) : (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                dir="auto"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 dark:focus:border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none leading-relaxed resize-y font-sans transition-colors bidi-auto"
                placeholder={t.canvas.editPromptPlaceholder}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNodeContent(id, editContent, true);
                    setIsEditing(false);
                    setIsEditPreview(false);
                  }}
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-[11px] font-semibold transition-colors shadow-sm"
                  title={t.canvas.saveAndRerun}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t.canvas.saveAndRerun}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNodeContent(id, editContent, false);
                    setIsEditing(false);
                    setIsEditPreview(false);
                  }}
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium transition-colors"
                  title={t.canvas.saveOnly}
                >
                  <Check className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                  <span>{t.canvas.saveOnly}</span>
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditContent(nodeData.content || '');
                  setIsEditing(false);
                  setIsEditPreview(false);
                }}
                type="button"
                className="px-2 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] transition-colors"
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
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-zinc-900 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200">{t.canvas.generationNotice}</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300/90 mt-0.5 leading-relaxed">
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
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-[11px] font-semibold transition-colors shadow-sm"
                title={t.canvas.retryFast}
              >
                <Sparkles className="w-3 h-3" />
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
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium transition-colors"
              >
                <RotateCw className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                <span>{t.common.retry}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="prose-custom text-zinc-800 dark:text-zinc-200 select-text selectable-text cursor-text" dir="auto">
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
            {isGenerating && Boolean(nodeData.content) && (
              <div className="inline-flex items-center gap-1.5 mt-2 text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                <span className="w-1.5 h-3.5 bg-zinc-800 dark:bg-zinc-200 animate-pulse rounded-xs inline-block align-middle" />
                <span className="animate-pulse">{t.canvas.streaming}</span>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Node Footer: Metadata (Time, Tokens) */}
      <div className="px-3.5 py-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/30 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          {nodeData.createdAt && (
            <span className="flex items-center gap-1" title={new Date(nodeData.createdAt).toLocaleString()}>
              <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
              <span>{formatTimestamp(nodeData.createdAt)}</span>
            </span>
          )}
          {nodeData.tokens && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400" title="Token Usage">
              <Coins className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
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
            className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
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
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800'
            }`}
            title="تعديل الـ Prompt / Edit Prompt"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            title="Copy thought content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspectNode(id);
            }}
            type="button"
            className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
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
            className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Node Action Controls (Fork / Merge) */}
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/70 rounded-b-2xl flex items-center justify-between gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFork(id);
          }}
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 text-xs font-medium transition-colors"
          title={t.canvas.forkBranch}
        >
          <GitFork className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 transform -rotate-90" />
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
              ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-white font-semibold'
              : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border-zinc-200 dark:border-zinc-800'
          }`}
          title={isSelectedForMerge ? t.canvas.removeFromMerge : t.canvas.pickForMerge}
        >
          <Merge className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span>{isSelectedForMerge ? t.canvas.removeFromMerge : t.canvas.pickForMerge}</span>
        </button>
      </div>

      {/* Primary Source Handle (Adapts dynamically to layout: Right in LR, Bottom in TB) */}
      <Handle
        type="source"
        position={isLR ? Position.Right : Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-zinc-700 dark:!bg-zinc-200 hover:!bg-black dark:hover:!bg-white !border-2 !border-white dark:!border-zinc-950 transition-all group-hover:scale-125 shadow-md z-10"
        title={t.canvas.dragToConnect || 'Source relationship handle'}
      />

      {/* Auxiliary Source Handle (allowing cross-axis connections) */}
      <Handle
        type="source"
        id={isLR ? 'bottom' : 'right'}
        position={isLR ? Position.Bottom : Position.Right}
        className="!w-2.5 !h-2.5 !bg-zinc-400 hover:!bg-black dark:hover:!bg-white !border-2 !border-white dark:!border-zinc-950 opacity-40 hover:opacity-100 group-hover:opacity-80 transition-all hover:scale-125 z-10"
        title={t.canvas.dragToConnect || 'Auxiliary source handle'}
      />
    </div>
  );
});

CustomThoughtNode.displayName = 'CustomThoughtNode';
