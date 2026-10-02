import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Code,
  Eye,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';
import { useLanguage } from '../../i18n/useLanguage';

interface MermaidBlockProps {
  code: string;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
  const { t } = useLanguage();
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diagram' | 'code'>('diagram');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const runRender = async () => {
      if (!code.trim()) {
        if (isMounted) {
          setSvgContent('');
          setRenderError(null);
        }
        return;
      }

      const isDark =
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark');
      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'neutral',
          themeVariables: isDark
            ? {
                darkMode: true,
                background: '#09090b',
                primaryColor: '#27272a',
                primaryTextColor: '#f4f4f5',
                primaryBorderColor: '#3f3f46',
                lineColor: '#a1a1aa',
                secondaryColor: '#18181b',
                tertiaryColor: '#27272a',
                fontFamily: 'Cairo, system-ui, sans-serif',
              }
            : {
                darkMode: false,
                background: '#ffffff',
                primaryColor: '#f1f5f9',
                primaryTextColor: '#0f172a',
                primaryBorderColor: '#cbd5e1',
                lineColor: '#64748b',
                secondaryColor: '#f8fafc',
                tertiaryColor: '#e2e8f0',
                fontFamily: 'Cairo, system-ui, sans-serif',
              },
          securityLevel: 'loose',
        });

        const { svg } = await mermaid.render(uniqueId, code.trim());
        if (isMounted) {
          setSvgContent(svg);
          setRenderError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          setRenderError(message);
        }

        const stray = document.getElementById(`d${uniqueId}`);
        if (stray) stray.remove();
      }
    };

    const timer = setTimeout(() => {
      runRender();
    }, 0);

    const observer = new MutationObserver(() => {
      runRender();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [code]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.4, +(prev - 0.15).toFixed(2)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopySvg = async () => {
    if (!svgContent) return;
    const success = await copyToClipboard(svgContent);
    if (success) {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden shadow-sm transition-all duration-200"
      dir="ltr"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs">
        {/* Left: Mode Tabs & Diagram Type */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('diagram')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'diagram'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>{t.markdown.diagramTab}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>{t.markdown.codeTab}</span>
            </button>
          </div>

          <span className="font-mono text-[10px] text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800/50">
            Mermaid
          </span>
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="flex items-center gap-1">
          {activeTab === 'diagram' && !renderError && (
            <>
              {/* Zoom Controls */}
              <div className="flex items-center rounded-lg bg-zinc-200/70 dark:bg-zinc-800/80 p-0.5 text-zinc-600 dark:text-zinc-300">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.4}
                  className="p-1 hover:text-zinc-900 dark:hover:text-white rounded disabled:opacity-40 transition-colors"
                  title={t.markdown.zoomOut}
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 text-[10px] font-mono hover:text-zinc-900 dark:hover:text-white transition-colors"
                  title={t.markdown.resetZoom}
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2.5}
                  className="p-1 hover:text-zinc-900 dark:hover:text-white rounded disabled:opacity-40 transition-colors"
                  title={t.markdown.zoomIn}
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                {zoomLevel !== 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded transition-colors"
                    title={t.markdown.resetZoom}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Copy SVG */}
              <button
                type="button"
                onClick={handleCopySvg}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[11px] transition-colors"
                title={t.markdown.copySvg}
              >
                {copiedSvg ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">{t.markdown.copiedSvg}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{t.markdown.copySvg}</span>
                  </>
                )}
              </button>

              {/* Download SVG */}
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                title="Download SVG"
              >
                <Download className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Copy Mermaid Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[11px] transition-colors"
            title="Copy Mermaid Code"
          >
            {copiedCode ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">{t.common.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{t.common.copy}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {renderError ? (
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="space-y-1">
              <p className="font-semibold">{t.markdown.mermaidError}</p>
              <p className="text-[11px] opacity-90">{t.markdown.renderError}</p>
              <pre className="mt-2 p-2 bg-rose-100/60 dark:bg-rose-950/60 rounded text-[10px] font-mono overflow-x-auto text-rose-900 dark:text-rose-200">
                {renderError}
              </pre>
            </div>
          </div>

          {/* Raw Code fallback */}
          <div className="p-3 bg-zinc-900 rounded-lg text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800">
            <pre>
              <code>{code}</code>
            </pre>
          </div>
        </div>
      ) : activeTab === 'diagram' ? (
        <div
          ref={containerRef}
          className="p-4 overflow-auto flex items-center justify-center min-h-[160px] max-h-[500px] bg-white dark:bg-zinc-950/70 transition-all"
        >
          {svgContent ? (
            <div
              className="transition-transform duration-150 ease-out origin-center max-w-full"
              style={{
                transform: `scale(${zoomLevel})`,
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
              <span>Rendering diagram...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto border-t border-zinc-800 leading-relaxed">
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
