import React, { useState } from 'react';
import {
  Merge,
  Trash2,
  Copy,
  Download,
  X,
  Check,
  Layers,
} from 'lucide-react';
import type { ThoughtFlowNode } from '../../types/graph';
import { copyToClipboard } from '../../utils/formatters';

interface BatchActionBarProps {
  selectedNodeIds: string[];
  nodes: ThoughtFlowNode[];
  onOpenMergeModal: () => void;
  onBatchDelete: (nodeIds: string[]) => void;
  onClearSelection: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedNodeIds,
  nodes,
  onOpenMergeModal,
  onBatchDelete,
  onClearSelection,
}) => {
  const [copied, setCopied] = useState(false);

  if (selectedNodeIds.length === 0) return null;

  const count = selectedNodeIds.length;
  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));

  const handleCopySelected = async () => {
    let text = `# ThoughtGraph AI: Batch Selection Export (${count} Nodes)\n\n`;
    selectedNodes.forEach((node, i) => {
      const role = node.data.role === 'user' ? 'User Thought' : `${node.data.modelUsed || 'AI'}`;
      text += `## ${i + 1}. ${node.data.branchLabel || role}\n\n`;
      text += `${node.data.content}\n\n---\n\n`;
    });

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    let text = `# ThoughtGraph AI: Batch Selection Export (${count} Nodes)\n\n`;
    selectedNodes.forEach((node, i) => {
      const role = node.data.role === 'user' ? 'User Thought' : `${node.data.modelUsed || 'AI'}`;
      text += `## ${i + 1}. ${node.data.branchLabel || role}\n\n`;
      text += `${node.data.content}\n\n---\n\n`;
    });

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thoughtgraph-selection-${count}-nodes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-700/80 shadow-2xl backdrop-blur-xl text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Count pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px]">
          <Layers className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <span className="font-semibold text-zinc-900 dark:text-white">{count}</span>
          <span className="text-zinc-500 dark:text-zinc-400">selected</span>
        </div>

        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

        {/* Merge Action */}
        <button
          onClick={onOpenMergeModal}
          disabled={count < 2}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          title={count < 2 ? 'Select at least 2 nodes to merge' : 'Synthesize selected nodes'}
        >
          <Merge className="w-3.5 h-3.5" />
          <span>Merge {count >= 2 ? `(${count})` : ''}</span>
        </button>

        {/* Copy Markdown */}
        <button
          onClick={handleCopySelected}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          title="Copy selected nodes as combined markdown"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-zinc-100" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy MD</span>
            </>
          )}
        </button>

        {/* Export Markdown */}
        <button
          onClick={handleDownloadMarkdown}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          title="Export selected as .md file"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Delete Selected */}
        <button
          onClick={() => onBatchDelete(selectedNodeIds)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title={`Delete ${count} selected nodes`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>

        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          title="Deselect all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
