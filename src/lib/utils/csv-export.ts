/**
 * Escapes a value cleanly for RFC-4180 CSV cells (wrapping quotes, commas, newlines).
 */
export function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a UTF-8 BOM CSV string ready for Thai Excel opening.
 */
export function buildCsvContent(
  headers: string[],
  rows: ReadonlyArray<ReadonlyArray<unknown>>,
  withBom = true
): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  const content = [headerLine, ...dataLines].join('\r\n');
  return withBom ? `\uFEFF${content}` : content;
}

/**
 * Triggers browser download of a UTF-8 CSV file.
 */
export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: ReadonlyArray<ReadonlyArray<unknown>>
): void {
  const csv = buildCsvContent(headers, rows, true);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
