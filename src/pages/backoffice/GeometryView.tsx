/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VerticalFieldGroup } from '../../components/ui/BackOfficeUI';
import { InspectionData } from './backofficeTypes';
import {
  Plus, Home, Layers,
  Box, Trash2, Copy, Edit3, Eye, ShieldCheck, Save,
  Image, Camera, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AppSelectWithOptions } from '../../components/common/AppSelect';
import { translateOverstekOption } from '../../i18n/translateOptions';
import { PhotoViewerModal } from '../../components/common/PhotoViewerModal';
import { slidesFromUrls } from '../../utils/photoViewer';
import { AppFlagPicker } from '../../components/common/AppFlagPicker';
import { AppModal } from '../../components/common/AppModal';

const LocalSelect: React.FC<any> = ({ className, ...props }) => {
  return (
    <AppSelectWithOptions
      {...props}
      placeholder={undefined}
      className={`!py-1 !px-2 !text-xs !rounded-xl ${className || ''}`}
    />
  );
};

const ModalSelect: React.FC<any> = ({ className, ...props }) => {
  return (
    <AppSelectWithOptions
      {...props}
      placeholder={undefined}
      className={`w-full text-xs font-semibold cursor-pointer ${className || ''}`}
    />
  );
};




interface GeometryViewProps {
  data: InspectionData;
  onChange: (path: string, value: any) => void;
  forcedTab?: 'bouwkundig' | 'overstek' | 'library' | 'bouwkundig-gevel' | 'bouwkundig-vloer' | 'bouwkundig-dak';
  onTabChange?: (tab: 'bouwkundig' | 'overstek' | 'library' | 'bouwkundig-gevel' | 'bouwkundig-vloer' | 'bouwkundig-dak') => void;
  onConstructieChange?: (rows: any[]) => void;
  onKozijnChange?: (rows: any[]) => void;
}

const GeometryView: React.FC<GeometryViewProps> = ({ data, onChange, forcedTab, onTabChange, onConstructieChange, onKozijnChange }) => {
  const { t } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [editingGevelRowIdx, setEditingGevelRowIdx] = useState<number | null>(null);
  const [editingVloerRowIdx, setEditingVloerRowIdx] = useState<number | null>(null);
  const [editingDakRowIdx, setEditingDakRowIdx] = useState<number | null>(null);
  const [editingOverstekRowIdx, setEditingOverstekRowIdx] = useState<number | null>(null);
  const [tempKozijnLinks, setTempKozijnLinks] = useState<Record<string, boolean>>({});

  const openLightbox = (photos: string[], index: number, title: string) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setSelectedPhoto(photos[index]);
    setLightboxTitle(title);
  };

  const handleDirectUpload = (rowType: string, constructieId: string, idxInTab: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const dataUrl = re.target?.result as string;
        const currentTabRows = bouwkundigRows.filter(row => {
          if (activeTab === 'bouwkundig-gevel') return row.type === 'Gevel';
          if (activeTab === 'bouwkundig-vloer') return row.type === 'Vloer';
          if (activeTab === 'bouwkundig-dak') return row.type === 'Dak';
          return true;
        });
        const rowToUpdate = currentTabRows[idxInTab];
        if (!rowToUpdate) return;
        const originalIdx = bouwkundigRows.indexOf(rowToUpdate);
        if (originalIdx !== -1) {
          const currentPhotos = rowToUpdate.photos || [];
          if (rowToUpdate.photoUrl && !currentPhotos.includes(rowToUpdate.photoUrl)) currentPhotos.push(rowToUpdate.photoUrl);
          const merged = [...currentPhotos, dataUrl];
          const updatedRow = { ...rowToUpdate, photos: merged, photoUrl: dataUrl };
          const nextRows = bouwkundigRows.map((r, i) => i === originalIdx ? updatedRow : r);
          onChange('bouwkundigRows', nextRows);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKozijnUpload = (idx: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        const dataUrl = re.target?.result as string;
        const rowToUpdate = kozijnenLibrary[idx];
        if (!rowToUpdate) return;
        const currentPhotos = rowToUpdate.photos || [];
        if (rowToUpdate.photoUrl && !currentPhotos.includes(rowToUpdate.photoUrl)) currentPhotos.push(rowToUpdate.photoUrl);
        const merged = [...currentPhotos, dataUrl];
        const updatedRow = { ...rowToUpdate, photos: merged, photoUrl: dataUrl };
        const nextRows = kozijnenLibrary.map((r, i) => i === idx ? updatedRow : r);
        onChange('kozijnenLibrary', nextRows);
      };
      reader.readAsDataURL(file);
    }
  };

  const [selectedId, setSelectedId] = useState('back-gevel');
  const [activeTabState, setActiveTabState] = useState<'bouwkundig' | 'overstek' | 'library' | 'bouwkundig-gevel' | 'bouwkundig-vloer' | 'bouwkundig-dak'>('bouwkundig');

  const [flags, setFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>(() => {
    try {
      const saved = localStorage.getItem(`geometry_flags_${data?.clientId || 'default'}`);
      return saved ? (JSON.parse(saved) || {}) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`geometry_flags_${data?.clientId || 'default'}`, JSON.stringify(flags));
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

  const activeTab = forcedTab || activeTabState;
  const setActiveTab = (tab: 'bouwkundig' | 'overstek' | 'library' | 'bouwkundig-gevel' | 'bouwkundig-vloer' | 'bouwkundig-dak') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  const constructies = data.constructies || [];
  const kozijnen = data.kozijnen || [];

  const [elements, setElements] = useState([
    {
      id: 'front-gevel', label: 'Front gevel', area: '28.5', status: 'completed', type: 'Gevel',
      vloer: 'Begane Grondvloer', perimeter: '23.4', vloerIsolatie: 'Ja', platDakIsolatie: 'Niet van toepassing', grenstAanPlatDak: 'Niet van toepassing', areaPlatDak: '0.0',
      isolatie: 'Geisoleerd', orientatie: 'Noord', grenstAan: 'Buitenlucht', hellingshoek: '90', kozijnstaat: 'Goed',
      gevel: 'Recht', kozijn: 'Ja', belemmering: 'Geen', zonwering: 'Geen', kozijnenCount: '2'
    },
    {
      id: 'back-gevel', label: 'Back gevel', area: '32.1', status: 'warning', type: 'Gevel',
      vloer: 'Begane Grondvloer', perimeter: '26.8', vloerIsolatie: 'Ja', platDakIsolatie: 'Niet van toepassing', grenstAanPlatDak: 'Niet van toepassing', areaPlatDak: '0.0',
      isolatie: 'Geisoleerd', orientatie: 'Zuid', grenstAan: 'Buitenlucht', hellingshoek: '90', kozijnstaat: 'Goed',
      gevel: 'Recht', kozijn: 'Ja', belemmering: 'Geen', zonwering: 'Geen', kozijnenCount: '4'
    },
    {
      id: 'left-gevel', label: 'Left gevel', area: '24.8', status: 'completed', type: 'Gevel',
      vloer: 'Begane Grondvloer', perimeter: '18.2', vloerIsolatie: 'Ja', platDakIsolatie: 'Niet van toepassing', grenstAanPlatDak: 'Niet van toepassing', areaPlatDak: '0.0',
      isolatie: 'Geisoleerd', orientatie: 'Oost', grenstAan: 'Buitenlucht', hellingshoek: '90', kozijnstaat: 'Goed',
      gevel: 'Recht', kozijn: 'Ja', belemmering: 'Geen', zonwering: 'Geen', kozijnenCount: '2'
    },
    {
      id: 'right-gevel', label: 'Right gevel', area: '24.7', status: 'completed', type: 'Gevel',
      vloer: 'Begane Grondvloer', perimeter: '18.2', vloerIsolatie: 'Ja', platDakIsolatie: 'Niet van toepassing', grenstAanPlatDak: 'Niet van toepassing', areaPlatDak: '0.0',
      isolatie: 'Geisoleerd', orientatie: 'West', grenstAan: 'Buitenlucht', hellingshoek: '90', kozijnstaat: 'Goed',
      gevel: 'Recht', kozijn: 'Ja', belemmering: 'Geen', zonwering: 'Geen', kozijnenCount: '1'
    },
    {
      id: 'plat-dak', label: 'Plat Dak', area: '70.2', status: 'warning', type: 'Dak',
      vloer: 'Niet van toepassing', perimeter: '0.0', vloerIsolatie: 'Nee', platDakIsolatie: 'Geisoleerd', grenstAanPlatDak: 'Buitenlucht', areaPlatDak: '70.2',
      isolatie: 'Geisoleerd', orientatie: 'Horizontaal', grenstAan: 'Buitenlucht', hellingshoek: '0', kozijnstaat: 'Niet van toepassing',
      gevel: 'Horizontaal', kozijn: 'Nee', belemmering: 'Geen', zonwering: 'Geen', kozijnenCount: '0'
    },
    {
      id: 'hellend-dak', label: 'Hellend Dak', area: '58.4', status: 'todo', type: 'Dak',
      vloer: 'Niet van toepassing', perimeter: '0.0', vloerIsolatie: 'Nee', platDakIsolatie: 'Niet van toepassing', grenstAanPlatDak: 'Niet van toepassing', areaPlatDak: '0.0',
      isolatie: 'Niet geisoleerd', orientatie: 'Zuid', grenstAan: 'Buitenlucht', hellingshoek: '45', kozijnstaat: 'Goed',
      gevel: 'Schuin', kozijn: 'Nee', belemmering: 'Geen', zonwering: 'Geen', kozijnenCount: '0'
    },
    {
      id: 'vloer', label: 'Begane Grondvloer', area: '70.2', status: 'completed', type: 'Vloer',
      vloer: 'Begane Grondvloer', perimeter: '32.4', vloerIsolatie: 'Ja', platDakIsolatie: 'Niet van toepassing', grenstAanPlatDak: 'Niet van toepassing', areaPlatDak: '0.0',
      isolatie: 'Geisoleerd', orientatie: 'Horizontaal', grenstAan: 'Grond', hellingshoek: '0', kozijnstaat: 'Niet van toepassing',
      gevel: 'Horizontaal', kozijn: 'Nee', belemmering: 'Geen', zonwering: 'Geen', kozijnenCount: '0'
    },
  ]);

  const kozijnenLibrary = data.kozijnenLibrary || [
    { id: 'k1', naam: 'D1', width: '1.33', height: '2.46', area: '1.98', constructie: '1520 + 1920_Deur ongeïsoleerd (U = 3.40)' },
  ];

  const handleAddKozijnRow = () => {
    const newId = `k${kozijnenLibrary.length + 1}-${Date.now()}`;
    const nextRows = [...kozijnenLibrary, {
      id: newId,
      naam: '',
      width: '0',
      height: '0',
      area: '0.00',
      constructie: '1520 + 1920_Raam HR++ glas (Hout, U = 1.80, g = 0.60)'
    }];
    onChange('kozijnenLibrary', nextRows);
  };

  const getUniqueCopyName = (originalName: string, existingNames: string[], suffixFormat: string) => {
    if (!originalName) return '';
    const regex = new RegExp(`(.*)(?:\\s*(?:-|\\()\\s*(?:Kopie|Copy|kopie|copy)\\)?)\\s*(?:\\((\\d+)\\))?$`, 'i');

    let baseName = originalName;
    const match = originalName.match(regex);
    if (match) {
      baseName = match[1].trim().replace(/\s*\(\s*\)?$/, '').trim();
    }

    let index = 1;
    let nextName = `${baseName}${suffixFormat}`;
    if (existingNames.includes(nextName)) {
      while (existingNames.includes(nextName)) {
        index++;
        nextName = `${baseName}${suffixFormat} (${index})`;
      }
    }
    return nextName;
  };

  const handleCopyKozijnRow = (idx: number) => {
    const rowToCopy = kozijnenLibrary[idx];
    const newRows = [...kozijnenLibrary];
    const newId = `k${kozijnenLibrary.length + 1}-${Date.now()}`;
    const uniqueName = getUniqueCopyName(rowToCopy.naam, kozijnenLibrary.map(k => k.naam), ' (Kopie)');
    newRows.splice(idx + 1, 0, { ...rowToCopy, id: newId, naam: uniqueName });
    onChange('kozijnenLibrary', newRows);
  };

  const handleDeleteKozijnRow = (idx: number) => {
    const nextRows = kozijnenLibrary.filter((_, i) => i !== idx);
    onChange('kozijnenLibrary', nextRows);
  };

  const bouwkundigRows = data.bouwkundigRows || [
    { kozijnIds: [] as string[], constructieId: 'c1', type: 'Gevel', kozijnArea: '0.00', gevel: 'Achtergevel', gevelIsolatie: '...', orientation: 'Z', grenstAan: 'Buitenlucht', breedte: '5.00', hoogte: '3.04', oppervlakte: '15.20', hellingshoek: '90', kozijn: '', naam: 'Achtergevel', invoer: 'Archiefonderzoek', rc: '2.5', perimeter: '' },
    { kozijnIds: [] as string[], constructieId: 'c2', type: 'Vloer', kozijnArea: '0.00', gevel: '', gevelIsolatie: 'Ja', orientation: '', grenstAan: 'Kruipruimte', breedte: '10.00', hoogte: '7.02', oppervlakte: '70.20', hellingshoek: '0', kozijn: '', naam: 'Begane Grondvloer', invoer: 'Archiefonderzoek', rc: '5.71', perimeter: '32.4' }
  ];

  const handleAddGevelRow = () => {
    const newIdx = bouwkundigRows.length;
    const nextRows = [...bouwkundigRows, {
      kozijnIds: [],
      constructieId: '',
      type: 'Gevel',
      kozijnArea: '0.00',
      gevel: '',
      gevelIsolatie: '',
      orientation: '',
      grenstAan: 'Buitenlucht',
      breedte: '',
      hoogte: '',
      oppervlakte: '',
      hellingshoek: '90',
      kozijn: '',
      naam: 'Nieuwe Gevel',
      invoer: 'Archiefonderzoek',
      rc: '',
      perimeter: ''
    }];
    onChange('bouwkundigRows', nextRows);
    setTempKozijnLinks({});
    setEditingGevelRowIdx(newIdx);
  };

  const handleAddVloerRow = () => {
    const newIdx = bouwkundigRows.length;
    const nextRows = [...bouwkundigRows, {
      kozijnIds: [],
      constructieId: '',
      type: 'Vloer',
      kozijnArea: '0.00',
      gevel: '',
      gevelIsolatie: 'Ja',
      orientation: '',
      grenstAan: 'Kruipruimte',
      breedte: '',
      hoogte: '',
      oppervlakte: '',
      hellingshoek: '0',
      kozijn: '',
      naam: 'Nieuwe Vloer',
      invoer: 'Archiefonderzoek',
      rc: '',
      perimeter: ''
    }];
    onChange('bouwkundigRows', nextRows);
    setEditingVloerRowIdx(newIdx);
  };

  const handleAddDakRow = () => {
    const newIdx = bouwkundigRows.length;
    const nextRows = [...bouwkundigRows, {
      kozijnIds: [] as string[],
      constructieId: '',
      type: 'Dak',
      kozijnArea: '0.00',
      gevel: '',
      gevelIsolatie: 'Ja',
      orientation: '',
      grenstAan: 'Buitenlucht',
      breedte: '',
      hoogte: '',
      oppervlakte: '',
      hellingshoek: '45',
      kozijn: '',
      naam: 'Nieuw Dak',
      invoer: 'Archiefonderzoek',
      rc: '',
      perimeter: ''
    }];
    onChange('bouwkundigRows', nextRows);
    setEditingDakRowIdx(newIdx);
  };

  const handleEditGevelClick = (idx: number, rowGevel: string) => {
    const links: Record<string, boolean> = {};
    const currentKozijnen = data.kozijnen || [];
    currentKozijnen.forEach(k => {
      links[k.id] = !!(rowGevel && k.gevel && k.gevel.split(',').map(s => s.trim()).includes(rowGevel));
    });
    setTempKozijnLinks(links);
    setEditingGevelRowIdx(idx);
  };

  const handleEditVloerClick = (idx: number) => {
    setEditingVloerRowIdx(idx);
  };

  const handleEditDakClick = (idx: number) => {
    setEditingDakRowIdx(idx);
  };

  const handleCopyBouwkundigRow = (idx: number) => {
    const rowToCopy = bouwkundigRows[idx];
    const newRows = [...bouwkundigRows];
    const uniqueName = getUniqueCopyName(rowToCopy.naam, bouwkundigRows.map(r => r.naam), ' Kopie');
    let updatedGevel = rowToCopy.gevel;
    if (rowToCopy.type === 'Gevel' && rowToCopy.gevel) {
      updatedGevel = getUniqueCopyName(rowToCopy.gevel, bouwkundigRows.map(r => r.gevel), ' Kopie');
    }

    let nextConstructieId = rowToCopy.constructieId;
    if (rowToCopy.constructieId && onConstructieChange) {
      const linkedC = constructies.find(c => c.id === rowToCopy.constructieId);
      if (linkedC) {
        const newCId = `c-copy-${Date.now()}`;
        const duplicatedC = {
          ...linkedC,
          id: newCId,
          naam: getUniqueCopyName(linkedC.naam, constructies.map(c => c.naam), ' Kopie'),
          photos: linkedC.photos ? [...linkedC.photos] : undefined
        };
        nextConstructieId = newCId;
        onConstructieChange([...constructies, duplicatedC]);
      }
    }

    newRows.splice(idx + 1, 0, {
      ...rowToCopy,
      naam: uniqueName,
      gevel: updatedGevel,
      constructieId: nextConstructieId
    });
    onChange('bouwkundigRows', newRows);
  };

  const handleDeleteBouwkundigRow = (idx: number) => {
    const nextRows = bouwkundigRows.filter((_, i) => i !== idx);
    onChange('bouwkundigRows', nextRows);
  };

  const updateBouwkundigCell = (idx: number, field: keyof typeof bouwkundigRows[0], value: any) => {
    const nextRows = bouwkundigRows.map((row, i) => i === idx ? { ...row, [field]: value } : row);
    onChange('bouwkundigRows', nextRows);
  };

  const overstekRows = data.overstekRows || [
    { folder: '1520 + 1920', revit: '1520-1', type: 'NLS', kozijnId: 'k1', constructieId: 'c4', kozijnArea: '0.00', gevel: 'Achtergevel', hbdiff: '2.172', hbdist: '6.026', hb: '0.360', bbaf: '5.408', bbbr: '2.660', bb: '2.033', hodiff: '', hodist: '', ho: '', conclusion: 'Overige belemmering', zonwering: 'Geen zonwering' }
  ];

  const handleAddOverstekRow = () => {
    const nextRows = [...overstekRows, {
      folder: '', revit: '', type: '', kozijnId: '', constructieId: '', kozijnArea: '0.00', gevel: 'Voorgevel', hbdiff: '', hbdist: '', hb: '', bbaf: '', bbbr: '', bb: '', hodiff: '', hodist: '', ho: '', conclusion: 'Automatisch', zonwering: 'Geen zonwering'
    }];
    onChange('overstekRows', nextRows);
    setEditingOverstekRowIdx(nextRows.length - 1);
  };

  const handleCopyOverstekRow = (idx: number) => {
    const rowToCopy = overstekRows[idx];
    const newRows = [...overstekRows];
    newRows.splice(idx + 1, 0, { ...rowToCopy });
    onChange('overstekRows', newRows);
  };

  const handleDeleteOverstekRow = (idx: number) => {
    const nextRows = overstekRows.filter((_, i) => i !== idx);
    onChange('overstekRows', nextRows);
  };

  const updateOverstekCell = (idx: number, field: keyof typeof overstekRows[0], value: string) => {
    const nextRows = overstekRows.map((row, i) => i === idx ? { ...row, [field]: value } : row);
    onChange('overstekRows', nextRows);
  };

  const handlePhotoUpload = (constructieId: string, file: File) => {
    if (!onConstructieChange) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const updated = (data.constructies || []).map(c =>
        c.id === constructieId
          ? { ...c, photoUrl: dataUrl, photoTag: `[${c.type}] ${c.naam}` }
          : c
      );
      onConstructieChange(updated);
    };
    reader.readAsDataURL(file);
  };

  const updateElement = (id: string, field: string, value: string) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, [field]: value } : el));
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'Dak': return <Box size={24} className="text-on-surface-variant/40" />;
      case 'Vloer': return <Layers size={24} className="text-on-surface-variant/40" />;
      default: return <Home size={24} className="text-on-surface-variant/40" />;
    }
  };

  const selectedElement = elements.find(e => e.id === selectedId) || elements[0];

  const isBouwkundigView = activeTab === 'bouwkundig' || activeTab === 'bouwkundig-gevel' || activeTab === 'bouwkundig-vloer' || activeTab === 'bouwkundig-dak';
  const currentBouwkundigRows = bouwkundigRows.filter(row => {
    if (activeTab === 'bouwkundig-gevel') return row.type === 'Gevel';
    if (activeTab === 'bouwkundig-vloer') return row.type === 'Vloer';
    if (activeTab === 'bouwkundig-dak') return row.type === 'Dak';
    return true;
  });

  const getConstructieOptions = (type: string) => {
    return constructies.filter(c => c.type === type);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-var(--app-topbar-height))] w-full">
      {/* 1. Sidebar Navigator */}
      {!isBouwkundigView && activeTab !== 'overstek' && (
        <div className="w-full md:w-52 shrink-0 flex flex-col bg-white border border-outline-variant/10 rounded-2xl shadow-sm overflow-hidden h-fit">
          <div className="p-3 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50">
            <span className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-wider">Bouwkundig Elements</span>
            <button type="button" className="flex items-center gap-1 text-[10px] font-black text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer">
              <Plus size={12} /> Add Element
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {elements.map((el) => (
              <button
                key={el.id}
                type="button"
                onClick={() => setSelectedId(el.id)}
                className={`w-full group px-4 py-3 text-left transition-all border-l-4 flex items-center gap-3 cursor-pointer ${selectedId === el.id
                    ? 'bg-primary/5 border-primary'
                    : 'border-transparent hover:bg-gray-50'
                  }`}
              >
                <div className={`p-1.5 rounded-xl border ${selectedId === el.id ? 'bg-white border-primary/20 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                  {getElementIcon(el.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-black ${selectedId === el.id ? 'text-gray-900' : 'text-on-surface-variant/70'}`}>{el.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant/40 font-bold">Area: {el.area} m²</span>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* 2. Main Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {forcedTab === 'overstek' && (
          <div className="pb-2">
            <h1 className="text-3xl font-black text-on-background tracking-tight">{t('nav.overstek')}</h1>
          </div>
        )}
        {forcedTab === 'bouwkundig-gevel' && (
          <div className="pb-2">
            <h1 className="text-3xl font-black text-on-background tracking-tight">{t('nav.gevel')}</h1>
          </div>
        )}
        {forcedTab === 'bouwkundig-vloer' && (
          <div className="pb-2">
            <h1 className="text-3xl font-black text-on-background tracking-tight">{t('nav.vloer')}</h1>
          </div>
        )}
        {forcedTab === 'bouwkundig-dak' && (
          <div className="pb-2">
            <h1 className="text-3xl font-black text-on-background tracking-tight">{t('nav.dak')}</h1>
          </div>
        )}

        {/* Workspace Header */}
        {!isBouwkundigView && activeTab !== 'overstek' && (
          <div className="bg-white border border-outline-variant/10 p-4 rounded-2xl flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 border border-outline-variant/10 rounded-xl">
                  {getElementIcon(selectedElement.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black text-on-background leading-tight">{selectedElement.label}</h1>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-black rounded-full uppercase tracking-wide">
                      In Progress
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/40 font-bold mt-0.5">Ref: GE-{selectedId.toUpperCase()}</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-gray-150 p-1 rounded-xl border border-outline-variant/5 overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('bouwkundig')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shrink-0 ${(activeTab as string) === 'bouwkundig' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant/60'
                    }`}
                >
                  {t('geometry.bouwkundigData')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('overstek')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shrink-0 ${(activeTab as string) === 'overstek' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant/60'
                    }`}
                >
                  {t('nav.overstek')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shrink-0 ${activeTab === 'library' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant/60'
                    }`}
                >
                  {t('geometry.library')}
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button type="button" className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant/15 text-on-surface-variant/70 text-[10px] font-black hover:bg-gray-50 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider">
                  <Eye size={12} /> Preview
                </button>
                <button type="button" className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant/15 text-on-surface-variant/70 text-[10px] font-black hover:bg-gray-50 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider">
                  <ShieldCheck size={12} /> Validate
                </button>
                <button type="button" className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-[10px] font-black rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider active:scale-[0.98]">
                  <Save size={12} /> Save
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-outline-variant/10">
              <SummaryCard label="Perimeter" value={`${selectedElement.perimeter} m`} />
              <SummaryCard label="Grenst aan" value={selectedElement.grenstAan} />
              <SummaryCard label="Linked Kozijnen" value={selectedElement.kozijnenCount} />
              <SummaryCard label="Last Updated" value="14-05-2024" />
            </div>
          </div>
        )}

        {/* Workspace Content */}
        <div className="flex-grow flex flex-col md:flex-row gap-4 items-start w-full">
          {/* Constant Panel: Geometry Data */}
          {!isBouwkundigView && activeTab !== 'overstek' && (
            <div className="w-full md:w-64 bg-white border border-outline-variant/10 rounded-2xl flex flex-col shadow-sm shrink-0">
              <div className="p-3.5 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-black text-xs font-mono">1.</span>
                  <span className="text-xs font-black text-on-surface-variant/70 uppercase tracking-wider">Bouwkundig Data</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <VerticalFieldGroup label={selectedElement.label}>
                  <select
                    className="input-field cursor-pointer"
                    value={selectedElement.vloer || ''}
                    onChange={(e) => updateElement(selectedId, 'vloer', e.target.value)}
                  >
                    <option>Begane Grondvloer</option>
                    <option>Eerste Verdieping</option>
                    <option>Niet van toepassing</option>
                  </select>
                </VerticalFieldGroup>
                <VerticalFieldGroup label="Perimeter (m²)">
                  <input
                    className="input-field font-mono font-bold"
                    value={selectedElement.perimeter || ''}
                    onChange={(e) => updateElement(selectedId, 'perimeter', e.target.value)}
                  />
                </VerticalFieldGroup>
                <VerticalFieldGroup label="Vloer isolatie">
                  <select
                    className="input-field cursor-pointer"
                    value={selectedElement.vloerIsolatie || ''}
                    onChange={(e) => updateElement(selectedId, 'vloerIsolatie', e.target.value)}
                  >
                    <option>Ja</option>
                    <option>Nee</option>
                  </select>
                </VerticalFieldGroup>
                <VerticalFieldGroup label="PlatDak Isolatie">
                  <select
                    className="input-field cursor-pointer"
                    value={selectedElement.platDakIsolatie || ''}
                    onChange={(e) => updateElement(selectedId, 'platDakIsolatie', e.target.value)}
                  >
                    <option>Niet van toepassing</option>
                    <option>Geisoleerd</option>
                    <option>Niet geisoleerd</option>
                  </select>
                </VerticalFieldGroup>
                <VerticalFieldGroup label="Grenst aan - PlatDAK">
                  <select
                    className="input-field cursor-pointer"
                    value={selectedElement.grenstAanPlatDak || ''}
                    onChange={(e) => updateElement(selectedId, 'grenstAanPlatDak', e.target.value)}
                  >
                    <option>Niet van toepassing</option>
                    <option>Buitenlucht</option>
                    <option>Andere woning</option>
                  </select>
                </VerticalFieldGroup>
                <VerticalFieldGroup label="AREA - PlatDAK (m²)">
                  <input
                    className="input-field font-mono font-bold text-right"
                    value={selectedElement.areaPlatDak || ''}
                    onChange={(e) => updateElement(selectedId, 'areaPlatDak', e.target.value)}
                  />
                </VerticalFieldGroup>
              </div>
            </div>
          )}

          <div className="flex-1 bg-white border border-outline-variant/10 rounded-2xl shadow-sm flex flex-col overflow-hidden w-full">
            {isBouwkundigView && (
              <div className="flex flex-col w-full">
                <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50 shrink-0">
                  <div className="flex items-center gap-2">
                    {!forcedTab && (
                      <>
                        <span className="text-primary font-black text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded-md">2.</span>
                        <span className="text-xs font-black text-on-surface-variant/70 uppercase tracking-wider">
                          {activeTab === 'bouwkundig-gevel' ? t('geometry.gevelData') :
                            activeTab === 'bouwkundig-vloer' ? t('geometry.vloerData') :
                              activeTab === 'bouwkundig-dak' ? t('geometry.dakData') : t('geometry.bouwkundigData')}
                        </span>
                        {(() => {
                          const activeCategory = activeTab === 'bouwkundig-gevel' ? 'Gevel' : activeTab === 'bouwkundig-vloer' ? 'Vloer' : activeTab === 'bouwkundig-dak' ? 'Dak' : '';
                          if (!activeCategory) return null;
                          const count = constructies.filter(c => c.type === activeCategory && c.photoUrl).length;
                          if (count === 0) return null;
                          return (
                            <span className="flex items-center gap-1 text-[9px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full select-none">
                              <Camera size={10} />
                              <span>{count} {t('geometry.linked')}</span>
                            </span>
                          );
                        })()}
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={activeTab === 'bouwkundig-dak' ? handleAddDakRow :
                      activeTab === 'bouwkundig-vloer' ? handleAddVloerRow :
                        handleAddGevelRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                  >
                    <Plus size={14} /> {t('geometry.add', { type: activeTab === 'bouwkundig-dak' ? t('structural.roof').toLowerCase() : activeTab === 'bouwkundig-vloer' ? t('structural.floor').toLowerCase() : t('structural.facade').toLowerCase() })}
                  </button>
                </div>

                <div className="overflow-x-auto w-full">
                  {activeTab === 'bouwkundig-gevel' && (
                    <table className="w-full min-w-[1000px] text-left border-collapse border-spacing-0">
                      <thead>
                        <tr className="bg-gray-50 border-b border-outline-variant/10">
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 bg-gray-50 uppercase tracking-wider">Naam</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('kozijn.constructie')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.facade')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.orientation')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('geometry.adjacentTo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('kozijn.width')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('kozijn.height')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('geometry.surfaceArea') || 'Area (m²)'}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('nav.kozijn')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center uppercase tracking-wider">{t('structural.photo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-24 text-center uppercase tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-16 text-center uppercase tracking-wider">{t('structural.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/5">
                        {currentBouwkundigRows.map((row, idx) => {
                          const originalIdx = bouwkundigRows.indexOf(row);
                          const linkedConstructie = constructies.find(c => c.id === row.constructieId);
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-primary/5 cursor-pointer group transition-colors select-none text-xs"
                              onClick={() => handleEditGevelClick(originalIdx, row.gevel)}
                            >
                              <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 text-on-surface-variant/80">
                                {row.naam || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {linkedConstructie?.naam || (
                                  <span className="text-on-surface-variant/40 italic font-bold">Geen constructie gekoppeld</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.gevel || <span className="text-on-surface-variant/40 italic font-bold">Niet opgegeven</span>}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.orientation || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.grenstAan || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.breedte || '-'}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.hoogte || '-'}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">{row.oppervlakte ? `${parseFloat(row.oppervlakte).toFixed(2)} m²` : '0.00 m²'}</td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.gevel && kozijnen.filter(k => k.gevel && k.gevel.split(',').map(s => s.trim()).includes(row.gevel)).length > 0
                                  ? kozijnen.filter(k => k.gevel && k.gevel.split(',').map(s => s.trim()).includes(row.gevel)).map(k => k.naam).filter(Boolean).join(', ')
                                  : <span className="text-on-surface-variant/30 italic">—</span>}
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-20">
                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                  {(() => {
                                      const allPhotos = [
                                        ...(row.photos || []),
                                        ...(row.photoUrl ? [row.photoUrl] : [])
                                      ].filter((p, i, arr) => arr.indexOf(p) === i);

                                      if (allPhotos.length > 0) {
                                        return (
                                          <div
                                            className="relative group/pic cursor-pointer"
                                            onClick={() => openLightbox(allPhotos, 0, (linkedConstructie?.naam || row.naam))}
                                          >
                                            <img
                                              src={allPhotos[0]}
                                              alt={linkedConstructie?.naam || row.naam}
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
                                      <label className="flex flex-col items-center gap-1 cursor-pointer group/upload">
                                        <Camera size={14} className="text-on-surface-variant/40 group-hover/upload:text-primary transition-colors" />
                                        <span className="text-[8px] font-black uppercase text-on-surface-variant/40 group-hover/upload:text-primary tracking-wider transition-colors">
                                          Upload
                                        </span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => handleDirectUpload(row.type, row.constructieId, idx, e)}
                                        />
                                      </label>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-center">
                                  <AppFlagPicker
                                    value={flags[`bouwkundig_${originalIdx}`]}
                                    onChange={(val) => toggleFlag(`bouwkundig_${originalIdx}`, val)}
                                    size="sm"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-16">
                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                    title="Copy row"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                                    title="Delete row"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'bouwkundig-vloer' && (
                    <table className="w-full min-w-[1000px] text-left border-collapse border-spacing-0">
                      <thead>
                        <tr className="bg-gray-50 border-b border-outline-variant/10">
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 bg-gray-50 uppercase tracking-wider">Naam</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('kozijn.constructie')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('geometry.adjacentTo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('kozijn.width')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('kozijn.height')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('geometry.surfaceArea') || 'Area (m²)'}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('geometry.perimeter')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center uppercase tracking-wider">{t('structural.photo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-24 text-center uppercase tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-16 text-center uppercase tracking-wider">{t('structural.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/5">
                        {currentBouwkundigRows.map((row, idx) => {
                          const originalIdx = bouwkundigRows.indexOf(row);
                          const linkedConstructie = constructies.find(c => c.id === row.constructieId);
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-primary/5 cursor-pointer group transition-colors select-none text-xs"
                              onClick={() => handleEditVloerClick(originalIdx)}
                            >
                              <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 text-on-surface-variant/80">
                                {row.naam || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {linkedConstructie?.naam || (
                                  <span className="text-on-surface-variant/40 italic font-bold">Geen constructie gekoppeld</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.grenstAan || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.breedte || '-'}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.hoogte || '-'}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">{row.oppervlakte ? `${parseFloat(row.oppervlakte).toFixed(2)} m²` : '0.00 m²'}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">
                                {row.perimeter ? `${parseFloat(row.perimeter).toFixed(2)} m²` : <span className="text-on-surface-variant/30 italic">—</span>}
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-20">
                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                  {(() => {
                                      const allPhotos = [
                                        ...(row.photos || []),
                                        ...(row.photoUrl ? [row.photoUrl] : [])
                                      ].filter((p, i, arr) => arr.indexOf(p) === i);

                                      if (allPhotos.length > 0) {
                                        return (
                                          <div
                                            className="relative group/pic cursor-pointer"
                                            onClick={() => openLightbox(allPhotos, 0, (linkedConstructie?.naam || row.naam))}
                                          >
                                            <img
                                              src={allPhotos[0]}
                                              alt={linkedConstructie?.naam || row.naam}
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
                                      <label className="flex flex-col items-center gap-1 cursor-pointer group/upload">
                                        <Camera size={14} className="text-on-surface-variant/40 group-hover/upload:text-primary transition-colors" />
                                        <span className="text-[8px] font-black uppercase text-on-surface-variant/40 group-hover/upload:text-primary tracking-wider transition-colors">
                                          Upload
                                        </span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => handleDirectUpload(row.type, row.constructieId, idx, e)}
                                        />
                                      </label>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-center">
                                  <AppFlagPicker
                                    value={flags[`bouwkundig_${originalIdx}`]}
                                    onChange={(val) => toggleFlag(`bouwkundig_${originalIdx}`, val)}
                                    size="sm"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-16">
                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                    title="Copy row"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                                    title="Delete row"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'bouwkundig-dak' && (
                    <table className="w-full min-w-[1000px] text-left border-collapse border-spacing-0">
                      <thead>
                        <tr className="bg-gray-50 border-b border-outline-variant/10">
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 bg-gray-50 uppercase tracking-wider">Naam</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('kozijn.constructie')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.orientation')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('geometry.adjacentTo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('kozijn.width')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('kozijn.height')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('geometry.surfaceArea') || 'Area (m²)'}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('geometry.slopeAngle')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('nav.kozijn')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center uppercase tracking-wider">{t('structural.photo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-24 text-center uppercase tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-16 text-center uppercase tracking-wider">{t('structural.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/5">
                        {currentBouwkundigRows.map((row, idx) => {
                          const originalIdx = bouwkundigRows.indexOf(row);
                          const linkedConstructie = constructies.find(c => c.id === row.constructieId);
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-primary/5 cursor-pointer group transition-colors select-none text-xs"
                              onClick={() => handleEditDakClick(originalIdx)}
                            >
                              <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 text-on-surface-variant/80">
                                {row.naam || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {linkedConstructie?.naam || (
                                  <span className="text-on-surface-variant/40 italic font-bold">Geen constructie gekoppeld</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.orientation || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.grenstAan || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.breedte || '-'}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.hoogte || '-'}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">{row.oppervlakte ? `${parseFloat(row.oppervlakte).toFixed(2)} m²` : '0.00 m²'}</td>
                              <td className="px-4 py-3.5 text-center font-semibold text-on-surface-variant font-mono">
                                {row.hellingshoek ? `${row.hellingshoek}°` : '0°'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.naam && kozijnen.filter(k => k.gevel && k.gevel.split(',').map(s => s.trim()).includes(row.naam)).length > 0
                                  ? kozijnen.filter(k => k.gevel && k.gevel.split(',').map(s => s.trim()).includes(row.naam)).map(k => k.naam).filter(Boolean).join(', ')
                                  : <span className="text-on-surface-variant/30 italic">—</span>}
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-20">
                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                  {(() => {
                                      const allPhotos = [
                                        ...(row.photos || []),
                                        ...(row.photoUrl ? [row.photoUrl] : [])
                                      ].filter((p, i, arr) => arr.indexOf(p) === i);

                                      if (allPhotos.length > 0) {
                                        return (
                                          <div
                                            className="relative group/pic cursor-pointer"
                                            onClick={() => openLightbox(allPhotos, 0, (linkedConstructie?.naam || row.naam))}
                                          >
                                            <img
                                              src={allPhotos[0]}
                                              alt={linkedConstructie?.naam || row.naam}
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
                                      <label className="flex flex-col items-center gap-1 cursor-pointer group/upload">
                                        <Camera size={14} className="text-on-surface-variant/40 group-hover/upload:text-primary transition-colors" />
                                        <span className="text-[8px] font-black uppercase text-on-surface-variant/40 group-hover/upload:text-primary tracking-wider transition-colors">
                                          Upload
                                        </span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => handleDirectUpload(row.type, row.constructieId, idx, e)}
                                        />
                                      </label>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-center">
                                  <AppFlagPicker
                                    value={flags[`bouwkundig_${originalIdx}`]}
                                    onChange={(val) => toggleFlag(`bouwkundig_${originalIdx}`, val)}
                                    size="sm"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-16">
                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                    title="Copy row"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                                    title="Delete row"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'bouwkundig' && (
                    <table className="w-full min-w-[1000px] text-left border-collapse border-spacing-0">
                      <thead>
                        <tr className="bg-gray-50 border-b border-outline-variant/10">
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 bg-gray-50 uppercase tracking-wider">Naam</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('kozijn.constructie')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">Isolatie</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('structural.orientation')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('geometry.adjacentTo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 text-right uppercase tracking-wider">{t('geometry.surfaceArea')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center uppercase tracking-wider">{t('structural.photo')}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-24 text-center uppercase tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-16 text-center uppercase tracking-wider">{t('structural.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/5">
                        {currentBouwkundigRows.map((row, idx) => {
                          const originalIdx = bouwkundigRows.indexOf(row);
                          const linkedConstructie = constructies.find(c => c.id === row.constructieId);
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-primary/5 cursor-pointer group transition-colors select-none text-xs"
                              onClick={
                                row.type === 'Gevel' ? () => handleEditGevelClick(originalIdx, row.gevel) :
                                  row.type === 'Vloer' ? () => handleEditVloerClick(originalIdx) :
                                    () => handleEditDakClick(originalIdx)
                              }
                            >
                              <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 text-on-surface-variant/80">
                                {row.naam || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {linkedConstructie?.naam || (
                                  <span className="text-on-surface-variant/40 italic font-bold">Geen constructie gekoppeld</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {linkedConstructie ? (linkedConstructie.isolatie === 'Ja' ? 'Ja (Geïsoleerd)' : linkedConstructie.isolatie) : (row.gevelIsolatie || '-')}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.orientation || '-'}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-on-surface-variant">
                                {row.grenstAan || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">
                                {row.oppervlakte ? `${parseFloat(row.oppervlakte).toFixed(2)} m²` : '0.00 m²'}
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-20">
                                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                  {(() => {
                                      const allPhotos = [
                                        ...(row.photos || []),
                                        ...(row.photoUrl ? [row.photoUrl] : [])
                                      ].filter((p, i, arr) => arr.indexOf(p) === i);

                                      if (allPhotos.length > 0) {
                                        return (
                                          <div
                                            className="relative group/pic cursor-pointer"
                                            onClick={() => openLightbox(allPhotos, 0, (linkedConstructie?.naam || row.naam))}
                                          >
                                            <img
                                              src={allPhotos[0]}
                                              alt={linkedConstructie?.naam || row.naam}
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
                                      <label className="flex flex-col items-center gap-1 cursor-pointer group/upload">
                                        <Camera size={14} className="text-on-surface-variant/40 group-hover/upload:text-primary transition-colors" />
                                        <span className="text-[8px] font-black uppercase text-on-surface-variant/40 group-hover/upload:text-primary tracking-wider transition-colors">
                                          Upload
                                        </span>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => handleDirectUpload(row.type, row.constructieId, idx, e)}
                                        />
                                      </label>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-center">
                                  <AppFlagPicker
                                    value={flags[`bouwkundig_${originalIdx}`]}
                                    onChange={(val) => toggleFlag(`bouwkundig_${originalIdx}`, val)}
                                    size="sm"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5 w-16">
                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={row.type === 'Gevel' ? () => handleEditGevelClick(originalIdx, row.gevel) : row.type === 'Vloer' ? () => handleEditVloerClick(originalIdx) : () => handleEditDakClick(originalIdx)}
                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                    title="Edit details"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                    title="Copy row"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBouwkundigRow(originalIdx)}
                                    className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                                    title="Delete row"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'overstek' && (
              <div className="flex flex-col w-full overflow-hidden">
                <div className="p-4 flex items-center justify-end bg-white shrink-0">
                  <button
                    type="button"
                    onClick={handleAddOverstekRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                  >
                    <Plus size={14} /> {t('overstek.addDetail')}
                  </button>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[1400px] text-left border-collapse border-spacing-0">
                    <thead>
                      <tr className="bg-gray-50 border-b border-outline-variant/10">
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider bg-gray-50">{t('overstek.selectGevel')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('overstek.kozijn')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.hbDiff')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.hbDist')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.hb')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.bbAfstand')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.bbBreedte')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.bb')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.hoDiff')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.hoDist')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider text-right">{t('overstek.ho')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('overstek.conclusionTitle')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider">{t('overstek.zonweringTitle')}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-24 text-center uppercase tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</th>
                        <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-16 text-center uppercase tracking-wider bg-white">{t('structural.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {overstekRows.map((row, idx) => {
                        const linkedKozijn = kozijnen.find(k => k.id === row.kozijnId);
                        const translatedGevel = row.gevel === 'Voorgevel' ? t('kozijn.options.location.voor') + 'gevel' :
                          row.gevel === 'Achtergevel' ? t('kozijn.options.location.achter') + 'gevel' :
                            row.gevel === 'Linkergevel' ? t('kozijn.options.location.links') + 'gevel' :
                              row.gevel === 'Rechtergevel' ? t('kozijn.options.location.rechts') + 'gevel' :
                                row.gevel;
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-primary/5 cursor-pointer group transition-colors select-none text-xs"
                            onClick={() => setEditingOverstekRowIdx(idx)}
                          >
                            <td className="px-4 py-3.5 bg-white group-hover:bg-primary/5 text-on-surface-variant/80">{translatedGevel || '-'}</td>
                            <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{linkedKozijn ? linkedKozijn.naam : '-'}</td>

                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.hbdiff || '-'}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.hbdist || '-'}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">{row.hb || '-'}</td>

                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.bbaf || '-'}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.bbbr || '-'}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">{row.bb || '-'}</td>

                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.hodiff || '-'}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant">{row.hodist || '-'}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-on-surface-variant font-mono">{row.ho || '-'}</td>

                            <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{row.conclusion ? translateOverstekOption(row.conclusion, t) : '-'}</td>
                            <td className="px-4 py-3.5 font-semibold text-on-surface-variant">{row.zonwering ? translateOverstekOption(row.zonwering, t) : '-'}</td>

                            <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-center">
                                <AppFlagPicker
                                  value={flags[`overstek_${idx}`]}
                                  onChange={(val) => toggleFlag(`overstek_${idx}`, val)}
                                  size="sm"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center bg-white group-hover:bg-primary/5" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={() => handleCopyOverstekRow(idx)} className="p-1.5 text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="Copy row"><Copy size={13} /></button>
                                <button type="button" onClick={() => handleDeleteOverstekRow(idx)} className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete row"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="flex flex-col w-full">
                <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-gray-50 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-black text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded-md">L.</span>
                    <span className="text-xs font-black text-on-surface-variant/70 uppercase tracking-wider">Kozijn Library</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange('kozijnenLibrary', [...kozijnenLibrary, { id: Date.now().toString(), naam: 'Nieuw Kozijn', width: '0', height: '0', area: '0.00', constructie: 'Onbekend' }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                  >
                    <Plus size={14} /> Add Kozijn Definition
                  </button>
                </div>
                <div className="p-4 overflow-x-auto w-full">
                  <div className="overflow-hidden border border-outline-variant/10 rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-outline-variant/10">
                          <th className="px-4 py-3 text-on-surface-variant/50 font-black uppercase tracking-wider">Naam</th>
                          <th className="px-4 py-3 text-on-surface-variant/50 font-black uppercase tracking-wider">Width (mm)</th>
                          <th className="px-4 py-3 text-on-surface-variant/50 font-black uppercase tracking-wider">Height (mm)</th>
                          <th className="px-4 py-3 text-on-surface-variant/50 font-black uppercase tracking-wider text-right">Area (m²)</th>
                          <th className="px-4 py-3 text-on-surface-variant/50 font-black uppercase tracking-wider">Constructie</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-20 text-center uppercase tracking-wider">Photo</th>
                          <th className="px-4 py-3 text-[10px] font-black text-on-surface-variant/60 w-24 text-center uppercase tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</th>
                          <th className="px-4 py-3 text-on-surface-variant/50 font-black uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/5">
                        {kozijnenLibrary.map((kz, iIdx) => (
                          <tr key={kz.id} className="hover:bg-primary/5 transition-colors font-semibold text-xs select-none">
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 text-on-surface-variant/80 p-0 font-bold"
                                value={kz.naam || ''}
                                onChange={(e) => onChange('kozijnenLibrary', kozijnenLibrary.map(item => item.id === kz.id ? { ...item, naam: e.target.value } : item))}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 text-on-surface-variant p-0 font-bold"
                                value={kz.width || ''}
                                onChange={(e) => {
                                  const newWidth = e.target.value;
                                  onChange('kozijnenLibrary', kozijnenLibrary.map(item => {
                                    if (item.id === kz.id) {
                                      const w = parseFloat(newWidth) || 0;
                                      const h = parseFloat(item.height) || 0;
                                      return { ...item, width: newWidth, area: (w * h).toFixed(2) };
                                    }
                                    return item;
                                  }));
                                }}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 text-on-surface-variant p-0 font-bold"
                                value={kz.height || ''}
                                onChange={(e) => {
                                  const newHeight = e.target.value;
                                  onChange('kozijnenLibrary', kozijnenLibrary.map(item => {
                                    if (item.id === kz.id) {
                                      const w = parseFloat(item.width) || 0;
                                      const h = parseFloat(newHeight) || 0;
                                      return { ...item, height: newHeight, area: (w * h).toFixed(2) };
                                    }
                                    return item;
                                  }));
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-black text-primary">
                              <input
                                className="w-full bg-transparent border-none focus:ring-0 text-right p-0 font-bold"
                                value={kz.area || ''}
                                readOnly
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                className="bg-transparent border-none focus:ring-0 text-on-surface-variant/80 p-0 appearance-none font-bold cursor-pointer"
                                value={kz.constructie || 'Kunststof'}
                                onChange={(e) => onChange('kozijnenLibrary', kozijnenLibrary.map(item => item.id === kz.id ? { ...item, constructie: e.target.value } : item))}
                              >
                                <option>Kunststof</option>
                                <option>Hout</option>
                                <option>Aluminium</option>
                                <option>Staal</option>
                                <option>Onbekend</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {(() => {
                                const allPhotos = [
                                  ...((kz as any).photos || []),
                                  ...((kz as any).photoUrl ? [(kz as any).photoUrl] : [])
                                ].filter((p, i, arr) => arr.indexOf(p) === i);

                                if (allPhotos.length > 0) {
                                  return (
                                    <div
                                      className="relative group/pic cursor-pointer inline-block"
                                      onClick={() => openLightbox(allPhotos, 0, kz.naam)}
                                    >
                                      <img
                                        src={allPhotos[0]}
                                        alt={kz.naam}
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
                                      onChange={(e) => handleKozijnUpload(iIdx, e)}
                                    />
                                  </label>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-center">
                                <AppFlagPicker
                                  value={flags[`library_${kz.id}`]}
                                  onChange={(val) => toggleFlag(`library_${kz.id}`, val)}
                                  size="sm"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => onChange('kozijnenLibrary', kozijnenLibrary.filter(item => item.id !== kz.id))}
                                className="p-1.5 text-on-surface-variant/40 hover:text-red-500 hover:bg-red-55 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gevel Row Editing Modal */}
      {editingGevelRowIdx !== null && (() => {
        const editingRow = bouwkundigRows[editingGevelRowIdx];
        if (!editingRow) return null;

        const updateField = (field: string, value: any) => {
          const nextRows = bouwkundigRows.map((r, i) => {
            if (i !== editingGevelRowIdx) return r;
            let nextRow = { ...r, [field]: value };
            if (field === 'breedte' || field === 'hoogte') {
              const w = parseFloat(field === 'breedte' ? value : (r.breedte || '0')) || 0;
              const h = parseFloat(field === 'hoogte' ? value : (r.hoogte || '0')) || 0;
              nextRow.oppervlakte = w > 0 && h > 0 ? (w * h).toFixed(2) : '';
            }
            return nextRow;
          });
          onChange('bouwkundigRows', nextRows);
        };

        const updateFields = (updates: Record<string, any>) => {
          const nextRows = bouwkundigRows.map((r, i) => {
            if (i !== editingGevelRowIdx) return r;
            let nextRow = { ...r, ...updates };
            if (updates.breedte !== undefined || updates.hoogte !== undefined) {
              const w = parseFloat(updates.breedte !== undefined ? updates.breedte : (r.breedte || '0')) || 0;
              const h = parseFloat(updates.hoogte !== undefined ? updates.hoogte : (r.hoogte || '0')) || 0;
              nextRow.oppervlakte = w > 0 && h > 0 ? (w * h).toFixed(2) : '';
            }
            return nextRow;
          });
          onChange('bouwkundigRows', nextRows);
        };

        const handleSave = () => {
          if (onKozijnChange) {
            const currentKozijnen = data.kozijnen || [];
            const updatedKozijnen = currentKozijnen.map(k => {
              const currentGevels = k.gevel ? k.gevel.split(',').map(s => s.trim()).filter(Boolean) : [];
              const wasLinked = currentGevels.includes(editingRow.gevel);
              const shouldBeLinked = tempKozijnLinks[k.id] !== undefined
                ? tempKozijnLinks[k.id]
                : wasLinked;

              if (shouldBeLinked && !wasLinked) {
                return { ...k, gevel: [...currentGevels, editingRow.gevel].join(', ') };
              } else if (!shouldBeLinked && wasLinked) {
                return { ...k, gevel: currentGevels.filter(g => g !== editingRow.gevel).join(', ') };
              }
              return k;
            });
            onKozijnChange(updatedKozijnen);
          }
          setEditingGevelRowIdx(null);
        };

        return (
          <AppModal
            isOpen={editingGevelRowIdx !== null}
            onClose={() => setEditingGevelRowIdx(null)}
            onSave={handleSave}
            title="Gevel Vragenlijst"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Naam</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingRow.naam || ''}
                  onChange={(e) => updateField('naam', e.target.value)}
                  placeholder="bijv. Voorgevel"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Gevel type/locatie</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={['Voorgevel', 'Achtergevel', 'Linkergevel', 'Rechtergevel', ''].includes(editingRow.gevel) ? editingRow.gevel : 'Custom'}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    if (val !== 'Custom') {
                      updateField('gevel', val);
                    } else {
                      updateField('gevel', 'Aangepaste Gevel');
                    }
                  }}
                >
                  <option value="">Kies gevelnaam...</option>
                  <option value="Voorgevel">Voorgevel</option>
                  <option value="Achtergevel">Achtergevel</option>
                  <option value="Linkergevel">Linkergevel</option>
                  <option value="Rechtergevel">Rechtergevel</option>
                  <option value="Custom">Aangepaste (type hieronder)</option>
                </ModalSelect>

                {!['Voorgevel', 'Achtergevel', 'Linkergevel', 'Rechtergevel', ''].includes(editingRow.gevel) && (
                  <input
                    type="text"
                    className="input-field mt-2"
                    value={editingRow.gevel}
                    onChange={(e) => updateField('gevel', e.target.value)}
                    placeholder="Type een aangepaste gevelnaam"
                  />
                )}
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Constructie</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.constructieId || ''}
                  onChange={(e: any) => updateField('constructieId', e.target.value)}
                >
                  <option value="">Koppel constructie...</option>
                  {constructies.filter(c => c.type === 'Gevel').map(c => (
                    <option key={c.id} value={c.id}>{c.naam}</option>
                  ))}
                </ModalSelect>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider font-sans">{t('structural.orientation') || 'Orientation'}</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.orientation || ''}
                  onChange={(e: any) => updateField('orientation', e.target.value)}
                >
                  <option value="">Selecteer oriëntatie...</option>
                  <option value="N">N (Noord)</option>
                  <option value="Z">Z (Zuid)</option>
                  <option value="O">O (Oost)</option>
                  <option value="W">W (West)</option>
                  <option value="NO">NO (Noordoost)</option>
                  <option value="ZO">ZO (Zuidoost)</option>
                  <option value="ZW">ZW (Zuidwest)</option>
                  <option value="NW">NW (Noordwest)</option>
                  <option value="Horizontaal">Horizontaal</option>
                </ModalSelect>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Grenst aan</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.grenstAan || 'Buitenlucht'}
                  onChange={(e: any) => updateField('grenstAan', e.target.value)}
                >
                  <option value="Buitenlucht">Buitenlucht</option>
                  <option value="Andere woning">Andere woning</option>
                  <option value="Onverwarmde ruimte">Onverwarmde ruimte</option>
                  <option value="Grond">Grond</option>
                </ModalSelect>
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('kozijn.width') || 'Breedte (m)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field font-mono font-bold"
                    value={editingRow.breedte || ''}
                    onChange={(e) => updateField('breedte', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('kozijn.height') || 'Hoogte (m)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field font-mono font-bold"
                    value={editingRow.hoogte || ''}
                    onChange={(e) => updateField('hoogte', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider text-nowrap overflow-hidden text-ellipsis" title={t('kozijn.areaAutoCalculated') || 'Oppervlakte (m²) — auto berekend'}>{t('kozijn.areaAutoCalculated') || 'Oppervlakte (m²) — auto berekend'}</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50 border border-outline-variant/10 text-on-background font-black font-mono text-center cursor-not-allowed"
                    value={editingRow.oppervlakte || ''}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</label>
                <AppFlagPicker
                  value={flags[`bouwkundig_${editingGevelRowIdx}`]}
                  onChange={(val) => setFlags(prev => ({ ...prev, [`bouwkundig_${editingGevelRowIdx}`]: val }))}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Kozijn Koppelingen</label>
                <div className="border border-outline-variant/10 rounded-xl p-3 bg-gray-50 max-h-36 overflow-y-auto space-y-2">
                  {kozijnen.length === 0 ? (
                    <span className="text-xs text-on-surface-variant/40 italic block py-2 text-center">
                      Er zijn geen kozijnen beschikbaar.
                    </span>
                  ) : (
                    kozijnen.map(k => {
                      const isInitiallyLinked = Boolean(k.gevel === editingRow.gevel || (k.gevel && k.gevel.split(',').map(s => s.trim()).includes(editingRow.gevel)));
                      const isChecked = tempKozijnLinks[k.id] !== undefined ? Boolean(tempKozijnLinks[k.id]) : isInitiallyLinked;
                      return (
                        <label key={k.id} className="flex items-start gap-2.5 text-xs font-bold text-on-surface-variant/80 cursor-pointer p-1 rounded-lg hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-4 h-4 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => {
                              setTempKozijnLinks(prev => ({
                                ...prev,
                                [k.id]: e.target.checked
                              }));
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-on-background">{k.naam}</span>
                            <span className="text-[10px] text-on-surface-variant/50 font-semibold">{k.width} m x {k.height} m (Area: {k.area} m²)</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="col-span-2 space-y-1.5">
                {(() => {
                  const allPhotos = [
                    ...(editingRow.photos || []),
                    ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])
                  ].filter((p, i, arr) => arr.indexOf(p) === i);

                  return (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">
                          {t('structural.photo') || 'Foto'} {allPhotos.length > 0 ? `(${allPhotos.length})` : ''}
                        </label>
                        <div>
                          <input
                            type="file"
                            id="modal-gevel-photo-upload-multi"
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
                                    updateFields({ photos: merged, photoUrl: merged[0] });
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
                            onClick={() => document.getElementById('modal-gevel-photo-upload-multi')?.click()}
                          >
                            <Camera size={11} />
                            Voeg foto toe
                          </button>
                        </div>
                      </div>

                      {allPhotos.length === 0 ? (
                        <div
                          className="border border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('modal-gevel-photo-upload-multi')?.click()}
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
                                onClick={() => openLightbox(allPhotos, idx, editingRow.naam || 'Gevel')}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = allPhotos.filter((_, i) => i !== idx);
                                  updateFields({
                                    photos: next,
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
        );
      })()}

      {/* Vloer Row Editing Modal */}
      {editingVloerRowIdx !== null && (() => {
        const editingRow = bouwkundigRows[editingVloerRowIdx];
        if (!editingRow) return null;

        const updateField = (field: string, value: any) => {
          const nextRows = bouwkundigRows.map((r, i) => {
            if (i !== editingVloerRowIdx) return r;
            let nextRow = { ...r, [field]: value };
            if (field === 'breedte' || field === 'hoogte') {
              const w = parseFloat(field === 'breedte' ? value : (r.breedte || '0')) || 0;
              const h = parseFloat(field === 'hoogte' ? value : (r.hoogte || '0')) || 0;
              nextRow.oppervlakte = w > 0 && h > 0 ? (w * h).toFixed(2) : '';
            }
            return nextRow;
          });
          onChange('bouwkundigRows', nextRows);
        };

        const updateFields = (updates: Record<string, any>) => {
          const nextRows = bouwkundigRows.map((r, i) => {
            if (i !== editingVloerRowIdx) return r;
            let nextRow = { ...r, ...updates };
            if (updates.breedte !== undefined || updates.hoogte !== undefined) {
              const w = parseFloat(updates.breedte !== undefined ? updates.breedte : (r.breedte || '0')) || 0;
              const h = parseFloat(updates.hoogte !== undefined ? updates.hoogte : (r.hoogte || '0')) || 0;
              nextRow.oppervlakte = w > 0 && h > 0 ? (w * h).toFixed(2) : '';
            }
            return nextRow;
          });
          onChange('bouwkundigRows', nextRows);
        };

        return (
          <AppModal
            isOpen={editingVloerRowIdx !== null}
            onClose={() => setEditingVloerRowIdx(null)}
            onSave={() => setEditingVloerRowIdx(null)}
            title="Vloer Vragenlijst"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Naam</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingRow.naam || ''}
                  onChange={(e) => updateField('naam', e.target.value)}
                  placeholder="bijv. Begane Grondvloer"
                />
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Invoer</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.invoer || ''}
                  onChange={(e: any) => updateField('invoer', e.target.value)}
                >
                  <option value="Archiefonderzoek">Archiefonderzoek</option>
                  <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                  <option value="Bouwjaar">Bouwjaar</option>
                  <option value="Custom">Aangepaste waarde</option>
                </ModalSelect>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Constructie</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.constructieId || ''}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    const updates: Record<string, any> = { constructieId: val };
                    const matchedC = constructies.find(c => c.id === val);
                    if (matchedC && matchedC.rc) {
                      updates.rc = matchedC.rc;
                    }
                    updateFields(updates);
                  }}
                >
                  <option value="">Koppel constructie...</option>
                  {constructies.filter(c => c.type === 'Vloer').map(c => (
                    <option key={c.id} value={c.id}>{c.naam}</option>
                  ))}
                </ModalSelect>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Rc waarde (m²K/W)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field font-mono font-bold"
                  value={editingRow.rc || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField('rc', val);
                    if (editingRow.constructieId && onConstructieChange) {
                      onConstructieChange(constructies.map(c => c.id === editingRow.constructieId ? { ...c, rc: val } : c));
                    }
                  }}
                  placeholder="Bijv. 3.50/5.71"
                />
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Grenst aan</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.grenstAan || 'Kruipruimte'}
                  onChange={(e: any) => updateField('grenstAan', e.target.value)}
                >
                  <option value="Kruipruimte">Kruipruimte</option>
                  <option value="Grond">Grond</option>
                  <option value="Buitenlucht">Buitenlucht</option>
                  <option value="Onverwarmde kelder">Onverwarmde kelder</option>
                </ModalSelect>
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('kozijn.width') || 'Breedte (m)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field font-mono font-bold"
                    value={editingRow.breedte || ''}
                    onChange={(e) => updateField('breedte', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('kozijn.height') || 'Hoogte (m)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field font-mono font-bold"
                    value={editingRow.hoogte || ''}
                    onChange={(e) => updateField('hoogte', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider text-nowrap overflow-hidden text-ellipsis" title={t('kozijn.areaAutoCalculated') || 'Oppervlakte (m²) — auto berekend'}>{t('kozijn.areaAutoCalculated') || 'Oppervlakte (m²) — auto berekend'}</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50 border border-outline-variant/10 text-on-background font-black font-mono text-center cursor-not-allowed"
                    value={editingRow.oppervlakte || ''}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Perimeter (m²)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field font-mono font-bold"
                  value={editingRow.perimeter || ''}
                  onChange={(e) => updateField('perimeter', e.target.value)}
                  placeholder="Bijv. 32.4"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</label>
                <AppFlagPicker
                  value={flags[`bouwkundig_${editingVloerRowIdx}`]}
                  onChange={(val) => setFlags(prev => ({ ...prev, [`bouwkundig_${editingVloerRowIdx}`]: val }))}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                {(() => {
                  const allPhotos = [
                    ...(editingRow.photos || []),
                    ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])
                  ].filter((p, i, arr) => arr.indexOf(p) === i);

                  return (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">
                          {t('structural.photo') || 'Foto'} {allPhotos.length > 0 ? `(${allPhotos.length})` : ''}
                        </label>
                        <div>
                          <input
                            type="file"
                            id="modal-vloer-photo-upload-multi"
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
                                    updateFields({ photos: merged, photoUrl: merged[0] });
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
                            onClick={() => document.getElementById('modal-vloer-photo-upload-multi')?.click()}
                          >
                            <Camera size={11} />
                            Voeg foto toe
                          </button>
                        </div>
                      </div>

                      {allPhotos.length === 0 ? (
                        <div
                          className="border border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('modal-vloer-photo-upload-multi')?.click()}
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
                                onClick={() => openLightbox(allPhotos, idx, editingRow.naam || 'Vloer')}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = allPhotos.filter((_, i) => i !== idx);
                                  updateFields({
                                    photos: next,
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
        );
      })()}

      {/* Dak Row Editing Modal */}
      {editingDakRowIdx !== null && (() => {
        const editingRow = bouwkundigRows[editingDakRowIdx];
        if (!editingRow) return null;

        const updateField = (field: string, value: any) => {
          const nextRows = bouwkundigRows.map((r, i) => {
            if (i !== editingDakRowIdx) return r;
            let nextRow = { ...r, [field]: value };
            if (field === 'breedte' || field === 'hoogte') {
              const w = parseFloat(field === 'breedte' ? value : (r.breedte || '0')) || 0;
              const h = parseFloat(field === 'hoogte' ? value : (r.hoogte || '0')) || 0;
              nextRow.oppervlakte = w > 0 && h > 0 ? (w * h).toFixed(2) : '';
            }
            return nextRow;
          });
          onChange('bouwkundigRows', nextRows);
        };

        const updateFields = (updates: Record<string, any>) => {
          const nextRows = bouwkundigRows.map((r, i) => {
            if (i !== editingDakRowIdx) return r;
            let nextRow = { ...r, ...updates };
            if (updates.breedte !== undefined || updates.hoogte !== undefined) {
              const w = parseFloat(updates.breedte !== undefined ? updates.breedte : (r.breedte || '0')) || 0;
              const h = parseFloat(updates.hoogte !== undefined ? updates.hoogte : (r.hoogte || '0')) || 0;
              nextRow.oppervlakte = w > 0 && h > 0 ? (w * h).toFixed(2) : '';
            }
            return nextRow;
          });
          onChange('bouwkundigRows', nextRows);
        };

        const handleSave = () => {
          if (onKozijnChange) {
            const currentKozijnen = data.kozijnen || [];
            const updatedKozijnen = currentKozijnen.map(k => {
              const currentGevels = k.gevel ? k.gevel.split(',').map(s => s.trim()).filter(Boolean) : [];
              const wasLinked = currentGevels.includes(editingRow.naam);
              const shouldBeLinked = tempKozijnLinks[k.id] !== undefined
                ? tempKozijnLinks[k.id]
                : wasLinked;

              if (shouldBeLinked && !wasLinked) {
                return { ...k, gevel: [...currentGevels, editingRow.naam].join(', ') };
              } else if (!shouldBeLinked && wasLinked) {
                return { ...k, gevel: currentGevels.filter(g => g !== editingRow.naam).join(', ') };
              }
              return k;
            });
            onKozijnChange(updatedKozijnen);
          }
          setEditingDakRowIdx(null);
        };

        return (
          <AppModal
            isOpen={editingDakRowIdx !== null}
            onClose={() => setEditingDakRowIdx(null)}
            onSave={handleSave}
            title="Dak Vragenlijst"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Naam</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingRow.naam || ''}
                  onChange={(e) => updateField('naam', e.target.value)}
                  placeholder="bijv. Hellend dak achter"
                />
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Invoer</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.invoer || ''}
                  onChange={(e: any) => updateField('invoer', e.target.value)}
                >
                  <option value="Archiefonderzoek">Archiefonderzoek</option>
                  <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                  <option value="Bouwjaar">Bouwjaar</option>
                  <option value="Custom">Aangepaste waarde</option>
                </ModalSelect>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Constructie</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.constructieId || ''}
                  onChange={(e: any) => {
                    const val = e.target.value;
                    const updates: Record<string, any> = { constructieId: val };
                    const matchedC = constructies.find(c => c.id === val);
                    if (matchedC && matchedC.rc) {
                      updates.rc = matchedC.rc;
                    }
                    updateFields(updates);
                  }}
                >
                  <option value="">Koppel constructie...</option>
                  {constructies.filter(c => c.type === 'Dak').map(c => (
                    <option key={c.id} value={c.id}>{c.naam}</option>
                  ))}
                </ModalSelect>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider font-sans">Orientation (Oriëntatie)</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.orientation || ''}
                  onChange={(e: any) => updateField('orientation', e.target.value)}
                >
                  <option value="">Selecteer oriëntatie...</option>
                  <option value="N">N (Noord)</option>
                  <option value="Z">Z (Zuid)</option>
                  <option value="O">O (Oost)</option>
                  <option value="W">W (West)</option>
                  <option value="NO">NO (Noordoost)</option>
                  <option value="ZO">ZO (Zuidoost)</option>
                  <option value="ZW">ZW (Zuidwest)</option>
                  <option value="NW">NW (Noordwest)</option>
                  <option value="Horizontaal">Horizontaal</option>
                </ModalSelect>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Grenst aan</label>
                <ModalSelect
                  className="input-field cursor-pointer"
                  value={editingRow.grenstAan || 'Buitenlucht'}
                  onChange={(e: any) => updateField('grenstAan', e.target.value)}
                >
                  <option value="Buitenlucht">Buitenlucht</option>
                  <option value="Onverwarmde ruimte">Onverwarmde ruimte</option>
                  <option value="Andere woning">Andere woning</option>
                </ModalSelect>
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('kozijn.width') || 'Breedte (m)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field font-mono font-bold"
                    value={editingRow.breedte || ''}
                    onChange={(e) => updateField('breedte', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('kozijn.height') || 'Hoogte (m)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field font-mono font-bold"
                    value={editingRow.hoogte || ''}
                    onChange={(e) => updateField('hoogte', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider text-nowrap overflow-hidden text-ellipsis" title={t('kozijn.areaAutoCalculated') || 'Oppervlakte (m²) — auto berekend'}>{t('kozijn.areaAutoCalculated') || 'Oppervlakte (m²) — auto berekend'}</label>
                  <input
                    type="text"
                    className="input-field bg-gray-50 border border-outline-variant/10 text-on-background font-black font-mono text-center cursor-not-allowed"
                    value={editingRow.oppervlakte || ''}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="col-span-1 space-y-1">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Hellingshoek (°)</label>
                <input
                  type="number"
                  className="input-field font-mono font-bold"
                  value={editingRow.hellingshoek || ''}
                  onChange={(e) => updateField('hellingshoek', e.target.value)}
                  placeholder="45"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</label>
                <AppFlagPicker
                  value={flags[`bouwkundig_${editingDakRowIdx}`]}
                  onChange={(val) => setFlags(prev => ({ ...prev, [`bouwkundig_${editingDakRowIdx}`]: val }))}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">Kozijn Koppelingen</label>
                <div className="border border-outline-variant/10 rounded-xl p-3 bg-gray-50 max-h-36 overflow-y-auto space-y-2">
                  {kozijnen.length === 0 ? (
                    <span className="text-xs text-on-surface-variant/40 italic block py-2 text-center">
                      Er zijn geen kozijnen beschikbaar.
                    </span>
                  ) : (
                    kozijnen.map(k => {
                      const isInitiallyLinked = Boolean(k.gevel === editingRow.naam || (k.gevel && k.gevel.split(',').map(s => s.trim()).includes(editingRow.naam)));
                      const isChecked = tempKozijnLinks[k.id] !== undefined ? Boolean(tempKozijnLinks[k.id]) : isInitiallyLinked;
                      return (
                        <label key={k.id} className="flex items-start gap-2.5 text-xs font-bold text-on-surface-variant/80 cursor-pointer p-1 rounded-lg hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-4 h-4 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => {
                              setTempKozijnLinks(prev => ({
                                ...prev,
                                [k.id]: e.target.checked
                              }));
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-on-background">{k.naam}</span>
                            <span className="text-[10px] text-on-surface-variant/50 font-semibold">{k.width} m x {k.height} m (Area: {k.area} m²)</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="col-span-2 space-y-1.5">
                {(() => {
                  const allPhotos = [
                    ...(editingRow.photos || []),
                    ...(editingRow.photoUrl ? [editingRow.photoUrl] : [])
                  ].filter((p, i, arr) => arr.indexOf(p) === i);

                  return (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">
                          {t('structural.photo') || 'Foto'} {allPhotos.length > 0 ? `(${allPhotos.length})` : ''}
                        </label>
                        <div>
                          <input
                            type="file"
                            id="modal-dak-photo-upload-multi"
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
                                    updateFields({ photos: merged, photoUrl: merged[0] });
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
                            onClick={() => document.getElementById('modal-dak-photo-upload-multi')?.click()}
                          >
                            <Camera size={11} />
                            Voeg foto toe
                          </button>
                        </div>
                      </div>

                      {allPhotos.length === 0 ? (
                        <div
                          className="border border-dashed border-outline-variant/30 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('modal-dak-photo-upload-multi')?.click()}
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
                                onClick={() => openLightbox(allPhotos, idx, editingRow.naam || 'Dak')}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = allPhotos.filter((_, i) => i !== idx);
                                  updateFields({
                                    photos: next,
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
        );
      })()}

      {/* Overstek Row Editing Modal */}
      {editingOverstekRowIdx !== null && (() => {
        const editingRow = overstekRows[editingOverstekRowIdx];
        if (!editingRow) return null;

        const updateField = (field: keyof typeof editingRow, value: any) => {
          let nextRow = { ...editingRow, [field]: value };
          if (field === 'hbdiff' || field === 'hbdist') {
            const diff = parseFloat(field === 'hbdiff' ? value : (editingRow.hbdiff || '0')) || 0;
            const dist = parseFloat(field === 'hbdist' ? value : (editingRow.hbdist || '0')) || 0;
            if (dist > 0) {
              nextRow.hb = (diff / dist).toFixed(2);
            } else {
              nextRow.hb = '';
            }
          }
          if (field === 'hodiff' || field === 'hodist') {
            const diff = parseFloat(field === 'hodiff' ? value : (editingRow.hodiff || '0')) || 0;
            const dist = parseFloat(field === 'hodist' ? value : (editingRow.hodist || '0')) || 0;
            if (dist > 0) {
              nextRow.ho = (diff / dist).toFixed(2);
            } else {
              nextRow.ho = '';
            }
          }
          if (field === 'bbaf' || field === 'bbbr') {
            const af = parseFloat(field === 'bbaf' ? value : (editingRow.bbaf || '0')) || 0;
            const br = parseFloat(field === 'bbbr' ? value : (editingRow.bbbr || '0')) || 0;
            if (br > 0) {
              nextRow.bb = (af / br).toFixed(2);
            } else {
              nextRow.bb = '';
            }
          }
          const nextRows = overstekRows.map((r, i) => i === editingOverstekRowIdx ? nextRow : r);
          onChange('overstekRows', nextRows);
        };

        return (
          <AppModal
            isOpen={editingOverstekRowIdx !== null}
            onClose={() => setEditingOverstekRowIdx(null)}
            onSave={() => setEditingOverstekRowIdx(null)}
            title={t('overstek.title')}
            saveLabel={t('common.save')}
            cancelLabel={t('common.close')}
          >
            {/* 1. Woning details */}
            <div className="bg-white border border-outline-variant/10 p-4 rounded-xl space-y-3 text-left">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">{t('overstek.woningDetails')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.selectGevel')}</label>
                  <ModalSelect
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                    value={editingRow.gevel || ''}
                    onChange={(e: any) => updateField('gevel', e.target.value)}
                  >
                    <option value="Voorgevel">{t('kozijn.options.location.voor')}gevel</option>
                    <option value="Achtergevel">{t('kozijn.options.location.achter')}gevel</option>
                    <option value="Linkergevel">{t('kozijn.options.location.links')}gevel</option>
                    <option value="Rechtergevel">{t('kozijn.options.location.rechts')}gevel</option>
                  </ModalSelect>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.kozijn')}</label>
                  <ModalSelect
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                    value={editingRow.kozijnId || ''}
                    onChange={(e: any) => updateField('kozijnId', e.target.value)}
                  >
                    <option value="">{t('overstek.chooseKozijn')}</option>
                    {kozijnen.map(k => (
                      <option key={k.id} value={k.id}>{k.naam} ({k.gevel})</option>
                    ))}
                  </ModalSelect>
                </div>
              </div>
            </div>

            {/* 2. Overhang (hb) Calculation */}
            <div className="bg-white border border-outline-variant/10 p-4 rounded-xl space-y-3 text-left">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">{t('overstek.horizontalOverhang')}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.hbDiff')}</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center font-bold"
                    value={editingRow.hbdiff || ''}
                    onChange={(e) => updateField('hbdiff', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.hbDist')}</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center font-bold"
                    value={editingRow.hbdist || ''}
                    onChange={(e) => updateField('hbdist', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase text-on-surface-variant/70 tracking-wider">{t('overstek.hbCalculated')}</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-outline-variant/10 text-on-background font-black rounded-xl px-3 py-2 text-sm focus:outline-none font-mono text-center cursor-not-allowed"
                    value={editingRow.hb || ''}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* 3. Obstruction Width (bb) Calculation */}
            <div className="bg-white border border-outline-variant/10 p-4 rounded-xl space-y-3 text-left">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">{t('overstek.obstructionWidth')}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.bbAfstand')}</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center font-bold"
                    value={editingRow.bbaf || ''}
                    onChange={(e) => updateField('bbaf', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.bbBreedte')}</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center font-bold"
                    value={editingRow.bbbr || ''}
                    onChange={(e) => updateField('bbbr', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase text-on-surface-variant/70 tracking-wider">{t('overstek.bbCalculated')}</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-outline-variant/10 text-on-background font-black rounded-xl px-3 py-2 text-sm focus:outline-none font-mono text-center cursor-not-allowed"
                    value={editingRow.bb || ''}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* 4. Vertical Obstruction (ho) Calculation */}
            <div className="bg-white border border-outline-variant/10 p-4 rounded-xl space-y-3 text-left">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">{t('overstek.verticalObstruction')}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.hoDiff')}</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center font-bold"
                    value={editingRow.hodiff || ''}
                    onChange={(e) => updateField('hodiff', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.hoDist')}</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center font-bold"
                    value={editingRow.hodist || ''}
                    onChange={(e) => updateField('hodist', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black uppercase text-on-surface-variant/70 tracking-wider">{t('overstek.hoCalculated')}</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-outline-variant/10 text-on-background font-black rounded-xl px-3 py-2 text-sm focus:outline-none font-mono text-center cursor-not-allowed"
                    value={editingRow.ho || ''}
                    readOnly
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* 5. Conclusion & Zonwering */}
            <div className="bg-white border border-outline-variant/10 p-4 rounded-xl space-y-3 text-left">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">{t('overstek.conclusionAndShading')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.conclusionTitle')}</label>
                  <ModalSelect
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                    value={editingRow.conclusion || ''}
                    onChange={(e: any) => updateField('conclusion', e.target.value)}
                  >
                    <option value="Automatisch">{t('overstek.options.automatisch')}</option>
                    <option value="Minimale belemmering">{t('overstek.options.minimaleBelemmering')}</option>
                    <option value="Overstek">{t('overstek.options.overstek')}</option>
                    <option value="Volledige belemmering">{t('overstek.options.volledigeBelemmering')}</option>
                    <option value="Constante belemmering">{t('overstek.options.constanteBelemmering')}</option>
                    <option value="Zijbelemmering">{t('overstek.options.zijbelemmering')}</option>
                    <option value="Overstek + (Zij)belemmering">{t('overstek.options.overstekZijbelemmering')}</option>
                  </ModalSelect>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('overstek.zonweringTitle')}</label>
                  <ModalSelect
                    className="w-full bg-white border border-outline-variant/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                    value={editingRow.zonwering || ''}
                    onChange={(e: any) => updateField('zonwering', e.target.value)}
                  >
                    <option value="Geen zonwering">{t('overstek.options.geenZonwering')}</option>
                    <option value="Vaste zonwering">{t('overstek.options.vasteZonwering')}</option>
                    <option value="Uitvalscherm">{t('overstek.options.uitvalscherm')}</option>
                    <option value="Knikarmscherm">{t('overstek.options.knikarmscherm')}</option>
                    <option value="Screens (buiten)">{t('overstek.options.screens')}</option>
                    <option value="Jaloezieen">{t('overstek.options.jaloezieen')}</option>
                    <option value="Gemetalliseerde weefsels">{t('overstek.options.gemetalliseerdeWeefsels')}</option>
                    <option value="Rolluiken">{t('overstek.options.rolluiken')}</option>
                  </ModalSelect>
                </div>
              </div>

              <div className="bg-white border border-outline-variant/10 p-4 rounded-xl space-y-2 text-left">
                <label className="block text-[10px] font-bold uppercase text-on-surface-variant/50 tracking-wider">{t('structural.flagStatus') || 'FLAG / STATUS'}</label>
                <AppFlagPicker
                  value={flags[`overstek_${editingOverstekRowIdx}`]}
                  onChange={(val) => setFlags(prev => ({ ...prev, [`overstek_${editingOverstekRowIdx}`]: val }))}
                />
              </div>
            </div>
          </AppModal>
        );
      })()}

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

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] uppercase text-on-surface-variant/40 font-black tracking-wider mb-0.5 leading-none">{label}</span>
    <span className="text-xs font-bold text-on-background truncate">{value}</span>
  </div>
);

export default GeometryView;
export { GeometryView };