const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/backoffice/InvoersheetView.tsx');
let data = fs.readFileSync(file, 'utf8');

// 1. Add Edit/Delete to Installatie header
data = data.replace(
  /<div className="flex justify-between items-center pb-3 border-b border-neutral-200\/85 print-header-keep">\s*<div className="flex items-center gap-2\.5 font-sans">\s*<span className="text-\[11px\] font-black text-primary uppercase tracking-wider">\s*Installatie #\{index \+ 1\}\s*<\/span>\s*<\/div>\s*<\/div>/g,
  <div className="flex justify-between items-center pb-3 border-b border-neutral-200/85 print-header-keep">
                            <div className="flex items-center gap-2.5 font-sans">
                              <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                                Installatie #{index + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 no-print relative">
                              <button
                                type="button"
                                onClick={() => {
                                  localStorage.setItem('installatie_active_id_current', inst.id);
                                  if (onViewChange) onViewChange('installatie');
                                }}
                                className="bg-blue-50 hover:bg-blue-500 text-blue-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                title="Bewerken"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Weet je zeker dat je deze installatie wilt verwijderen?')) {
                                    const currentList = data.allInstallations || [];
                                    onChange('allInstallations', currentList.filter((i: any) => i.id !== inst.id));
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                title="Verwijderen"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
);

// 2. Re-wrap categories with activeCategories check
const cats = [
  { name: 'Ventilatie', marker: '{/* 3.1 Ventilatie Card */}' },
  { name: 'Verwarming', marker: '{/* 3.2 Verwarming Card */}' },
  { name: 'Tapwater', marker: '{/* 3.3 Tapwater Card */}' },
  { name: 'Koeling', marker: '{/* 3.4 Koeling Card */}' },
  { name: 'Zonne-panelen', marker: '{/* 3.5 Zonne-panelen Card */}' }
];

for (const cat of cats) {
  // It starts with the marker and ends with </div> before the next marker or end of loop
  const regex = new RegExp(cat.marker.replace(/[\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*<div className="border border-outline-variant/10', 'g');
  data = data.replace(regex, cat.marker + '\\n                          {activeCategories.includes(\\'' + cat.name + '\\') && (\\n                          <div className="border border-outline-variant/10');
}

// We need to close the conditional bracket for each card.
// Each card ends with </div> followed by </div> and then maybe a comment for the next.
// We'll search for the enderInstallationMasonryGallery block which is at the end of each card.
data = data.replace(/renderInstallationMasonryGallery\([^)]+\)\}\s*<\/div>\s*<\/div>/g, (match) => {
  return match + '\\n                          )}';
});


fs.writeFileSync(file, data);
