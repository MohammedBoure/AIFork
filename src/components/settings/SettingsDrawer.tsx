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
  ExternalLink,
} from 'lucide-react';
import type { AppSettings, ModelOption, AIProvider } from '../../types/graph';
import { testGeminiApiKey, fetchAvailableGeminiModels, DEFAULT_PRESET_MODELS } from '../../services/gemini';
import {
  testOpenRouterApiKey,
  fetchAvailableOpenRouterModels,
  OPENROUTER_PRESET_MODELS,
} from '../../services/openrouter';
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

  const handleProviderChange = (provider: AIProvider) => {
    let newDefault = formState.defaultModel;
    let newMerge = formState.defaultMergeModel;

    if (provider === 'openrouter') {
      if (!newDefault.includes('/')) newDefault = 'deepseek/deepseek-chat';
      if (!newMerge.includes('/')) newMerge = 'deepseek/deepseek-r1';
      onUpdateAvailableModels(OPENROUTER_PRESET_MODELS);
    } else {
      if (newDefault.includes('/')) newDefault = 'gemini-2.5-flash';
      if (newMerge.includes('/')) newMerge = 'gemini-2.5-pro';
      onUpdateAvailableModels(DEFAULT_PRESET_MODELS);
    }

    setFormState({
      ...formState,
      provider,
      defaultModel: newDefault,
      defaultMergeModel: newMerge,
    });
    setTestStatus({ loading: false });
  };

  const handleTestKey = async () => {
    setTestStatus({ loading: true });

    if (formState.provider === 'openrouter') {
      const result = await testOpenRouterApiKey(formState.openRouterApiKey);
      setTestStatus({
        loading: false,
        success: result.success,
        message: result.message,
      });
    } else {
      const result = await testGeminiApiKey(formState.apiKey);
      setTestStatus({
        loading: false,
        success: result.success,
        message: result.message,
      });
    }
  };

  const handleFetchModels = async () => {
    const currentKey =
      formState.provider === 'openrouter'
        ? formState.openRouterApiKey
        : formState.apiKey;

    if (!currentKey && formState.provider === 'gemini') {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter a Google Gemini API key first.',
      });
      return;
    }

    setIsFetchingModels(true);
    try {
      if (formState.provider === 'openrouter') {
        const models = await fetchAvailableOpenRouterModels(formState.openRouterApiKey);
        onUpdateAvailableModels(models);
        setTestStatus({
          loading: false,
          success: true,
          message: `Successfully loaded ${models.length} models from OpenRouter (DeepSeek prioritized)!`,
        });
      } else {
        const models = await fetchAvailableGeminiModels(formState.apiKey);
        onUpdateAvailableModels(models);
        setTestStatus({
          loading: false,
          success: true,
          message: `Successfully loaded ${models.length} models from Gemini API!`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch remote models';
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

  const isOpenRouter = formState.provider === 'openrouter';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 text-zinc-100 flex flex-col h-full shadow-2xl z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-zinc-100" />
            <h2 className="font-semibold text-base text-zinc-100">ThoughtGraph Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Provider Selection Tabs */}
          <div className="space-y-2">
            <label className="font-medium text-zinc-200 flex items-center gap-1.5 text-xs">
              <Cpu className="w-3.5 h-3.5 text-zinc-300" />
              Active AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => handleProviderChange('openrouter')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs transition-all ${
                  isOpenRouter
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>OpenRouter.ai</span>
                </div>
                <span className="text-[10px] opacity-75 mt-0.5">DeepSeek, R1 & Multi-LLM</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs transition-all ${
                  !isOpenRouter
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Google Gemini</span>
                </div>
                <span className="text-[10px] opacity-75 mt-0.5">Gemini 2.5 Flash / Pro</span>
              </button>
            </div>
          </div>

          {/* Provider-Specific API Key Section */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-850">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-200 flex items-center gap-1.5 text-xs">
                <KeyRound className="w-3.5 h-3.5 text-zinc-300" />
                {isOpenRouter ? 'OpenRouter API Key' : 'Google Gemini API Key'}
              </label>
              <a
                href={
                  isOpenRouter
                    ? 'https://openrouter.ai/keys'
                    : 'https://aistudio.google.com/app/apikey'
                }
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-300 hover:text-white underline flex items-center gap-1"
              >
                <span>{isOpenRouter ? 'Get OpenRouter Key' : 'Get Gemini Key'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={isOpenRouter ? formState.openRouterApiKey : formState.apiKey}
                onChange={(e) => {
                  if (isOpenRouter) {
                    setFormState({ ...formState, openRouterApiKey: e.target.value });
                  } else {
                    setFormState({ ...formState, apiKey: e.target.value });
                  }
                  setTestStatus({ loading: false });
                }}
                placeholder={isOpenRouter ? 'sk-or-v1-...' : 'AIzaSy...'}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={
                  testStatus.loading ||
                  (isOpenRouter ? !formState.openRouterApiKey : !formState.apiKey)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-xs font-medium transition-colors text-zinc-200 border border-zinc-700"
              >
                {testStatus.loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                )}
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-xs font-medium transition-colors text-zinc-200 border border-zinc-700"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-zinc-300 ${isFetchingModels ? 'animate-spin' : ''}`}
                />
                <span>Fetch Models</span>
              </button>
            </div>

            {testStatus.message && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                  testStatus.success
                    ? 'bg-zinc-900 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900 border-rose-800 text-rose-300'
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

            {isOpenRouter && (
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                <p className="font-semibold text-zinc-100">DeepSeek on OpenRouter:</p>
                <p className="text-zinc-400 leading-relaxed">
                  Includes full support for <strong className="text-zinc-200">DeepSeek-V3</strong> (chat) and <strong className="text-zinc-200">DeepSeek-R1</strong> (deep chain-of-thought reasoning), including free-tier models and distillation variants.
                </p>
              </div>
            )}

            <p className="text-[11px] text-zinc-500">
              Your API key is stored securely in browser localStorage and is never transmitted to any third-party server other than the designated provider.
            </p>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4 pt-4 border-t border-zinc-850">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-300" />
              Default Model Profiles ({isOpenRouter ? 'OpenRouter / DeepSeek' : 'Google Gemini'})
            </h3>

            {/* Global Default Fork Model */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">
                  Default Forking Model
                </label>
                <span className="text-[11px] text-zinc-500">For new branch ideas</span>
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
                <label className="text-xs font-medium text-zinc-300">
                  Default Synthesis Model
                </label>
                <span className="text-[11px] text-zinc-400">High-reasoning model</span>
              </div>
              <ModelSelector
                selectedModel={formState.defaultMergeModel}
                onChange={(modelId) =>
                  setFormState({ ...formState, defaultMergeModel: modelId })
                }
                availableModels={availableModels}
                variant="full"
              />
            </div>
          </div>

          {/* Inference Parameters */}
          <div className="space-y-4 pt-4 border-t border-zinc-850">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-300" />
              Generation Parameters
            </h3>

            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Temperature</span>
                <span className="font-mono text-zinc-100">{formState.temperature}</span>
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
                className="w-full accent-zinc-100 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                <span>Precise (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (1.5)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                System Instructions
              </label>
              <textarea
                rows={3}
                value={formState.systemInstruction}
                onChange={(e) =>
                  setFormState({ ...formState, systemInstruction: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-400 leading-relaxed"
                placeholder="Provide global persona or reasoning guidelines..."
              />
            </div>
          </div>

          {/* Canvas & Edge Preferences */}
          <div className="space-y-3 pt-4 border-t border-zinc-850">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-300" />
              Canvas Display
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-200 block">Auto-Layout on New Branch</span>
                <span className="text-[11px] text-zinc-500">Automatically adjust sibling spacing</span>
              </div>
              <input
                type="checkbox"
                checked={formState.autoLayoutOnAdd}
                onChange={(e) =>
                  setFormState({ ...formState, autoLayoutOnAdd: e.target.checked })
                }
                className="w-4 h-4 accent-zinc-100 rounded bg-zinc-800 border-zinc-700 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 mb-1">Branch Edge Curve</label>
              <select
                value={formState.edgeType}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    edgeType: e.target.value as 'smoothstep' | 'bezier' | 'straight',
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-400"
              >
                <option value="smoothstep">Smooth Step (Recommended for DAGs)</option>
                <option value="bezier">Curved Bezier</option>
                <option value="straight">Straight Vector</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-colors shadow-md"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
