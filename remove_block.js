const fs = require('fs');
const file = 'c:\\mEPA\\massEPA\\src\\pages\\backoffice\\InvoersheetView.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = '<div className="flex flex-col md:flex-row print:flex-row gap-6 w-full items-start">';
const endMarker = '                                    {itemKozijnen.length > 0 && (';

const startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
  const endIndex = content.indexOf(endMarker, startIndex);
  if (endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    // Let's remove the kozijnen too because they are now in the modal
    const nextItemCode = '                                </div>\n                              );';
    const finalEndIndex = content.indexOf(nextItemCode, startIndex);
    if (finalEndIndex !== -1) {
       content = before + '\n' + content.substring(finalEndIndex);
       fs.writeFileSync(file, content);
       console.log('Success! Removed the huge block.');
    } else {
      console.log('Could not find finalEndIndex');
    }
  } else {
    console.log('Could not find endMarker');
  }
} else {
  console.log('Could not find startMarker');
}
