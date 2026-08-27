import React, { useState, useEffect, useRef } from 'react';
import { AppModal } from './AppModal';
import { AppInputField } from '../ui/BackOfficeUI';
import { AppSelectWithOptions } from './AppSelect';
import { AppFlagPicker } from './AppFlagPicker';
import { KozijnRow, InspectionData } from '../../pages/backoffice/backofficeTypes';
import { useLanguage } from '../../context/LanguageContext';
import { Camera, Trash2 } from 'lucide-react';
import { GlobalPhotoSelectorModal } from './GlobalPhotoSelectorModal';

const LocalSelect: React.FC<any> = (props) => {
  return <AppSelectWithOptions {...props} placeholder={undefined} />;
};

interface KozijnEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: KozijnRow) => void;
  initialRow: KozijnRow | null;
  data?: InspectionData;
  flagKey?: string;
  onFlagChange?: (key: string, val: 'red' | 'yellow' | 'green' | null) => void;
  onFieldEdit?: (key: string) => void;
  onChangeData?: (path: string, val: any) => void;
}

export const KozijnEditModal: React.FC<KozijnEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRow,
  data,
  flagKey,
  onFlagChange,
  onChangeData,
  onFieldEdit
}) => {
  const { t } = useLanguage();
  const [editingRow, setEditingRow] = useState<KozijnRow & { photos?: string[], photoUrl?: string } | null>(null);

  const updateField = (updates: Partial<KozijnRow & { photos?: string[], photoUrl?: string }>) => {
    if (!editingRow) return;
    setEditingRow({ ...editingRow, ...updates });
    if (flagKey && onFieldEdit) {
      onFieldEdit(flagKey);
    }
  };
  const [isGevelDropdownOpen, setIsGevelDropdownOpen] = useState(false);
  const [globalPhotoModalOpen, setGlobalPhotoModalOpen] = useState(false);
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGevelDropdownOpen(false);
      }
    };
    if (isGevelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGevelDropdownOpen]);

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
        title="EDIT FRAME & GLASS"
        saveLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.name')}</label>
              <AppInputField
                type="text"
                value={editingRow.naam || ''}
                onChange={(e) => updateField({ naam: e.target.value  })}
                placeholder="Bijv. W1, Deur voor..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Locatie (Gevel)</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsGevelDropdownOpen(!isGevelDropdownOpen)}
                  className="w-full bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary border-none text-left flex justify-between items-center transition-all font-semibold"
                >
                  <span className="truncate text-on-surface-variant/90 font-medium">
                    {editingRow.gevel || 'Selecteer gevels...'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-on-surface-variant/50 transition-transform ${isGevelDropdownOpen ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                {isGevelDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/10 shadow-lg rounded-xl max-h-48 overflow-y-auto z-[60] p-2 space-y-1">
                    {(() => {
                      const gevels = (data?.bouwkundigRows || []).filter((r: any) => r.type === 'Gevel' || r.type === 'Dak');
                      if (gevels.length === 0) {
                        return <span className="text-[9px] text-on-surface-variant/40 italic block text-center py-1">Geen gevels of daken gedefinieerd.</span>;
                      }
                      
                      const selectedGevels = (editingRow.gevel || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

                      return gevels.map((g: any, i: number) => {
                        const gName = (g.naam || `${g.type} ${i + 1}`).trim();
                        const isSelected = selectedGevels.includes(gName.toLowerCase());
                        return (
                          <label key={i} className="flex items-start gap-2 text-xs font-bold text-on-surface-variant/80 cursor-pointer p-1.5 rounded hover:bg-gray-50 transition-colors w-full">
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                              checked={isSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                let currentGevels = (editingRow.gevel || '').split(',').map(s => s.trim()).filter(Boolean);
                                if (checked) {
                                  if (!currentGevels.some(cg => cg.toLowerCase() === gName.toLowerCase())) {
                                    currentGevels.push(gName);
                                  }
                                } else {
                                  currentGevels = currentGevels.filter(cg => cg.toLowerCase() !== gName.toLowerCase());
                                }
                                updateField({ gevel: currentGevels.join(', ')  });
                              }}
                            />
                            <span className="text-on-background text-[11px] leading-tight select-none">{gName}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Breedte (m)</label>
              <AppInputField
                type="number"
                step="0.01"
                value={editingRow.width || ''}
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 0;
                  const h = parseFloat(editingRow.height || '0') || 0;
                  updateField({ width: e.target.value, area: w > 0 && h > 0 ? (w * h).toFixed(2) : editingRow.area  });
                }}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Hoogte (m)</label>
              <AppInputField
                type="number"
                step="0.01"
                value={editingRow.height || ''}
                onChange={(e) => {
                  const h = parseFloat(e.target.value) || 0;
                  const w = parseFloat(editingRow.width || '0') || 0;
                  updateField({ height: e.target.value, area: w > 0 && h > 0 ? (w * h).toFixed(2) : editingRow.area  });
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Area (mÂ²)</label>
            <AppInputField
              type="number"
              step="0.01"
              value={editingRow.area || ''}
              onChange={(e) => updateField({ area: e.target.value  })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Constructie</label>
            <LocalSelect
              value={editingRow.constructieId || ''}
              onChange={(e: any) => updateField({ constructieId: e.target.value  })}
            >
              <option value="">- Selecteer Constructie -</option>
              {(data?.constructies || []).filter(c => ['Raam', 'Deur', 'Paneel'].includes(c.type)).map(c => (
                <option key={c.id} value={c.id}>{c.naam || c.id}</option>
              ))}
            </LocalSelect>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.flagStatus') || 'FLAG / STATUS'}</label>
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
                              updateField({ photos: next,
                                photoUrl: next[0] || undefined
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
          categoryName={editingRow.naam || 'Kozijn'}
          onClose={() => setGlobalPhotoModalOpen(false)}
          data={data}
          initialPhotoUrls={[...(editingRow.photos || []), ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])].filter((p, i, arr) => p && arr.indexOf(p) === i)}
          onSelect={(dataUrls) => {
            const newPhotos = dataUrls || [];
            updateField({ photos: newPhotos,
              photoUrl: newPhotos.length > 0 ? newPhotos[0] : ''
             });
          }}
          onUpload={handleGlobalUploadAction}
        />
      )}
    </>
  );
};

