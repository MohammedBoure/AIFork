import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950/90 text-slate-100 text-xs shadow-inner">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-blue-400 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800"
          title="Copy code"
          type="button"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto font-mono text-[12px] leading-relaxed">
        <pre>
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
