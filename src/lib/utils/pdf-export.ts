/**
 * Unified Multi-page A4 PDF Exporter using html2canvas-pro and jsPDF
 */

export interface MultiPagePdfExportOptions {
  pageElements?: HTMLElement[] | HTMLElement;
  elementId?: string;
  filename?: string;
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4';
  scale?: number;
  hideSelector?: string;
  onProgress?: (message: string, current: number, total: number) => void;
}

/**
 * Captures an array of DOM elements or elementId and compiles them into a single multi-page A4 PDF
 */
export async function exportMultiPagePdf({
  pageElements,
  elementId,
  filename,
  fileName,
  orientation = 'portrait',
  format = 'a4',
  scale = 2,
  hideSelector = '.screen-only-header, .no-print',
  onProgress,
}: MultiPagePdfExportOptions): Promise<void> {
  const resolvedFilename = fileName || filename || 'export.pdf';

  let elements: HTMLElement[] = [];
  if (pageElements) {
    elements = Array.isArray(pageElements) ? pageElements : [pageElements];
  } else if (elementId) {
    const el = document.getElementById(elementId);
    if (el) elements = [el];
  }

  if (elements.length === 0) return;

  const html2canvas = (await import('html2canvas-pro')).default;
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
    compress: true,
  });

  const pdfWidth = orientation === 'portrait' ? 210 : 297;
  const pdfHeight = orientation === 'portrait' ? 297 : 210;

  for (let i = 0; i < elements.length; i++) {
    const pageEl = elements[i];
    if (!pageEl) continue;

    if (onProgress) {
      onProgress(`กำลังสร้างหน้า PDF ที่ ${i + 1} จากทั้งหมด ${elements.length} หน้า...`, i + 1, elements.length);
    }

    // Hide screen-only indicator during canvas capture
    const hiddenElements = hideSelector ? pageEl.querySelectorAll(hideSelector) : [];
    hiddenElements.forEach((h) => ((h as HTMLElement).style.display = 'none'));

    const origBorder = pageEl.style.border;
    const origShadow = pageEl.style.boxShadow;
    const origRadius = pageEl.style.borderRadius;
    pageEl.style.border = 'none';
    pageEl.style.boxShadow = 'none';
    pageEl.style.borderRadius = '0';

    try {
      const canvas = await html2canvas(pageEl, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: pageEl.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) {
        pdf.addPage(format, orientation);
      }

      const canvasRatio = canvas.width / canvas.height;
      let targetW = pdfWidth;
      let targetH = pdfWidth / canvasRatio;
      let x = 0;
      let y = 0;

      if (targetH > pdfHeight) {
        targetH = pdfHeight;
        targetW = pdfHeight * canvasRatio;
        x = (pdfWidth - targetW) / 2;
      } else {
        y = (pdfHeight - targetH) / 2;
      }

      pdf.addImage(imgData, 'JPEG', x, y, targetW, targetH);
    } finally {
      // Restore styles
      pageEl.style.border = origBorder;
      pageEl.style.boxShadow = origShadow;
      pageEl.style.borderRadius = origRadius;
      hiddenElements.forEach((h) => ((h as HTMLElement).style.display = ''));
    }
  }

  if (onProgress) {
    onProgress('กำลังบันทึกไฟล์ PDF...', elements.length, elements.length);
  }

  const cleanFilename = resolvedFilename.endsWith('.pdf') ? resolvedFilename : `${resolvedFilename}.pdf`;
  pdf.save(cleanFilename);
}
