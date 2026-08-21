import sys

file = 'src/pages/backoffice/InvoersheetView.tsx'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix activeCategories
search1 = "                    const ventSysteemVal = instDetails.ventVentilatiesysteem || '';"
replace1 = "                    const activeCategories = inst.activeCategories || ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen'];\n" + search1
if search1 in content and "const activeCategories =" not in content:
    content = content.replace(search1, replace1)

# Add Edit/Delete
search2 = '''<div className="flex justify-between items-center pb-3 border-b border-neutral-200/85 print-header-keep">
                            <div className="flex items-center gap-2.5 font-sans">
                              <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                                Installatie #{index + 1}
                              </span>
                            </div>
                          </div>'''
replace2 = '''<div className="flex justify-between items-center pb-3 border-b border-neutral-200/85 print-header-keep">
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
                          </div>'''

if search2 in content:
    content = content.replace(search2, replace2)

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
