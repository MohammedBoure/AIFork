import React, { useState } from 'react';
import {
  X,
  Merge,
  Sparkles,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import type { ThoughtFlowNode, ModelOption } from '../../types/graph';
import { ModelSelector } from '../settings/ModelSelector';
import { getModelBadgeInfo } from '../../utils/formatters';
import { useLanguage } from '../../i18n/useLanguage';

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodes: ThoughtFlowNode[];
  availableModels: ModelOption[];
  defaultMergeModel: string;
  onConfirmMerge: (synthesisPrompt: string, modelId: string) => void;
  isGenerating: boolean;
}

const SYNTHESIS_TEMPLATES = [
  'Synthesize the perspectives, reconcile trade-offs, and produce a unified, comprehensive conclusion with actionable next steps.',
  'Compare the pros, cons, costs, and feasibility of each branch in a structured comparison table, followed by a final decision.',
  'Extract the best components from each branch into a hybrid architecture specification with code architecture snippets.',
];

export const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  selectedNodes,
  availableModels,
  defaultMergeModel,
  onConfirmMerge,
  isGenerating,
}) => {
  const { t } = useLanguage();
  const [modelId, setModelId] = useState(defaultMergeModel);
  const [synthesisPrompt, setSynthesisPrompt] = useState(SYNTHESIS_TEMPLATES[0]);

  if (!isOpen) return null;

  const handleMerge = () => {
    onConfirmMerge(synthesisPrompt, modelId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Merge className="w-4 h-4 text-zinc-100" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-zinc-100 flex items-center gap-2">
                {t.merge.title}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono">
                  {selectedNodes.length} {t.merge.selectedBranches}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {t.merge.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-850 transition-colors"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Selected Branch Cards */}
          <div>
            <label className="text-xs font-medium text-zinc-300 mb-2 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-zinc-300" />
              Incoming Branches to Synthesize
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {selectedNodes.map((node, i) => {
                const modelBadge = getModelBadgeInfo(node.data.modelUsed);
                return (
                  <div
                    key={node.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between text-xs hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-zinc-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                          {node.data.branchLabel || `Branch ${i + 1}`}
                        </span>
                        {node.data.modelUsed && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${modelBadge.badgeClass}`}>
                            {node.data.modelUsed}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 line-clamp-3 text-[11px] leading-relaxed">
                        {node.data.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Selection for Merge */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-100" />
                  Synthesis Reasoning Model
                </label>
                <p className="text-[11px] text-zinc-400">
                  Select a deep-reasoning model optimized for complex trade-off reconciliation.
                </p>
              </div>
            </div>
            <ModelSelector
              selectedModel={modelId}
              onChange={setModelId}
              availableModels={availableModels}
              variant="full"
            />
          </div>

          {/* Synthesis Goal Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                Synthesis Goal & Instructions
              </label>
              <span className="text-[11px] text-zinc-500">Customizable</span>
            </div>
            <textarea
              rows={3}
              value={synthesisPrompt}
              onChange={(e) => setSynthesisPrompt(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 leading-relaxed"
              placeholder="How should Gemini synthesize these paths?"
            />

            {/* Template Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SYNTHESIS_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSynthesisPrompt(tmpl)}
                  className="text-[10px] px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors text-left"
                >
                  Template {idx + 1}: {tmpl.slice(0, 38)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleMerge}
            disabled={isGenerating || selectedNodes.length < 2}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 text-xs font-semibold shadow-md transition-all"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
                <span>{t.promptBar.branching}</span>
              </>
            ) : (
              <>
                <span>{t.merge.executeMerge}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
