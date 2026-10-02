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
  Languages,
  Plus,
  Trash2,
} from 'lucide-react';
import type { AppSettings, ModelOption, AIProvider, ApiKeyItem } from '../../types/graph';
import { testGeminiApiKey, fetchAvailableGeminiModels, DEFAULT_PRESET_MODELS } from '../../services/gemini';
import {
  testOpenRouterApiKey,
  fetchAvailableOpenRouterModels,
  OPENROUTER_PRESET_MODELS,
} from '../../services/openrouter';
import { ModelSelector } from './ModelSelector';
import { useLanguage } from '../../i18n/useLanguage';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  availableModels: ModelOption[];
  onUpdateAvailableModels: (models: ModelOption[]) => void;
}

function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return '••••••••';
  return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  availableModels,
  onUpdateAvailableModels,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Multi-key state
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [keyInputError, setKeyInputError] = useState<string | null>(null);
  const [keyActionNotice, setKeyActionNotice] = useState<string | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOpenRouter = formState.provider === 'openrouter';
  const providerKeys = (formState.apiKeys || []).filter((k) => k.provider === formState.provider);
  const activeKeyId = isOpenRouter ? formState.activeOpenRouterKeyId : formState.activeGeminiKeyId;

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
    setIsAddingKey(false);
    setKeyInputError(null);
  };

  const handleAddKey = () => {
    if (!newKeyName.trim()) {
      setKeyInputError(t.multiKey.keyNameRequired);
      return;
    }
    if (!newKeyValue.trim()) {
      setKeyInputError(t.multiKey.keyValueRequired);
      return;
    }

    const newKeyItem: ApiKeyItem = {
      id: `${formState.provider}-key-${Date.now()}`,
      name: newKeyName.trim(),
      key: newKeyValue.trim(),
      provider: formState.provider,
      createdAt: Date.now(),
    };

    const updatedKeys = [...(formState.apiKeys || []), newKeyItem];
    const isFirstKeyForProvider = providerKeys.length === 0;

    let newActiveGeminiId = formState.activeGeminiKeyId;
    let newActiveORId = formState.activeOpenRouterKeyId;
    let newGeminiKey = formState.apiKey;
    let newORKey = formState.openRouterApiKey;

    if (isFirstKeyForProvider || !activeKeyId) {
      if (formState.provider === 'openrouter') {
        newActiveORId = newKeyItem.id;
        newORKey = newKeyItem.key;
      } else {
        newActiveGeminiId = newKeyItem.id;
        newGeminiKey = newKeyItem.key;
      }
    }

    setFormState({
      ...formState,
      apiKeys: updatedKeys,
      activeGeminiKeyId: newActiveGeminiId,
      activeOpenRouterKeyId: newActiveORId,
      apiKey: newGeminiKey,
      openRouterApiKey: newORKey,
    });

    setNewKeyName('');
    setNewKeyValue('');
    setIsAddingKey(false);
    setKeyInputError(null);
    setKeyActionNotice(t.multiKey.keyAddedSuccess);
    setTimeout(() => setKeyActionNotice(null), 3000);
  };

  const handleActivateKey = (keyId: string) => {
    const selectedKey = (formState.apiKeys || []).find((k) => k.id === keyId);
    if (!selectedKey) return;

    if (formState.provider === 'openrouter') {
      setFormState({
        ...formState,
        activeOpenRouterKeyId: selectedKey.id,
        openRouterApiKey: selectedKey.key,
      });
    } else {
      setFormState({
        ...formState,
        activeGeminiKeyId: selectedKey.id,
        apiKey: selectedKey.key,
      });
    }

    setKeyActionNotice(t.multiKey.keyActivatedSuccess);
    setTestStatus({ loading: false });
    setTimeout(() => setKeyActionNotice(null), 3000);
  };

  const handleDeleteKey = (keyId: string) => {
    if (!window.confirm(t.multiKey.confirmDelete)) return;

    const remainingKeys = (formState.apiKeys || []).filter((k) => k.id !== keyId);
    const remainingProviderKeys = remainingKeys.filter((k) => k.provider === formState.provider);

    let newActiveGeminiId = formState.activeGeminiKeyId;
    let newActiveORId = formState.activeOpenRouterKeyId;
    let newGeminiKey = formState.apiKey;
    let newORKey = formState.openRouterApiKey;

    if (formState.provider === 'openrouter' && formState.activeOpenRouterKeyId === keyId) {
      const nextKey = remainingProviderKeys[0];
      newActiveORId = nextKey?.id;
      newORKey = nextKey ? nextKey.key : '';
    } else if (formState.provider === 'gemini' && formState.activeGeminiKeyId === keyId) {
      const nextKey = remainingProviderKeys[0];
      newActiveGeminiId = nextKey?.id;
      newGeminiKey = nextKey ? nextKey.key : '';
    }

    setFormState({
      ...formState,
      apiKeys: remainingKeys,
      activeGeminiKeyId: newActiveGeminiId,
      activeOpenRouterKeyId: newActiveORId,
      apiKey: newGeminiKey,
      openRouterApiKey: newORKey,
    });

    setKeyActionNotice(t.multiKey.keyDeletedSuccess);
    setTimeout(() => setKeyActionNotice(null), 3000);
  };

  const handleTestSpecificKey = async (keyItem: ApiKeyItem) => {
    setTestingKeyId(keyItem.id);
    setTestStatus({ loading: true });

    try {
      if (keyItem.provider === 'openrouter') {
        const result = await testOpenRouterApiKey(keyItem.key);
        setTestStatus({
          loading: false,
          success: result.success,
          message: `[${keyItem.name}] ${result.message}`,
        });
      } else {
        const result = await testGeminiApiKey(keyItem.key);
        setTestStatus({
          loading: false,
          success: result.success,
          message: `[${keyItem.name}] ${result.message}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Key test failed';
      setTestStatus({
        loading: false,
        success: false,
        message: `[${keyItem.name}] ${msg}`,
      });
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleTestActiveKey = async () => {
    const currentKey = isOpenRouter ? formState.openRouterApiKey : formState.apiKey;
    if (!currentKey) {
      setTestStatus({
        loading: false,
        success: false,
        message: isOpenRouter ? 'OpenRouter API key is empty.' : 'Google Gemini API key is empty.',
      });
      return;
    }

    setTestStatus({ loading: true });
    if (isOpenRouter) {
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
    const currentKey = isOpenRouter ? formState.openRouterApiKey : formState.apiKey;

    if (!currentKey && formState.provider === 'gemini') {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please activate or add a Google Gemini API key first.',
      });
      return;
    }

    setIsFetchingModels(true);
    try {
      if (isOpenRouter) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800 text-zinc-100 flex flex-col h-full shadow-2xl z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-zinc-100" />
            <h2 className="font-semibold text-base text-zinc-100">{t.settings.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
            title={t.common.close}
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
              {t.settings.provider}
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

          {/* Multi-Key API Manager Section */}
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-zinc-100 flex items-center gap-1.5 text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-300" />
                  <span>{t.multiKey.title}</span>
                </label>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {t.multiKey.subtitle}
                </p>
              </div>

              <a
                href={
                  isOpenRouter
                    ? 'https://openrouter.ai/keys'
                    : 'https://aistudio.google.com/app/apikey'
                }
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-300 hover:text-white underline flex items-center gap-1 shrink-0"
              >
                <span>{isOpenRouter ? 'Get OpenRouter Key' : 'Get Gemini Key'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Auto-Switching on Quota Limit Checkbox */}
            <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-start gap-2.5">
              <input
                id="autoSwitchQuota"
                type="checkbox"
                checked={formState.autoSwitchKeyOnQuota !== false}
                onChange={(e) =>
                  setFormState({ ...formState, autoSwitchKeyOnQuota: e.target.checked })
                }
                className="w-4 h-4 accent-zinc-100 rounded bg-zinc-800 border-zinc-700 mt-0.5 cursor-pointer"
              />
              <label htmlFor="autoSwitchQuota" className="cursor-pointer select-none space-y-0.5">
                <span className="text-xs font-medium text-zinc-200 block">
                  {t.multiKey.autoSwitchQuotaLabel}
                </span>
                <span className="text-[11px] text-zinc-400 block leading-normal">
                  {t.multiKey.autoSwitchQuotaHint}
                </span>
              </label>
            </div>

            {/* Key Action Feedback Banner */}
            {keyActionNotice && (
              <div className="p-2.5 rounded-lg text-xs flex items-center gap-2 bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{keyActionNotice}</span>
              </div>
            )}

            {/* List of Saved Keys for Current Provider */}
            <div className="space-y-2">
              {providerKeys.length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-dashed border-zinc-800 text-center space-y-2">
                  <p className="text-xs text-zinc-400">{t.multiKey.noKeys}</p>
                </div>
              ) : (
                providerKeys.map((item) => {
                  const isActive = item.id === activeKeyId;
                  const isTesting = testingKeyId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-zinc-900 border-zinc-600 shadow-sm'
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-zinc-100 truncate">
                              {item.name}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                {t.multiKey.activeBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                            {maskApiKey(item.key)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleActivateKey(item.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:text-white transition-colors"
                              title={t.multiKey.activateKey}
                            >
                              {t.multiKey.activateKey}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleTestSpecificKey(item)}
                            disabled={isTesting || testStatus.loading}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors disabled:opacity-40"
                            title={t.multiKey.testKey}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-zinc-100' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteKey(item.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors"
                            title={t.multiKey.deleteKey}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Key Form / Accordion */}
            {isAddingKey ? (
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-zinc-200 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{t.multiKey.addNewKey}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingKey(false);
                      setKeyInputError(null);
                    }}
                    className="text-zinc-400 hover:text-zinc-200 text-xs"
                  >
                    {t.multiKey.cancelAdd}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-300 block">{t.multiKey.keyNameLabel}</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => {
                      setNewKeyName(e.target.value);
                      if (keyInputError) setKeyInputError(null);
                    }}
                    placeholder={t.multiKey.keyNamePlaceholder}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-300 block">{t.multiKey.keyValueLabel}</label>
                  <div className="relative">
                    <input
                      type={showNewKey ? 'text' : 'password'}
                      value={newKeyValue}
                      onChange={(e) => {
                        setNewKeyValue(e.target.value);
                        if (keyInputError) setKeyInputError(null);
                      }}
                      placeholder={isOpenRouter ? 'sk-or-v1-...' : 'AIzaSy...'}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 pr-8 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewKey(!showNewKey)}
                      className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showNewKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {keyInputError && (
                  <p className="text-rose-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{keyInputError}</span>
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingKey(false);
                      setKeyInputError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    {t.multiKey.cancelAdd}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddKey}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-colors shadow-sm"
                  >
                    {t.multiKey.saveKey}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingKey(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/60 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.multiKey.addNewKey}</span>
              </button>
            )}

            {/* Active Key Controls & Model Fetching */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestActiveKey}
                disabled={testStatus.loading || (isOpenRouter ? !formState.openRouterApiKey : !formState.apiKey)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-xs font-medium transition-colors text-zinc-200 border border-zinc-700"
              >
                {testStatus.loading && !testingKeyId ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                )}
                <span>{t.multiKey.testKey} ({t.multiKey.activeBadge})</span>
              </button>

              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-xs font-medium transition-colors text-zinc-200 border border-zinc-700"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-zinc-300 ${isFetchingModels ? 'animate-spin' : ''}`}
                />
                <span>{t.multiKey.fetchModelsWithActive}</span>
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
              Your API keys are stored securely in browser localStorage and are never transmitted to any third-party server other than the designated provider.
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

          {/* Interface Language Preferences */}
          <div className="space-y-3 pt-4 border-t border-zinc-850">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-zinc-300" />
              <span>{t.settings.uiLanguage}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 text-center transition-all ${
                  language === 'ar'
                    ? 'bg-zinc-100 text-zinc-950 font-bold border-white shadow-md'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold">العربية (Arabic)</span>
                <span className="text-[10px] opacity-75">اتجاه اليمين لليسار (RTL)</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 text-center transition-all ${
                  language === 'en'
                    ? 'bg-zinc-100 text-zinc-950 font-bold border-white shadow-md'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="font-bold">English (US)</span>
                <span className="text-[10px] opacity-75">Left-to-Right (LTR)</span>
              </button>
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
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-colors shadow-md"
          >
            {t.settings.saveSettings}
          </button>
        </div>
      </div>
    </div>
  );
};
