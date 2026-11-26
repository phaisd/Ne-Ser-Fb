'use client';

import React from 'react';
import {
  type VipassanaLiveScannerModalProps,
  useVipassanaLiveScanner,
  ScannerPolicyDrawer,
  ScannerSidePanel,
  ScannerHeaderControls,
  ScannerCameraView,
  ScannerResultCard,
  ScannerHardwareInput,
} from './vipassana/scanner';

export function VipassanaLiveScannerModal({
  isOpen,
  onClose,
  event,
  registrations,
  onCheckInRecorded,
}: VipassanaLiveScannerModalProps) {
  const {
    selectedDayNumber,
    setSelectedDayNumber,
    selectedPeriod,
    setSelectedPeriod,
    statusMode,
    setStatusMode,
    soundEnabled,
    setSoundEnabled,
    evalMode,
    setEvalMode,
    lateGraceMinutes,
    setLateGraceMinutes,
    showConfigDrawer,
    setShowConfigDrawer,
    isToolbarCollapsed,
    setIsToolbarCollapsed,
    showAdvancedControls,
    setShowAdvancedControls,
    isScreenLocked,
    setIsScreenLocked,
    periodPolicies,
    setPeriodPolicies,
    inputCode,
    setInputCode,
    isSubmitting,
    kioskState,
    recentScans,
    setRecentScans,
    lastFeedback,
    setLastFeedback,
    isCameraActive,
    setIsCameraActive,
    cameraFacing,
    setCameraFacing,
    cameraError,
    videoRef,
    inputRef,
    selectedGroup,
    setSelectedGroup,
    rightPanelTab,
    setRightPanelTab,
    checklistSearch,
    setChecklistSearch,
    availableGroups,
    scannerOfficerName,
    setScannerOfficerName,
    offlineQueue,
    syncOfflineQueue,
    isSyncingOffline,
    dayKey,
    groupRegistrations,
    stats,
    handleFormSubmit,
    processScanCode,
    handleOverrideStudentStatus,
  } = useVipassanaLiveScanner({
    isOpen,
    event,
    registrations,
    onCheckInRecorded,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-1 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER & SETTINGS TOOLBAR */}
        <ScannerHeaderControls
          event={event}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedDayNumber={selectedDayNumber}
          setSelectedDayNumber={setSelectedDayNumber}
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          availableGroups={availableGroups}
          registrations={registrations}
          stats={stats}
          offlineQueueCount={offlineQueue.length}
          syncOfflineQueue={syncOfflineQueue}
          isSyncingOffline={isSyncingOffline}
          isScreenLocked={isScreenLocked}
          setIsScreenLocked={setIsScreenLocked}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onClose={onClose}
          isToolbarCollapsed={isToolbarCollapsed}
          setIsToolbarCollapsed={setIsToolbarCollapsed}
          showAdvancedControls={showAdvancedControls}
          setShowAdvancedControls={setShowAdvancedControls}
          scannerOfficerName={scannerOfficerName}
          setScannerOfficerName={setScannerOfficerName}
          evalMode={evalMode}
          setEvalMode={setEvalMode}
          manualStatus={statusMode}
          setManualStatus={setStatusMode}
          showConfigDrawer={showConfigDrawer}
          setShowConfigDrawer={setShowConfigDrawer}
          lateThresholdMinutes={lateGraceMinutes}
          setLateThresholdMinutes={setLateGraceMinutes}
        />

        {/* Policy Time Editor Drawer */}
        <ScannerPolicyDrawer
          isOpen={showConfigDrawer}
          onClose={() => setShowConfigDrawer(false)}
          selectedPeriod={selectedPeriod}
          periodPolicies={periodPolicies}
          setPeriodPolicies={setPeriodPolicies}
        />

        {/* BODY AREA */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
          {/* LEFT COLUMN: CAMERA FEED & SCANNER INPUT (7 COLS) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Camera Viewport & HUD */}
            <ScannerCameraView
              isCameraActive={isCameraActive}
              setIsCameraActive={setIsCameraActive}
              cameraFacing={cameraFacing}
              setCameraFacing={setCameraFacing}
              videoRef={videoRef}
              kioskState={kioskState}
              lastFeedback={lastFeedback}
              setLastFeedback={setLastFeedback}
              cameraError={cameraError}
            />

            {/* Hardware Barcode & Fast Input Box */}
            <ScannerHardwareInput
              inputCode={inputCode}
              setInputCode={setInputCode}
              isSubmitting={isSubmitting}
              inputRef={inputRef}
              onSubmit={handleFormSubmit}
            />

            {/* Kiosk Readiness & Live Result Feedback Card */}
            <ScannerResultCard
              kioskState={kioskState}
              lastFeedback={lastFeedback}
            />
          </div>

          {/* RIGHT COLUMN: RECENT SCANS LOG & GROUP CHECKLIST (5 COLS) */}
          <ScannerSidePanel
            rightPanelTab={rightPanelTab}
            setRightPanelTab={setRightPanelTab}
            recentScans={recentScans}
            onClearRecentScans={() => setRecentScans([])}
            groupRegistrations={groupRegistrations}
            dayKey={dayKey}
            selectedPeriod={selectedPeriod}
            checklistSearch={checklistSearch}
            setChecklistSearch={setChecklistSearch}
            onOverrideStudentStatus={handleOverrideStudentStatus}
            onProcessScanCode={processScanCode}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
export default VipassanaLiveScannerModal;
