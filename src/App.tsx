import { ReactFlowProvider } from '@xyflow/react';
import { useGraphState } from './hooks/useGraphState';
import { Navbar } from './components/ui/Navbar';
import { ThoughtCanvas } from './components/canvas/ThoughtCanvas';
import { ForkPromptBar } from './components/prompt/ForkPromptBar';
import { MergeModal } from './components/prompt/MergeModal';
import { SettingsDrawer } from './components/settings/SettingsDrawer';
import { ExportImportModal } from './components/modals/ExportImportModal';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { NodeDetailModal } from './components/modals/NodeDetailModal';
import { FocusFlowModal } from './components/focus/FocusFlowModal';
import { ToastContainer } from './components/ui/Toast';

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

    // Focus Flow
    focusNodeId,
    isFocusFlowOpen,
    handleOpenFocusFlow,
    handleCloseFocusFlow,

    // Modals
    isSettingsOpen,
    setIsSettingsOpen,
    isExportOpen,
    setIsExportOpen,
    isTemplatesOpen,
    setIsTemplatesOpen,
    isMergeModalOpen,
    setIsMergeModalOpen,
    inspectedNodeId,
    setInspectedNodeId,

    // Actions
    handleForkNode,
    handleClearParent,
    handleToggleMergeSelect,
    handleClearMergeSelection,
    handleDeleteNode,
    handleBatchDelete,
    handleRetryNode,
    handleAutoLayout,
    handleSaveSettings,
    handleLoadGraph,
    handleResetCanvas,
    handleAddThought,
    handleConfirmMerge,
    setShowMinimap,
  } = useGraphState();

  const selectedForMergeNodes = nodes.filter((n) =>
    selectedForMergeIds.includes(n.id)
  );

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-black text-zinc-100 select-none">
      {/* Top Navigation */}
      <Navbar
        nodeCount={nodes.length}
        edgeCount={edges.length}
        activeParentTitle={activeParentTitle}
        activeParentId={activeParentId}
        hasApiKey={Boolean(settings.apiKey && settings.apiKey.trim().length > 0)}
        selectedForMergeCount={selectedForMergeIds.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onAutoLayout={() => handleAutoLayout(layoutDirection)}
        onResetCanvas={handleResetCanvas}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
        onOpenFocusFlow={handleOpenFocusFlow}
      />

      {/* Main Interactive DAG Canvas */}
      <main className="flex-1 relative overflow-hidden bg-black">
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
          onAutoLayout={handleAutoLayout}
          layoutDirection={layoutDirection}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          onOpenMergeModal={() => setIsMergeModalOpen(true)}
          onClearMergeSelection={handleClearMergeSelection}
          onNewGenesisThought={handleClearParent}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          onBatchDelete={handleBatchDelete}
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

      {/* Starter Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleLoadGraph}
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

      {/* System Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <ThoughtGraphApp />
    </ReactFlowProvider>
  );
}
