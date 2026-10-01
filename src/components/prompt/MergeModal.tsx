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
  const [modelId, setModelId] = useState(defaultMergeModel);
  const [synthesisPrompt, setSynthesisPrompt] = useState(SYNTHESIS_TEMPLATES[0]);

  if (!isOpen) return null;

  const handleMerge = () => {
    onConfirmMerge(synthesisPrompt, modelId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-950 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Merge className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-white flex items-center gap-2">
                Multi-Branch Synthesis (Merge)
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-800/60 font-mono">
                  {selectedNodes.length} Branches Selected
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fuse disparate thought trajectories into a unified resolution node.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Selected Branch Cards */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              Incoming Branches to Synthesize
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {selectedNodes.map((node, i) => {
                const modelBadge = getModelBadgeInfo(node.data.modelUsed);
                return (
                  <div
                    key={node.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-blue-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {node.data.branchLabel || `Branch ${i + 1}`}
                        </span>
                        {node.data.modelUsed && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${modelBadge.badgeClass}`}>
                            {node.data.modelUsed}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 line-clamp-3 text-[11px] leading-relaxed">
                        {node.data.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Selection for Merge */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Synthesis Reasoning Model
                </label>
                <p className="text-[11px] text-slate-400">
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
              <label className="text-xs font-medium text-slate-300">
                Synthesis Goal & Instructions
              </label>
              <span className="text-[11px] text-slate-500">Customizable</span>
            </div>
            <textarea
              rows={3}
              value={synthesisPrompt}
              onChange={(e) => setSynthesisPrompt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
              placeholder="How should Gemini synthesize these paths?"
            />

            {/* Template Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SYNTHESIS_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSynthesisPrompt(tmpl)}
                  className="text-[10px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-left"
                >
                  Template {idx + 1}: {tmpl.slice(0, 38)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMerge}
            disabled={isGenerating || selectedNodes.length < 2}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-medium shadow-lg shadow-purple-900/40 transition-all"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing Paths...</span>
              </>
            ) : (
              <>
                <span>Generate Synthesis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
