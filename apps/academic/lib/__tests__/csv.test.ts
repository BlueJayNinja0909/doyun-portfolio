import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseCsv, parseCsvRecords, num } from '../csv';

describe('parseCsv', () => {
  test('splits plain rows', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  test('keeps commas inside quoted fields', () => {
    expect(parseCsv('a,b\n1,"x, y"')).toEqual([
      ['a', 'b'],
      ['1', 'x, y'],
    ]);
  });

  test('handles escaped quotes', () => {
    expect(parseCsv('a\n"he said ""hi"""')).toEqual([['a'], ['he said "hi"']]);
  });

  test('handles newlines inside quoted fields', () => {
    expect(parseCsv('a,b\n1,"line1\nline2"')).toEqual([
      ['a', 'b'],
      ['1', 'line1\nline2'],
    ]);
  });

  test('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  test('strips a UTF-8 BOM from the first header', () => {
    expect(parseCsv('﻿a,b\n1,2')[0]).toEqual(['a', 'b']);
  });

  test('ignores a trailing blank line', () => {
    expect(parseCsv('a\n1\n')).toEqual([['a'], ['1']]);
  });
});

describe('num', () => {
  test('parses numerics', () => {
    expect(num('5.49', 'gas price')).toBe(5.49);
  });

  test('throws rather than returning NaN, naming the field', () => {
    // A NaN reaching a chart renders as a zero-height bar that looks like real data.
    expect(() => num('n/a', 'gas price')).toThrow(/gas price/);
  });
});

describe('the study\'s real files', () => {
  // Resolved from this file, not process.cwd(): vitest runs from the repo root while
  // `next build` runs from the app directory, so cwd is not a stable base here.
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../content/transit');
  const read = (f: string) => fs.readFileSync(path.join(dir, f), 'utf8');

  test('every file parses to a consistent column count', () => {
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.csv'))) {
      const rows = parseCsv(read(f));
      expect(rows.length, `${f} is empty`).toBeGreaterThan(1);
      const width = rows[0].length;
      rows.forEach((r, i) => {
        expect(r.length, `${f} row ${i} has ${r.length} columns, header has ${width}`).toBe(width);
      });
    }
  });

  test('assumptions.csv keeps its comma-containing source notes intact', () => {
    const recs = parseCsvRecords(read('assumptions.csv'));
    const costco = recs.find((r) => r.parameter === 'Gas Price - Costco');
    expect(costco?.value).toBe('5.49');
    // Naive comma splitting would truncate this at "Costco San Diego".
    expect(costco?.unit_source).toContain('Costco San Diego, Jun 2025');
  });
});
