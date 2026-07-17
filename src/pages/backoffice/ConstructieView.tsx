/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CollapsibleSection, FieldGroup, AppInputField, AppTextAreaField } from '../../components/ui/BackOfficeUI';
import { InspectionData, ConstructionRow, KozijnRow as BaseKozijnRow } from './backofficeTypes';
import { Plus, Trash2, Copy, Image, Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AppSelect, AppSelectWithOptions } from '../../components/common/AppSelect';
import { PhotoViewerModal } from '../../components/common/PhotoViewerModal';
import { slidesFromUrls } from '../../utils/photoViewer';
import { AppFlagPicker } from '../../components/common/AppFlagPicker';
import { AppModal } from '../../components/common/AppModal';

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

  const getCalculatedUValue = (row: ConstructionRow) => {
    if (row.type === 'Deur') {
      if (row.glas?.includes('super')) return '1.00';
      if (row.glas?.includes('geïsoleerd')) return '2.00';
      return '3.40';
    }
    if (row.type === 'Paneel') {
      if (row.isolatie === 'Nee') return '3.40';
      if (row.isolatie === 'Onbekend') return '2.00';
      return '1.20';
    }
    const glassVal = parseFloat(row.uGren) || 2.0;
    let frameU = 2.4;
    if (row.kozijn === 'Hout') frameU = 1.8;
    else if (row.kozijn === 'Kunststof') frameU = 1.5;
    else if (row.kozijn?.includes('niet thermisch')) frameU = 3.8;
    return ((glassVal + frameU) / 2).toFixed(2);
  };

  const getCalculatedRcValue = (row: ConstructionRow) => {
    if (row.isolatie === 'Nee') return '0.24';
    if (row.isolatie === 'Onbekend') return '0.40';
    const d = parseInt(row.dikte) || 0;
    if (d === 0) return '2.50';
    const lambda = 0.035;
    const rInsulation = (d / 1000) / lambda;
    return (rInsulation + 0.24).toFixed(2);
  };

  const handleSave = (updatedRow: ConstructionRow) => {
    let finalRow = { ...updatedRow };
    if (finalRow.invoer === 'Beslisschema') {
      if (finalRow.type === 'Deur' || finalRow.type === 'Raam' || finalRow.type === 'Paneel') {
        if (!finalRow.uWaarde) {
          finalRow.uWaarde = getCalculatedUValue(finalRow);
        }
      } else {
        if (!finalRow.rc) {
          finalRow.rc = getCalculatedRcValue(finalRow);
        }
      }
    }
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
          <table className="w-full min-w-[1000px] text-left border-collapse border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-50 border-b border-outline-variant/10">
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 bg-gray-50 uppercase tracking-wider">{t('structural.name')}</th>
                {activeTab === 'Dak' && (
                  <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 bg-gray-50 uppercase tracking-wider">{t('structural.type')}</th>
                )}

                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.input')}</th>

                {activeTab === 'Deur' && (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.insulationPresent')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.brandAndType')}</th>
                  </>
                )}

                {activeTab === 'Raam' && (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.frame')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.glass')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.brandAndType')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">{t('structural.uNotAdjacent')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">{t('structural.uAdjacent')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">{t('structural.gValue')}</th>
                  </>
                )}

                {activeTab === 'Paneel' && (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.insulationPresent')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.brandAndType')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">Thickness (mm)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.frame')}</th>
                  </>
                )}

                {activeTab === 'Gevel' && (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.insulationPresent')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.brandAndType')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">Thickness (mm)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.yearBuilt')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">{t('structural.rcValue')}</th>
                  </>
                )}

                {activeTab === 'Vloer' && (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.insulationPresent')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.brandAndType')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">Thickness (mm)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.yearBuilt')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">{t('structural.rcValue')}</th>
                  </>
                )}

                {activeTab === 'Dak' && (
                  <>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.insulationPresent')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.brandAndType')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">Thickness (mm)</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.yearBuilt')}</th>
                    <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-center uppercase tracking-wider">{t('structural.rcValue')}</th>
                  </>
                )}

                {(activeTab === 'Deur' || activeTab === 'Raam' || activeTab === 'Paneel') && (
                  <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center bg-gray-50 uppercase tracking-wider">{t('structural.uValue')}</th>
                )}
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center bg-gray-50 uppercase tracking-wider">{t('structural.photo')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-16 text-center bg-gray-50 uppercase tracking-wider">{t('structural.action')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-24 text-center bg-gray-50 uppercase tracking-wider">{t('structural.flagStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {currentRows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-primary/5 cursor-pointer group transition-colors select-none text-xs"
                  onClick={() => setEditingRow(row)}
                >
                  <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 text-on-surface-variant/80">
                    {row.naam || '-'}
                  </td>
                  {activeTab === 'Dak' && (
                    <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 font-semibold text-on-surface-variant">
                      {row.dakType === 'Plat dak' ? t('structural.flatRoof') : t('structural.slopedRoof')}
                    </td>
                  )}

                  <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                    {row.invoer === 'Kwaliteitsverklaring'
                      ? t('structural.qualityDeclaration')
                      : (row.invoer === 'Beslisschema' ? t('structural.decisionTree') : (row.invoer || '-'))}
                  </td>

                  {activeTab === 'Deur' && (
                    <>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">
                        {row.invoer === 'Beslisschema' ? <span className="text-on-surface-variant/30">—</span> : (row.merk || '-')}
                      </td>
                    </>
                  )}

                  {activeTab === 'Raam' && (
                    <>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{row.kozijn || '-'}</td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{row.glas || '-'}</td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">
                        {row.invoer === 'Beslisschema' ? <span className="text-on-surface-variant/30">—</span> : (row.merk || '-')}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.uNiet || '-'}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.uGren || '-'}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.g || '-'}</td>
                    </>
                  )}

                  {activeTab === 'Paneel' && (
                    <>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">
                        {row.invoer === 'Beslisschema' ? <span className="text-on-surface-variant/30">—</span> : (row.merk || '-')}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.dikte || '-'}</td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{row.kozijn || '-'}</td>
                    </>
                  )}

                  {activeTab === 'Gevel' && (
                    <>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">
                        {row.invoer === 'Beslisschema' ? <span className="text-on-surface-variant/30">—</span> : (row.merk || '-')}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.dikte || '-'}</td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">{row.bouwjaar || '-'}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.rc || '-'}</td>
                    </>
                  )}

                  {activeTab === 'Vloer' && (
                    <>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">
                        {row.invoer === 'Beslisschema' ? <span className="text-on-surface-variant/30">—</span> : (row.merk || '-')}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.dikte || '-'}</td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">{row.bouwjaar || '-'}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.rc || '-'}</td>
                    </>
                  )}

                  {activeTab === 'Dak' && (
                    <>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                        {row.isolatie === 'Ja' || row.isolatie === 'Yes' ? t('common.yes') : t('common.no')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">
                        {row.invoer === 'Beslisschema' ? <span className="text-on-surface-variant/30">—</span> : (row.merk || '-')}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.dikte || '-'}</td>
                      <td className="px-4 py-3.5 font-semibold text-on-surface-variant/60 italic">{row.bouwjaar || '-'}</td>
                      <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">{row.rc || '-'}</td>
                    </>
                  )}

                  {(activeTab === 'Deur' || activeTab === 'Raam' || activeTab === 'Paneel') && (
                    <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 min-w-[80px] w-20 font-mono font-semibold text-primary">
                      {row.uWaarde || '-'}
                    </td>
                  )}

                  <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 min-w-[80px] w-20">
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
                          <span className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-wider">
                            {t('structural.noPhoto')}
                          </span>
                        );
                      })()}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyRow(idx)}
                        className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        title="Copy row"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                        title="Delete row"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 min-w-[96px] w-24" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center w-full">
                      <AppFlagPicker
                        value={row.flag}
                        onChange={(val) => handleUpdateFlag(row, val)}
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Popup Modal */}


      <AppModal
        isOpen={editingRow !== null}
        onClose={() => setEditingRow(null)}
        onSave={() => handleSave(editingRow)}
        title={editingRow ? (constructies.some(r => r.id === editingRow.id)
          ? t('structural.editTitle', { type: getTabLabel(editingRow.type) })
          : t('structural.newTitle', { type: getTabLabel(editingRow.type) })) : ''}
        saveLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      >
        {editingRow && (
          <div className="space-y-4">
            {/* Naam */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.name')}</label>
              <AppInputField
                type="text"
                value={editingRow.naam || ''}
                onChange={(e) => setEditingRow({ ...editingRow, naam: e.target.value })}
                placeholder="Bijv. Voordeur, Achterdeur..."
              />
            </div>

            {/* Custom type-specific Dak details directly under Naam */}
            {editingRow.type === 'Dak' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.type')}</label>
                <LocalSelect
                  value={editingRow.dakType || 'Hellend dak'}
                  onChange={(e: any) => setEditingRow({ ...editingRow, dakType: e.target.value })}
                >
                  <option value="Hellend dak">Hellend dak</option>
                  <option value="Plat dak">Plat dak</option>
                </LocalSelect>
              </div>
            )}

            {/* Invoer option dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.input')}</label>
              <LocalSelect
                value={editingRow.invoer || 'Beslisschema'}
                onChange={(e: any) => setEditingRow({ ...editingRow, invoer: e.target.value })}
              >
                <option value="Beslisschema">{t('structural.decisionTree')}</option>
                <option value="Kwaliteitsverklaring">{t('structural.qualityDeclaration')}</option>
              </LocalSelect>
            </div>

            {/* Merk & type (visible if invoer === 'Kwaliteitsverklaring') */}
            {editingRow.invoer === 'Kwaliteitsverklaring' && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.brandAndType')}</label>
                <AppInputField
                  type="text"
                  value={editingRow.merk || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, merk: e.target.value })}
                  placeholder="Voer merk & type in..."
                />
              </div>
            )}

            {/* Kozijn type choice dropdown for Raam directly under Type */}
            {(editingRow.type === 'Raam' || editingRow.type === 'Paneel') && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">frameType</label>
                <LocalSelect
                  value={editingRow.kozijn || 'Hout'}
                  onChange={(e: any) => setEditingRow({ ...editingRow, kozijn: e.target.value })}
                >
                  <option value="Hout">Hout</option>
                  <option value="Kunststof">Kunststof</option>
                  <option value="Metaal thermisch onderbroken">Metaal thermisch onderbroken</option>
                  <option value="Metaal niet thermisch onderbroken">Metaal niet thermisch onderbroken</option>
                </LocalSelect>
              </div>
            )}

            {/* Custom Type choice dropdown for Raam directly under Kozijn */}
            {editingRow.type === 'Raam' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">glassType</label>
                <LocalSelect
                  value={editingRow.glas || 'Enkel glas'}
                  onChange={(e: any) => setEditingRow({ ...editingRow, glas: e.target.value })}
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

            {/* Custom Raam specific properties directly under Glas choice */}
            {editingRow.type === 'Raam' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 mb-1">{t('structural.uNotAdjacent')}</label>
                  <AppInputField
                    type="text"
                    className="py-1.5 text-xs font-mono font-bold"
                    value={editingRow.uNiet || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, uNiet: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 mb-1">{t('structural.uAdjacent')}</label>
                  <AppInputField
                    type="text"
                    className="py-1.5 text-xs font-mono font-bold"
                    value={editingRow.uGren || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, uGren: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 mb-1">{t('structural.gValue')}</label>
                  <AppInputField
                    type="text"
                    className="py-1.5 text-xs font-mono font-bold"
                    value={editingRow.g || ''}
                    onChange={(e) => setEditingRow({ ...editingRow, g: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Isolatie keuze */}
            {editingRow.type !== 'Deur' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">Insulation present</label>
                <LocalSelect
                  value={editingRow.isolatie || 'Nee'}
                  onChange={(e: any) => setEditingRow({ ...editingRow, isolatie: e.target.value })}
                >
                  <option value="Ja">Ja</option>
                  <option value="Nee">Nee</option>
                  <option value="Onbekend">Onbekend</option>
                </LocalSelect>
              </div>
            )}

            {/* Dikte (conditional) */}
            {editingRow.isolatie === 'Ja' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.thickness')}</label>
                <AppInputField
                  type="number"
                  value={editingRow.dikte || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, dikte: e.target.value })}
                  placeholder="Dikte in mm, bijv. 80"
                />
              </div>
            )}

            {/* Bouwjaar */}
            {editingRow.type !== 'Deur' && editingRow.type !== 'Raam' && editingRow.type !== 'Paneel' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">constructionYear</label>
                <AppInputField
                  type="text"
                  value={editingRow.bouwjaar || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, bouwjaar: e.target.value })}
                  placeholder="Bijv. 1998, Tot 1965..."
                />
              </div>
            )}

            {/* Vlag / Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.flagStatus')}</label>
              <AppFlagPicker
                value={editingRow.flag}
                onChange={(val) => setEditingRow({ ...editingRow, flag: val || undefined })}
              />
            </div>

            {/* U-waarde */}
            {(editingRow.type === 'Deur' || editingRow.type === 'Raam' || editingRow.type === 'Paneel') && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.uValue')}</label>
                <AppInputField
                  type="number"
                  step="0.01"
                  className="font-mono font-bold text-center"
                  value={editingRow.uWaarde || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, uWaarde: e.target.value })}
                  placeholder={editingRow.invoer === 'Beslisschema' ? getCalculatedUValue(editingRow) : "Bijv. 1.6"}
                />
              </div>
            )}

            {/* Rc-waarde */}
            {editingRow.type !== 'Deur' && editingRow.type !== 'Raam' && editingRow.type !== 'Paneel' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('structural.rcValue')}</label>
                <AppInputField
                  type="number"
                  step="0.01"
                  className="font-mono font-bold text-center"
                  value={editingRow.rc || ''}
                  onChange={(e) => setEditingRow({ ...editingRow, rc: e.target.value })}
                  placeholder={editingRow.invoer === 'Beslisschema' ? getCalculatedRcValue(editingRow) : "Bijv. 2.5"}
                />
              </div>
            )}

            {/* Foto uploaden */}
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
                        <input
                          type="file"
                          id="modal-constructie-photo-upload-multi"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;

                            let loaded = 0;
                            const newPhotos: string[] = [];
                            files.forEach((file) => {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                newPhotos.push(re.target?.result as string);
                                loaded++;
                                if (loaded === files.length) {
                                  const currentPhotos = editingRow.photos || [];
                                  if (editingRow.photoUrl && !currentPhotos.includes(editingRow.photoUrl)) currentPhotos.push(editingRow.photoUrl);
                                  const merged = [...currentPhotos, ...newPhotos];
                                  setEditingRow({
                                    ...editingRow,
                                    photos: merged,
                                    photoUrl: merged[0],
                                    photoTag: merged.length > 0 ? `[${editingRow.type}] ${editingRow.naam}` : undefined
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-outline-variant/15 hover:border-primary/40 hover:bg-primary/5 text-on-surface-variant/70 hover:text-primary text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                          onClick={() => document.getElementById('modal-constructie-photo-upload-multi')?.click()}
                        >
                          <Camera size={11} />
                          Voeg foto toe
                        </button>
                      </div>
                    </div>

                    {allPhotos.length === 0 ? (
                      <div
                        className="border border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('modal-constructie-photo-upload-multi')?.click()}
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
                              onClick={() => openLightbox(allPhotos, idx, editingRow.naam || 'Constructie')}
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
        )}
      </AppModal>

      {/* Lightbox */}
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
    setEditingKozijn({ id: `k-${Date.now()}`, gevel: 'Voorgevel', naam: 'Nieuw kozijn', width: '', height: '', area: '', constructieId: '' });
  };

  const calcArea = (w: string, h: string) => {
    const wv = parseFloat(w), hv = parseFloat(h);
    return (!isNaN(wv) && !isNaN(hv)) ? (wv * hv).toFixed(2) : '';
  };

  const handleSave = (row: KozijnRow) => {
    const saved = { ...row, area: calcArea(row.width, row.height) || row.area };
    const exists = kozijnen.some(r => r.id === saved.id);
    onChange(exists ? kozijnen.map(r => r.id === saved.id ? saved : r) : [...kozijnen, saved]);
    setEditingKozijn(null);
  };

  const inputCls = 'bg-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full border-none transition-all font-semibold';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden h-full max-w-7xl">
      <div className="pb-2 flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-black text-on-background tracking-tight">{t('kozijn.title')}</h1>
      </div>
      <div className="flex-1 bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2"></div>
          <button type="button" onClick={handleAdd}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider active:scale-[0.98]">
            <Plus size={14} /> {t('kozijn.addKozijn')}
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[1000px] text-left border-collapse border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-50 border-b border-outline-variant/10">
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 bg-gray-50 uppercase tracking-wider min-w-[180px]">{t('kozijn.naam')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('nav.gevel')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-center">{t('kozijn.width')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-center">{t('kozijn.height')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-center">{t('kozijn.area')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('kozijn.constructie')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center uppercase tracking-wider">{t('structural.photo') || 'Photo'}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center uppercase tracking-wider">{t('structural.flagStatus')}</th>
                <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-16 text-center bg-gray-50 uppercase tracking-wider">{t('kozijn.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {kozijnen.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-xs text-on-surface-variant/40 font-bold uppercase tracking-wider">{t('kozijn.emptyList')}</td></tr>
              )}
              {kozijnen.map((row) => {
                const linked = constructies.find(c => c.id === row.constructieId);
                return (
                  <tr key={row.id} className="hover:bg-primary/5 cursor-pointer group transition-colors select-none text-xs" onClick={() => setEditingKozijn(row)}>
                    <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 text-on-surface-variant/80">{row.naam}</td>
                    <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{row.gevel}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.width || '-'}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.height || '-'}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">{row.area || '-'}</td>
                    <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{linked ? linked.naam : <span className="text-on-surface-variant/40 italic font-bold">Geen constructie gekoppeld</span>}</td>
                    <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-20" onClick={e => e.stopPropagation()}>
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
                          <label className="flex flex-col items-center justify-center gap-1 cursor-pointer group/upload h-8">
                            <Camera size={14} className="text-on-surface-variant/40 group-hover/upload:text-primary transition-colors" />
                            <span className="text-[8px] font-black uppercase text-on-surface-variant/40 group-hover/upload:text-primary tracking-wider transition-colors">
                              Upload
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length === 0) return;
                                let loaded = 0;
                                const newPhotos: string[] = [];
                                files.forEach((file) => {
                                  const reader = new FileReader();
                                  reader.onload = (re) => {
                                    newPhotos.push(re.target?.result as string);
                                    loaded++;
                                    if (loaded === files.length) {
                                      const merged = [...(row.photos || []), ...newPhotos];
                                      onChange(kozijnen.map(r => r.id === row.id ? { ...r, photos: merged, photoUrl: merged[0] } : r));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                });
                                e.target.value = '';
                              }}
                            />
                          </label>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-24" onClick={e => e.stopPropagation()}>
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
                    </td>
                    <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-16" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => {
                          const uniqueName = getUniqueCopyName(row.naam, kozijnen.map(k => k.naam), ` (${t('kozijn.kopie', { defaultValue: 'Kopie' })})`);
                          onChange([...kozijnen, { ...row, id: `k-${Date.now()}`, naam: uniqueName }]);
                        }} className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"><Copy size={13} /></button>
                        <button type="button" onClick={() => onChange(kozijnen.filter(r => r.id !== row.id))} className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        isOpen={editingKozijn !== null}
        onClose={() => setEditingKozijn(null)}
        onSave={() => handleSave(editingKozijn)}
        title={editingKozijn ? (kozijnen.some(r => r.id === editingKozijn.id) ? t('kozijn.editKozijn') : t('kozijn.newKozijn')) : ''}
        saveLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      >
        {editingKozijn && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('kozijn.naam')}</label>
              <AppInputField value={editingKozijn.naam} onChange={e => setEditingKozijn({ ...editingKozijn, naam: e.target.value })} />
            </div>

            {/* Vlag / Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">
                {t('structural.flagStatus')}
              </label>
              <AppFlagPicker
                value={flags[editingKozijn.id]}
                onChange={(val) => toggleFlag(editingKozijn.id, val)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('kozijn.gevelOrLocation')}</label>
              <LocalSelect className={selectCls} value={editingKozijn.gevel} onChange={(e: any) => setEditingKozijn({ ...editingKozijn, gevel: e.target.value })}>
                {gevelOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </LocalSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('kozijn.width')}</label>
                <AppInputField type="number" step="0.01" className="font-mono" value={editingKozijn.width} onChange={e => setEditingKozijn({ ...editingKozijn, width: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('kozijn.height')}</label>
                <AppInputField type="number" step="0.01" className="font-mono" value={editingKozijn.height} onChange={e => setEditingKozijn({ ...editingKozijn, height: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('kozijn.areaAutoCalculated')}</label>
              <AppInputField readOnly className="bg-gray-50 border border-outline-variant/10 font-mono font-black text-primary" value={calcArea(editingKozijn.width, editingKozijn.height) || editingKozijn.area || ''} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider mb-1.5">{t('kozijn.connectToElement')}</label>
              <LocalSelect className={selectCls} value={editingKozijn.constructieId} onChange={(e: any) => setEditingKozijn({ ...editingKozijn, constructieId: e.target.value })}>
                <option value="">— {t('kozijn.noConnection')} —</option>
                {constructies.filter(c => ['Gevel', 'Dak', 'Raam', 'Paneel'].includes(c.type)).map(c => (
                  <option key={c.id} value={c.id}>[{c.type}] {c.naam}</option>
                ))}
              </LocalSelect>
            </div>

            {/* Photos inside Popup */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">
                  {t('structural.photo') || 'Photo'}
                </label>
                <label className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-on-surface-variant/80 rounded border border-outline-variant/10 cursor-pointer transition-colors">
                  <Camera size={12} />
                  <span className="text-[10px] font-black uppercase tracking-wider">{t('structural.uploadPhoto', { defaultValue: 'Upload Photo' })}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      const existingPhotos = [
                        ...(editingKozijn.photos || []),
                        ...(editingKozijn.photoUrl ? [editingKozijn.photoUrl] : [])
                      ].filter((p, i, arr) => arr.indexOf(p) === i);
                      let loaded = 0;
                      const newPhotos: string[] = [];
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          newPhotos.push(re.target?.result as string);
                          loaded++;
                          if (loaded === files.length) {
                            const merged = [...existingPhotos, ...newPhotos];
                            setEditingKozijn({
                              ...editingKozijn,
                              photos: merged,
                              photoUrl: merged[0]
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              {(() => {
                const allPhotos = [
                  ...(editingKozijn.photos || []),
                  ...(editingKozijn.photoUrl ? [editingKozijn.photoUrl] : [])
                ].filter((p, i, arr) => arr.indexOf(p) === i);
                if (allPhotos.length === 0) {
                  return (
                    <div className="bg-gray-50 border border-outline-variant/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                      <Image size={24} className="text-on-surface-variant/30" />
                      <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-wider">{t('structural.noPhoto', { defaultValue: 'No photos' })}</span>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {allPhotos.map((url, idx) => (
                      <div key={idx} className="relative group/thumb aspect-[4/3] rounded-xl overflow-hidden border border-outline-variant/10 bg-gray-50 shadow-xs">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                          onClick={() => openLightbox(allPhotos, idx, editingKozijn.naam)}
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-600 text-white rounded-lg opacity-100 lg:opacity-0 lg:group-hover/thumb:opacity-100 transition-all shadow-sm cursor-pointer"
                          onClick={() => {
                            const next = allPhotos.filter((_, i) => i !== idx);
                            setEditingKozijn({
                              ...editingKozijn,
                              photos: next,
                              photoUrl: next[0] || ''
                            });
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </AppModal>

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