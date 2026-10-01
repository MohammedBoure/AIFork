import React, { useState, useRef } from 'react';
import {
  GitFork,
  X,
  Sparkles,
  CornerDownLeft,
  Lightbulb,
} from 'lucide-react';
import type { ModelOption } from '../../types/graph';
import { ModelSelector } from '../settings/ModelSelector';

interface ForkPromptBarProps {
  activeParentTitle?: string | null;
  activeParentId: string | null;
  onClearParent: () => void;
  onSubmit: (prompt: string, modelId: string) => void;
  isGenerating: boolean;
  availableModels: ModelOption[];
  defaultModel: string;
}

const PROMPT_SUGGESTIONS = [
  '⚡ Explore an alternative approach',
  '⚖️ Analyze pros, cons, and trade-offs',
  '🔍 Identify potential edge cases & risks',
  '🛠️ Break down concrete implementation steps',
];

export const ForkPromptBar: React.FC<ForkPromptBarProps> = ({
  activeParentTitle,
  activeParentId,
  onClearParent,
  onSubmit,
  isGenerating,
  availableModels,
  defaultModel,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeModel = selectedModel ?? defaultModel;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    onSubmit(prompt.trim(), activeModel);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-3xl px-4 pointer-events-none">
      <div className="pointer-events-auto bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl p-3 text-zinc-100 transition-all duration-200 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/20">
        {/* Parent Context Banner & Model Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80 text-xs">
          {/* Active Branch Parent */}
          <div className="flex items-center gap-1.5 min-w-0">
            {activeParentId ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200">
                <GitFork className="w-3.5 h-3.5 text-zinc-300 transform -rotate-90 flex-shrink-0" />
                <span className="text-zinc-400 text-[11px]">Branching off:</span>
                <span className="font-medium max-w-[220px] sm:max-w-xs truncate text-zinc-100">
                  {activeParentTitle || `Node ${activeParentId.slice(0, 8)}`}
                </span>
                <button
                  type="button"
                  onClick={onClearParent}
                  className="ml-1 p-0.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                  title="Branch off root canvas instead"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px]">Genesis Thought (Root Node)</span>
              </div>
            )}
          </div>

          {/* Granular Per-Fork Model Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 hidden sm:inline">Model for this branch:</span>
            <ModelSelector
              selectedModel={activeModel}
              onChange={setSelectedModel}
              availableModels={availableModels}
              variant="compact"
            />
          </div>
        </div>

        {/* Text Input Area */}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeParentId
                ? 'Expand this thought, challenge assumptions, or propose a new branch direction...'
                : 'Start a new thought graph or problem statement...'
            }
            disabled={isGenerating}
            className="flex-1 bg-transparent resize-none text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed max-h-36 overflow-y-auto"
          />

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-semibold shadow-md transition-all flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
                <span className="hidden sm:inline">Branching...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Suggestion Starter Chips */}
        <div className="hidden md:flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-800/60 overflow-x-auto text-[11px]">
          <span className="text-zinc-500 flex items-center gap-1 flex-shrink-0">
            <Lightbulb className="w-3 h-3 text-zinc-300" />
            <span>Starters:</span>
          </span>
          {PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setPrompt(suggestion.replace(/^[^\s]+\s/, ''))}
              className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 hover:text-white text-zinc-400 border border-zinc-800 transition-colors whitespace-nowrap"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
