const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../../../../../../../mEPA/massEPA/src/pages/inspector/invoersheetV2');
// Better to just pass absolute path
const absPath = 'C:\\mEPA\\massEPA\\src\\pages\\inspector\\invoersheetV2';

const colorMap = {
  // Backgrounds / text that use hardcoded hex
  'bg-\\[#f8f9ff\\]': 'bg-surface',
  'text-\\[#0b1c30\\]': 'text-on-surface',
  'bg-\\[#0f2038\\]': 'bg-primary',
  'text-\\[#0f2038\\]': 'text-primary',
  'bg-\\[#000818\\]': 'bg-primary-dark',
  'bg-\\[#006a63\\]': 'bg-primary',
  'text-\\[#006a63\\]': 'text-primary',
  'hover:bg-\\[#00504a\\]': 'hover:bg-primary-dark',
  'text-\\[#9bf2e8\\]': 'text-emerald-500', 
  'border-\\[#9bf2e8\\]': 'border-emerald-500',
  'bg-\\[#9bf2e8\\]': 'bg-emerald-500',
  'border-\\[#213145\\]': 'border-primary-dark',
  'border-\\[#2563eb\\]': 'border-primary',
  'bg-\\[#1e385c\\]': 'bg-primary',
  'hover:bg-\\[#284c7c\\]': 'hover:bg-primary-dark',
  'bg-\\[#0b1b30\\]': 'bg-primary-dark',
  'bg-\\[#081220\\]': 'bg-primary-dark',
  'bg-\\[#050c17\\]': 'bg-[#1a1c19]', // very dark background for CAD canvas
  'bg-\\[#0a1728\\]': 'bg-primary-dark',
  'bg-\\[#183152\\]': 'bg-primary',
  'hover:bg-\\[#234570\\]': 'hover:bg-primary-dark',
  'text-\\[#00201d\\]': 'text-white'
};

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [hexRegex, twClass] of Object.entries(colorMap)) {
        const regex = new RegExp(hexRegex, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, twClass);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated colors in ${file}`);
      }
    }
  });
}

processDirectory(absPath);
console.log('Done!');
