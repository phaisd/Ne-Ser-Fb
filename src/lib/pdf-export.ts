import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * Exports an HTML element directly to a standard A4 PDF file.
 */
export async function exportElementToPdf(
  elementId: string,
  filename: string = 'หนังสือรับรอง_มจร.pdf'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Generate high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Standard A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate height in PDF mm to preserve aspect ratio
    const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
    } else {
      // If content exceeds one A4 page, scale it slightly to fit cleanly within single A4 page
      const scaleFactor = pdfHeight / imgHeight;
      const scaledWidth = pdfWidth * scaleFactor;
      const xOffset = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, pdfHeight);
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
