import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  FileCode,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { ThoughtFlowNode, ThoughtFlowEdge, SerializedGraph } from '../../types/graph';
import { exportGraphToJson, exportToMarkdown, importGraphFromJson } from '../../services/storage';
import { copyToClipboard } from '../../utils/formatters';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ThoughtFlowNode[];
  edges: ThoughtFlowEdge[];
  activeParentId: string | null;
  onImportGraph: (graph: SerializedGraph) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  activeParentId,
  onImportGraph,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'markdown'>('export');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const createExportGraph = (): SerializedGraph => ({
    version: '1.0.0',
    title: 'ThoughtGraph Export',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes,
    edges,
    activeParentId,
  });

  const handleDownloadJson = () => {
    exportGraphToJson(createExportGraph());
  };

  const handleCopyJson = async () => {
    const success = await copyToClipboard(JSON.stringify(createExportGraph(), null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = exportToMarkdown(nodes, activeParentId);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thoughtgraph-export-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = importGraphFromJson(text);
        onImportGraph(parsed);
        onClose();
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    try {
      setImportError(null);
      const parsed = importGraphFromJson(importJsonText);
      onImportGraph(parsed);
      onClose();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-base text-white">Export & Import Graph</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/30 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>JSON Export</span>
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'markdown'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Markdown Summary</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Graph</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 text-xs space-y-4">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                Export your full DAG graph structure, including all nodes, model configurations, coordinates, and branching edges.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200">Download .json File</h4>
                  <p className="text-slate-400 text-[11px]">
                    Includes {nodes.length} nodes and {edges.length} connections.
                  </p>
                </div>
                <button
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200">Copy to Clipboard</h4>
                  <p className="text-slate-400 text-[11px]">
                    Paste directly into other instances or backups.
                  </p>
                </div>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                Export your active branch path or complete graph as a clean, human-readable Markdown report ready to share with your team.
              </p>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200">Download .md Document</h4>
                  <p className="text-slate-400 text-[11px]">
                    Structured sections with roles, model badges, and synthesis conclusions.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Markdown</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                Load a previously saved ThoughtGraph JSON file.
              </p>

              <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40">
                <Upload className="w-8 h-8 text-blue-400 mb-2" />
                <span className="font-medium text-slate-200">Click to upload JSON file</span>
                <span className="text-[11px] text-slate-400 mt-1">Accepts valid .json graph format</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Or paste raw JSON:
                </label>
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"version": "1.0.0", "nodes": [...], "edges": [...]}'
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {importError && (
                <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleManualImport}
                disabled={!importJsonText.trim()}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-colors"
              >
                Import Pasted Graph
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
