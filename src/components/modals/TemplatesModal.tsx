import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { STARTER_TEMPLATES } from '../../services/mockData';
import type { SerializedGraph } from '../../types/graph';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (graph: SerializedGraph) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const templates = [
    {
      key: 'deepseek_reasoning',
      title: 'DeepSeek R1 vs V3 Architecture Exploration',
      badge: 'OpenRouter • DeepSeek Reasoning',
      description:
        'A multi-branch exploration comparing high-speed DeepSeek V3 execution with deep chain-of-thought DeepSeek R1 reasoning and unified multi-branch synthesis.',
      nodesCount: 6,
      branchesCount: 6,
      color: 'border-zinc-700 hover:border-zinc-400',
    },
    {
      key: 'ai_architecture',
      title: 'AI Architecture Decision Tree (Gemini)',
      badge: 'Multi-Branch & Synthesis',
      description:
        'A comprehensive branching exploration comparing Serverless Edge Workers (Gemini 2.5 Flash) vs Dedicated Kubernetes Cluster (Gemini 2.5 Pro) with a synthesized hybrid resolution node.',
      nodesCount: 6,
      branchesCount: 6,
      color: 'border-zinc-800 hover:border-zinc-600',
    },
    {
      key: 'blank_canvas',
      title: 'Blank Ideation Canvas',
      badge: 'Fresh Start',
      description:
        'A clean slate starting with a single root thought. Ideal for starting an entirely new ideation process from scratch.',
      nodesCount: 1,
      branchesCount: 0,
      color: 'border-zinc-800 hover:border-zinc-600',
    },
  ];

  const handlePick = (key: string) => {
    const template = STARTER_TEMPLATES[key];
    if (template) {
      onSelectTemplate(template);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-zinc-100" />
            <h2 className="font-semibold text-base text-zinc-100">Starter Thought Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Choose a pre-configured thought graph template to explore branching topologies, per-branch model tags, and multi-path synthesis.
          </p>

          <div className="space-y-3">
            {templates.map((tpl) => (
              <div
                key={tpl.key}
                onClick={() => handlePick(tpl.key)}
                className={`p-4 rounded-xl bg-zinc-900/80 border ${tpl.color} cursor-pointer transition-all hover:bg-zinc-900 flex flex-col justify-between gap-3 group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-white transition-colors">
                      {tpl.title}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span>{tpl.nodesCount} Nodes</span>
                    <span>•</span>
                    <span>{tpl.branchesCount} Connections</span>
                  </div>
                  <span className="text-zinc-200 flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform">
                    <span>Load Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
