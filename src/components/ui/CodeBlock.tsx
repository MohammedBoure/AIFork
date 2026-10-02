import React, { useState, useMemo } from 'react';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import { copyToClipboard } from '../../utils/formatters';
import { MermaidBlock } from './MermaidBlock';
import { useLanguage } from '../../i18n/useLanguage';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', value }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Normalize language name
  const cleanLang = (language || 'text').toLowerCase().trim();

  // Safe syntax highlighting with PrismJS
  const highlightedHtml = useMemo(() => {
    if (cleanLang === 'mermaid') return null;
    try {
      const grammar = Prism.languages[cleanLang] || Prism.languages.javascript || Prism.languages.plain;
      if (grammar) {
        return Prism.highlight(value, grammar, cleanLang);
      }
    } catch {
      // Fallback on any highlighting parse failure
    }
    return null;
  }, [value, cleanLang]);

  // If language is mermaid, delegate directly to the visual interactive MermaidBlock
  if (cleanLang === 'mermaid') {
    return <MermaidBlock code={value} />;
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="relative my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/95 text-zinc-100 text-xs shadow-md transition-all select-text selectable-text"
      dir="ltr"
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-zinc-400 font-mono text-[11px] select-none">
        <span className="font-semibold text-zinc-300 uppercase tracking-wider">{cleanLang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-zinc-800"
          title="Copy code"
          type="button"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">{t.common.copied}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{t.common.copy}</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content Container strictly isolated LTR */}
      <div className="p-3.5 overflow-x-auto font-mono text-[12px] leading-relaxed ltr-force">
        <pre className="!bg-transparent !p-0 !m-0 !border-0 text-left font-mono">
          {highlightedHtml ? (
            <code
              className={`language-${cleanLang}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <code>{value}</code>
          )}
        </pre>
      </div>
    </div>
  );
};
