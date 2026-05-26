// Merges IMDb-export CSV files into src/data/ratings.csv.
// Starts from the existing ratings.csv as a base, then layers each input on top.
// For duplicate IMDb IDs, keeps the row with the most recent Date Rated.
// Removes exact-duplicate rows (same Const appearing more than once).
//
// Usage:
//   node scripts/mergeRatings.js src/data/ratings_lior.csv src/data/ratings_or.csv [more...]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_PATH = path.join(__dirname, '../src/data/ratings.csv');

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('Usage: node scripts/mergeRatings.js <file1.csv> [file2.csv ...]');
  process.exit(1);
}

// ── CSV helpers ────────────────────────────────────────────────────────────────

function parseCsvRow(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCsv(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const headers = parseCsvRow(lines[0]);
  return { headers, rows: lines.slice(1).map(line => parseCsvRow(line)) };
}

function quoteCsvField(val) {
  if (val == null) return '';
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

function rowToLine(row) {
  return row.map(quoteCsvField).join(',');
}

// ── Main ───────────────────────────────────────────────────────────────────────

let headers = null;
// Map: Const → { row: string[], date: string }
const best = new Map();

// Phase 1: load existing ratings.csv as base (dedup it in the process)
if (fs.existsSync(BASE_PATH)) {
  const { headers: h, rows } = parseCsv(fs.readFileSync(BASE_PATH, 'utf8'));
  headers = h;
  const constIdx = h.indexOf('Const');
  const dateIdx  = h.indexOf('Date Rated');
  let dupsRemoved = 0;
  for (const row of rows) {
    const id   = row[constIdx]?.trim();
    const date = dateIdx !== -1 ? (row[dateIdx]?.trim() ?? '') : '';
    if (!id) continue;
    const existing = best.get(id);
    if (!existing || date > existing.date) {
      best.set(id, { row, date });
      if (existing) dupsRemoved++;
    } else {
      dupsRemoved++;
    }
  }
  console.log(`Base ratings.csv: ${rows.length} rows → ${best.size} unique (${dupsRemoved} duplicates removed)`);
}

// Phase 2: merge each input file on top
for (const filePath of inputs) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.warn(`Warning: file not found, skipping — ${abs}`);
    continue;
  }
  const { headers: h, rows } = parseCsv(fs.readFileSync(abs, 'utf8'));
  if (!headers) headers = h;

  const constIdx = h.indexOf('Const');
  const dateIdx  = h.indexOf('Date Rated');

  if (constIdx === -1) {
    console.warn(`Warning: no 'Const' column in ${filePath}, skipping`);
    continue;
  }

  const before = best.size;
  let updated = 0;
  for (const row of rows) {
    const id   = row[constIdx]?.trim();
    const date = dateIdx !== -1 ? (row[dateIdx]?.trim() ?? '') : '';
    if (!id) continue;
    const existing = best.get(id);
    if (!existing) {
      best.set(id, { row, date });
    } else if (date > existing.date) {
      best.set(id, { row, date });
      updated++;
    }
  }
  const added = best.size - before;
  console.log(`${path.basename(filePath)}: ${rows.length} rows → ${added} new, ${updated} updated`);
}

if (!headers) {
  console.error('No valid input files found.');
  process.exit(1);
}

const lines = [rowToLine(headers)];
for (const { row } of best.values()) {
  lines.push(rowToLine(row));
}

fs.writeFileSync(BASE_PATH, lines.join('\n') + '\n', 'utf8');
console.log(`\nWrote ${best.size} unique entries to ${BASE_PATH}`);
