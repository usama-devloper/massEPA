import fs from 'fs';

const srcEnPath = 'C:/mEPA/mEpaAdmin/src/i18n/locales/en.json';
const srcNlPath = 'C:/mEPA/mEpaAdmin/src/i18n/locales/nl.json';
const dstEnPath = 'c:/mEPA/massEPA/src/i18n/locales/en.json';
const dstNlPath = 'c:/mEPA/massEPA/src/i18n/locales/nl.json';

const srcEn = JSON.parse(fs.readFileSync(srcEnPath, 'utf8'));
const srcNl = JSON.parse(fs.readFileSync(srcNlPath, 'utf8'));
const dstEn = JSON.parse(fs.readFileSync(dstEnPath, 'utf8'));
const dstNl = JSON.parse(fs.readFileSync(dstNlPath, 'utf8'));

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && key in target) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

deepMerge(dstEn, srcEn);
deepMerge(dstNl, srcNl);

fs.writeFileSync(dstEnPath, JSON.stringify(dstEn, null, 2), 'utf8');
fs.writeFileSync(dstNlPath, JSON.stringify(dstNl, null, 2), 'utf8');
console.log('Locales merged successfully!');
