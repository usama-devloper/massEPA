/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CollapsibleSection, FieldGroup, AppInputField, AppTextAreaField } from '../../components/ui/BackOfficeUI';
import { InspectionData, ConstructionRow, KozijnRow as BaseKozijnRow } from './backofficeTypes';
import { Plus, Trash2, Camera, MapPin, Copy, Layers, Target, Droplets, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { useLanguage } from '../../context/LanguageContext';
import { AppSelect, AppSelectWithOptions } from '../../components/common/AppSelect';
import { GlobalPhotoSelectorModal } from '../../components/common/GlobalPhotoSelectorModal';
import { KozijnEditModal } from '../../components/common/KozijnEditModal';
import { PhotoViewerModal } from '../../components/common/PhotoViewerModal';
import { slidesFromUrls } from '../../utils/photoViewer';
import { AppFlagPicker } from '../../components/common/AppFlagPicker';
import { AppModal } from '../../components/common/AppModal';
import { ConstructieEditModal, getCalculatedUValue, getCalculatedRcValue } from '../../components/common/ConstructieEditModal';

// Extend the imported KozijnRow type to safely include custom dynamic properties
interface KozijnRow extends BaseKozijnRow {
  photos?: string[];
  photoUrl?: string;
}

const LocalSelect: React.FC<any> = (props) => {
  return <AppSelectWithOptions {...props} placeholder={undefined} />;
};

interface ConstructieViewProps {
  data: InspectionData;
  onChange: (rows: ConstructionRow[]) => void;
  allowedTypes?: ('Deur' | 'Raam' | 'Paneel' | 'Gevel' | 'Vloer' | 'Dak')[];
  title?: string;
}

const ConstructieView: React.FC<ConstructieViewProps> = ({ data, onChange, allowedTypes, title }) => {
  const { t, locale } = useLanguage();
  const tabs = allowedTypes || ['Deur', 'Raam', 'Paneel', 'Gevel', 'Vloer', 'Dak'];
  const [activeTab, setActiveTab] = useState<'Deur' | 'Raam' | 'Paneel' | 'Gevel' | 'Vloer' | 'Dak'>(() => {
    const saved = localStorage.getItem('constructie_active_tab');
    if (saved && (tabs as string[]).includes(saved)) {
      return saved as any;
    }
    return tabs[0];
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [editingRow, setEditingRow] = useState<ConstructionRow | null>(null);

  const [globalPhotoModalOpen, setGlobalPhotoModalOpen] = useState(false);
  const [globalUploadContext, setGlobalUploadContext] = useState<{ type: 'constructie' | 'kozijn', id: string, source: 'table' | 'modal' } | null>(null);
  const globalFileInputRef = useRef<HTMLInputElement>(null);

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
    if (!file || !globalUploadContext) return;
    
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
        
        const { id, source } = globalUploadContext;
        if (source === 'table') {
          onChange(allConstructies.map(r => r.id === id ? { ...r, photos: [...(r.photos || []), dataUrl].filter((p, i, arr) => arr.indexOf(p) === i), photoUrl: dataUrl } : r));
        } else if (source === 'modal' && editingRow && editingRow.id === id) {
          setEditingRow({
            ...editingRow,
            photos: [...(editingRow.photos || []), dataUrl].filter((p, i, arr) => arr.indexOf(p) === i),
            photoUrl: dataUrl
          });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    if (globalFileInputRef.current) {
      globalFileInputRef.current.value = '';
    }
  };

  const openLightbox = (photos: string[], index: number, title: string) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setSelectedPhoto(photos[index]);
    setLightboxTitle(title);
  };

  const allConstructies = data.constructies || [];
  const constructies = allConstructies.filter(c => tabs.includes(c.type));

  // Sync flags to localStorage for dashboard compatibility
  useEffect(() => {
    try {
      const constructieFlags: Record<string, string> = {};
      data.constructies?.forEach(c => {
        if (c.flag) {
          constructieFlags[c.id] = c.flag;
        }
      });
      localStorage.setItem(`constructie_flags_${data.clientId || 'default'}`, JSON.stringify(constructieFlags));
    } catch (e) {
      console.error(e);
    }
  }, [data.constructies, data.clientId]);

  useEffect(() => {
    localStorage.setItem('constructie_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const saved = localStorage.getItem('constructie_active_tab');
    if (saved && (tabs as string[]).includes(saved)) {
      setActiveTab(saved as any);
    } else {
      setActiveTab(tabs[0]);
    }
  }, [allowedTypes]);

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

  const handleAddRow = () => {
    const newId = `c-${Date.now()}`;
    const newRow: ConstructionRow = {
      id: newId,
      type: activeTab,
      naam: t('structural.newElementPlaceholder', { type: getTabLabel(activeTab).toLowerCase() }),
      locatie: 'voorgevel',
      invoer: 'Beslisschema',
      isolatie: 'Yes',
      area: '0.00',
      rc: '0.0',
      dakType: activeTab === 'Dak' ? 'Hellend dak' : undefined,
    };
    setEditingRow(newRow);
  };

  const handleSave = (finalRow: ConstructionRow) => {
    const exists = allConstructies.some(r => r.id === finalRow.id);
    if (exists) {
      onChange(allConstructies.map(r => r.id === finalRow.id ? finalRow : r));
    } else {
      onChange([...allConstructies, finalRow]);
    }
    setEditingRow(null);
  };

  const getUniqueCopyName = (originalName: string, existingNames: string[], suffixFormat?: string) => {
    if (!originalName) return '';
    const regex = new RegExp(`(.*)(?:\\s*(?:-|\\()\\s*(?:Kopie|Copy|kopie|copy)\\)?)\\s*(?:\\((\\d+)\\))?$`, 'i');

    let baseName = originalName;
    const match = originalName.match(regex);
    if (match) {
      baseName = match[1].trim().replace(/\s*\(\s*\)?$/, '').trim();
    }

    const defaultSuffix = ` ${t('structural.copySuffix') || 'Kopie'}`;
    const suffixBase = suffixFormat !== undefined ? suffixFormat : defaultSuffix;

    let index = 1;
    let nextName = `${baseName}${suffixBase}`;
    if (existingNames.includes(nextName)) {
      while (existingNames.includes(nextName)) {
        index++;
        nextName = `${baseName}${suffixBase} (${index})`;
      }
    }
    return nextName;
  };

  const handleCopyRow = (idx: number) => {
    const currentRows = constructies.filter(r => r.type === activeTab);
    const rowToCopy = currentRows[idx];
    const newId = `c-${Date.now()}`;
    const uniqueName = getUniqueCopyName(rowToCopy.naam, allConstructies.map(c => c.naam));
    onChange([...allConstructies, { ...rowToCopy, id: newId, naam: uniqueName }]);
  };

  const handleDeleteRow = (idx: number) => {
    const currentRows = constructies.filter(r => r.type === activeTab);
    const rowToDelete = currentRows[idx];
    onChange(allConstructies.filter(r => r.id !== rowToDelete.id));
  };

  const handleUpdateFlag = (row: ConstructionRow, val: 'red' | 'yellow' | 'green' | undefined) => {
    onChange(allConstructies.map(r => r.id === row.id ? { ...r, flag: val } : r));
  };

  const currentRows = constructies.filter(r => r.type === activeTab);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden h-full max-w-7xl">
      <input
        type="file"
        ref={globalFileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="pb-2 flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-black text-on-background tracking-tight">
          {title || t('structural.title')}
        </h1>
      </div>

      {tabs.length > 1 && (
        <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto flex-nowrap scrollbar-none border border-outline-variant/5">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${activeTab === tab
                ? 'bg-primary/10 text-primary font-black shadow-sm'
                : 'text-on-surface-variant/60 hover:bg-gray-250'
                }`}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2"></div>
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Plus size={14} /> {t('structural.newTitle', { type: getTabLabel(activeTab) })}
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <DataTable minWidth="1000px">
            <DataTable.Head className="sticky top-0 z-20">
              <DataTable.Row className="bg-gray-50 border-b border-outline-variant/10">
                <DataTable.HeaderCell className="bg-gray-50">{t('structural.name')}</DataTable.HeaderCell>
                {activeTab === 'Dak' && (
                  <DataTable.HeaderCell className="bg-gray-50">{t('structural.type')}</DataTable.HeaderCell>
                )}

                <DataTable.HeaderCell>{t('structural.input')}</DataTable.HeaderCell>

                {activeTab === 'Deur' && (
                  <>
                    <DataTable.HeaderCell>{t('structural.insulationPresent')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.brandAndType')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">Thickness (mm)</DataTable.HeaderCell>
                  </>
                )}

                {activeTab === 'Raam' && (
                  <>
                    <DataTable.HeaderCell>{t('structural.frame')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.glass')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.brandAndType')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">{t('structural.uNotAdjacent')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">{t('structural.uAdjacent')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">{t('structural.gValue')}</DataTable.HeaderCell>
                  </>
                )}

                {activeTab === 'Paneel' && (
                  <>
                    <DataTable.HeaderCell>{t('structural.insulationPresent')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.brandAndType')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">Thickness (mm)</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.frame')}</DataTable.HeaderCell>
                  </>
                )}

                {activeTab === 'Gevel' && (
                  <>
                    <DataTable.HeaderCell>{t('structural.insulationPresent')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.brandAndType')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">Thickness (mm)</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.yearBuilt')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">{t('structural.rcValue')}</DataTable.HeaderCell>
                  </>
                )}

                {activeTab === 'Vloer' && (
                  <>
                    <DataTable.HeaderCell>{t('structural.insulationPresent')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.brandAndType')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">Thickness (mm)</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.yearBuilt')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">{t('structural.rcValue')}</DataTable.HeaderCell>
                  </>
                )}

                {activeTab === 'Dak' && (
                  <>
                    <DataTable.HeaderCell>{t('structural.insulationPresent')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.brandAndType')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">Thickness (mm)</DataTable.HeaderCell>
                    <DataTable.HeaderCell>{t('structural.yearBuilt')}</DataTable.HeaderCell>
                    <DataTable.HeaderCell className="text-center">{t('structural.rcValue')}</DataTable.HeaderCell>
                  </>
                )}

                {(activeTab === 'Deur' || activeTab === 'Raam' || activeTab === 'Paneel') && (
                  <DataTable.HeaderCell className="text-center w-20">{t('structural.uValue')}</DataTable.HeaderCell>
                )}
                <DataTable.HeaderCell className="text-center w-20">{t('structural.photo')}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="text-center w-16">{t('structural.action')}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="text-center w-24">{t('structural.flagStatus')}</DataTable.HeaderCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {currentRows.map((row, idx) => (
                <DataTable.Row
                  key={row.id || idx}
                  className="cursor-pointer"
                  onClick={() => setEditingRow(row)}
                >
                  <DataTable.Cell>{row.naam || '-'}</DataTable.Cell>
                  {activeTab === 'Dak' && (
                    <DataTable.Cell>
                      {row.dakType === 'Plat dak' ? t('structural.flatRoof') : t('structural.slopedRoof')}
                    </DataTable.Cell>
                  )}

                  <DataTable.Cell>
                    {row.invoer === 'Kwaliteitsverklaring'
                      ? t('structural.qualityDeclaration')
                      : (row.invoer === 'Beslisschema' ? t('structural.decisionTree') : (row.invoer || '-'))}
                  </DataTable.Cell>

                  {activeTab === 'Deur' && (
                    <>
                      <DataTable.Cell>
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </DataTable.Cell>
                      <DataTable.Cell>{row.invoer === 'Beslisschema' ? '—' : (row.merk || '-')}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? (row.dikte || '-') : '-'}
                      </DataTable.Cell>
                    </>
                  )}

                  {activeTab === 'Raam' && (
                    <>
                      <DataTable.Cell>{row.kozijn || '-'}</DataTable.Cell>
                      <DataTable.Cell>{row.glas || '-'}</DataTable.Cell>
                      <DataTable.Cell>{row.invoer === 'Beslisschema' ? '—' : (row.merk || '-')}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.uNiet || '-'}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.uGren || '-'}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.g || '-'}</DataTable.Cell>
                    </>
                  )}

                  {activeTab === 'Paneel' && (
                    <>
                      <DataTable.Cell>
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </DataTable.Cell>
                      <DataTable.Cell>{row.invoer === 'Beslisschema' ? '—' : (row.merk || '-')}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.dikte || '-'}</DataTable.Cell>
                      <DataTable.Cell>{row.kozijn || '-'}</DataTable.Cell>
                    </>
                  )}

                  {activeTab === 'Gevel' && (
                    <>
                      <DataTable.Cell>
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </DataTable.Cell>
                      <DataTable.Cell>{row.invoer === 'Beslisschema' ? '—' : (row.merk || '-')}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.dikte || '-'}</DataTable.Cell>
                      <DataTable.Cell>{row.bouwjaar || '-'}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.rc || '-'}</DataTable.Cell>
                    </>
                  )}

                  {activeTab === 'Vloer' && (
                    <>
                      <DataTable.Cell>
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </DataTable.Cell>
                      <DataTable.Cell>{row.invoer === 'Beslisschema' ? '—' : (row.merk || '-')}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.dikte || '-'}</DataTable.Cell>
                      <DataTable.Cell>{row.bouwjaar || '-'}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.rc || '-'}</DataTable.Cell>
                    </>
                  )}

                  {activeTab === 'Dak' && (
                    <>
                      <DataTable.Cell>
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </DataTable.Cell>
                      <DataTable.Cell>{row.invoer === 'Beslisschema' ? '—' : (row.merk || '-')}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.dikte || '-'}</DataTable.Cell>
                      <DataTable.Cell>{row.bouwjaar || '-'}</DataTable.Cell>
                      <DataTable.Cell className="text-center font-mono">{row.rc || '-'}</DataTable.Cell>
                    </>
                  )}

                  {(activeTab === 'Deur' || activeTab === 'Raam' || activeTab === 'Paneel') && (
                    <DataTable.Cell className="text-center font-mono font-bold text-primary">
                      {row.uWaarde || '-'}
                    </DataTable.Cell>
                  )}

                  <DataTable.Cell className="text-center">
                    <div className="flex items-center justify-center">
                      {(() => {
                        const allPhotos = [
                          ...(row.photos || []),
                          ...(row.photoUrl ? [row.photoUrl] : [])
                        ].filter((p, i, arr) => arr.indexOf(p) === i);
                        if (allPhotos.length > 0) {
                          return (
                            <div
                              className="relative group/pic cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(allPhotos, 0, row.naam);
                              }}
                            >
                              <img
                                src={allPhotos[0]}
                                alt={row.naam}
                                className="w-10 h-8 object-cover rounded-md shadow-sm hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              {allPhotos.length > 1 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                  {allPhotos.length}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <button
                            type="button"
                            className="flex flex-col items-center justify-center gap-1 cursor-pointer group/upload h-8 bg-transparent border-none w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGlobalUploadContext({ type: 'constructie', id: row.id, source: 'table' });
                              setGlobalPhotoModalOpen(true);
                            }}
                          >
                            <Camera size={14} className="text-on-surface-variant/40 group-hover/upload:text-primary transition-colors" />
                            <span className="text-[8px] font-black uppercase text-on-surface-variant/40 group-hover/upload:text-primary tracking-wider transition-colors">
                              Upload
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  </DataTable.Cell>

                  <DataTable.Cell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyRow(idx)}
                        className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </DataTable.Cell>

                  <DataTable.Cell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <AppFlagPicker
                        value={row.flag}
                        onChange={(val) => handleUpdateFlag(row, val || undefined)}
                        size="sm"
                      />
                    </div>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable.Body>
          </DataTable>
        </div>
      </div>

      <ConstructieEditModal
        isOpen={editingRow !== null}
        onClose={() => setEditingRow(null)}
        onSave={handleSave}
        initialRow={editingRow}
        existingConstructies={constructies}
        data={data}
      />

      <PhotoViewerModal
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        slides={slidesFromUrls(lightboxPhotos.length > 0 ? lightboxPhotos : (selectedPhoto ? [selectedPhoto] : []))}
        index={lightboxIndex}
        onPrev={() => setLightboxIndex(i => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
        onNext={() => setLightboxIndex(i => (i + 1) % lightboxPhotos.length)}
        zIndexClassName="z-[99999]"
      />

      <GlobalPhotoSelectorModal
        isOpen={globalPhotoModalOpen}
        categoryName={(() => {
          if (globalUploadContext?.source === 'table') {
            return constructies.find(r => r.id === globalUploadContext.id)?.naam || 'Constructie';
          }
          return editingRow?.naam || 'Constructie';
        })()}
        onClose={() => setGlobalPhotoModalOpen(false)}
        data={data!}
        initialPhotoUrls={(() => {
          if (!globalUploadContext) return [];
          const { id, source } = globalUploadContext;
          if (source === 'table') {
            const row = constructies.find(r => r.id === id);
            return row ? [...(row.photos || []), ...(row.photoUrl ? [row.photoUrl] : [])].filter((p, i, arr) => p && arr.indexOf(p) === i) : [];
          } else if (source === 'modal' && editingRow && editingRow.id === id) {
            return [...(editingRow.photos || []), ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])].filter((p, i, arr) => p && arr.indexOf(p) === i);
          }
          return [];
        })()}
        onSelect={(dataUrls) => {
          if (!globalUploadContext) return;
          const { id, source } = globalUploadContext;
          const newPhotos = dataUrls || [];
          const newPhotoUrl = newPhotos.length > 0 ? newPhotos[0] : '';
          
          if (source === 'table') {
            onChange(allConstructies.map(r => r.id === id ? { ...r, photos: newPhotos, photoUrl: newPhotoUrl } : r));
          } else if (source === 'modal' && editingRow && editingRow.id === id) {
            setEditingRow({
              ...editingRow,
              photos: newPhotos,
              photoUrl: newPhotoUrl
            });
          }
        }}
        onUpload={handleGlobalUploadAction}
      />
      

    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Kozijn & Glas View (KozijnView)
   ───────────────────────────────────────────────────────────── */
interface KozijnViewProps {
  data?: InspectionData;
  kozijnen: KozijnRow[];
  constructies: ConstructionRow[];
  onChange: (rows: KozijnRow[]) => void;
}

export const KozijnView: React.FC<KozijnViewProps> = ({ data, kozijnen, constructies, onChange }) => {
  const { t } = useLanguage();
  const [editingKozijn, setEditingKozijn] = useState<KozijnRow | null>(null);

  const [globalPhotoModalOpen, setGlobalPhotoModalOpen] = useState(false);
  const [globalUploadContext, setGlobalUploadContext] = useState<{ id: string, source: 'table' | 'modal' } | null>(null);
  const globalFileInputRef = useRef<HTMLInputElement>(null);

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
    if (!file || !globalUploadContext) return;
    
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
        
        const { id, source } = globalUploadContext;
        if (source === 'table') {
          onChange(kozijnen.map(r => r.id === id ? { ...r, photos: [...(r.photos || []), dataUrl].filter((p, i, arr) => arr.indexOf(p) === i), photoUrl: dataUrl } : r));
        } else if (source === 'modal' && editingKozijn && editingKozijn.id === id) {
          setEditingKozijn({
            ...editingKozijn,
            photos: [...(editingKozijn.photos || []), dataUrl].filter((p, i, arr) => arr.indexOf(p) === i),
            photoUrl: dataUrl
          });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    if (globalFileInputRef.current) {
      globalFileInputRef.current.value = '';
    }
  };

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const openLightbox = (photos: string[], index: number, title: string) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setSelectedPhoto(photos[index]);
    setLightboxTitle(title);
  };

  const [flags, setFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    try {
      const saved = localStorage.getItem(`kozijn_flags_${data?.clientId || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`kozijn_flags_${data?.clientId || 'default'}`, JSON.stringify(flags));
    } catch (e) {
      console.error(e);
    }
  }, [flags, data?.clientId]);

  const toggleFlag = (fieldKey: string, status: 'red' | 'yellow' | 'green' | null) => {
    setFlags(prev => {
      const current = prev[fieldKey];
      return {
        ...prev,
        [fieldKey]: current === status ? null : status
      };
    });
  };

  const getUniqueCopyName = (originalName: string, existingNames: string[], suffixFormat?: string) => {
    if (!originalName) return '';
    const regex = new RegExp(`(.*)(?:\\s*(?:-|\\()\\s*(?:Kopie|Copy|kopie|copy)\\)?)\\s*(?:\\((\\d+)\\))?$`, 'i');

    let baseName = originalName;
    const match = originalName.match(regex);
    if (match) {
      baseName = match[1].trim().replace(/\s*\(\s*\)?$/, '').trim();
    }

    const defaultSuffix = ` ${t('structural.copySuffix') || 'Kopie'}`;
    const suffixBase = suffixFormat !== undefined ? suffixFormat : defaultSuffix;

    let index = 1;
    let nextName = `${baseName}${suffixBase}`;
    if (existingNames.includes(nextName)) {
      while (existingNames.includes(nextName)) {
        index++;
        nextName = `${baseName}${suffixBase} (${index})`;
      }
    }
    return nextName;
  };

  const gevelOptions = ['Voorgevel', 'Achtergevel', 'Linkergevel', 'Rechtergevel', 'Dak'];

  const handleAdd = () => {
    setEditingKozijn({ id: `k-${Date.now()}`, gevel: '', naam: 'Nieuw kozijn', width: '', height: '', area: '', constructieId: '' });
  };

  const calcArea = (w: string, h: string) => {
    const wv = parseFloat(w), hv = parseFloat(h);
    return (!isNaN(wv) && !isNaN(hv)) ? (wv * hv).toFixed(2) : '';
  };

  const handleSave = (row: KozijnRow) => {
    const saved = { ...row };
    const exists = kozijnen.some(r => r.id === saved.id);
    onChange(exists ? kozijnen.map(r => r.id === saved.id ? saved : r) : [...kozijnen, saved]);
    setEditingKozijn(null);
  };

  const inputCls = 'bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden h-full max-w-7xl">
      <input
        type="file"
        ref={globalFileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="pb-2 flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-black text-on-background tracking-tight">{t('kozijn.title')}</h1>
      </div>
      <div className="flex-1 bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2"></div>
          <button type="button" onClick={handleAdd}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider active:scale-[0.98]">
            <Plus size={14} /> {t('kozijn.addKozijn')}
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <DataTable minWidth="1000px">
            <DataTable.Head className="sticky top-0 z-20">
              <DataTable.Row className="bg-gray-50 border-b border-outline-variant/10">
                <DataTable.HeaderCell className="bg-gray-50 min-w-[180px]">{t('kozijn.naam')}</DataTable.HeaderCell>
                <DataTable.HeaderCell>{t('nav.gevel')}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="text-center">{t('kozijn.width')}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="text-center">{t('kozijn.height')}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="text-center">{t('kozijn.area')}</DataTable.HeaderCell>
                <DataTable.HeaderCell>{t('kozijn.constructie')}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="w-20 text-center">{t('structural.photo') || 'Photo'}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="w-20 text-center">{t('structural.flagStatus')}</DataTable.HeaderCell>
                <DataTable.HeaderCell className="w-16 text-center bg-gray-50">{t('kozijn.action')}</DataTable.HeaderCell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {kozijnen.length === 0 && (
                <DataTable.Row><DataTable.Cell colSpan={8} className="text-center font-bold uppercase tracking-wider text-on-surface-variant/40 py-12">{t('kozijn.emptyList')}</DataTable.Cell></DataTable.Row>
              )}
              {kozijnen.map((row) => {
                const linked = constructies.find(c => c.id === row.constructieId);
                return (
                  <DataTable.Row key={row.id} className="cursor-pointer" onClick={() => setEditingKozijn(row)}>
                    <DataTable.Cell>{row.naam}</DataTable.Cell>
                    <DataTable.Cell>{row.gevel}</DataTable.Cell>
                    <DataTable.Cell className="text-right">{row.width || '-'}</DataTable.Cell>
                    <DataTable.Cell className="text-right">{row.height || '-'}</DataTable.Cell>
                    <DataTable.Cell className="text-right font-mono">{row.area || '-'}</DataTable.Cell>
                    <DataTable.Cell>{linked ? linked.naam : <span className="text-on-surface-variant/40 italic font-bold">Geen constructie gekoppeld</span>}</DataTable.Cell>
                    <DataTable.Cell className="text-center w-20" onClick={e => e.stopPropagation()}>
                      {(() => {
                        const allPhotos = [
                          ...(row.photos || []),
                          ...(row.photoUrl ? [row.photoUrl] : [])
                        ].filter((p, i, arr) => arr.indexOf(p) === i);

                        if (allPhotos.length > 0) {
                          return (
                            <div
                              className="relative group/pic cursor-pointer inline-block"
                              onClick={() => openLightbox(allPhotos, 0, row.naam)}
                            >
                              <img
                                src={allPhotos[0]}
                                alt={row.naam}
                                className="w-10 h-8 object-cover rounded-md border border-outline-variant/10 shadow-xs hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              {allPhotos.length > 1 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                  {allPhotos.length}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <button
                            type="button"
                            className="flex flex-col items-center justify-center gap-1 cursor-pointer group/upload h-8 bg-transparent border-none w-full"
                            onClick={() => {
                              setGlobalUploadContext({ id: row.id, source: 'table' });
                              setGlobalPhotoModalOpen(true);
                            }}
                          >
                            <Camera size={14} className="text-on-surface-variant/40 group-hover/upload:text-primary transition-colors" />
                            <span className="text-[8px] font-black uppercase text-on-surface-variant/40 group-hover/upload:text-primary tracking-wider transition-colors">
                              Upload
                            </span>
                          </button>
                        );
                      })()}
                    </DataTable.Cell>
                    <DataTable.Cell className="text-center w-24" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5 w-16 h-[12px] bg-slate-100 border border-slate-200 rounded-[4px] overflow-hidden p-[1px] gap-[1px] shadow-xs mx-auto">
                        <button
                          type="button"
                          onClick={() => toggleFlag(row.id, 'red')}
                          className={`h-full flex-1 rounded-[2.5px] transition-all duration-150 cursor-pointer ${flags[row.id] === 'red' ? 'bg-red-600 shadow-xs scale-y-110' : 'bg-red-100 hover:bg-red-200'}`}
                          title="Action required / Missing"
                        />
                        <div className="w-[1px] h-full bg-slate-200" />
                        <button
                          type="button"
                          onClick={() => toggleFlag(row.id, 'yellow')}
                          className={`h-full flex-1 rounded-[1px] transition-all duration-150 cursor-pointer ${flags[row.id] === 'yellow' ? 'bg-amber-450 bg-amber-400 shadow-xs scale-y-110' : 'bg-amber-100 hover:bg-amber-250'}`}
                          title="Under review / Warning"
                        />
                        <div className="w-[1px] h-full bg-slate-200" />
                        <button
                          type="button"
                          onClick={() => toggleFlag(row.id, 'green')}
                          className={`h-full flex-1 rounded-[2.5px] transition-all duration-150 cursor-pointer ${flags[row.id] === 'green' ? 'bg-green-600 shadow-xs scale-y-110' : 'bg-green-100 hover:bg-green-250'}`}
                          title="Verified / Correct"
                        />
                      </div>
                    </DataTable.Cell>
                    <DataTable.Cell className="text-center w-16" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => {
                          const uniqueName = getUniqueCopyName(row.naam, kozijnen.map(k => k.naam), ` (${t('kozijn.kopie', { defaultValue: 'Kopie' })})`);
                          onChange([...kozijnen, { ...row, id: `k-${Date.now()}`, naam: uniqueName }]);
                        }} className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"><Copy size={13} /></button>
                        <button type="button" onClick={() => onChange(kozijnen.filter(r => r.id !== row.id))} className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"><Trash2 size={13} /></button>
                      </div>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable.Body>
          </DataTable>
        </div>
      </div>

      <KozijnEditModal
        isOpen={editingKozijn !== null}
        onClose={() => setEditingKozijn(null)}
        onSave={handleSave}
        initialRow={editingKozijn}
        data={data}
        flagKey={editingKozijn ? `library_${editingKozijn.id}` : undefined}
        onFlagChange={(key, val) => editingKozijn && toggleFlag(editingKozijn.id, val)}
      />

      {/* Global Photo Modal for KozijnView */}
      <GlobalPhotoSelectorModal
        isOpen={globalPhotoModalOpen}
        categoryName={(() => {
          if (globalUploadContext?.source === 'table') {
            return kozijnen.find(r => r.id === globalUploadContext.id)?.naam || 'Kozijnen';
          }
          return editingKozijn?.naam || 'Kozijnen';
        })()}
        onClose={() => setGlobalPhotoModalOpen(false)}
        data={data!}
        initialPhotoUrls={(() => {
          if (!globalUploadContext) return [];
          const { id, source } = globalUploadContext;
          if (source === 'table') {
            const row = kozijnen.find(r => r.id === id);
            return row ? [...(row.photos || []), ...(row.photoUrl ? [row.photoUrl] : [])].filter((p, i, arr) => p && arr.indexOf(p) === i) : [];
          } else if (source === 'modal' && editingKozijn && editingKozijn.id === id) {
            return [...(editingKozijn.photos || []), ...(editingKozijn.photoUrl ? [editingKozijn.photoUrl] : [])].filter((p, i, arr) => p && arr.indexOf(p) === i);
          }
          return [];
        })()}
        onSelect={(dataUrls) => {
          if (!globalUploadContext) return;
          const { id, source } = globalUploadContext;
          const newPhotos = dataUrls || [];
          const newPhotoUrl = newPhotos.length > 0 ? newPhotos[0] : '';
          
          if (source === 'table') {
            onChange(kozijnen.map(r => r.id === id ? { ...r, photos: newPhotos, photoUrl: newPhotoUrl } : r));
          } else if (source === 'modal' && editingKozijn && editingKozijn.id === id) {
            setEditingKozijn({
              ...editingKozijn,
              photos: newPhotos,
              photoUrl: newPhotoUrl
            });
          }
        }}
        onUpload={handleGlobalUploadAction}
      />

      {/* Lightbox for KozijnView */}
      <PhotoViewerModal
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        slides={slidesFromUrls(lightboxPhotos.length > 0 ? lightboxPhotos : (selectedPhoto ? [selectedPhoto] : []))}
        index={lightboxIndex}
        onPrev={() => setLightboxIndex(i => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
        onNext={() => setLightboxIndex(i => (i + 1) % lightboxPhotos.length)}
        zIndexClassName="z-[99999]"
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Overstek & Belemmering View
   ───────────────────────────────────────────────────────────── */
export interface OverstekData {
  overstekAanwezig: string;
  overstekDiepte: string;
  overstekBreedte: string;
  belemmeringAanwezig: string;
  belemmeringType: string;
  belemmeringHoogte: string;
  belemmeringAfstand: string;
  zonnehoekCorrectie: string;
  notities: string;
}

interface OverstekViewProps {
  data: OverstekData;
  onChange: (data: OverstekData) => void;
}

export const OverstekView: React.FC<OverstekViewProps> = ({ data, onChange }) => {
  const set = (field: keyof OverstekData, val: string) => onChange({ ...data, [field]: val });
  const inputCls = 'bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold';
  const selectCls = `${inputCls} cursor-pointer`;
  const sectionCls = 'bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-5 space-y-4';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl space-y-6">
      <div className="pb-2">
        <h1 className="text-3xl font-black text-on-background tracking-tight">Overstek &amp; Belemmering</h1>
      </div>

      <div className={sectionCls}>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">Overstek</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Overstek aanwezig</label>
            <LocalSelect className={selectCls} value={data.overstekAanwezig} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('overstekAanwezig', e.target.value)}>
              <option value="">— Kies —</option>
              <option value="Ja">Ja</option>
              <option value="Nee">Nee</option>
              <option value="Onbekend">Onbekend</option>
            </LocalSelect>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Diepte overstek (m)</label>
            <AppInputField type="number" step="0.01" placeholder="0.00" value={data.overstekDiepte} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('overstekDiepte', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Breedte overstek (m)</label>
            <AppInputField type="number" step="0.01" placeholder="0.00" value={data.overstekBreedte} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('overstekBreedte', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Zonnehoek correctie (°)</label>
            <AppInputField type="number" step="0.1" placeholder="0.0" value={data.zonnehoekCorrectie} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('zonnehoekCorrectie', e.target.value)} />
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">Belemmering</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Belemmering aanwezig</label>
            <LocalSelect className={selectCls} value={data.belemmeringAanwezig} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('belemmeringAanwezig', e.target.value)}>
              <option value="">— Kies —</option>
              <option value="Ja">Ja</option>
              <option value="Nee">Nee</option>
              <option value="Onbekend">Onbekend</option>
            </LocalSelect>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Type belemmering</label>
            <LocalSelect className={selectCls} value={data.belemmeringType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('belemmeringType', e.target.value)}>
              <option value="">— Kies —</option>
              <option value="Gebouw">Gebouw</option>
              <option value="Boom / begroeiing">Boom / begroeiing</option>
              <option value="Heuvel / berg">Heuvel / berg</option>
              <option value="Anders">Anders</option>
            </LocalSelect>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Hoogte belemmering (m)</label>
            <AppInputField type="number" step="0.1" placeholder="0.0" value={data.belemmeringHoogte} onChange={e => set('belemmeringHoogte', e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Afstand tot belemmering (m)</label>
            <AppInputField type="number" step="0.1" placeholder="0.0" value={data.belemmeringAfstand} onChange={e => set('belemmeringAfstand', e.target.value)} />
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Notities / opmerkingen</label>
        <AppTextAreaField
          rows={4}
          placeholder="Extra informatie over overstek of belemmering..."
          value={data.notities}
          onChange={e => set('notities', e.target.value)}
        />
      </div>
    </div>
  );
};

export default ConstructieView;
export { ConstructieView };