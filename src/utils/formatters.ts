/**
 * Format timestamp into relative or clean time string
 */
export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns color classes and friendly label for model IDs
 */
export function getModelBadgeInfo(modelId?: string): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (!modelId) {
    return {
      label: 'Default',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
      dotClass: 'bg-slate-400',
    };
  }

  const lower = modelId.toLowerCase();

  if (lower.includes('2.5-pro') || lower.includes('pro')) {
    return {
      label: modelId,
      badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/80 shadow-sm shadow-purple-900/30',
      dotClass: 'bg-purple-400 animate-pulse',
    };
  }

  if (lower.includes('2.5-flash') || lower.includes('2.0-flash') || lower.includes('flash')) {
    return {
      label: modelId,
      badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-800/80 shadow-sm shadow-blue-900/30',
      dotClass: 'bg-blue-400',
    };
  }

  if (lower.includes('exp') || lower.includes('thinking')) {
    return {
      label: modelId,
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-sm shadow-amber-900/30',
      dotClass: 'bg-amber-400',
    };
  }

  return {
    label: modelId,
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    dotClass: 'bg-emerald-400',
  };
}

/**
 * Copies text to user's clipboard safely
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}
