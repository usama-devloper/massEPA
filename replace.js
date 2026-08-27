const fs = require('fs');
const filePath = 'c:/mEPA/massEPA/src/pages/backoffice/InvoersheetView.tsx';

let content = fs.readFileSync(filePath, 'utf8');

const rep1 =   const [categoryToDelete, setCategoryToDelete] = useState<{ instId: string; cat: string } | null>(null);
  const [installationToDelete, setInstallationToDelete] = useState<string | null>(null);;
const new_rep1 =   const [categoryToDelete, setCategoryToDelete] = useState<{ instId: string; cat: string } | null>(null);
  const [installationToDelete, setInstallationToDelete] = useState<string | null>(null);
  const [constructieToDelete, setConstructieToDelete] = useState<string | null>(null);
  const [bouwkundigToDelete, setBouwkundigToDelete] = useState<number | null>(null);
  const [kozijnToDelete, setKozijnToDelete] = useState<string | null>(null);;
content = content.replace(rep1, new_rep1);

const rep2 =                                               onClick={() => {
                                                if (window.confirm('Weet je zeker dat je deze constructie wilt verwijderen?')) {
                                                  onChange('constructies', (data.constructies || []).filter((c: any) => c.id !== item.id));
                                                }
                                              }};
const new_rep2 =                                               onClick={() => {
                                                setConstructieToDelete(item.id);
                                              }};
content = content.replace(rep2, new_rep2);

const rep3 =                                               onClick={() => {
                                                if (window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                                                  const newRows = [...allBouwkundig];
                                                  newRows.splice(originalIdx, 1);
                                                  onChange('bouwkundigRows', newRows);
                                                }
                                              }};
const new_rep3 =                                               onClick={() => {
                                                setBouwkundigToDelete(originalIdx);
                                              }};
content = content.replace(rep3, new_rep3);

const rep4 =                                                           onClick={() => {
                                                            if (window.confirm('Weet je zeker dat je dit kozijn wilt verwijderen?')) {
                                                              onChange('kozijnen', (data.kozijnen || []).filter((kz: any) => kz.id !== k.id));
                                                            }
                                                          }};
const new_rep4 =                                                           onClick={() => {
                                                            setKozijnToDelete(k.id);
                                                          }};
content = content.replace(rep4, new_rep4);

const rep5 =         title="Weet je het zeker?"
        message="Weet je zeker dat je deze gehele installatie wilt verwijderen?"
      />

      {showInstallatieModal && createPortal(;
const new_rep5 =         title="Weet je het zeker?"
        message="Weet je zeker dat je deze gehele installatie wilt verwijderen?"
      />
      <ConfirmModal
        isOpen={constructieToDelete !== null}
        onClose={() => setConstructieToDelete(null)}
        onConfirm={() => {
          if (constructieToDelete) {
            onChange('constructies', (data.constructies || []).filter((c: any) => c.id !== constructieToDelete));
          }
          setConstructieToDelete(null);
        }}
        title="Weet je het zeker?"
        message="Weet je zeker dat je deze constructie wilt verwijderen?"
      />
      <ConfirmModal
        isOpen={bouwkundigToDelete !== null}
        onClose={() => setBouwkundigToDelete(null)}
        onConfirm={() => {
          if (bouwkundigToDelete !== null) {
            const newRows = [...(data.bouwkundigRows || defaultBouwkundigRows)];
            newRows.splice(bouwkundigToDelete, 1);
            onChange('bouwkundigRows', newRows);
          }
          setBouwkundigToDelete(null);
        }}
        title="Weet je het zeker?"
        message="Weet je zeker dat je dit item wilt verwijderen?"
      />
      <ConfirmModal
        isOpen={kozijnToDelete !== null}
        onClose={() => setKozijnToDelete(null)}
        onConfirm={() => {
          if (kozijnToDelete) {
            onChange('kozijnen', (data.kozijnen || []).filter((kz: any) => kz.id !== kozijnToDelete));
          }
          setKozijnToDelete(null);
        }}
        title="Weet je het zeker?"
        message="Weet je zeker dat je dit kozijn wilt verwijderen?"
      />

      {showInstallatieModal && createPortal(;
content = content.replace(rep5, new_rep5);

fs.writeFileSync(filePath, content, 'utf8');
console.log('done');
