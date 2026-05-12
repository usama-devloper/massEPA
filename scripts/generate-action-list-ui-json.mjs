/**
 * Reads `Action List_massEPA - UI items.csv` from the project root and writes
 * `src/data/actionListMassEpaUiItems.json` for use in the app.
 *
 * Run: node scripts/generate-action-list-ui-json.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const csvName = 'Action List_massEPA - UI items.csv';
const csvPath = path.join(root, csvName);
const outDir = path.join(root, 'src', 'data');
const outPath = path.join(outDir, 'actionListMassEpaUiItems.json');

/** Minimal RFC-style CSV row parser (handles quoted fields with commas). */
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
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
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (c === '\r') {
      i += 1;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }
  return rows;
}

function isYes(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase() === 'yes';
}

function main() {
  if (!fs.existsSync(csvPath)) {
    console.error('Missing CSV:', csvPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsvRows(raw);
  if (rows.length < 2) {
    console.error('CSV has no data rows');
    process.exit(1);
  }
  const header = rows[0].map((h) => h.trim());
  const expected = ['Sr. No.', 'Section', 'Category', 'Questions', 'Client', 'Intern', 'BO', 'Inspector'];
  if (header.length !== expected.length || !expected.every((e, idx) => header[idx] === e)) {
    console.warn('Unexpected header:', header);
  }

  const items = [];
  for (let r = 1; r < rows.length; r += 1) {
    const line = rows[r];
    if (line.length < 8) {
      console.warn('Skipping short row', r + 1, line);
      continue;
    }
    const [sr, section, category, question, client, intern, bo, inspector] = line;
    const order = parseInt(String(sr).trim(), 10);
    items.push({
      order: Number.isFinite(order) ? order : r,
      section: String(section).trim(),
      category: String(category).trim(),
      question: String(question).trim(),
      roles: {
        client: isYes(client),
        bidIntern: isYes(intern),
        backOffice: isYes(bo),
        inspector: isYes(inspector),
      },
    });
  }

  const doc = {
    version: 1,
    sourceFile: csvName,
    generatedAt: new Date().toISOString(),
    items,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${items.length} items -> ${path.relative(root, outPath)}`);
}

main();
