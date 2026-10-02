import { ReactFlowProvider } from '@xyflow/react';
import { useGraphState } from './hooks/useGraphState';
import { Navbar } from './components/ui/Navbar';
import { ThoughtCanvas } from './components/canvas/ThoughtCanvas';
import { ForkPromptBar } from './components/prompt/ForkPromptBar';
import { MergeModal } from './components/prompt/MergeModal';
import { SettingsDrawer } from './components/settings/SettingsDrawer';
import { ExportImportModal } from './components/modals/ExportImportModal';
import { NodeDetailModal } from './components/modals/NodeDetailModal';
import { SessionsModal } from './components/modals/SessionsModal';
import { FocusFlowModal } from './components/focus/FocusFlowModal';
import { ToastContainer } from './components/ui/Toast';
import { LanguageProvider } from './i18n/LanguageContext';
import { useLanguage } from './i18n/useLanguage';

export function ThoughtGraphApp() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    activeParentId,
    activeParentTitle,
    selectedForMergeIds,
    layoutDirection,
    showMinimap,
    isGenerating,
    settings,
    availableModels,
    setAvailableModels,
    toasts,
    dismissToast,

    // Undo / Redo & Theme
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    theme,
    toggleTheme,

    // Focus Flow
    focusNodeId,
    isFocusFlowOpen,
    handleOpenFocusFlow,
    handleCloseFocusFlow,

    // Modals
    isSessionsOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    isMergeModalOpen,
    setIsMergeModalOpen,
    inspectedNodeId,
    setInspectedNodeId,

    // Sessions
    sessions,
    currentSessionId,
    currentSessionTitle,
    handleOpenSessions,
    handleCloseSessions,
    handleSwitchSession,
    handleCreateSession,
    handleDeleteSession,
    handleDuplicateSession,
    handleRenameSession,

    // Actions
    handleForkNode,
    handleClearParent,
    handleToggleMergeSelect,
    handleClearMergeSelection,
    handleDeleteNode,
    handleDeleteEdge,
    handleBatchDelete,
    handleRetryNode,
    handleUpdateNodeContent,
    handleAutoLayout,
    handleSaveSettings,
    handleLoadGraph,
    handleResetCanvas,
    handleAddThought,
    handleConfirmMerge,
    setShowMinimap,
  } = useGraphState();

  const { dir } = useLanguage();

  const selectedForMergeNodes = nodes.filter((n) =>
    selectedForMergeIds.includes(n.id)
  );

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100" dir={dir}>
      {/* Top Navigation */}
      <Navbar
        nodeCount={nodes.length}
        edgeCount={edges.length}
        activeParentTitle={activeParentTitle}
        activeParentId={activeParentId}
        provider={settings.provider}
        hasApiKey={Boolean(
          settings.provider === 'openrouter'
            ? settings.openRouterApiKey && settings.openRouterApiKey.trim().length > 0
            : settings.apiKey && settings.apiKey.trim().length > 0
        )}
        selectedForMergeCount={selectedForMergeIds.length}
        sessionCount={sessions.length}
        currentSessionTitle={currentSessionTitle}
        onOpenSessions={handleOpenSessions}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onAutoLayout={() => handleAutoLayout(layoutDirection)}
        onResetCanvas={handleResetCanvas}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
        onOpenFocusFlow={handleOpenFocusFlow}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Interactive DAG Canvas */}
      <main className="flex-1 relative overflow-hidden bg-zinc-50 dark:bg-black">
        <ThoughtCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          activeParentId={activeParentId}
          selectedForMergeIds={selectedForMergeIds}
          onForkNode={handleForkNode}
          onOpenFocusFlow={handleOpenFocusFlow}
          onToggleMergeSelect={handleToggleMergeSelect}
          onDeleteNode={handleDeleteNode}
          onInspectNode={setInspectedNodeId}
          onRetryNode={handleRetryNode}
          onUpdateNodeContent={handleUpdateNodeContent}
          onAutoLayout={handleAutoLayout}
          layoutDirection={layoutDirection}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          onOpenMergeModal={() => setIsMergeModalOpen(true)}
          onClearMergeSelection={handleClearMergeSelection}
          onNewGenesisThought={handleClearParent}
          onOpenSessions={handleOpenSessions}
          onBatchDelete={handleBatchDelete}
          onDeleteEdge={handleDeleteEdge}
          theme={theme}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* Floating Fork & Ideation Prompt Bar */}
        <ForkPromptBar
          activeParentTitle={activeParentTitle}
          activeParentId={activeParentId}
          onClearParent={handleClearParent}
          onSubmit={handleAddThought}
          isGenerating={isGenerating}
          availableModels={availableModels}
          defaultModel={settings.defaultModel}
        />
      </main>

      {/* Focus Flow / Full View as Conversation Modal */}
      <FocusFlowModal
        isOpen={isFocusFlowOpen}
        onClose={handleCloseFocusFlow}
        targetNodeId={focusNodeId}
        nodes={nodes}
        onReplyInFlow={handleAddThought}
        onUpdateNodeContent={handleUpdateNodeContent}
        isGenerating={isGenerating}
        availableModels={availableModels}
        defaultModel={settings.defaultModel}
      />

      {/* Multi-Branch Synthesis Modal */}
      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        selectedNodes={selectedForMergeNodes}
        availableModels={availableModels}
        defaultMergeModel={settings.defaultMergeModel}
        onConfirmMerge={handleConfirmMerge}
        isGenerating={isGenerating}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        availableModels={availableModels}
        onUpdateAvailableModels={setAvailableModels}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        nodes={nodes}
        edges={edges}
        activeParentId={activeParentId}
        onImportGraph={handleLoadGraph}
      />

      {/* Node Detail Inspector Modal */}
      <NodeDetailModal
        isOpen={Boolean(inspectedNodeId)}
        onClose={() => setInspectedNodeId(null)}
        nodeId={inspectedNodeId}
        nodes={nodes}
        onFork={handleForkNode}
        onToggleMergeSelect={handleToggleMergeSelect}
        isSelectedForMerge={Boolean(
          inspectedNodeId && selectedForMergeIds.includes(inspectedNodeId)
        )}
      />

      {/* Graph Sessions & History Modal */}
      <SessionsModal
        isOpen={isSessionsOpen}
        onClose={handleCloseSessions}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSwitchSession={handleSwitchSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        onDuplicateSession={handleDuplicateSession}
        onRenameSession={handleRenameSession}
      />

      {/* System Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ReactFlowProvider>
        <ThoughtGraphApp />
      </ReactFlowProvider>
    </LanguageProvider>
  );
}
