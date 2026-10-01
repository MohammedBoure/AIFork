import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Cpu,
  Layers,
} from 'lucide-react';
import type { AppSettings, ModelOption } from '../../types/graph';
import { testGeminiApiKey, fetchAvailableGeminiModels } from '../../services/gemini';
import { ModelSelector } from './ModelSelector';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  availableModels: ModelOption[];
  onUpdateAvailableModels: (models: ModelOption[]) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  availableModels,
  onUpdateAvailableModels,
}) => {
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setTestStatus({ loading: true });
    const result = await testGeminiApiKey(formState.apiKey);
    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  const handleFetchModels = async () => {
    if (!formState.apiKey) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter an API key first to discover remote models.',
      });
      return;
    }
    setIsFetchingModels(true);
    try {
      const models = await fetchAvailableGeminiModels(formState.apiKey);
      onUpdateAvailableModels(models);
      setTestStatus({
        loading: false,
        success: true,
        message: `Successfully loaded ${models.length} models from Gemini API!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch models';
      setTestStatus({
        loading: false,
        success: false,
        message: msg,
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = () => {
    onSaveSettings(formState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-base text-white">ThoughtGraph Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* API Key Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-200 flex items-center gap-1.5 text-xs">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                Get API Key
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={formState.apiKey}
                onChange={(e) => {
                  setFormState({ ...formState, apiKey: e.target.value });
                  setTestStatus({ loading: false });
                }}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testStatus.loading || !formState.apiKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium transition-colors text-slate-200 border border-slate-700"
              >
                {testStatus.loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels || !formState.apiKey}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium transition-colors text-slate-200 border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isFetchingModels ? 'animate-spin' : ''}`} />
                <span>Fetch Models</span>
              </button>
            </div>

            {testStatus.message && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                  testStatus.success
                    ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-800/80 text-rose-200'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{testStatus.message}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Your key is stored safely in local browser storage and never transmitted to any third-party server.
            </p>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Default Model Profiles
            </h3>

            {/* Global Default Fork Model */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Default Forking Model
                </label>
                <span className="text-[11px] text-slate-500">For new branches</span>
              </div>
              <ModelSelector
                selectedModel={formState.defaultModel}
                onChange={(modelId) => setFormState({ ...formState, defaultModel: modelId })}
                availableModels={availableModels}
                variant="full"
              />
            </div>

            {/* Global Default Merge Model */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Default Synthesis Model
                </label>
                <span className="text-[11px] text-purple-400">High-reasoning model</span>
              </div>
              <ModelSelector
                selectedModel={formState.defaultMergeModel}
                onChange={(modelId) => setFormState({ ...formState, defaultMergeModel: modelId })}
                availableModels={availableModels}
                variant="full"
              />
            </div>
          </div>

          {/* Inference Parameters */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Generation Parameters
            </h3>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Temperature</span>
                <span className="font-mono text-blue-400">{formState.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={formState.temperature}
                onChange={(e) =>
                  setFormState({ ...formState, temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Precise (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (1.5)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                System Instructions
              </label>
              <textarea
                rows={3}
                value={formState.systemInstruction}
                onChange={(e) =>
                  setFormState({ ...formState, systemInstruction: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Provide global persona or reasoning guidelines..."
              />
            </div>
          </div>

          {/* Canvas & Edge Preferences */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Canvas Display
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-200 block">Auto-Layout on New Branch</span>
                <span className="text-[11px] text-slate-500">Automatically adjust sibling spacing</span>
              </div>
              <input
                type="checkbox"
                checked={formState.autoLayoutOnAdd}
                onChange={(e) =>
                  setFormState({ ...formState, autoLayoutOnAdd: e.target.checked })
                }
                className="w-4 h-4 accent-blue-500 rounded bg-slate-800 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Branch Edge Curve</label>
              <select
                value={formState.edgeType}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    edgeType: e.target.value as 'smoothstep' | 'bezier' | 'straight',
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="smoothstep">Smooth Step (Recommended for DAGs)</option>
                <option value="bezier">Curved Bezier</option>
                <option value="straight">Straight Vector</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/30"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
