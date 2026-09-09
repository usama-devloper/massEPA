import React, { useState, useRef, useEffect } from 'react';
import { AppModal } from './AppModal';
import { AppInputField } from '../ui/BackOfficeUI';
import { AppSelectWithOptions } from './AppSelect';
import { AppFlagPicker } from './AppFlagPicker';
import { ConstructionRow, InspectionData } from '../../pages/backoffice/backofficeTypes';
import { useLanguage } from '../../context/LanguageContext';
import { Camera, Trash2 } from 'lucide-react';
import { GlobalPhotoSelectorModal } from './GlobalPhotoSelectorModal';

const LocalSelect: React.FC<any> = (props) => {
  return <AppSelectWithOptions {...props} placeholder={undefined} />;
};

export const getCalculatedUValue = (row: ConstructionRow) => {
  if (row.type === 'Deur') {
    if (row.glas?.includes('super')) return '1.00';
    if (row.glas?.includes('geÃ¯soleerd')) return '2.00';
    return '3.40';
  }
  if (row.type === 'Paneel') {
    if (row.isolatie === 'Nee') return '3.40';
    if (row.isolatie === 'Onbekend') return '2.00';
    return '1.20';
  }
  const glassVal = parseFloat(row.uGren || '') || 2.0;
  let frameU = 2.4;
  if (row.kozijn === 'Hout') frameU = 1.8;
  else if (row.kozijn === 'Kunststof') frameU = 1.5;
  else if (row.kozijn?.includes('niet thermisch')) frameU = 3.8;
  return ((glassVal + frameU) / 2).toFixed(2);
};

export const getCalculatedRcValue = (row: ConstructionRow) => {
  if (row.isolatie === 'Nee') return '0.24';
  if (row.isolatie === 'Onbekend') return '0.40';
  const d = parseInt(row.dikte || '') || 0;
  if (d === 0) return '2.50';
  const lambda = 0.035;
  const rInsulation = (d / 1000) / lambda;
  return (rInsulation + 0.24).toFixed(2);
};

interface ConstructieEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: ConstructionRow) => void;
  initialRow?: ConstructionRow | null;
  existingConstructies?: ConstructionRow[];
  data?: InspectionData;
  flagKey?: string;
  onFlagChange?: (key: string, val: 'red' | 'yellow' | 'green' | null) => void;
  onFieldEdit?: (key: string) => void;
  onChangeData?: (path: string, val: any) => void;
}

export const ConstructieEditModal: React.FC<ConstructieEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRow,
  existingConstructies = [],
  data,
  flagKey,
  onFlagChange,
  onChangeData,
  onFieldEdit
}) => {
  const { t } = useLanguage();
  

  const [editingRow, setEditingRow] = useState<ConstructionRow | null>(null);

  const updateField = (updates: Partial<ConstructionRow>) => {
    if (!editingRow) return;
    setEditingRow({ ...editingRow, ...updates });
    if (flagKey && onFieldEdit) {
      onFieldEdit(flagKey);
    }
  };
  
  const [globalPhotoModalOpen, setGlobalPhotoModalOpen] = useState(false);
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialRow) {
      setEditingRow({ ...initialRow });
    } else {
      setEditingRow(null);
    }
  }, [isOpen, initialRow]);

  const handleGlobalUploadAction = (capture: boolean) => {
    if (globalFileInputRef.current) {
      if (capture) {
        globalFileInputRef.current.setAttribute('capture', 'environment');
      } else {
        globalFileInputRef.current.removeAttribute('capture');
      }
      globalFileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingRow) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        
        updateField({ photos: [...(editingRow.photos || []), dataUrl].filter((p, i, arr) => arr.indexOf(p) === i),
          photoUrl: dataUrl
         });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    if (globalFileInputRef.current) {
      globalFileInputRef.current.value = '';
    }
  };

  const handleSaveClick = () => {
    if (editingRow) {
      let finalRow = { ...editingRow };
      onSave(finalRow);
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'Deur': return t('structural.door');
      case 'Raam': return t('structural.window');
      case 'Paneel': return t('structural.panel');
      case 'Gevel': return t('structural.facade');
      case 'Vloer': return t('structural.floor');
      case 'Dak': return t('structural.roof');
      default: return tab;
    }
  };

  if (!isOpen || !editingRow) return null;

  return (
    <>
      <input
        type="file"
        ref={globalFileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSaveClick}
        title={existingConstructies.some(r => r.id === editingRow.id)
          ? t('structural.editTitle', { type: getTabLabel(editingRow.type) })
          : t('structural.newTitle', { type: getTabLabel(editingRow.type) })}
        saveLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.name')}</label>
            <AppInputField
              type="text"
              value={editingRow.naam || ''}
              onChange={(e) => updateField({ naam: e.target.value  })}
              placeholder="Bijv. Voordeur, Achterdeur..."
            />
          </div>

          {editingRow.type === 'Dak' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.type')}</label>
              <LocalSelect
                value={editingRow.dakType || 'Hellend dak'}
                onChange={(e: any) => updateField({ dakType: e.target.value  })}
              >
                <option value="Hellend dak">Hellend dak</option>
                <option value="Plat dak">Plat dak</option>
              </LocalSelect>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.input')}</label>
            <LocalSelect
              value={editingRow.invoer || 'Beslisschema'}
              onChange={(e: any) => updateField({ invoer: e.target.value  })}
            >
              <option value="Beslisschema">{t('structural.decisionTree')}</option>
              <option value="Kwaliteitsverklaring">{t('structural.qualityDeclaration')}</option>
            </LocalSelect>
          </div>

          {editingRow.invoer === 'Kwaliteitsverklaring' && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.brandAndType')}</label>
              <AppInputField
                type="text"
                value={editingRow.merk || ''}
                onChange={(e) => updateField({ merk: e.target.value  })}
                placeholder="Voer merk & type in..."
              />
            </div>
          )}

          {(editingRow.type === 'Raam' || editingRow.type === 'Paneel') && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">frameType</label>
              <LocalSelect
                value={editingRow.kozijn || 'Hout'}
                onChange={(e: any) => updateField({ kozijn: e.target.value  })}
              >
                <option value="Hout">Hout</option>
                <option value="Kunststof">Kunststof</option>
                <option value="Metaal thermisch onderbroken">Metaal thermisch onderbroken</option>
                <option value="Metaal niet thermisch onderbroken">Metaal niet thermisch onderbroken</option>
              </LocalSelect>
            </div>
          )}

          {editingRow.type === 'Raam' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">glassType</label>
              <LocalSelect
                value={editingRow.glas || 'Enkel glas'}
                onChange={(e: any) => updateField({ glas: e.target.value  })}
              >
                <option value="Enkel glas">Enkel glas (U = 5.20, g = 0.85)</option>
                <option value="Dubbel glas">Dubbel glas (U = 3.00, g = 0.75)</option>
                <option value="HR glas">HR glas (U = 2.00, g = 0.70)</option>
                <option value="HR+ glas">HR+ glas (U = 1.60, g = 0.65)</option>
                <option value="HR++ glas">HR++ glas (U = 1.20, g = 0.60)</option>
                <option value="Triple (HR+++) glas">Triple (HR+++) glas (U = 0.80, g = 0.50)</option>
              </LocalSelect>
            </div>
          )}

          {editingRow.type === 'Raam' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 mb-1">{t('structural.uNotAdjacent')}</label>
                <AppInputField
                  type="text"
                  className="py-1.5 text-xs font-mono font-bold"
                  value={editingRow.uNiet || ''}
                  onChange={(e) => updateField({ uNiet: e.target.value  })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 mb-1">{t('structural.uAdjacent')}</label>
                <AppInputField
                  type="text"
                  className="py-1.5 text-xs font-mono font-bold"
                  value={editingRow.uGren || ''}
                  onChange={(e) => updateField({ uGren: e.target.value  })}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 mb-1">{t('structural.gValue')}</label>
                <AppInputField
                  type="text"
                  className="py-1.5 text-xs font-mono font-bold"
                  value={editingRow.g || ''}
                  onChange={(e) => updateField({ g: e.target.value  })}
                />
              </div>
            </div>
          )}

          {editingRow.type !== 'Raam' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Insulation present</label>
              <LocalSelect
                value={editingRow.isolatie || 'Nee'}
                onChange={(e: any) => updateField({ isolatie: e.target.value  })}
              >
                <option value="Ja">Ja</option>
                <option value="Nee">Nee</option>
                <option value="Onbekend">Onbekend</option>
              </LocalSelect>
            </div>
          )}

          {editingRow.isolatie === 'Ja' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.thickness')}</label>
              <AppInputField
                type="number"
                value={editingRow.dikte || ''}
                onChange={(e) => updateField({ dikte: e.target.value  })}
                placeholder={t('structural.thicknessPlaceholder')}
              />
            </div>
          )}

          {editingRow.type !== 'Deur' && editingRow.type !== 'Raam' && editingRow.type !== 'Paneel' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.yearBuilt')}</label>
              <AppInputField
                type="text"
                value={editingRow.bouwjaar || ''}
                onChange={(e) => updateField({ bouwjaar: e.target.value  })}
                placeholder={t('structural.yearBuiltPlaceholder')}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1">{t('structural.flagStatus')}</label>
            <div className="flex items-center gap-1.5 mt-1 ml-0.5">
              <span className="text-[9px] font-black text-neutral-500 tracking-wider leading-none">
                SYS
              </span>
              <AppFlagPicker
              value={editingRow.flag}
              onChange={(val) => {
                updateField({ flag: val || undefined  });
                if (flagKey && onFlagChange) {
                  onFlagChange(flagKey, val || null);
                }
              }}
            />
          </div>
        </div>


          {(editingRow.type === 'Deur' || editingRow.type === 'Raam' || editingRow.type === 'Paneel') && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.uValue')}</label>
              <AppInputField
                type="number"
                step="0.01"
                className="font-mono font-bold text-center"
                value={editingRow.uWaarde || ''}
                onChange={(e) => updateField({ uWaarde: e.target.value  })}
                placeholder={editingRow.invoer === 'Beslisschema' ? getCalculatedUValue(editingRow) : "Bijv. 1.6"}
              />
            </div>
          )}

          {editingRow.type !== 'Deur' && editingRow.type !== 'Raam' && editingRow.type !== 'Paneel' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.rcValue')}</label>
              <AppInputField
                type="number"
                step="0.01"
                className="font-mono font-bold text-center"
                value={editingRow.rc || ''}
                onChange={(e) => updateField({ rc: e.target.value  })}
                placeholder={editingRow.invoer === 'Beslisschema' ? getCalculatedRcValue(editingRow) : "Bijv. 2.5"}
              />
            </div>
          )}

          <div>
            {(() => {
              const allPhotos = [
                ...(editingRow.photos || []),
                ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])
              ].filter((p, i, arr) => arr.indexOf(p) === i);

              return (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">
                      {t('structural.photo')} {allPhotos.length > 0 ? `(${allPhotos.length})` : ''}
                    </label>
                    <div>
                      <button
                        type="button"
                        className="flex items-center gap-1 px-2.5 py-1 bg-white border border-outline-variant/15 hover:border-primary/40 hover:bg-primary/5 text-on-surface-variant/70 hover:text-primary text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                        onClick={() => setGlobalPhotoModalOpen(true)}
                      >
                        <Camera size={11} />
                        {t('structural.addPhoto')}
                      </button>
                    </div>
                  </div>

                  {allPhotos.length === 0 ? (
                    <div
                      className="border border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                      onClick={() => setGlobalPhotoModalOpen(true)}
                    >
                      <Camera size={22} className="text-on-surface-variant/30 mb-2" />
                      <p className="text-[10px] text-on-surface-variant/50 font-medium">Klik om foto's toe te voegen</p>
                      <p className="text-[9px] text-on-surface-variant/35 mt-0.5">Meerdere foto's tegelijk selecteren mogelijk</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {allPhotos.map((url, idx) => (
                        <div key={idx} className="relative group/photo rounded-lg overflow-hidden border border-outline-variant/10 aspect-square">
                          <img
                            src={url}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = allPhotos.filter((_, i) => i !== idx);
                              updateField({
                                photos: next,
                                photoUrl: next[0] || undefined,
                                photoTag: next.length > 0 ? `[${editingRow.type}] ${editingRow.naam}` : undefined
                              });
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-md opacity-100 lg:opacity-0 lg:group-hover/photo:opacity-100 transition-all cursor-pointer"
                            title="Verwijder foto"
                          >
                            <Trash2 size={10} />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/40 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </AppModal>
      {data && (
        <GlobalPhotoSelectorModal
          isOpen={globalPhotoModalOpen}
          categoryName={editingRow.naam || editingRow.type || 'Constructie'}
          onClose={() => setGlobalPhotoModalOpen(false)}
          data={data}
          initialPhotoUrls={[...(editingRow.photos || []), ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])].filter((p, i, arr) => p && arr.indexOf(p) === i)}
          onSelect={(dataUrls) => {
            const newPhotos = dataUrls || [];
            updateField({
              photos: newPhotos,
              photoUrl: newPhotos.length > 0 ? newPhotos[0] : '',
              photoTag: newPhotos.length > 0 ? `[${editingRow.type}] ${editingRow.naam}` : undefined
            });
          }}
          onUpload={handleGlobalUploadAction}
        />
      )}
    </>
  );
};

