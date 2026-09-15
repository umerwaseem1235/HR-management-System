/** Triggers a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Builds a CSV string from headers + rows (values are quoted/escaped). */
export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

/** Downloads rows as a .csv file. */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  downloadBlob(new Blob([toCSV(headers, rows)], { type: 'text/csv' }), filename);
}
