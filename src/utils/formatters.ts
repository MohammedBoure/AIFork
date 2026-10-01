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
 * Returns color classes and friendly label for model IDs in monochrome/refined theme
 */
export function getModelBadgeInfo(modelId?: string): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  if (!modelId) {
    return {
      label: 'Default',
      badgeClass: 'bg-zinc-900 text-zinc-300 border-zinc-700',
      dotClass: 'bg-zinc-400',
    };
  }

  const lower = modelId.toLowerCase();

  if (lower.includes('3.7') || lower.includes('pro')) {
    return {
      label: modelId,
      badgeClass: 'bg-zinc-100 text-zinc-950 border-zinc-200 shadow-sm font-semibold',
      dotClass: 'bg-zinc-950 animate-pulse',
    };
  }

  if (lower.includes('flash')) {
    return {
      label: modelId,
      badgeClass: 'bg-zinc-900 text-zinc-200 border-zinc-700 shadow-sm',
      dotClass: 'bg-zinc-300',
    };
  }

  if (lower.includes('exp') || lower.includes('thinking')) {
    return {
      label: modelId,
      badgeClass: 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-sm',
      dotClass: 'bg-zinc-100',
    };
  }

  return {
    label: modelId,
    badgeClass: 'bg-zinc-900 text-zinc-300 border-zinc-800',
    dotClass: 'bg-zinc-400',
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
