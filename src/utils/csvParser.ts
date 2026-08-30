export interface CSVRow {
  [key: string]: string;
}

export function parseCSV(content: string, delimiter = ';'): CSVRow[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Try detecting delimiter if semicolon doesn't yield columns
  if (!lines[0].includes(';') && lines[0].includes(',')) {
    delimiter = ',';
  } else if (!lines[0].includes(';') && lines[0].includes('\t')) {
    delimiter = '\t';
  }

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (values.length >= headers.length) {
      const row: CSVRow = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}