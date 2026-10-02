import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  GitFork,
  X,
  Sparkles,
  CornerDownLeft,
  Eye,
  Pencil,
} from 'lucide-react';
import type { ModelOption } from '../../types/graph';
import { ModelSelector } from '../settings/ModelSelector';
import { CodeBlock } from '../ui/CodeBlock';
import { useLanguage } from '../../i18n/useLanguage';

interface ForkPromptBarProps {
  activeParentTitle?: string | null;
  activeParentId: string | null;
  onClearParent: () => void;
  onSubmit: (prompt: string, modelId: string) => void;
  isGenerating: boolean;
  availableModels: ModelOption[];
  defaultModel: string;
}

export const ForkPromptBar: React.FC<ForkPromptBarProps> = ({
  activeParentTitle,
  activeParentId,
  onClearParent,
  onSubmit,
  isGenerating,
  availableModels,
  defaultModel,
}) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeModel = selectedModel ?? defaultModel;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    onSubmit(prompt.trim(), activeModel);
    setPrompt('');
    setIsPreview(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-3xl px-4 pointer-events-none">
      <div className="pointer-events-auto bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl p-3 text-zinc-900 dark:text-zinc-100 transition-all duration-200 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-400/20 dark:focus-within:ring-zinc-500/20">
        {/* Parent Context Banner & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800/80 text-xs">
          {/* Active Branch Parent */}
          <div className="flex items-center gap-1.5 min-w-0">
            {activeParentId ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200">
                <GitFork className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300 transform -rotate-90 flex-shrink-0" />
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">{t.promptBar.branchingOff}</span>
                <span className="font-medium max-w-[180px] sm:max-w-xs truncate text-zinc-900 dark:text-zinc-100">
                  {activeParentTitle || `Node ${activeParentId.slice(0, 8)}`}
                </span>
                <button
                  type="button"
                  onClick={onClearParent}
                  className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  title="Clear Parent"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />
                <span className="text-[11px]">{t.promptBar.genesisThought}</span>
              </div>
            )}
          </div>

          {/* Right Tools: Live Preview Toggle & Granular Model Selector */}
          <div className="flex items-center gap-2">
            {/* Live Preview Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                isPreview
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
              title={isPreview ? t.markdown.editMode : t.markdown.livePreview}
            >
              {isPreview ? (
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

            {/* Model Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">{t.promptBar.modelForBranch}</span>
              <ModelSelector
                selectedModel={activeModel}
                onChange={setSelectedModel}
                availableModels={availableModels}
                variant="compact"
              />
            </div>
          </div>
        </div>

        {/* Input Area or Live Render Preview */}
        <div className="flex items-end gap-2">
          {isPreview ? (
            <div
              className="flex-1 min-h-[56px] max-h-48 overflow-y-auto p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 prose-custom text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm select-text selectable-text transition-all"
              dir="auto"
            >
              {prompt.trim() ? (
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
                  {prompt}
                </ReactMarkdown>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 italic text-xs py-1">
                  {t.markdown.emptyPreview}
                </p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={2}
              dir="auto"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeParentId
                  ? t.promptBar.expandPlaceholder
                  : t.promptBar.startPlaceholder
              }
              disabled={isGenerating}
              className="flex-1 bg-transparent resize-none text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none leading-relaxed max-h-36 overflow-y-auto font-sans bidi-auto"
            />
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold shadow-md transition-all flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-zinc-400 dark:text-zinc-950" />
                <span className="hidden sm:inline">{t.promptBar.branching}</span>
              </>
            ) : (
              <>
                <span>{t.promptBar.send}</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
