const fs = require('fs');

const currentFile = 'C:/mEPA/massEPA/src/pages/backoffice/InvoersheetView.tsx';
const backupFile = 'C:/mEPA/__Backup/mass_EPA/260819_massEPA_invoersheet_constructieandBouwkundigupdated/src/pages/backoffice/InvoersheetView.tsx';

const currentLines = fs.readFileSync(currentFile, 'utf8').split('\n');
const backupLines = fs.readFileSync(backupFile, 'utf8').split('\n');

const part1 = currentLines.slice(0, 2220); // Lines 1 to 2220 (indices 0 to 2219)
const part2 = backupLines.slice(1609, 3499); // Lines 1610 to 3499 (indices 1609 to 3498)
const part3 = currentLines.slice(3517); // Lines 3518 to end (indices 3517 to end)

const merged = part1.concat(part2, part3).join('\n');
fs.writeFileSync(currentFile, merged);
console.log('Merged successfully!');
