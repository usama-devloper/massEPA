const fs = require('fs');
['src/i18n/locales/en.json', 'src/i18n/locales/nl.json'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Find colons at the end of string values
  // e.g. "key": "Value:" -> "key": "Value"
  let updated = content.replace(/:\",/g, '",');
  updated = updated.replace(/:\"\n/g, '"\n'); // for last items without comma
  fs.writeFileSync(file, updated);
});
