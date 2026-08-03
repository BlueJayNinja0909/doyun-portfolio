/**
 * Minimal RFC 4180 CSV reader.
 *
 * Written rather than pulled in because the study's own files need exactly one
 * non-trivial feature — quoted fields containing commas, which several rows use:
 *
 *   Gas Price - Costco,5.49,"$/gal | Costco San Diego, Jun 2025"
 *
 * Splitting on commas silently corrupts those rows into the wrong columns, which is
 * the kind of error that produces a plausible-looking but wrong chart. Handles quotes,
 * escaped quotes (""), embedded commas and newlines, and CRLF line endings.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  // Strip a UTF-8 BOM; Excel writes one and it corrupts the first header name.
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    // Skip blank trailing lines rather than emitting a row of one empty string.
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ',') {
      endField();
      i++;
      continue;
    }
    if (c === '\r') {
      i++;
      continue;
    }
    if (c === '\n') {
      endRow();
      i++;
      continue;
    }
    field += c;
    i++;
  }

  if (field !== '' || row.length > 0) endRow();
  return rows;
}

/** Parses to objects keyed by the header row. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body.map((r) => {
    const rec: Record<string, string> = {};
    header.forEach((h, i) => {
      rec[h.trim()] = (r[i] ?? '').trim();
    });
    return rec;
  });
}

/**
 * Parses a numeric cell, throwing rather than silently yielding NaN. A NaN reaching a
 * chart renders as a missing or zero-height bar that looks like real data.
 */
export function num(value: string, context: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Expected a number for ${context}, got ${JSON.stringify(value)}`);
  }
  return n;
}
