import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  User,
  Sparkles,
  ArrowLeft,
  CornerDownLeft,
  Copy,
  Check,
  Coins,
  GitFork,
  Pencil,
  Eye,
} from 'lucide-react';
import type { ThoughtFlowNode, ModelOption } from '../../types/graph';
import { getBranchAncestors } from '../../utils/contextResolver';
import { CodeBlock } from '../ui/CodeBlock';
import { ModelSelector } from '../settings/ModelSelector';
import { formatTimestamp, copyToClipboard } from '../../utils/formatters';
import { useLanguage } from '../../i18n/useLanguage';

interface FocusFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNodeId: string | null;
  nodes: ThoughtFlowNode[];
  onReplyInFlow: (userPrompt: string, modelId: string, parentNodeId: string) => void;
  onUpdateNodeContent?: (nodeId: string, newContent: string, regenerateChildren?: boolean) => void;
  isGenerating: boolean;
  availableModels: ModelOption[];
  defaultModel: string;
}

export const FocusFlowModal: React.FC<FocusFlowModalProps> = ({
  isOpen,
  onClose,
  targetNodeId,
  nodes,
  onReplyInFlow,
  onUpdateNodeContent,
  isGenerating,
  availableModels,
  defaultModel,
}) => {
  const { t, isRTL, dir } = useLanguage();
  const [replyText, setReplyText] = useState('');
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isReplyPreview, setIsReplyPreview] = useState(false);
  const [isEditPreview, setIsEditPreview] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const nodesMap = new Map(nodes.map((n) => [n.id, n]));
  const branchNodes = targetNodeId ? getBranchAncestors(targetNodeId, nodesMap) : [];
  const leafNode = branchNodes[branchNodes.length - 1];

  // Auto-scroll to latest message on open or when nodes update or live tokens stream in
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, branchNodes.length, isGenerating, leafNode?.data.content]);

  // Handle escape key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetNodeId) return null;

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isGenerating || !leafNode) return;

    onReplyInFlow(replyText.trim(), selectedModel || leafNode.data.modelUsed || defaultModel, leafNode.id);
    setReplyText('');
    setIsReplyPreview(false);
  };

  const handleCopyFullFlow = async () => {
    let text = `# Thought Flow: ${leafNode?.data.branchLabel || 'Conversation Branch'}\n\n`;
    branchNodes.forEach((node, i) => {
      const isUser = node.data.role === 'user';
      text += `### Turn ${i + 1} (${isUser ? 'User' : `${node.data.modelUsed || 'AI'}`})\n\n`;
      text += `${node.data.content}\n\n---\n\n`;
    });

    const success = await copyToClipboard(text);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleCopyMessage = async (content: string, id: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedNodeId(id);
      setTimeout(() => setCopiedNodeId(null), 2000);
    }
  };

  const handleStartEdit = (nodeId: string, currentContent: string) => {
    setEditingNodeId(nodeId);
    setEditingContent(currentContent);
    setIsEditPreview(false);
  };

  const handleSaveEdit = (nodeId: string, regenerate: boolean) => {
    if (onUpdateNodeContent) {
      onUpdateNodeContent(nodeId, editingContent, regenerate);
    }
    setEditingNodeId(null);
    setIsEditPreview(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100 animate-in fade-in duration-200" dir={dir}>
      {/* Top Header Bar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-medium"
            title={t.focusFlow.exitFocus}
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRTL ? 'transform rotate-180' : ''}`} />
            <span>{t.focusFlow.exitFocus}</span>
            <kbd className="hidden sm:inline px-1.5 py-0.2 bg-zinc-800 rounded font-mono text-[10px] text-zinc-400">Esc</kbd>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-800 text-xs">
            <span className="font-semibold text-white">
              {leafNode?.data.branchLabel || t.focusFlow.linearFlow}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {branchNodes.length} {t.common.turns} {t.focusFlow.fromGenesis}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyFullFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-xs"
            title={t.focusFlow.copyFullFlow}
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-zinc-100" />
                <span>{t.focusFlow.copiedFlow}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.focusFlow.copyFullFlow}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto space-y-6">
        {branchNodes.map((node, index) => {
          const isUser = node.data.role === 'user';
          const isCurrentEditing = editingNodeId === node.id;
          const isCurrentCopied = copiedNodeId === node.id;

          return (
            <div
              key={node.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-in slide-in-from-bottom-2 duration-150`}
            >
              {/* Speaker Header */}
              <div className="flex items-center gap-2 px-1 text-xs text-zinc-400">
                {isUser ? (
                  <>
                    {/* Action buttons for user message */}
                    <div className="flex items-center gap-1 mr-1">
                      {onUpdateNodeContent && (
                        <button
                          onClick={() => handleStartEdit(node.id, node.data.content)}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="تعديل الـ Prompt / Edit Prompt"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCopyMessage(node.data.content, node.id)}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title={t.focusFlow.copyPrompt}
                      >
                        {isCurrentCopied ? (
                          <Check className="w-3 h-3 text-zinc-100" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <span className="text-[11px] text-zinc-500">
                      {formatTimestamp(node.data.createdAt)}
                    </span>
                    <span className="font-medium text-zinc-200">{t.common.you}</span>
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                    </div>
                    <span className="font-semibold text-zinc-100">
                      {node.data.modelUsed?.includes('deepseek') ? 'DeepSeek AI' : node.data.modelUsed?.includes('gemini') ? 'Gemini AI' : t.common.ai}
                    </span>
                    {node.data.modelUsed && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {node.data.modelUsed}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-500">
                      {formatTimestamp(node.data.createdAt)}
                    </span>

                    {/* Copy action for assistant message */}
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => handleCopyMessage(node.data.content, node.id)}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title={t.focusFlow.copyResponse}
                      >
                        {isCurrentCopied ? (
                          <Check className="w-3 h-3 text-zinc-100" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Message Bubble / Card */}
              <div
                className={`w-full max-w-3xl rounded-2xl p-5 text-sm leading-relaxed border shadow-md select-text selectable-text ${
                  isUser
                    ? 'bg-zinc-900/90 border-zinc-700 text-zinc-100 rounded-tr-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-200 rounded-tl-sm'
                }`}
                dir="auto"
              >
                {isCurrentEditing ? (
                  <div className="space-y-3" dir="auto">
                    <div className="flex items-center justify-between text-xs text-zinc-400 pb-1 border-b border-zinc-800">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5 text-zinc-300" />
                        <span>{t.focusFlow.editingInFlow}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditPreview(!isEditPreview)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            isEditPreview
                              ? 'bg-white text-zinc-950'
                              : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                          }`}
                          title={isEditPreview ? t.markdown.editMode : t.markdown.livePreview}
                        >
                          {isEditPreview ? (
                            <>
                              <Pencil className="w-3 h-3" />
                              <span>{t.markdown.editMode}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>{t.markdown.livePreview}</span>
                            </>
                          )}
                        </button>
                        <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">{t.focusFlow.editingHint}</span>
                      </div>
                    </div>

                    {isEditPreview ? (
                      <div
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-700/80 min-h-[100px] max-h-60 overflow-y-auto prose-custom select-text selectable-text text-zinc-100"
                        dir="auto"
                      >
                        {editingContent.trim() ? (
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
                            {editingContent}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-zinc-500 italic text-xs">{t.markdown.emptyPreview}</p>
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={4}
                        dir="auto"
                        className="w-full bg-zinc-950 border border-zinc-700 focus:border-zinc-300 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed resize-y font-sans transition-colors bidi-auto"
                        placeholder={t.canvas.editPromptPlaceholder}
                      />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(node.id, true)}
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors shadow-sm"
                          title={t.canvas.saveAndRerun}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                          <span>{t.canvas.saveAndRerun}</span>
                        </button>

                        <button
                          onClick={() => handleSaveEdit(node.id, false)}
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
                          title={t.canvas.saveOnly}
                        >
                          <Check className="w-3.5 h-3.5 text-zinc-300" />
                          <span>{t.canvas.saveOnly}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setEditingNodeId(null)}
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs transition-colors"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : node.data.status === 'generating' && !node.data.content ? (
                  <div className="flex items-center gap-2 text-zinc-400 py-2">
                    <Sparkles className="w-4 h-4 animate-spin text-zinc-200" />
                    <span className="text-xs">Generating response from {node.data.modelUsed || 'AI'}...</span>
                  </div>
                ) : (
                  <div className="prose-custom select-text selectable-text cursor-text" dir="auto">
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
                    {node.data.status === 'generating' && Boolean(node.data.content) && (
                      <div className="inline-flex items-center gap-1.5 mt-2 text-zinc-400 font-mono text-[11px]">
                        <span className="w-1.5 h-3.5 bg-zinc-200 animate-pulse rounded-xs inline-block align-middle" />
                        <span className="text-[10px] animate-pulse">{t.canvas.streaming}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer metrics for AI node */}
                {!isUser && node.data.tokens && (
                  <div className="mt-4 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-zinc-400" />
                      <span>{node.data.tokens.totalTokens} Tokens</span>
                    </span>
                    <span className="text-zinc-600">Step #{index + 1}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Bottom Reply Bar inside Focus View */}
      <footer className="border-t border-zinc-800 bg-zinc-950/95 p-4 select-none">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Controls bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
              <GitFork className="w-3.5 h-3.5 text-zinc-300 transform -rotate-90" />
              <span>{t.focusFlow.continueFlow} {branchNodes.length}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReplyPreview(!isReplyPreview)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  isReplyPreview
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                }`}
                title={isReplyPreview ? t.markdown.editMode : t.markdown.livePreview}
              >
                {isReplyPreview ? (
                  <>
                    <Pencil className="w-3 h-3" />
                    <span>{t.markdown.editMode}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>{t.markdown.livePreview}</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 text-[11px] hidden sm:inline">{t.settings.defaultModel}:</span>
                <ModelSelector
                  selectedModel={selectedModel}
                  onChange={setSelectedModel}
                  availableModels={availableModels}
                  variant="compact"
                />
              </div>
            </div>
          </div>

          {/* Text Input or Live Preview */}
          <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 focus-within:border-zinc-500 transition-colors">
            {isReplyPreview ? (
              <div
                className="flex-1 min-h-[56px] max-h-36 overflow-y-auto p-2.5 bg-zinc-950/80 rounded-lg border border-zinc-700/60 prose-custom text-zinc-100 text-xs sm:text-sm select-text selectable-text"
                dir="auto"
              >
                {replyText.trim() ? (
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
                    {replyText}
                  </ReactMarkdown>
                ) : (
                  <p className="text-zinc-500 italic text-xs py-1">
                    {t.markdown.emptyPreview}
                  </p>
                )}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                rows={2}
                dir="auto"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                placeholder={t.focusFlow.replyPlaceholder}
                disabled={isGenerating}
                className="flex-1 bg-transparent resize-none text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed max-h-32 font-sans bidi-auto"
              />
            )}

            <button
              onClick={() => handleSendReply()}
              disabled={!replyText.trim() || isGenerating}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex-shrink-0"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.focusFlow.thinking}</span>
                </>
              ) : (
                <>
                  <span>{t.focusFlow.reply}</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
