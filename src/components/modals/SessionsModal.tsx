import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Trash2,
  Copy,
  Pencil,
  Check,
  ExternalLink,
  Clock,
  Layers,
  FileDown,
  Sparkles,
  GitFork,
  AlertTriangle,
} from 'lucide-react';
import type { GraphSessionMeta } from '../../types/graph';
import { loadSession, exportGraphToJson } from '../../services/storage';
import { formatTimestamp } from '../../utils/formatters';
import { useLanguage } from '../../i18n/useLanguage';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: GraphSessionMeta[];
  currentSessionId: string;
  onSwitchSession: (sessionId: string) => void;
  onCreateSession: (title?: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onDuplicateSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSwitchSession,
  onCreateSession,
  onDeleteSession,
  onDuplicateSession,
  onRenameSession,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((session) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      session.title.toLowerCase().includes(q) ||
      (session.previewText && session.previewText.toLowerCase().includes(q))
    );
  });

  const handleStartRename = (session: GraphSessionMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleExportSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sessionData = loadSession(sessionId);
    if (sessionData) {
      exportGraphToJson({
        version: '1.0.0',
        title: sessionData.title,
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
        nodes: sessionData.nodes,
        edges: sessionData.edges,
        activeParentId: sessionData.activeParentId,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-zinc-100 flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">
                  {t.sessions.title}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {sessions.length} {t.sessions.countLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t.sessions.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Toolbar: Search & New Session Button */}
        <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              dir="auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.sessions.searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-zinc-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => {
              onCreateSession();
              onClose();
            }}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.sessions.newSession}</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 space-y-3">
              <Layers className="w-10 h-10 mx-auto opacity-30 text-zinc-400" />
              <p className="text-sm">{t.sessions.noSessionsFound}</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  {t.sessions.clearSearch}
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isEditing = editingSessionId === session.id;
              const isConfirmingDelete = deleteConfirmId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isActive && !isEditing && !isConfirmingDelete) {
                      onSwitchSession(session.id);
                      onClose();
                    }
                  }}
                  className={`group relative p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900/90 border-white ring-1 ring-white/20 shadow-lg shadow-white/5'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Title & Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <form
                            onSubmit={(e) => handleSaveRename(session.id, e)}
                            className="flex items-center gap-2 flex-1 max-w-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              dir="auto"
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-500 rounded-lg text-white focus:outline-none flex-1"
                            />
                            <button
                              type="submit"
                              className="p-1 rounded bg-zinc-100 text-zinc-950 hover:bg-white"
                              title={t.common.save}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSessionId(null)}
                              className="p-1 rounded text-zinc-400 hover:text-white"
                              title={t.common.cancel}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <h3 className="font-semibold text-sm text-zinc-100 truncate group-hover:text-white">
                              {session.title}
                            </h3>
                            <button
                              onClick={(e) => handleStartRename(session, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-white transition-opacity"
                              title={t.common.edit}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {isActive && (
                          <span className="flex-shrink-0 text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-white text-zinc-950 font-semibold shadow-sm">
                            {t.sessions.activeSession}
                          </span>
                        )}
                      </div>

                      {/* Preview Text */}
                      {session.previewText && (
                        <p
                          className="text-xs text-zinc-400 mt-1 line-clamp-1 bidi-auto font-sans"
                          dir="auto"
                        >
                          {session.previewText}
                        </p>
                      )}

                      {/* Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3 text-zinc-400 transform -rotate-90" />
                          <span>{session.nodeCount} {t.sessions.nodesCount}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{formatTimestamp(session.updatedAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div
                      className="flex items-center gap-1.5 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-800 rounded-lg p-1 animate-in fade-in duration-100">
                          <span className="text-[11px] text-rose-300 px-1 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>{t.sessions.confirmDelete}</span>
                          </span>
                          <button
                            onClick={() => {
                              onDeleteSession(session.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            {t.common.delete}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 text-zinc-400 hover:text-white text-[11px]"
                          >
                            {t.common.cancel}
                          </button>
                        </div>
                      ) : (
                        <>
                          {!isActive && (
                            <button
                              onClick={() => {
                                onSwitchSession(session.id);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                              title={t.sessions.openSession}
                            >
                              <span>{t.sessions.openSession}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateSession(session.id);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title={t.sessions.duplicateSession}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleExportSession(session.id, e)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title={t.sessions.exportJson}
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(session.id);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                            title={t.sessions.deleteSession}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <footer className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-950/90 text-xs text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t.sessions.autoSaveNotice}</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
          >
            {t.common.close}
          </button>
        </footer>
      </div>
    </div>
  );
};
