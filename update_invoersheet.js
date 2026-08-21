const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/backoffice/InvoersheetView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add activeCategories definition
content = content.replace(
  "const ventSysteemVal = instDetails.ventVentilatiesysteem || '';",
  "const activeCategories = inst.activeCategories || ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen'];\n                    const ventSysteemVal = instDetails.ventVentilatiesysteem || '';"
);

// 2. Add Edit/Delete to each category header and wrap in activeCategories.includes()
const categoriesToReplace = [
  { name: 'Ventilatie', icon: '<Wind size={14} />', startMarker: '{/* 3.1 Ventilatie Card */}', endMarker: '<div className="flex flex-col gap-6 mt-6">' },
  { name: 'Verwarming', icon: '<Flame size={14} />', startMarker: '{/* 3.2 Verwarming Card */}', endMarker: '{/* 3.3 Tapwater Card */}' },
  { name: 'Tapwater', icon: '<Droplet size={14} />', startMarker: '{/* 3.3 Tapwater Card */}', endMarker: '{/* 3.4 Koeling Card */}' },
  { name: 'Koeling', icon: '<Snowflake size={14} />', startMarker: '{/* 3.4 Koeling Card */}', endMarker: '{/* 3.5 Zonne-panelen Card */}' },
  { name: 'Zonne-panelen', icon: '<Sun size={14} />', startMarker: '{/* 3.5 Zonne-panelen Card */}', endMarker: '</div>\n                      </div>\n                    );\n                  })}' }
];

for (const cat of categoriesToReplace) {
  const iconRegex = cat.icon.replace(/[\/\(\)\<\>]/g, '\\$&');
  
  // Replace the h3
  const searchRegex = new RegExp(`<h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1\\.5 w-full uppercase tracking-wider font-sans">\\s*<span className="flex items-center gap-1\\.5">${iconRegex} ${cat.name}</span>\\s*</h3>`, 'g');
  
  const replaceStr = `<h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans group">
                                <span className="flex items-center gap-1.5">${cat.icon} ${cat.name}</span>
                                <div className="flex items-center gap-1.5 no-print">
                                  <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', '${cat.name}'); if (onViewChange) onViewChange('installatie'); }} className="p-1.5 hover:bg-blue-50 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer" title="Bewerken"><Pencil size={13} /></button>
                                  <button type="button" onClick={() => { if (window.confirm('Weet je zeker dat je deze categorie wilt verwijderen?')) { onChange('allInstallations', (data.allInstallations || []).map((i: any) => i.id === inst.id ? { ...i, activeCategories: (i.activeCategories || []).filter((c: string) => c !== '${cat.name}') } : i)); } }} className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Verwijderen"><Trash2 size={13} /></button>
                                </div>
                              </h3>`;
                              
  content = content.replace(searchRegex, replaceStr);

  // Wrap the card
  if (cat.name === 'Ventilatie') {
    content = content.replace(
      /(\{\/\* 3\.1 Ventilatie Card \*\/\}\n\s*)(<div className="border border-outline-variant[\s\S]*?)(<div className="flex flex-col gap-6 mt-6">)/,
      "$1{activeCategories.includes('Ventilatie') && (\n$2)}\n                        $3"
    );
  } else if (cat.name === 'Verwarming') {
    content = content.replace(
      /(\{\/\* 3\.2 Verwarming Card \*\/\}\n\s*)(<div className="border border-outline-variant[\s\S]*?)(?=\{\/\* 3\.3 Tapwater Card \*\/})/,
      "$1{activeCategories.includes('Verwarming') && (\n$2)}\n\n                          "
    );
  } else if (cat.name === 'Tapwater') {
    content = content.replace(
      /(\{\/\* 3\.3 Tapwater Card \*\/\}\n\s*)(<div className="border border-outline-variant[\s\S]*?)(?=\{\/\* 3\.4 Koeling Card \*\/})/,
      "$1{activeCategories.includes('Tapwater') && (\n$2)}\n\n                          "
    );
  } else if (cat.name === 'Koeling') {
    content = content.replace(
      /(\{\/\* 3\.4 Koeling Card \*\/\}\n\s*)(<div className="border border-outline-variant[\s\S]*?)(?=\{\/\* 3\.5 Zonne-panelen Card \*\/})/,
      "$1{activeCategories.includes('Koeling') && (\n$2)}\n\n                          "
    );
  } else if (cat.name === 'Zonne-panelen') {
    content = content.replace(
      /(\{\/\* 3\.5 Zonne-panelen Card \*\/\}\n\s*)(<div className="border border-outline-variant[\s\S]*?<\/div>\s*<\/div>\s*)(<\/div>\s*<\/div>\s*\);\s*\}\)})/,
      "$1{activeCategories.includes('Zonne-panelen') && (\n$2)}\n$3"
    );
  }
}

// 3. Add 'Add System' button and 'Add New Installation' button
content = content.replace(
  /<\/div>\s*<\/div>\s*\);\s*\}\)}\s*<\/div>\s*\);\s*\}\)\(\)\}/g,
  `                          {(() => {
                            const availableCats = ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen'].filter(c => !activeCategories.includes(c));
                            if (availableCats.length === 0) return null;
                            return (
                              <div className="relative group/addmenu mt-1 no-print flex justify-start pb-4 pl-6">
                                <button
                                  type="button"
                                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                                >
                                  <Plus size={14} className="stroke-[3]" /> Add System
                                </button>
                                <div className="absolute left-6 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden opacity-0 invisible group-hover/addmenu:opacity-100 group-hover/addmenu:visible group-focus-within/addmenu:opacity-100 group-focus-within/addmenu:visible transition-all z-[100]">
                                  {availableCats.map((cat) => (
                                    <button
                                      key={cat}
                                      onClick={() => {
                                        const newList = (data.allInstallations || []).map((i: any) => i.id === inst.id ? { ...i, activeCategories: [...(i.activeCategories || []), cat] } : i);
                                        onChange('allInstallations', newList);
                                      }}
                                      className="w-full text-left px-4 py-3 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-outline-variant/5 last:border-0"
                                    >
                                      + {cat}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 flex justify-center no-print">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = \`inst_\${Date.now()}\_\${Math.random().toString(36).substr(2, 9)}\`;
                      const currentList = data.allInstallations || [];
                      onChange('allInstallations', [...currentList, { id: newId, activeCategories: [] }]);
                    }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-wider rounded-2xl hover:bg-primary/90 transition-all cursor-pointer shadow-sm hover:shadow-md font-sans"
                  >
                    <Plus size={16} className="stroke-[3]" />
                    Add New Installation
                  </button>
                </div>
              );
            })()}`
);

fs.writeFileSync(filePath, content);
console.log("Done");
