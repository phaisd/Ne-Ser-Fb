/**
 * CSV Export Helper with UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
 */

export interface CsvExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Formats a 2D array into a RFC4180-compliant CSV string with UTF-8 BOM
 */
export function generateCsvContent(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const escapeCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));

  // Prepend UTF-8 BOM
  return '\uFEFF' + [headerLine, ...rowLines].join('\n');
}

/**
 * Triggers a client-side file download of CSV content
 */
export function downloadCsvFile({ filename, headers, rows }: CsvExportOptions): void {
  if (typeof window === 'undefined') return;

  const csvContent = generateCsvContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
