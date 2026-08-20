import React, { useState, useRef, useEffect } from 'react';
import { AppModal } from './AppModal';
import { AppInputField } from '../ui/BackOfficeUI';
import { AppSelectWithOptions } from './AppSelect';
import { AppFlagPicker } from './AppFlagPicker';
import { InspectionData } from '../../pages/backoffice/backofficeTypes';
import { useLanguage } from '../../context/LanguageContext';
import { Camera, Trash2 } from 'lucide-react';
import { GlobalPhotoSelectorModal } from './GlobalPhotoSelectorModal';

const LocalSelect: React.FC<any> = (props) => {
  return <AppSelectWithOptions {...props} placeholder={undefined} />;
};

export interface BouwkundigRow {
  id?: string;
  kozijnIds?: string[];
  constructieId?: string;
  type: string;
  kozijnArea?: string;
  gevel?: string;
  gevelIsolatie?: string;
  orientation?: string;
  grenstAan?: string;
  breedte?: string;
  hoogte?: string;
  oppervlakte?: string;
  hellingshoek?: string;
  kozijn?: string;
  naam?: string;
  invoer?: string;
  rc?: string;
  perimeter?: string;
  photos?: string[];
  photoUrl?: string;
  photoTag?: string;
  flag?: 'red' | 'yellow' | 'green' | null;
}

interface BouwkundigEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: BouwkundigRow) => void;
  initialRow: BouwkundigRow | null;
  data?: InspectionData;
  onChangeData?: (path: string, value: any) => void;
  flagKey?: string;
  onFlagChange?: (key: string, val: 'red' | 'yellow' | 'green' | null) => void;
}

export const BouwkundigEditModal: React.FC<BouwkundigEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRow,
  data,
  onChangeData,
  flagKey,
  onFlagChange
}) => {
  const { t } = useLanguage();
  const [editingRow, setEditingRow] = useState<BouwkundigRow | null>(null);
  
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
        
        setEditingRow({
          ...editingRow,
          photos: [...(editingRow.photos || []), dataUrl].filter((p, i, arr) => arr.indexOf(p) === i),
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
      onSave(editingRow);
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
        title={initialRow?.naam || `Nieuwe ${editingRow.type}`}
        saveLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Naam</label>
            <AppInputField
              type="text"
              value={editingRow.naam || ''}
              onChange={(e) => setEditingRow({ ...editingRow, naam: e.target.value })}
              placeholder="Bijv. Voorgevel, Begane Grondvloer..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Constructie</label>
            <LocalSelect
              value={editingRow.constructieId || ''}
              onChange={(e: any) => setEditingRow({ ...editingRow, constructieId: e.target.value })}
            >
              <option value="">- Selecteer Constructie -</option>
              {(data?.constructies || []).filter(c => c.type === editingRow.type).map(c => (
                <option key={c.id} value={c.id}>{c.naam || c.id}</option>
              ))}
            </LocalSelect>
          </div>

          {editingRow.type === 'Gevel' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Gevel type</label>
              <LocalSelect
                value={editingRow.gevel || '-'}
                onChange={(e: any) => setEditingRow({ ...editingRow, gevel: e.target.value })}
              >
                <option value="Voorgevel">Voorgevel</option>
                <option value="Achtergevel">Achtergevel</option>
                <option value="Linkergevel">Linkergevel</option>
                <option value="Rechtergevel">Rechtergevel</option>
                <option value="Aangepaste Gevel">Aangepaste Gevel</option>
                <option value="-">-</option>
              </LocalSelect>
            </div>
          )}

          {(editingRow.type === 'Gevel' || editingRow.type === 'Dak') && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Orientation</label>
              <LocalSelect
                value={editingRow.orientation || '-'}
                onChange={(e: any) => setEditingRow({ ...editingRow, orientation: e.target.value })}
              >
                {['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW', 'Horizontaal', '-'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </LocalSelect>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Grenst aan</label>
            <LocalSelect
              value={editingRow.grenstAan || '-'}
              onChange={(e: any) => setEditingRow({ ...editingRow, grenstAan: e.target.value })}
            >
              {(() => {
                let grenstOptions = ['Buitenlucht'];
                if (editingRow.type === 'Gevel') grenstOptions = ['Buitenlucht', 'Andere woning', 'Onverwarmde ruimte', 'Grond'];
                else if (editingRow.type === 'Vloer') grenstOptions = ['Kruipruimte', 'Grond', 'Buitenlucht', 'Onverwarmde kelder'];
                else if (editingRow.type === 'Dak') grenstOptions = ['Buitenlucht', 'Onverwarmde ruimte', 'Andere woning'];
                return [...grenstOptions, '-'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ));
              })()}
            </LocalSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Breedte (m)</label>
              <AppInputField
                type="text"
                value={editingRow.breedte || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const w = parseFloat(val.replace(',', '.') || '0');
                  const h = parseFloat(editingRow.hoogte?.replace(',', '.') || '0');
                  setEditingRow({ 
                    ...editingRow, 
                    breedte: val,
                    oppervlakte: (w > 0 && h > 0) ? (w * h).toFixed(2) : editingRow.oppervlakte
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Hoogte (m)</label>
              <AppInputField
                type="text"
                value={editingRow.hoogte || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const h = parseFloat(val.replace(',', '.') || '0');
                  const w = parseFloat(editingRow.breedte?.replace(',', '.') || '0');
                  setEditingRow({ 
                    ...editingRow, 
                    hoogte: val,
                    oppervlakte: (w > 0 && h > 0) ? (w * h).toFixed(2) : editingRow.oppervlakte
                  });
                }}
              />
            </div>
          </div>

          {editingRow.type === 'Vloer' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Perimeter (m)</label>
                <AppInputField
                  type="text"
                  value={editingRow.perimeter || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, perimeter: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Rc Waarde</label>
                <div className="px-3 py-2 bg-gray-50 border border-outline-variant/10 rounded-xl text-xs font-mono font-bold text-on-surface-variant/60">
                  {editingRow.rc || (data?.constructies || []).find((c: any) => c.id === editingRow.constructieId)?.rc || '-'}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Oppervlakte (m²)</label>
            <AppInputField
              type="text"
              className="font-mono font-bold"
              value={editingRow.oppervlakte || ''}
              onChange={(e) => setEditingRow({ ...editingRow, oppervlakte: e.target.value })}
            />
          </div>

          {editingRow.type === 'Dak' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Hellingshoek</label>
              <AppInputField
                type="text"
                value={editingRow.hellingshoek || ''}
                onChange={(e) => setEditingRow({ ...editingRow, hellingshoek: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Vlag / Status</label>
            <AppFlagPicker
              value={editingRow.flag}
              onChange={(val) => {
                setEditingRow({ ...editingRow, flag: val || undefined });
                if (flagKey && onFlagChange) {
                  onFlagChange(flagKey, val || null);
                }
              }}
            />
          </div>

          {editingRow.type !== 'Vloer' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Kozijn Koppelingen (Frame & Glass)</label>
              <div className="border border-outline-variant/10 rounded-xl p-2 bg-gray-50 max-h-40 overflow-y-auto space-y-1">
                {(!data?.kozijnen || data.kozijnen.length === 0) ? (
                  <span className="text-[9px] text-on-surface-variant/40 italic block text-center py-1">Geen kozijnen beschikbaar.</span>
                ) : (
                  data.kozijnen.map((k: any) => {
                    const linkedTo = k.gevel ? k.gevel.split(',').map((s: string) => s.trim().toLowerCase()) : [];
                    const targets = [editingRow.naam, editingRow.gevel, initialRow?.id].filter(Boolean).map((s: string) => s!.toString().trim().toLowerCase());
                    const isLinked = Boolean(targets.some(t => linkedTo.includes(t)));
                    
                    return (
                      <label key={k.id} className="flex items-start gap-2 text-xs font-bold text-on-surface-variant/80 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-3 h-3 cursor-pointer"
                          checked={isLinked}
                          onChange={(e) => {
                            if (!onChangeData) return;
                            const checked = e.target.checked;
                            const list = data.kozijnen || [];
                            const target = editingRow.naam || editingRow.gevel || initialRow?.id;
                            if (!target) return;
                            const updated = list.map((kz: any) => {
                              if (kz.id === k.id) {
                                let currentGevels = kz.gevel ? kz.gevel.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                                if (checked) {
                                  if (!currentGevels.some((g: string) => g.toLowerCase() === target.toLowerCase())) {
                                    currentGevels.push(target);
                                  }
                                } else {
                                  currentGevels = currentGevels.filter((g: string) => !targets.includes(g.toLowerCase()));
                                }
                                return { ...kz, gevel: currentGevels.join(', ') };
                              }
                              return kz;
                            });
                            onChangeData('kozijnen', updated);
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-on-background text-[10px] leading-tight">{k.naam}</span>
                          <span className="text-[9px] text-on-surface-variant/50 font-semibold leading-tight">{k.width} m x {k.height} m (Area: {k.area} m²)</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
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
                        Voeg foto toe
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
                              setEditingRow({
                                ...editingRow,
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
          categoryName={editingRow.naam || editingRow.type || 'Bouwkundig'}
          onClose={() => setGlobalPhotoModalOpen(false)}
          data={data}
          initialPhotoUrls={[...(editingRow.photos || []), ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])].filter((p, i, arr) => p && arr.indexOf(p) === i)}
          onSelect={(dataUrls) => {
            const newPhotos = dataUrls || [];
            setEditingRow({
              ...editingRow,
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
