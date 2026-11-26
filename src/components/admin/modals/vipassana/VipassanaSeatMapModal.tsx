import React from 'react';
import type { VipassanaSeatMapModalProps } from './seat-map';
import { VipassanaSeatMapPrintModal } from './VipassanaSeatMapPrintModal';
import {
  useVipassanaSeatMap,
  SeatMapZoneConfigModal,
  SeatMapQrShareModal,
  SeatMapBatchActionsBar,
  SeatMapRangeModal,
  SeatMapAutoAssignModal,
  SeatMapAbsentReportModal,
  SeatMapImportExportModal,
  SeatDetailSidebar,
  SeatMapHeaderToolbar,
  SeatMapStatsBar,
  SeatMapCanvas,
} from './seat-map';

export const VipassanaSeatMapModal: React.FC<VipassanaSeatMapModalProps> = ({
  isOpen,
  onClose,
  event,
  registrations: rawRegistrations,
  onRefresh,
  onOpenSeatScanner,
  onOpenEventQr,
}) => {
  const {
    registrations,
    config,
    setConfig,
    activeZoneId,
    setActiveZoneId,
    zoomLevel,
    setZoomLevel,
    searchQuery,
    setSearchQuery,
    selectedSeat,
    setSelectedSeat,
    isConfigDrawerOpen,
    setIsConfigDrawerOpen,
    isAssignModalOpen,
    setIsAssignModalOpen,
    autoSortBy,
    setAutoSortBy,
    isSaving,
    message,
    setMessage,
    assignTargetStudentCode,
    setAssignTargetStudentCode,
    isImportExportModalOpen,
    setIsImportExportModalOpen,
    importExportTab,
    setImportExportTab,
    isPrintModalOpen,
    setIsPrintModalOpen,
    importFileName,
    importRawText,
    importPreviewRows,
    setImportPreviewRows,
    isImporting,
    resetExistingSeats,
    setResetExistingSeats,
    isMobileQrOpen,
    setIsMobileQrOpen,
    isBatchMode,
    setIsBatchMode,
    selectedSeats,
    setSelectedSeats,
    isRangeModalOpen,
    setIsRangeModalOpen,
    totalDays,
    inspectionDay,
    setInspectionDay,
    inspectionPeriod,
    setInspectionPeriod,
    isSavingInspection,
    isAbsentReportOpen,
    setIsAbsentReportOpen,
    isDeduplicating,
    disabledSet,
    filteredZones,
    selectedOccupant,
    seatOccupantMap,
    stats,
    dailyStats,
    handleSaveConfig,
    handleToggleDisableSeat,
    handleDesignateSeatStatus,
    handleDesignateRowStatus,
    handleDesignateColStatus,
    handleToggleColAisle,
    handleSeatClick,
    handleBatchDisableSeats,
    handleBatchEnableSeats,
    handleBatchDesignateStatus,
    mobileScannerQrDataUrl,
    mobileSeatingQrDataUrl,
    mobileSeatScanUrl,
    mobilePublicSeatingUrl,
    copiedMobileUrl,
    handleCopyMobileUrl,
    handleExportSeatingXlsx,
    handleExportSeatingCsv,
    handleDownloadBlankTemplate,
    handleFileUpload,
    handlePasteText,
    handleApplyImportedSeating,
    handleSaveSeatInspection,
    handleMarkAllScannedOccupied,
    handleDeduplicateRegistrations,
    handleClearAllSeats,
    handleAutoAssign,
    handleAssignSeatManually,
    handleAddZone,
    handleRemoveZone,
    handleUpdateZone,
  } = useVipassanaSeatMap({
    event,
    rawRegistrations,
    onRefresh,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-hidden sm:overflow-y-auto no-print print:hidden">
      <div className="relative w-full max-w-7xl h-full sm:h-auto sm:max-h-[96vh] flex flex-col bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar & 2-Row Toolbars */}
        <SeatMapHeaderToolbar
          event={event}
          config={config}
          onClose={onClose}
          onOpenSeatScanner={onOpenSeatScanner}
          onOpenMobileQr={() => setIsMobileQrOpen(true)}
          isConfigDrawerOpen={isConfigDrawerOpen}
          setIsConfigDrawerOpen={setIsConfigDrawerOpen}
          message={message}
          setMessage={setMessage}
          activeZoneId={activeZoneId}
          setActiveZoneId={setActiveZoneId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          isBatchMode={isBatchMode}
          setIsBatchMode={setIsBatchMode}
          selectedSeatsCount={selectedSeats.size}
          onClearSelectedSeats={() => setSelectedSeats(new Set())}
          onOpenRangeModal={() => setIsRangeModalOpen(true)}
          onOpenAssignModal={() => setIsAssignModalOpen(true)}
          isSaving={isSaving}
          onOpenImportExport={() => {
            setImportExportTab('EXPORT');
            setIsImportExportModalOpen(true);
          }}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
          onDeduplicate={handleDeduplicateRegistrations}
          isDeduplicating={isDeduplicating}
          onClearAllSeats={handleClearAllSeats}
          assignedCount={stats.assignedCount}
        />

        {/* Daily & Period Inspection Bar & Statistics Legend */}
        <SeatMapStatsBar
          inspectionDay={inspectionDay}
          setInspectionDay={setInspectionDay}
          totalDays={totalDays}
          inspectionPeriod={inspectionPeriod}
          setInspectionPeriod={setInspectionPeriod}
          onMarkAllScannedOccupied={handleMarkAllScannedOccupied}
          isSavingInspection={isSavingInspection}
          dailyStats={dailyStats}
          onOpenAbsentReport={() => setIsAbsentReportOpen(true)}
          stats={stats}
          onDeduplicateRegistrations={handleDeduplicateRegistrations}
          isDeduplicating={isDeduplicating}
        />

        {/* Main Content Area: Seat Grid + Side Drawer */}
        <div className="relative flex-1 flex overflow-hidden bg-slate-100/70">
          <SeatMapCanvas
            isBatchMode={isBatchMode}
            setIsBatchMode={setIsBatchMode}
            setSelectedSeats={setSelectedSeats}
            onOpenRangeModal={() => setIsRangeModalOpen(true)}
            zoomLevel={zoomLevel}
            filteredZones={filteredZones}
            config={config}
            disabledSet={disabledSet}
            selectedSeats={selectedSeats}
            selectedSeat={selectedSeat}
            setSelectedSeat={setSelectedSeat}
            seatOccupantMap={seatOccupantMap}
            searchQuery={searchQuery}
            inspectionDay={inspectionDay}
            inspectionPeriod={inspectionPeriod}
            onSeatClick={handleSeatClick}
            onToggleColAisle={handleToggleColAisle}
          />

          {/* Backdrop for mobile bottom sheet */}
          {selectedSeat && (
            <div
              className="fixed inset-0 bg-slate-900/50 z-30 sm:hidden animate-in fade-in duration-150"
              onClick={() => setSelectedSeat(null)}
            />
          )}

          {/* Selected Seat Inspector Drawer: Bottom sheet on mobile, right side drawer on desktop */}
          <SeatDetailSidebar
            selectedSeat={selectedSeat}
            onClose={() => setSelectedSeat(null)}
            config={config}
            disabledSet={disabledSet}
            selectedOccupant={selectedOccupant}
            inspectionDay={inspectionDay}
            inspectionPeriod={inspectionPeriod}
            isSavingInspection={isSavingInspection}
            onSaveSeatInspection={handleSaveSeatInspection}
            onAssignSeatManually={handleAssignSeatManually}
            onToggleDisableSeat={handleToggleDisableSeat}
            onDesignateSeatStatus={handleDesignateSeatStatus}
            onDesignateRowStatus={handleDesignateRowStatus}
            onDesignateColStatus={handleDesignateColStatus}
            assignTargetStudentCode={assignTargetStudentCode}
            setAssignTargetStudentCode={setAssignTargetStudentCode}
            registrations={registrations}
            isSaving={isSaving}
          />

          {/* Config Drawer (Zone Settings) */}
          <SeatMapZoneConfigModal
            isOpen={isConfigDrawerOpen}
            onClose={() => setIsConfigDrawerOpen(false)}
            config={config}
            setConfig={setConfig}
            onSave={handleSaveConfig}
            isSaving={isSaving}
            onAddZone={handleAddZone}
            onRemoveZone={handleRemoveZone}
            onUpdateZone={handleUpdateZone}
          />
        </div>

        {/* Auto Assign Modal Popup */}
        <SeatMapAutoAssignModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          registrationsCount={registrations.length}
          autoSortBy={autoSortBy}
          setAutoSortBy={setAutoSortBy}
          onAutoAssign={handleAutoAssign}
          isSaving={isSaving}
          onOpenImportExport={() => {
            setIsAssignModalOpen(false);
            setIsImportExportModalOpen(true);
          }}
        />

        {/* Excel / CSV Import & Export Modal Popup */}
        <SeatMapImportExportModal
          isOpen={isImportExportModalOpen}
          onClose={() => {
            setIsImportExportModalOpen(false);
            setImportPreviewRows([]);
          }}
          eventTitle={event.title}
          registrationsCount={registrations.length}
          importExportTab={importExportTab}
          setImportExportTab={setImportExportTab}
          onExportXlsx={handleExportSeatingXlsx}
          onExportCsv={handleExportSeatingCsv}
          onDownloadBlankTemplate={handleDownloadBlankTemplate}
          onFileUpload={handleFileUpload}
          importFileName={importFileName}
          importRawText={importRawText}
          onPasteText={handlePasteText}
          resetExistingSeats={resetExistingSeats}
          setResetExistingSeats={setResetExistingSeats}
          importPreviewRows={importPreviewRows}
          isImporting={isImporting}
          onApplyImport={handleApplyImportedSeating}
        />

        {/* Mobile QR & Deep-link Modal */}
        <SeatMapQrShareModal
          isOpen={isMobileQrOpen}
          onClose={() => setIsMobileQrOpen(false)}
          event={event}
          mobileScannerQrDataUrl={mobileScannerQrDataUrl}
          mobileSeatingQrDataUrl={mobileSeatingQrDataUrl}
          mobileSeatScanUrl={mobileSeatScanUrl}
          mobilePublicSeatingUrl={mobilePublicSeatingUrl}
          copiedMobileUrl={copiedMobileUrl}
          onCopyMobileUrl={handleCopyMobileUrl}
          onOpenSeatScanner={onOpenSeatScanner}
          onOpenEventQr={onOpenEventQr}
          onParentClose={onClose}
        />

        {/* Absent From Seat Report Modal */}
        <SeatMapAbsentReportModal
          isOpen={isAbsentReportOpen}
          onClose={() => setIsAbsentReportOpen(false)}
          dailyStats={dailyStats}
          inspectionDay={inspectionDay}
          inspectionPeriod={inspectionPeriod}
          onSaveSeatInspection={handleSaveSeatInspection}
        />

        {/* Print Seating Chart A4 Modal */}
        {isPrintModalOpen && (
          <VipassanaSeatMapPrintModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            event={event}
            config={config}
            registrations={registrations}
          />
        )}

        {/* Range Selection Modal */}
        <SeatMapRangeModal
          isOpen={isRangeModalOpen}
          onClose={() => setIsRangeModalOpen(false)}
          config={config}
          activeZoneId={activeZoneId}
          onBatchDisable={handleBatchDisableSeats}
          onBatchEnable={handleBatchEnableSeats}
          onSelectRangeOnMap={(seats: string[]) => {
            setSelectedSeats((prev) => {
              const next = new Set(prev);
              seats.forEach((s) => next.add(s.toUpperCase()));
              return next;
            });
            setIsBatchMode(true);
            setIsRangeModalOpen(false);
          }}
        />

        {/* Batch Multi-Seat Actions Bar Floating at Bottom */}
        <SeatMapBatchActionsBar
          selectedSeats={selectedSeats}
          onClearSelection={() => {
            setSelectedSeats(new Set());
            setIsBatchMode(false);
          }}
          onBatchDisable={handleBatchDisableSeats}
          onBatchEnable={handleBatchEnableSeats}
          onBatchDesignateStatus={handleBatchDesignateStatus}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};
export default VipassanaSeatMapModal;
