import React, { useState } from 'react';
import { ChevronDown, Check, Plus, Cpu } from 'lucide-react';
import type { ModelOption } from '../../types/graph';
import { getModelBadgeInfo } from '../../utils/formatters';

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (modelId: string) => void;
  availableModels: ModelOption[];
  label?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onChange,
  availableModels,
  label,
  variant = 'compact',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const currentOption = availableModels.find((m) => m.id === selectedModel);
  const badgeInfo = getModelBadgeInfo(selectedModel);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onChange(customInput.trim());
      setIsOpen(false);
      setShowCustomInput(false);
      setCustomInput('');
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {label && (
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400 ${
          variant === 'compact'
            ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200 shadow-sm'
            : 'w-full bg-zinc-900 border-zinc-700/80 hover:border-zinc-500 text-zinc-100 py-2'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className={`w-2 h-2 rounded-full ${badgeInfo.dotClass}`}></span>
          <span className="truncate">{currentOption?.name || selectedModel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCustomInput(false);
            }}
          />
          <div className="absolute left-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 z-50 w-72 sm:w-80 rounded-xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
              <span>Select Gemini Model</span>
              <Cpu className="w-3 h-3 text-zinc-400" />
            </div>

            <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
              {availableModels.map((model) => {
                const isSelected = model.id === selectedModel;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelect(model.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-600'
                        : 'hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="truncate">{model.name}</span>
                        {model.badge && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                        {model.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-zinc-100 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Model Input Option */}
            <div className="border-t border-zinc-800 pt-1.5 mt-1">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Use custom model string...</span>
                </button>
              ) : (
                <form onSubmit={handleCustomSubmit} className="p-1 space-y-1.5">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="e.g. gemini-2.5-flash-thinking-exp"
                    autoFocus
                    className="w-full px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-zinc-400"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!customInput.trim()}
                      className="px-2 py-0.5 text-[11px] bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 rounded font-semibold"
                    >
                      Apply
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
