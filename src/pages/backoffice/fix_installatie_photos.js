const fs = require('fs');
const path = 'c:/mEPA/massEPA/src/pages/backoffice/InstallatieView.tsx';
let content = fs.readFileSync(path, 'utf8');

const helper = `
    const getActiveInstDetails = () => {
      const allInst = data.installationsList || (data.installations && Array.isArray(data.installations) ? data.installations : []);
      const existingInst = allInst.find((i: any) => i.id === activeInstallatieId);
      return existingInst?.details || {};
    };
`;

content = content.replace(
  /const getSanitizedFileKey = \(category: string\) => \{\s*return `files_\$\{category\.replace\(\/\[\^a-zA-Z0-9_\]\/g, ''\)\}`;\s*\};\n/,
  match => match + helper
);

content = content.replace(/const files: any\[\] = \(data\.installations as any\)\?\.\[getSanitizedFileKey\('([^']+)'\)\] \|\| \[\];/g, 
  "const files: any[] = getActiveInstDetails()[getSanitizedFileKey('$1')] || [];");

content = content.replace(/const existingFiles: any\[\] = Array\.isArray\(\(data\?\.installations as any\)\?\.\[currentFilesKey\]\)\s*\? \(data\.installations as any\)\[currentFilesKey\]\s*: \[\];/g,
  "const existingFiles: any[] = Array.isArray(getActiveInstDetails()[currentFilesKey]) ? getActiveInstDetails()[currentFilesKey] : [];");

content = content.replace(/if \(\(data\?\.installations as any\)\?\.\\[\`selectedPhotoIndex_\$\{slot\}\`\\] === '-1'\) \{/g,
  "if (getActiveInstDetails()[`selectedPhotoIndex_${slot}`] === '-1') {");

content = content.replace(/if \(\(data\?\.installations as any\)\?\.\\[\`selectedPhotoIndex_\\$\\{slot\\}\`\\] === '-1'\) \{/g,
  "if (getActiveInstDetails()[`selectedPhotoIndex_${slot}`] === '-1') {");
  
content = content.replace(/if \(\(data\?\.installations as any\)\?\.\\[\`selectedPhotoIndex_\\$\\{slot\\}\`\\] === '-1'\)/g,
  "if (getActiveInstDetails()[`selectedPhotoIndex_${slot}`] === '-1')");

fs.writeFileSync(path, content, 'utf8');
