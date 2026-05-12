/**
 * Writes src/data/dummyClientsImport.json — 5 dummy clients with empty checklist answers
 * keyed alist_0 … alist_N (same order as actionListMassEpaUiItems.json).
 *
 * Run: node scripts/generate-dummy-clients-import.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const actionListPath = path.join(root, 'src', 'data', 'actionListMassEpaUiItems.json');
const outPath = path.join(root, 'src', 'data', 'dummyClientsImport.json');

const actionList = JSON.parse(fs.readFileSync(actionListPath, 'utf8'));

const emptyBuilding = {
  renovationStatus: 'Nee',
  renovationYear: '',
  bouwjaar: '',
  floorArea: '',
  vloerenType: 'Licht',
  wandenType: 'Licht',
  gboT: '',
  leidingdoorvoeren: '',
  avr: '',
  buurt: '',
  wijk: '',
  gemeente: '',
  gebouwhoogte: '',
  hasFloorPlans: null,
};

function emptyAnswers() {
  const answers = {};
  for (let index = 0; index < actionList.items.length; index++) {
    const item = actionList.items[index];
    answers[`alist_${index}`] = {
      value: null,
      section: item.section,
      category: item.category,
      question: item.question,
    };
  }
  return answers;
}

function normalizeAddressKey(address) {
  return address
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s\-_,.]/gi, '_')
    .replace(/\s+/g, '_')
    .slice(0, 240);
}

const now = Date.now();
const clientsSeed = [
  {
    fullName: 'Jan de Vries',
    email: 'jan.devries@example.nl',
    phoneNumber: '+31 6 12345601',
    address: 'Jaagmeent 1, 1213 AB Hilversum',
  },
  {
    fullName: 'Maria Jansen',
    email: 'maria.jansen@example.nl',
    phoneNumber: '+31 6 12345602',
    address: 'Keizersgracht 10, 1015 CC Amsterdam',
  },
  {
    fullName: 'Pieter Bakker',
    email: 'pieter.bakker@example.nl',
    phoneNumber: '+31 6 12345603',
    address: 'Coolsingel 42, 3011 AD Rotterdam',
  },
  {
    fullName: 'Sophie van Dijk',
    email: 'sophie.vandijk@example.nl',
    phoneNumber: '+31 6 12345604',
    address: 'Oudegracht 88, 3511 AR Utrecht',
  },
  {
    fullName: 'Ahmed El Amrani',
    email: 'ahmed.elamrani@example.nl',
    phoneNumber: '+31 6 12345605',
    address: 'Grote Markt 5, 9712 HN Groningen',
  },
];

const doc = {
  v: 1,
  importKind: 'massEpaClientsAndDossiers',
  description:
    'Dummy clients for massEPA. Edit profile fields and answer "value" entries, then import into the app. Keys alist_N match item order in actionListMassEpaUiItems.json.',
  actionListVersion: actionList.version,
  actionListSourceFile: actionList.sourceFile,
  generatedAt: new Date(now).toISOString(),
  clients: clientsSeed.map((c, i) => {
    const id = `cli_dummy_${String(i + 1).padStart(3, '0')}`;
    const addressKey = normalizeAddressKey(c.address);
    const t = now + i;
    return {
      id,
      fullName: c.fullName,
      email: c.email,
      phoneNumber: c.phoneNumber,
      address: c.address,
      createdAt: t,
      updatedAt: t,
      dossier: {
        v: 1,
        addressKey,
        addressDisplay: c.address,
        actionListVersion: actionList.version,
        updatedAt: t,
        lastEditedByEmail: 'import@buildingid.local',
        lastEditedByName: 'Import seed',
        profileHint: {
          fullName: c.fullName,
          email: c.email,
          phoneNumber: c.phoneNumber,
        },
        building: { ...emptyBuilding },
        answers: emptyAnswers(),
      },
    };
  }),
};

fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`  clients: ${doc.clients.length}`);
console.log(`  answers per client: ${Object.keys(doc.clients[0].dossier.answers).length}`);
