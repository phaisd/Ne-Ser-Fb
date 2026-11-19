/**
 * Print Helper Utility for Next.js / React Client Components.
 * 
 * Provides bulletproof printing of specific DOM elements (A4 forms, Badges, Certs)
 * by rendering the target element inside an isolated, hidden iframe with all active stylesheets.
 * This completely prevents parent modal backdrops, fixed positionings, and overflow:hidden containers
 * from clipping the document or breaking browser print preview.
 * 
 * Automatically falls back to window.print() if iframe creation is restricted.
 */

export function printElement(elementId: string, documentTitle?: string): boolean {
  if (typeof window === 'undefined') return false;

  const targetEl = document.getElementById(elementId);
  if (!targetEl) {
    // If element ID is not found, fallback to native window.print()
    window.print();
    return true;
  }

  try {
    // Create an invisible iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      if (iframe.parentNode) document.body.removeChild(iframe);
      window.print();
      return true;
    }

    // Collect all stylesheets and inline style tags from current document
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>${documentTitle || document.title || 'เอกสารพิมพ์ A4'}</title>
    ${styleTags}
    <style>
      @page {
        size: A4 portrait;
        margin: 6mm 5mm;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 100% !important;
        font-family: var(--font-family-main, "Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print\\:hidden, .no-print {
        display: none !important;
      }
    </style>
  </head>
  <body>
    ${targetEl.outerHTML}
  </body>
</html>`);
    doc.close();

    // Small delay to ensure styles and images are parsed before calling print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (printErr) {
        console.warn('Iframe print failed, falling back to window.print()', printErr);
        window.print();
      } finally {
        // Clean up the iframe after print dialog concludes
        setTimeout(() => {
          try {
            if (iframe.parentNode) {
              document.body.removeChild(iframe);
            }
          } catch {}
        }, 3000);
      }
    }, 300);

    return true;
  } catch (err) {
    console.warn('printElement setup error, falling back to window.print()', err);
    window.print();
    return true;
  }
}
