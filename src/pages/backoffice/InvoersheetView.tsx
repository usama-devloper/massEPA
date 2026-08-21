import React, { useState, useRef, useEffect } from 'react';
import { InspectionData, ConstructionRow } from './backofficeTypes';
import {
  FileText,
  Trash2,
  Camera,
  Check,
  Calendar,
  Wind,
  Flame,
  Droplet,
  Snowflake,
  Sun,
  ImageIcon,
  Plus,
  Box,
  Layers,
  Ruler,
  Pencil,
  Printer,
  X,
  Upload
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { PhotoViewerModal } from '../../components/common/PhotoViewerModal';
import { slidesFromUrls } from '../../utils/photoViewer';
import { ConstructieEditModal } from '../../components/common/ConstructieEditModal';
import { BouwkundigEditModal, BouwkundigRow } from '../../components/common/BouwkundigEditModal';
import { KozijnEditModal } from '../../components/common/KozijnEditModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface InvoersheetViewProps {
  data: InspectionData;
  onChange: (path: string, value: any) => void;
  onViewChange?: (view: any) => void;
}

const defaultBouwkundigRows = [
  { kozijnIds: [] as string[], constructieId: 'c1', type: 'Gevel', kozijnArea: '0.00', gevel: 'Achtergevel', gevelIsolatie: '...', orientation: 'Z', grenstAan: 'Buitenlucht', breedte: '5.00', hoogte: '3.04', oppervlakte: '15.20', hellingshoek: '90', kozijn: '', naam: 'Achtergevel', invoer: 'Archiefonderzoek', rc: '2.5', perimeter: '' },
  { kozijnIds: [] as string[], constructieId: 'c2', type: 'Vloer', kozijnArea: '0.00', gevel: '', gevelIsolatie: 'Ja', orientation: '', grenstAan: 'Kruipruimte', breedte: '10.00', hoogte: '7.02', oppervlakte: '70.20', hellingshoek: '0', kozijn: '', naam: 'Begane Grondvloer', invoer: 'Archiefonderzoek', rc: '5.71', perimeter: '32.4' }
];

const defaultKozijnenLibrary = [
  { id: 'k1', naam: 'D1', width: '1.33', height: '2.46', area: '1.98', constructie: '1520 + 1920_Deur ongeïsoleerd (U = 3.40)' }
];

const DynamicMasonryImage = React.memo(({ 
  src, alt, readOnly, slotKey, categoryName, title, instId,
  makeInstActive, setPhotoSelectorModal, onDelete, onPhotoClick
}: { 
  src: string; alt: string; readOnly: boolean; slotKey: string; categoryName: string; title: string; instId?: string;
  makeInstActive: (id: string) => void;
  setPhotoSelectorModal: (modal: any) => void;
  onDelete: (slotKey: string) => void;
  onPhotoClick?: () => void;
}) => {
  const [span, setSpan] = useState<string>('col-span-1 aspect-[4/3]');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src || src === '-' || src === '') return;
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio > 1.15) {
        setSpan('col-span-2 aspect-[21/9]');
      } else {
        setSpan('col-span-1 aspect-[4/3]');
      }
      setLoaded(true);
    };
    img.onerror = () => setLoaded(true);
    img.src = src;
  }, [src]);

  if (!src || src === '-' || src === '') return null;

  return (
    <div className={`group relative rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center border border-[#e2e8f0] shadow-xs transition-all duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${span} print:break-inside-avoid ${onPhotoClick ? 'cursor-pointer' : ''}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" referrerPolicy="no-referrer" onClick={onPhotoClick} />
      
      {!readOnly && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity no-print z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (instId) makeInstActive(instId);
              setPhotoSelectorModal({ isOpen: true, slotKey, categoryName, title, existingPhotoUrl: src });
            }}
            className="bg-primary hover:bg-primary-dark text-white rounded-lg p-1 shadow-sm transition cursor-pointer"
            title="Wijzig foto"
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(slotKey);
            }}
            className="bg-red-500 hover:bg-red-600 text-white rounded-lg p-1 shadow-sm transition cursor-pointer"
            title="Verwijder selectie"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
});

const InvoersheetView: React.FC<InvoersheetViewProps> = ({ data, onChange, onViewChange }) => {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'p3' | 'p4'>('p1');
  const [categoryToDelete, setCategoryToDelete] = useState<{ instId: string; cat: string } | null>(null);
  const [installationToDelete, setInstallationToDelete] = useState<string | null>(null);
  
  const [isBouwkundigModalOpen, setIsBouwkundigModalOpen] = useState(false);
  const [editingKozijnRow, setEditingKozijnRow] = useState<any>(null);
  const [editingBouwkundigRow, setEditingBouwkundigRow] = useState<BouwkundigRow | null>(null);
  const [editingBouwkundigIndex, setEditingBouwkundigIndex] = useState<number | null>(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadKeyRef = useRef<string | null>(null);
  const activeUploadContextRef = useRef<{ type?: 'bouwkundig' | 'kozijn' | 'constructie', id?: string, index?: number, instId?: string } | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setSelectedPhoto(photos[index]);
    setLightboxIndex(index);
  };

  const handlePrintA4 = () => {
    setIsPrinting(true);
    // Give React 800ms to finish mounting all sections before triggering print
    setTimeout(() => {
      window.print();
      // Reset state after the print dialog closes
      setTimeout(() => setIsPrinting(false), 300);
    }, 800);
  };
  const [photoSelectorModal, setPhotoSelectorModal] = useState<{
    isOpen: boolean;
    slotKey: string;
    categoryName: string;
    title: string;
    existingPhotoUrl?: string;
    visiblePhotos?: string[];
    itemContext?: { type: 'bouwkundig' | 'kozijn' | 'constructie'; id: string; index?: number };
  } | null>(null);

  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage quota exceeded when setting ${key}`);
    }
  };

  const installations = data.installations || {
    ventSysteem: 'Mechanische afvoer',
    ventMerkType: 'Itho Daalderop CVE-S',
    ventSpecsBcrg: 'BCRG 2023.0124',
    ventVentilatiesysteem: 'Type C.4a',
    ventSubsysteem: 'Woonhuisventilator',
    ventLuchtdichtheid: 'Klasse 2',
    ventVentilatoren: 'Gelijkstroom',
    ventTypeVentilator: 'Centrifugaal',
    ventCode: 'V-01-IDCVE',

    verwarmSysteem: 'HR-Combiketel',
    verwarmMerkType: 'Nefit Trendline HRC30',
    verwarmSpecsBcrg: 'BCRG 2022.0911',
    verwarmTypeopwekker: 'Gasgestookte ketel',
    verwarmTypeToestel: 'Individueel',
    verwarmDistributiemedium: 'Water',
    verwarmWatertemprater: '55°C / 45°C',
    verwarmAfgiftesysteem: 'LT Radiatoren + Vloer',
    verwarmCode: 'W-01-NEF-T',
    verwarmRegeling: 'Weersafhankelijk',

    tapSysteem: 'Gecombineerd met CV',
    tapMerkType: 'Nefit Trendline (Interne)',
    tapSpecsBcrg: '-',
    tapTypeInstallatie: 'Individueel',
    tapTypeOpwekker: '-',
    tapTypeToestel: '-',
    tapCode: 'TW-01-COMBI',
    tapAfgifteKeuken: 'L <= 3m',
    tapAfgifteBadkamer: 'L <= 1m',
    tapCirculatieleiding: 'Niet aanwezig',
    tapDwtw: 'Niet aanwezig',

    koelSysteem: 'Niet aanwezig',
    koelMerkType: '-',
    koelSpecsBcrg: '-',
    koelTypeInstallatie: '-',
    koelExpansie: '-',
    koelCode: '-',
    koelDistributiemedium: '-',
    koelWatertemprater: '-',
    koelAfgiftesysteem: '-',
    koelRegeling: '-',

    zonSysteem: 'PV-panelen',
    zonMerkType: 'JA Solar Mono',
    zonSpecsBcrg: '-',
    zonAantal: '12 stuks',
    zonHellingshook: '35° (Zuid-West)',
    zonCode: 'PV-01-JASOL',
    zonOppPerPanelen: '1.75 m²',
    zonWattpiekvermogen: '410 Wp / paneel',
    zonBouwintegratie: 'Op dakbedekking',
    zonOrientatie: 'Zuid-West',
  };



  const [fieldFlags, setFieldFlags] = useState<Record<string, 'red' | 'yellow' | 'green' | null>>({});

  // Helper to resolve the correct localStorage key and subkey for a given invoersheet fieldKey
  const resolveFlagNamespace = (fieldKey: string) => {
    const clientId = data.clientId || 'default';

    // 1. Identificatie / Inspector / Bewoner / BID Intern
    if (fieldKey.startsWith('algemeen.inspector.') || fieldKey.startsWith('algemeen.bewoner.') || fieldKey.startsWith('algemeen.bidIntern.')) {
      let subKey = fieldKey;
      if (fieldKey.startsWith('algemeen.inspector.')) {
        subKey = fieldKey.substring('algemeen.inspector.'.length);
      } else if (fieldKey.startsWith('algemeen.bewoner.')) {
        subKey = 'bewoner_' + fieldKey.substring('algemeen.bewoner.'.length);
      } else if (fieldKey.startsWith('algemeen.bidIntern.')) {
        subKey = 'bid_' + fieldKey.substring('algemeen.bidIntern.'.length);
      }
      return {
        storageKey: `inspector_flags_${clientId}`,
        subKey
      };
    }

    // 2. Woning / Algemeen details
    if (fieldKey.startsWith('algemeen.woning.') || fieldKey.startsWith('algemeen.technical.')) {
      let subKey = fieldKey;
      if (fieldKey.startsWith('algemeen.woning.')) {
        subKey = fieldKey.substring('algemeen.woning.'.length);
      } else if (fieldKey.startsWith('algemeen.technical.')) {
        const technicalSuffix = fieldKey.substring('algemeen.technical.'.length);
        if (technicalSuffix === 'gboTs.0') subKey = 'gbot-0';
        else if (technicalSuffix === 'gboTs.1') subKey = 'gbot-1';
        else if (technicalSuffix === 'gboTs.2') subKey = 'gbot-2';
        else subKey = technicalSuffix;
      }
      return {
        storageKey: `algemeen_flags_${clientId}`,
        subKey
      };
    }

    // 3. Installations
    if (fieldKey.startsWith('installations.') || fieldKey.startsWith('installations_') || fieldKey.startsWith('inst_')) {
      let subKey = fieldKey;
      let instId = localStorage.getItem('installatie_active_id_current') || '1';

      if (fieldKey.startsWith('installations.')) {
        subKey = fieldKey.substring('installations.'.length);
      } else if (fieldKey.startsWith('installations_')) {
        subKey = fieldKey.substring('installations_'.length);
      } else if (fieldKey.startsWith('inst_')) {
        const parts = fieldKey.split('_');
        if (parts.length >= 3) {
          instId = parts[1];
          subKey = parts.slice(2).join('_');
        }
      }

      // Check if subKey contains an instId prefix (e.g. "1_ventTypeToestel")
      const underscoreIndex = subKey.indexOf('_');
      if (underscoreIndex > 0) {
        const potentialId = subKey.substring(0, underscoreIndex);
        if (!isNaN(Number(potentialId))) {
          instId = potentialId;
          subKey = subKey.substring(underscoreIndex + 1);
        }
      }

      const flagSubKeyMap: Record<string, string> = {
        ventTypeToestel: 'system_Ventilatie',
        ventIdentiekeSystemen: 'count_Ventilatie',
        ventMerkType: 'brand_Ventilatie',
        ventVentilatiesysteem: 'ventSysteemType',
        verwarmTypeToestel: 'system_Verwarming',
        verwarmIdentiekeSystemen: 'count_Verwarming',
        verwarmMerkType: 'brand_Verwarming',
        tapTypeInstallatie: 'system_Tapwater',
        tapIdentiekeSystemen: 'count_Tapwater',
        tapMerkType: 'brand_Tapwater',
        koelTypeToestel: 'system_Koeling',
        koelIdentiekeSystemen: 'count_Koeling',
        koelMerkType: 'brand_Koeling',
        zonTypeToestel: 'system_Zonne-panelen',
        zonIdentiekeSystemen: 'count_Zonne-panelen',
        zonMerkType: 'brand_Zonne-panelen'
      };

      if (flagSubKeyMap[subKey]) {
        subKey = flagSubKeyMap[subKey];
      }

      const prefixedSubKey = `${instId}_${subKey}`;

      return {
        storageKey: `installatie_flags_${clientId}`,
        subKey: prefixedSubKey
      };
    }

    // 4. Constructies (cards)
    if (fieldKey.startsWith('constructie_')) {
      const parts = fieldKey.split('_');
      if (parts[1] === 'row') {
        return {
          storageKey: `constructie_flags_${clientId}`,
          subKey: parts[2]
        };
      }
      return {
        storageKey: `constructie_flags_${clientId}`,
        subKey: parts[1]
      };
    }

    // 5. Geometry / Bouwkundig
    if (fieldKey.startsWith('bouwkundig_') || fieldKey.startsWith('overstek_')) {
      return {
        storageKey: `geometry_flags_${clientId}`,
        subKey: fieldKey
      };
    }

    // 6. Kozijnen (library)
    if (fieldKey.startsWith('library_')) {
      return {
        storageKey: `kozijn_flags_${clientId}`,
        subKey: fieldKey.substring('library_'.length)
      };
    }

    return {
      storageKey: `invoersheet_flags_${clientId}`,
      subKey: fieldKey
    };
  };

  useEffect(() => {
    const loadFlags = () => {
      const clientId = data.clientId || 'default';
      const compiledFlags: Record<string, 'red' | 'yellow' | 'green' | null> = {};

      // 1. Load inspector flags
      try {
        const saved = localStorage.getItem(`inspector_flags_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(k => {
            if (k === 'opnamedatum' || k === 'invoerdatum') {
              compiledFlags[`algemeen.inspector.${k}`] = parsed[k];
            } else if (k.startsWith('bewoner_')) {
              compiledFlags[`algemeen.bewoner.${k.substring(8)}`] = parsed[k];
            } else if (k.startsWith('bid_')) {
              compiledFlags[`algemeen.bidIntern.${k.substring(4)}`] = parsed[k];
            } else {
              compiledFlags[`algemeen.inspector.${k}`] = parsed[k];
            }
          });
        }
      } catch { }

      // 2. Load woning / algemeen flags
      try {
        const saved = localStorage.getItem(`algemeen_flags_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(k => {
            if (k === 'gbot-0') {
              compiledFlags['algemeen.technical.gboTs.0'] = parsed[k];
            } else if (k === 'gbot-1') {
              compiledFlags['algemeen.technical.gboTs.1'] = parsed[k];
            } else if (k === 'gbot-2') {
              compiledFlags['algemeen.technical.gboTs.2'] = parsed[k];
            } else if (k === 'bouwfase' || k === 'opname' || k === 'adres' || k === 'postcode' || k === 'plaats' || k === 'pandId' || k === 'vboId' || k === 'wijk' || k === 'gemeent' || k === 'svbStatus' || k === 'bron' || k === 'gebouwtype' || k === 'subtype' || k === 'daktype' || k === 'ligging' || k === 'gebouwhoogte' || k === 'floorConstructieType' || k === 'wallConstructieType' || k === 'technischComplex' || k === 'financieelComplex') {
              compiledFlags[`algemeen.woning.${k}`] = parsed[k];
            } else {
              compiledFlags[`algemeen.technical.${k}`] = parsed[k];
            }
          });
        }
      } catch { }

      // 3. Load installatie flags
      try {
        const saved = localStorage.getItem(`installatie_flags_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const flagSubKeyMap: Record<string, string> = {
            ventTypeToestel: 'system_Ventilatie',
            ventIdentiekeSystemen: 'count_Ventilatie',
            ventMerkType: 'brand_Ventilatie',
            ventVentilatiesysteem: 'ventSysteemType',
            verwarmTypeToestel: 'system_Verwarming',
            verwarmIdentiekeSystemen: 'count_Verwarming',
            verwarmMerkType: 'brand_Verwarming',
            tapTypeInstallatie: 'system_Tapwater',
            tapIdentiekeSystemen: 'count_Tapwater',
            tapMerkType: 'brand_Tapwater',
            koelTypeToestel: 'system_Koeling',
            koelIdentiekeSystemen: 'count_Koeling',
            koelMerkType: 'brand_Koeling',
            zonTypeToestel: 'system_Zonne-panelen',
            zonIdentiekeSystemen: 'count_Zonne-panelen',
            zonMerkType: 'brand_Zonne-panelen'
          };

          const reverseMap: Record<string, string> = {};
          Object.keys(flagSubKeyMap).forEach(key => {
            reverseMap[flagSubKeyMap[key]] = key;
          });

          Object.keys(parsed).forEach(k => {
            const underscoreIndex = k.indexOf('_');
            if (underscoreIndex > 0) {
              const instIdStr = k.substring(0, underscoreIndex);
              const baseKey = k.substring(underscoreIndex + 1);
              const fieldKeySuffix = reverseMap[baseKey] || baseKey;
              compiledFlags[`installations.${instIdStr}_${fieldKeySuffix}`] = parsed[k];
              compiledFlags[`installations_${instIdStr}_${fieldKeySuffix}`] = parsed[k];
              compiledFlags[`inst_${instIdStr}_${fieldKeySuffix}`] = parsed[k];
            }
          });
        }
      } catch { }

      // 4. Load constructie flags
      try {
        const saved = localStorage.getItem(`constructie_flags_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(rowId => {
            compiledFlags[`constructie_row_${rowId}`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_invoer`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_merk`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_val`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_g`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_dikte`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_code`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_kozijn`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_glas`] = parsed[rowId];
            compiledFlags[`constructie_${rowId}_isolatie`] = parsed[rowId];
          });
        }
      } catch { }

      // 5. Load geometry flags
      try {
        const saved = localStorage.getItem(`geometry_flags_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(key => {
            if (key.startsWith('bouwkundig_') || key.startsWith('overstek_')) {
              compiledFlags[key] = parsed[key];
            }
          });
        }
      } catch { }

      // 6. Load kozijn flags
      try {
        const saved = localStorage.getItem(`kozijn_flags_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(key => {
            compiledFlags[`library_${key}`] = parsed[key];
          });
        }
      } catch { }

      setFieldFlags(compiledFlags);
    };

    loadFlags();

    window.addEventListener('storage', loadFlags);
    window.addEventListener('focus', loadFlags);
    return () => {
      window.removeEventListener('storage', loadFlags);
      window.removeEventListener('focus', loadFlags);
    };
  }, [data.clientId, data.constructies]);

  const toggleFieldFlag = (fieldKey: string) => {
    const clientId = data.clientId || 'default';
    const res = resolveFlagNamespace(fieldKey);
    if (!res) return;

    const { storageKey, subKey } = res;

    setFieldFlags(prev => {
      const current = prev[fieldKey];
      let next: 'red' | 'yellow' | 'green' | null = null;
      if (!current) next = 'red';
      else if (current === 'red') next = 'yellow';
      else if (current === 'yellow') next = 'green';
      else next = null;

      try {
        let storedObj: Record<string, any> = {};
        const saved = localStorage.getItem(storageKey);
        if (saved) storedObj = JSON.parse(saved);

        if (next === null) {
          delete storedObj[subKey];
        } else {
          storedObj[subKey] = next;
        }
        safeSetItem(storageKey, JSON.stringify(storedObj));
      } catch (e) {
        console.error('Failed to save flag to localstorage', e);
      }

      const updated = { ...prev };

      if (storageKey.startsWith('constructie_flags_')) {
        updated[`constructie_row_${subKey}`] = next;
        updated[`constructie_${subKey}_invoer`] = next;
        updated[`constructie_${subKey}_merk`] = next;
        updated[`constructie_${subKey}_val`] = next;
        updated[`constructie_${subKey}_g`] = next;
        updated[`constructie_${subKey}_dikte`] = next;
        updated[`constructie_${subKey}_code`] = next;
        updated[`constructie_${subKey}_kozijn`] = next;
        updated[`constructie_${subKey}_glas`] = next;
        updated[`constructie_${subKey}_isolatie`] = next;
        handleRealConstructieChange(subKey, 'flag', next || '');
      } else {
        updated[fieldKey] = next;
        if (fieldKey.startsWith('installations.')) {
          const alternateKey = 'installations_' + fieldKey.substring('installations.'.length);
          updated[alternateKey] = next;
        } else if (fieldKey.startsWith('installations_')) {
          const alternateKey = 'installations.' + fieldKey.substring('installations_'.length);
          updated[alternateKey] = next;
        }
      }

      return updated;
    });
  };

  const setFieldFlag = (fieldKey: string, next: 'red' | 'yellow' | 'green' | null) => {
    const clientId = data.clientId || 'default';
    const res = resolveFlagNamespace(fieldKey);
    if (!res) return;

    const { storageKey, subKey } = res;

    setFieldFlags(prev => {
      try {
        let storedObj: Record<string, any> = {};
        const saved = localStorage.getItem(storageKey);
        if (saved) storedObj = JSON.parse(saved);

        if (next === null) {
          delete storedObj[subKey];
        } else {
          storedObj[subKey] = next;
        }
        safeSetItem(storageKey, JSON.stringify(storedObj));
      } catch (e) {
        console.error('Failed to save flag to localstorage', e);
      }

      const updated = { ...prev };

      if (storageKey.startsWith('constructie_flags_')) {
        updated[`constructie_row_${subKey}`] = next;
        updated[`constructie_${subKey}_invoer`] = next;
        updated[`constructie_${subKey}_merk`] = next;
        updated[`constructie_${subKey}_val`] = next;
        updated[`constructie_${subKey}_g`] = next;
        updated[`constructie_${subKey}_dikte`] = next;
        updated[`constructie_${subKey}_code`] = next;
        updated[`constructie_${subKey}_kozijn`] = next;
        updated[`constructie_${subKey}_glas`] = next;
        updated[`constructie_${subKey}_isolatie`] = next;
        handleRealConstructieChange(subKey, 'flag', next || '');
      } else {
        updated[fieldKey] = next;
        if (fieldKey.startsWith('installations.')) {
          const alternateKey = 'installations_' + fieldKey.substring('installations.'.length);
          updated[alternateKey] = next;
        } else if (fieldKey.startsWith('installations_')) {
          const alternateKey = 'installations.' + fieldKey.substring('installations_'.length);
          updated[alternateKey] = next;
        }
      }

      return updated;
    });
  };

  const renderFlagCycleClicker = (fieldKey: string) => {
    const flag = fieldFlags[fieldKey];
    let colorClass = 'bg-neutral-200 border-neutral-300 hover:bg-neutral-300';
    if (flag === 'red') colorClass = 'bg-red-500 border-red-600 shadow-[0_0_6px_rgba(239,68,68,0.55)]';
    else if (flag === 'yellow') colorClass = 'bg-amber-400 border-amber-500 shadow-[0_0_6px_rgba(251,191,36,0.55)]';
    else if (flag === 'green') colorClass = 'bg-green-500 border-green-600 shadow-[0_0_6px_rgba(34,197,94,0.55)]';

    return (
      <button
        type="button"
        onClick={() => toggleFieldFlag(fieldKey)}
        className={`w-2.5 h-2.5 rounded-full border cursor-pointer transition-all duration-150 transform hover:scale-110 flex-shrink-0 focus:outline-none ${colorClass}`}
        title="Toggle field status (None -> Red -> Yellow -> Green)"
      />
    );
  };

  const renderCardLabel = (labelText: string, flagKey: string) => (
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block">{labelText}</span>
      {renderFlagCycleClicker(flagKey)}
    </div>
  );

  const [editingConstructieRow, setEditingConstructieRow] = useState<ConstructionRow | null>(null);

  const handleSaveConstructieRow = (updated: ConstructionRow) => {
    const updatedConstructies = (data.constructies || []).map(r => r.id === updated.id ? updated : r);
    if (!updatedConstructies.some(r => r.id === updated.id)) {
      updatedConstructies.push(updated);
    }
    
    const newFlags = { ...((data.installations as any)?.flags || {}) };
    const flagKey = `constructie_row_${updated.id}`;
    if (updated.flag) newFlags[flagKey] = updated.flag;
    else delete newFlags[flagKey];
    onChange('installations.flags', newFlags);

    onChange('constructies', updatedConstructies as any);
    setEditingConstructieRow(null);
  };

  const handleAddConstructieRow = (type: string) => {
    const newId = `c-${Date.now()}`;
    const tLang = t('structural.newElementPlaceholder', { type: type.toLowerCase() }) || `Nieuwe ${type.toLowerCase()}`;
    setEditingConstructieRow({
      id: newId,
      type: type as any,
      naam: tLang,
      locatie: 'voorgevel',
      invoer: 'Beslisschema',
      isolatie: 'Yes',
      area: '0.00',
      rc: '0.0',
      dakType: type === 'Dak' ? 'Hellend dak' : undefined,
    });
  };

  const [bouwkundig, setBouwkundig] = useState({
    voorgevelIso: 'H2Foam lite 60mm',
    voorgevelOri: 'NO',
    voorgevelGrens: 'Buitenlucht',
    voorgevelArea: '18.7 m2',
    kozijnenVoorgevel: [
      { id: 'D1', area: '1.96', constructie: 'Geïsoleerd', zonwering: 'Geen', hb: '', bb: '', ho: '', belemmering: 'Geen', imgKey: 'kozijnD1' as const },
      { id: 'D1W', area: '0.28', constructie: 'TripleHR', zonwering: 'Geen', hb: '', bb: '', ho: '', belemmering: 'Geen', imgKey: 'kozijnD1W' as const },
      { id: 'W2', area: '2.58', constructie: 'HR++', zonwering: 'Geen', hb: '', bb: '', ho: '', belemmering: 'Geen', imgKey: 'kozijnW2' as const },
      { id: 'W4', area: '1.03', constructie: 'HR++', zonwering: 'Geen', hb: '', bb: '', ho: '', belemmering: 'Geen', imgKey: null },
    ],
    linkergevelIso: 'H2Foam lite 60mm',
    linkergevelOri: 'ZO',
    linkergevelGrens: 'Buitenlucht',
    linkergevelArea: '39.1 m2',
    kozijnenLinkergevel: [
      { id: 'WS', area: '0.82', constructie: 'HR++', zonwering: 'Geen', hb: '', bb: '', ho: '', belemmering: 'Geen', imgKey: null },
    ],
    platdakIso: 'PUR/PIR | - 80mm',
    platdakArea: '29.9 m2',
    platdakGrens: 'Buitenlucht',
    achterdakIso: 'Unidek Reno Dekfolie 189mm',
    achterdakOri: 'ZW',
    achterdakAngle: '45°',
    achterdakGrens: 'Buitenlucht',
    achterdakArea: '17.99 m2',
    dak1Type: 'Plat dak',
    dak1Iso: 'PUR 40mm',
    dak1Area: '12.4',
    dak2Type: 'Hellend dak',
    dak2Iso: 'Minerale wol 120mm',
    dak2Angle: '45 graden',
    vloerType: 'Betonnen begane grondvloer',
    vloerIso: 'EPS 80mm (Kruipruimte)',
    vloerRc: '3.2',
    vloerGrens: 'Kruipruimte',
    kozijnenAchtergevel: [],
    achtergevelIso: 'H2Foam lite 60mm',
    achtergevelOri: 'ZW',
    achtergevelGrens: 'Buitenlucht',
    achtergevelArea: '31.2',
  });

  const currentAddress = data.algemeen?.woning?.adres || 'default';

  const defaultImages = {};

  const [images, setImages] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(`invoersheet_images_${currentAddress}`);
      return stored ? JSON.parse(stored) : defaultImages;
    } catch {
      return defaultImages;
    }
  });

  const [interiorPhotos, setInteriorPhotos] = useState<Record<string, string[]>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('massEPA_photos_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.interior) {
           const aggregated: Record<string, string[]> = {};
           for (const categories of Object.values(parsed.interior)) {
             for (const [category, urls] of Object.entries(categories as Record<string, string[]>)) {
               if (!aggregated[category]) aggregated[category] = [];
               aggregated[category].push(...urls);
             }
           }
           setInteriorPhotos(aggregated);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`invoersheet_images_${currentAddress}`);
      setImages(stored ? JSON.parse(stored) : defaultImages);
    } catch {
      setImages(defaultImages);
    }
  }, [currentAddress]);

  useEffect(() => {
    if (!currentAddress || Object.keys(images).length === 0) return;
    try {
      safeSetItem(`invoersheet_images_${currentAddress}`, JSON.stringify(images));
    } catch (e) {
      console.error('Failed to save invoersheet images to localStorage:', e);
    }
  }, [images, currentAddress]);

  const triggerPhotoUpload = (key: string, context?: { type?: 'bouwkundig' | 'kozijn', id?: string, index?: number, instId?: string }, capture?: boolean) => {
    activeUploadKeyRef.current = key;
    activeUploadContextRef.current = context || null;
    if (fileInputRef.current) {
      if (capture) {
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
  };

  const keyToCategoryMap: Record<string, string> = {
    vent: 'Ventilatie',
    vent_extra: 'Ventilatie',
    vent_3: 'Ventilatie',
    vent_4: 'Ventilatie',
    ketel: 'Verwarming',
    ketel_extra: 'Verwarming',
    ketel_3: 'Verwarming',
    ketel_4: 'Verwarming',
    tapwater: 'Tapwater',
    tapwater_extra: 'Tapwater',
    tapwater_3: 'Tapwater',
    tapwater_4: 'Tapwater',
    koeling: 'Koeling',
    koeling_extra: 'Koeling',
    koeling_3: 'Koeling',
    koeling_4: 'Koeling',
    solar: 'Zonne-panelen',
    solar_extra: 'Zonne-panelen',
    solar_3: 'Zonne-panelen',
    solar_4: 'Zonne-panelen'
  };

  const getCategoryPhotoUrl = (category: string, index: number = 0): string | undefined => {
    const key = `files_${category.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const files: any[] = (data.installations as any)?.[key] || [];
    const imageFiles = files.filter(f => f.type?.startsWith('image/'));
    return imageFiles[index]?.dataUrl;
  };

  const getInstCategoryPhotoUrl = (instDetails: any, category: string, index: number = 0): string | undefined => {
    const key = `files_${category.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const files: any[] = instDetails?.[key] || [];
    const imageFiles = files.filter((f: any) => f.type?.startsWith('image/'));
    return imageFiles[index]?.dataUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = activeUploadKeyRef.current;
    const context = activeUploadContextRef.current;

    if (file && (key || context)) {
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

          if (key) {
            setImages(prev => ({
              ...prev,
              [key]: dataUrl
            }));
          }

          if (context && (context.type === 'bouwkundig' || context.type === 'kozijn')) {
            if (context.type === 'bouwkundig') {
              const rows = data.bouwkundigRows || defaultBouwkundigRows;
              let idx = rows.findIndex((r: any) => (r.constructieId && r.constructieId === context.id) || (r.id && r.id === context.id) || (r.naam && r.naam === context.id));
              if (idx === -1 && context.index !== undefined && context.index < rows.length) {
                idx = context.index;
              }
              if (idx >= 0) {
                const rowObj = rows[idx];
                const existing = [...(rowObj.photos || []), ...(rowObj.photoUrl ? [rowObj.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => p && arr.indexOf(p) === i);
                const newPhotos = [...existing, dataUrl];
                const updatedRows = [...rows];
                updatedRows[idx] = {
                  ...rowObj,
                  photos: newPhotos,
                  photoUrl: rowObj.photoUrl || dataUrl
                };
                onChange('bouwkundigRows', updatedRows as any);
                if (key) {
                  onChange(`installations.selectedPhotoIndex_${key}`, (newPhotos.length - 1).toString());
                }
              }
            } else if (context.type === 'kozijn') {
              const lib = data.kozijnenLibrary || defaultKozijnenLibrary;
              let idx = lib.findIndex((k: any) => (k.id && k.id === context.id) || (k.naam && k.naam === context.id));
              if (idx === -1 && context.index !== undefined && context.index < lib.length) {
                idx = context.index;
              }
              if (idx >= 0) {
                const libObj = lib[idx];
                const existing = [...(libObj.photos || []), ...(libObj.photoUrl ? [libObj.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => p && arr.indexOf(p) === i);
                const newPhotos = [...existing, dataUrl];
                const updatedLib = [...lib];
                updatedLib[idx] = {
                  ...libObj,
                  photos: newPhotos,
                  photoUrl: libObj.photoUrl || dataUrl
                };
                onChange('kozijnenLibrary', updatedLib as any);
                if (key) {
                  onChange(`installations.selectedPhotoIndex_${key}`, (newPhotos.length - 1).toString());
                }
              }

              const list = data.kozijnen || [];
              let updatedKozijnen = list.map((kItem: any) => {
                if ((kItem.id && kItem.id === context.id) || (kItem.naam && kItem.naam === context.id)) {
                  const existing = [...(kItem.photos || []), ...(kItem.photoUrl ? [kItem.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => p && arr.indexOf(p) === i);
                  const newPhotos = [...existing, dataUrl];
                  return {
                    ...kItem,
                    photos: newPhotos,
                    photoUrl: kItem.photoUrl || dataUrl
                  };
                }
                return kItem;
              });
              if (list.length === 0 && context.id) {
                updatedKozijnen = [{ id: context.id, naam: context.id, photos: [dataUrl], photoUrl: dataUrl }];
              }
              if (updatedKozijnen.length > 0) {
                onChange('kozijnen', updatedKozijnen as any);
              }
            }
          } else if (key) {
            const category = keyToCategoryMap[key];
            if (category) {
              const filesKey = `files_${category.replace(/[^a-zA-Z0-9_]/g, '')}`;
              const activeId = localStorage.getItem('installatie_active_id_current') || '1';
              const allInst = data.allInstallations || [];
              const inst = allInst.find((i: any) => i.id === activeId);
              const existingFiles = [...(inst?.details?.[filesKey] || (data.installations as any)?.[filesKey] || [])];
              
              const newFileObj = {
                name: file.name || 'unnamed_image.jpg',
                type: 'image/jpeg',
                size: `${Math.round(dataUrl.length / 1024)} KB`,
                dataUrl
              };

              existingFiles.push(newFileObj);
              const newIndex = existingFiles.length - 1;

              updateInstallationField(activeId, filesKey, existingFiles);
              updateInstallationField(activeId, `selectedPhotoIndex_${key}`, newIndex.toString());
              // Clean up any leftover buggy prefix state from the old deletion logic
              updateInstallationField(activeId, `inst_${activeId}_selectedPhotoIndex_${key}`, undefined);
              onChange(`installations.selectedPhotoIndex_${key}`, newIndex.toString());
            }
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
    activeUploadKeyRef.current = null;
    activeUploadContextRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImages(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    const category = keyToCategoryMap[key];
    if (category) {
      const filesKey = `files_${category.replace(/[^a-zA-Z0-9_]/g, '')}`;
      const existingFiles = [...((data.installations as any)?.[filesKey] || [])];
      const index = key.endsWith('_extra') ? 1 : 0;

      if (existingFiles.length > index) {
        existingFiles.splice(index, 1);
        onChange(`installations.${filesKey}`, existingFiles as any);
      }
    }
  };

  const handleInstallationChange = (key: string, val: string) => {
    onChange(`installations.${key}`, val);
  };

  const handleRealConstructieChange = (id: string, field: string, val: string) => {
    const list = data.constructies || [];
    const updated = list.map(item => {
      if (item.id === id) {
        if (field === 'uWaarde' || field === 'uGren') {
          return { ...item, uWaarde: val, uGren: val };
        }
        if (field === 'invoer' && val === 'Beslisschema') {
          return { ...item, invoer: val, merk: '' };
        }
        return { ...item, [field]: val };
      }
      return item;
    });
    onChange('constructies', updated as any);
  };

  const navigateToConstructieTab = (type: 'Deur' | 'Raam' | 'Paneel' | 'Gevel' | 'Vloer' | 'Dak') => {
    safeSetItem('constructie_active_tab', type);
    if (onViewChange) {
      onViewChange('constructie');
    }
  };

  const makeInstActive = (instId: string) => {
    const activeInstallatieId = localStorage.getItem('installatie_active_id_current') || '1';
    if (instId !== activeInstallatieId) {
      safeSetItem('installatie_active_id_current', instId);
      const currentInsts = data.allInstallations || [];
      const inst = currentInsts.find((i: any) => i.id === instId);
      if (inst) {
        onChange('installations', inst.details || {});
      }
    }
  };

  const updateInstallationField = (instId: string, detailKey: string, newVal: any) => {
    makeInstActive(instId);

    const clientIdKey = data.clientId || 'default';
    let rawList: any[] = Array.isArray(data.allInstallations) && data.allInstallations.length > 0
      ? data.allInstallations
      : [];
    if (rawList.length === 0) {
      try {
        const saved = localStorage.getItem(`mepa_installations_list_${clientIdKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) rawList = parsed;
        }
      } catch { }
    }
    if (rawList.length === 0) {
      rawList = [{ id: instId, details: { ...data.installations } }];
    }

    const updatedList = rawList.map((item: any) => {
      if (item.id === instId) {
        const updatedDetails = {
          ...(item.details || {}),
          [detailKey]: newVal
        };
        let extra = {};
        if (detailKey === 'ventMerkType') extra = { ventilatieName: newVal };
        else if (detailKey === 'verwarmMerkType') extra = { verwarmingName: newVal };
        else if (detailKey === 'tapMerkType') extra = { tapwaterName: newVal };
        else if (detailKey === 'koelMerkType') extra = { koelingName: newVal };
        else if (detailKey === 'zonMerkType') extra = { zonneName: newVal };

        return {
          ...item,
          ...extra,
          details: updatedDetails
        };
      }
      return item;
    });

    safeSetItem(`mepa_installations_list_${clientIdKey}`, JSON.stringify(updatedList));
    onChange('allInstallations', updatedList as any);
    onChange(`installations.${detailKey}`, newVal);
  };


  const renderInstallationMasonryGallery = (categoryName: string, instDetails?: any, instId?: string, readOnly: boolean = false) => {
    const targetDetails = instDetails || data.installations || {};
    
    let baseKey = '';
    if (categoryName === 'Verwarming') baseKey = 'ketel';
    else if (categoryName === 'Ventilatie') baseKey = 'vent';
    else if (categoryName === 'Tapwater') baseKey = 'tapwater';
    else if (categoryName === 'Koeling') baseKey = 'koeling';
    else if (categoryName === 'Zonne-panelen') baseKey = 'solar';

    const slots = [baseKey, `${baseKey}_extra`, `${baseKey}_3`, `${baseKey}_4`];
    const maxPhotos = 4;
    const activePhotos: Array<{ url: string; slotKey: string; index: number; internalIndex: number }> = [];

    for (let i = 0; i < maxPhotos; i++) {
      const slotKey = slots[i];
      let selectedIndexVal = targetDetails[`selectedPhotoIndex_${slotKey}`];
      if (instId && targetDetails[`inst_${instId}_selectedPhotoIndex_${slotKey}`] !== undefined) {
        selectedIndexVal = targetDetails[`inst_${instId}_selectedPhotoIndex_${slotKey}`];
      }
      
      const index = selectedIndexVal !== undefined ? parseInt(selectedIndexVal, 10) : (i < 2 ? i : -1);
      
      let url = undefined;
      if (index !== -1) {
        url = getInstCategoryPhotoUrl(targetDetails, categoryName, index) || images[slotKey];
        if (!url) {
           if (categoryName === 'Verwarming') {
             url = (interiorPhotos['Heating system - merk & type'] || interiorPhotos['Heating system'] || [])[index];
           } else if (categoryName === 'Ventilatie') {
             url = (interiorPhotos['Ventilation panel'] || interiorPhotos['Ventilation grill'] || [])[index];
           } else if (categoryName === 'Tapwater') {
             url = (interiorPhotos['Tapwater system - brand & type'] || [])[index];
           } else if (categoryName === 'Zonne-panelen') {
             url = (interiorPhotos['PV system - merk & type'] || interiorPhotos['PV system'] || [])[index];
           }
        }
      }

      if (url && url !== '-' && url !== '') {
        activePhotos.push({ url, slotKey, index: i + 1, internalIndex: index });
      }
    }

    const handlePhotoDelete = (deletedSlotKey: string) => {
      const removeIdx = activePhotos.findIndex(p => p.slotKey === deletedSlotKey);
      if (removeIdx === -1) return;
      
      const newActivePhotos = [...activePhotos];
      newActivePhotos.splice(removeIdx, 1);
      
      slots.forEach((sKey, i) => {
         const newIndex = i < newActivePhotos.length ? newActivePhotos[i].internalIndex : -1;
         if (instId) {
           updateInstallationField(instId, `selectedPhotoIndex_${sKey}`, newIndex.toString());
           // Clean up the buggy prefix that was hiding photos
           updateInstallationField(instId, `inst_${instId}_selectedPhotoIndex_${sKey}`, undefined);
         } else {
           onChange(`installations.selectedPhotoIndex_${sKey}`, newIndex.toString());
         }
      });
    };

    const emptySlotIndex = slots.findIndex(s => !activePhotos.some(p => p.slotKey === s));
    const nextSlotKey = emptySlotIndex !== -1 ? slots[emptySlotIndex] : null;
    const nextSlotTitleIndex = emptySlotIndex !== -1 ? emptySlotIndex + 1 : -1;

    return (
      <div className="w-full flex flex-col gap-2">
        {activePhotos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full grid-flow-row-dense">
            {activePhotos.map((photo) => (
              <DynamicMasonryImage 
                key={photo.slotKey} 
                src={photo.url} 
                alt={`${categoryName} ${photo.index}`} 
                readOnly={readOnly}
                slotKey={photo.slotKey}
                categoryName={categoryName}
                title={`${categoryName} ${photo.index}`}
                instId={instId}
                makeInstActive={makeInstActive}
                setPhotoSelectorModal={setPhotoSelectorModal}
                onDelete={handlePhotoDelete}
                onPhotoClick={() => openLightbox(activePhotos.map(p => p.url), activePhotos.findIndex(p => p.slotKey === photo.slotKey))}
              />
            ))}
          </div>
        )}
        
        {!readOnly && nextSlotKey && (
          <div
            onClick={() => {
              if (instId) makeInstActive(instId);
              setPhotoSelectorModal({ isOpen: true, slotKey: nextSlotKey, categoryName, title: `${categoryName} ${nextSlotTitleIndex}`, visiblePhotos: activePhotos.map(p => p.url) });
            }}
            className={`border border-[#e2e8f0] border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-neutral-100 hover:border-primary/50 text-neutral-400 aspect-[4/3] w-full print:hidden transition cursor-pointer shadow-xs ${activePhotos.length === 0 ? 'min-h-[120px]' : 'mt-1'}`}
          >
            <Camera size={20} className="mb-1 opacity-50" />
            <span className="text-[10px] font-black uppercase tracking-wider font-sans opacity-70">Voeg foto toe</span>
          </div>
        )}
        
        {activePhotos.length === 0 && (
          <div className="hidden print:flex border border-[#e2e8f0] rounded-xl items-center justify-center bg-gray-50 text-neutral-400 aspect-[4/3] w-full text-xs">
            Geen {categoryName.toLowerCase()} foto's
          </div>
        )}
      </div>
    );
  };

  const parseToDateInputValue = (friendlyDate: string): string => {
    if (!friendlyDate) return '';
    const dateStr = friendlyDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const parts = dateStr.split(/\s+/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const monthName = parts[1].toLowerCase();
      const year = parts[2];
      const monthIndex = months.findIndex(m => m === monthName || m.startsWith(monthName.substring(0, 3)));
      if (monthIndex !== -1 && /^\d+$/.test(year) && /^\d+$/.test(day)) {
        const month = String(monthIndex + 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const rday = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${rday}`;
    }
    return '';
  };

  const formatToDutchDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const translationMap: Record<string, { en: string; nl: string }> = {
    'Onbekend': { en: 'Unknown', nl: 'Onbekend' },
    'Ja': { en: 'Yes', nl: 'Ja' },
    'Nee': { en: 'No', nl: 'Nee' },
    'Individueel': { en: 'Individual', nl: 'Individueel' },
    'Gemeenschappelijk/collectief': { en: 'Collective', nl: 'Gemeenschappelijk/collectief' },
    'Ge/collectief': { en: 'Collective', nl: 'Ge/collectief' },
    'Warmtelevering derden individueel': { en: 'Third party heat supply individual', nl: 'Warmtelevering derden individueel' },
    'Warmtelevering derden gemeenschappelijk': { en: 'Third party heat supply collective', nl: 'Warmtelevering derden gemeenschappelijk' },
    'Koudelevering derden': { en: 'Cooling from third parties', nl: 'Koudelevering derden' },
    'Koudelevering derden ge': { en: 'Cooling from third parties collective', nl: 'Koudelevering derden ge' },
    'Externe warmtelevering via een afleverset individueel': { en: 'External heat supply via individual delivery set', nl: 'Externe warmtelevering via een afleverset individueel' },
    'Externe warmtelevering via een afleverset gemeenschappelijk (centraal)': { en: 'External heat supply via collective delivery set', nl: 'Externe warmtelevering via een afleverset gemeenschappelijk (centraal)' },
    'Nominaal vermogen': { en: 'Nominal power', nl: 'Nominaal vermogen' },
    'Nominaal vermogen onbekend': { en: 'Nominal power unknown', nl: 'Nominaal vermogen onbekend' },
    'Kwaliteitsverklaring': { en: 'Quality declaration', nl: 'Kwaliteitsverklaring' },
    'Gelijkstroom': { en: 'Direct Current (DC)', nl: 'Gelijkstroom' },
    'Wisselstroom': { en: 'Alternating Current (AC)', nl: 'Wisselstroom' },
    'Draaistroom': { en: 'Three-phase', nl: 'Draaistroom' },
    'tot 1980': { en: 'up to 1980', nl: 'tot 1980' },
    '1980 - 1990': { en: '1980 - 1990', nl: '1980 - 1990' },
    '1990 - 2000': { en: '1990 - 2000', nl: '1990 - 2000' },
    '>2006': { en: '>2006', nl: '>2006' },
    'LUKA A,B of C': { en: 'LUKA A,B or C', nl: 'LUKA A,B of C' },
    'LUKA D': { en: 'LUKA D', nl: 'LUKA D' },
    'Geen kanaal': { en: 'No duct', nl: 'Geen kanaal' },
    'Ja, 100% bypass': { en: 'Yes, 100% bypass', nl: 'Ja, 100% bypass' },
    'Ja, gedeeltelijk': { en: 'Yes, partial', nl: 'Ja, gedeeltelijk' },
    'Gasgestookte ketel': { en: 'Gas-fired boiler', nl: 'Gasgestookte ketel' },
    'Elektrische verwarming': { en: 'Electric heating', nl: 'Elektrische verwarming' },
    'Moederhaard': { en: 'Mother fireplace / back boiler', nl: 'Moederhaard' },
    'Lokale gaskachel': { en: 'Local gas stove', nl: 'Lokale gaskachel' },
    'Lokale oliekachel': { en: 'Local oil stove', nl: 'Lokale oliekachel' },
    'Oliegestookte ketel': { en: 'Oil-fired boiler', nl: 'Oliegestookte ketel' },
    'WKK': { en: 'CHP', nl: 'WKK' },
    'Warmtepomp gasinjectie': { en: 'Gas injection heat pump', nl: 'Warmtepomp gasinjectie' },
    'Warmtepomp gasmotor': { en: 'Gas engine heat pump', nl: 'Warmtepomp gasmotor' },
    'Warmtepomp elektrisch': { en: 'Electric heat pump', nl: 'Warmtepomp elektrisch' },
    'Biomassakachel': { en: 'Biomass stove', nl: 'Biomassakachel' },
    'Biomassaketel handmatig gestookt': { en: 'Manually fired biomass boiler', nl: 'Biomassaketel handmatig gestookt' },
    'Biomassaketel automatisch gestookt': { en: 'Automatically fired biomass boiler', nl: 'Biomassaketel automatisch gestookt' },
    'Warmtelevering derden': { en: 'Heat supply by third parties', nl: 'Warmtelevering derden' },
    'Water': { en: 'Water', nl: 'Water' },
    'Local': { en: 'Local', nl: 'Local' },
    'Tweepijpsysteem': { en: 'Two-pipe system', nl: 'Tweepijpsysteem' },
    'Eenpijpsysteem': { en: 'One-pipe system', nl: 'Eenpijpsysteem' },
    'VR-ketel': { en: 'VR boiler', nl: 'VR-ketel' },
    'Verbeterd rendement': { en: 'Improved efficiency', nl: 'Verbeterd rendement' },
    'Niet-condenserend': { en: 'Non-condensing', nl: 'Niet-condenserend' },
    'Radiatoren / convectoren': { en: 'Radiators / convectors', nl: 'Radiatoren / convectoren' },
    'Ventilatorgestuurde radiatoren en/of convectoren': { en: 'Fan-assisted radiators and/or convectors', nl: 'Ventilatorgestuurde radiatoren en/of convectoren' },
    'Vloerverwarming': { en: 'Underfloor heating', nl: 'Vloerverwarming' },
    'Luchtverwarming': { en: 'Warm air heating', nl: 'Luchtverwarming' },
    'Overig van': { en: 'Other', nl: 'Overig van' },
    'Regeling in hoofdvertrek (kamerthermostaat)': { en: 'Control in main room (room thermostat)', nl: 'Regeling in hoofdvertrek (kamerthermostaat)' },
    'Centrale regeling met individuele regeling per ruimte': { en: 'Central control with individual control per room', nl: 'Centrale regeling met individuele regeling per ruimte' },
    'Individuele regeling per ruimte': { en: 'Individual control per room', nl: 'Individuele regeling per ruimte' },
    'Overig of onbekend': { en: 'Other or unknown', nl: 'Overig of onbekend' },
    'Nee / Onbekend': { en: 'No / Unknown', nl: 'Nee / Onbekend' },
    'Ja, aangetoond (Label A)': { en: 'Yes, proven (Label A)', nl: 'Ja, aangetoond (Label A)' },
    'Ja, waarschijnlijk': { en: 'Yes, likely', nl: 'Ja, waarschijnlijk' },
    'Compleet toestel': { en: 'Complete device', nl: 'Compleet toestel' },
    'Directly heated vessel': { en: 'Directly heated vessel', nl: 'Directly heated vessel' },
    'Indirectly heated vessel': { en: 'Indirectly heated vessel', nl: 'Indirectly heated vessel' },
    'Externe heat supply via delivery set': { en: 'External heat supply via delivery set', nl: 'Externe heat supply via delivery set' },
    'Keukengeiser': { en: 'Kitchen geyser', nl: 'Keukengeiser' },
    'Gasgestookt warmwatertoestel (Badgeiser)': { en: 'Gas water heater (bath geyser)', nl: 'Gasgestookt warmwatertoestel (Badgeiser)' },
    'Gasgestookt combitoestel': { en: 'Gas combi boiler', nl: 'Gasgestookt combitoestel' },
    '(micro) WKK': { en: '(micro) CHP', nl: '(micro) WKK' },
    'Elektrisch': { en: 'Electric', nl: 'Elektrisch' },
    'Boosterwarmtepomp': { en: 'Booster heat pump', nl: 'Boosterwarmtepomp' },
    'Elektrische doorstroomverwarmer': { en: 'Electric instantaneous water heater', nl: 'Elektrische doorstroomverwarmer' },
    'Vast biobrandstoftoestel': { en: 'Solid biofuel appliance', nl: 'Vast biobrandstoftoestel' },
    'Elektrische boiler': { en: 'Electric boiler', nl: 'Elektrische boiler' },
    'Warmwaterboiler': { en: 'Hot water boiler', nl: 'Warmwaterboiler' },
    'Ja, geïsoleerd': { en: 'Yes, insulated', nl: 'Ja, geïsoleerd' },
    'Ja, ongeïsoleerd': { en: 'Yes, uninsulated', nl: 'Ja, ongeïsoleerd' },
    'Ja, douchepijp-WTW': { en: 'Yes, shower pipe recovery', nl: 'Ja, douchepijp-WTW' },
    'Ja, douchebak-WTW': { en: 'Yes, shower tray recovery', nl: 'Ja, douchebak-WTW' },
    'Compressiekoeling': { en: 'Compression cooling', nl: 'Compressiekoeling' },
    'Absorptiekoeling': { en: 'Absorption cooling', nl: 'Absorptiekoeling' },
    'Passieve vrije koeling': { en: 'Passive free cooling', nl: 'Passieve vrije koeling' },
    'Directe koeling in de ruimte (airconditioning)': { en: 'Direct cooling in the room (air conditioning)', nl: 'Directe koeling in de ruimte (airconditioning)' },
    'Directe koeling in het LBK (DX-systeem)': { en: 'Direct cooling in the AHU (DX system)', nl: 'Directe koeling in het LBK (DX-systeem)' },
    'Met indirecte verdamping': { en: 'With indirect evaporation', nl: 'Met indirecte verdamping' },
    'Lucht': { en: 'Air', nl: 'Lucht' },
    'Koudemiddel': { en: 'Refrigerant', nl: 'Koudemiddel' },
    'Werkelijk vermogen en EI': { en: 'Actual power and EI', nl: 'Werkelijk vermogen en EI' },
    'Werkelijk vermogen': { en: 'Actual power', nl: 'Werkelijk vermogen' },
    'Vloerkoeling': { en: 'Floor cooling', nl: 'Vloerkoeling' },
    'Wandkoeling': { en: 'Wall cooling', nl: 'Wandkoeling' },
    'Plafondkoeling': { en: 'Ceiling cooling', nl: 'Plafondkoeling' },
    'Ventilatorconvectoren (aan plafond)': { en: 'Fan coils (on ceiling)', nl: 'Ventilatorconvectoren (aan plafond)' },
    'Ventilatorconvectoren (aan buitenmuur)': { en: 'Fan coils (on external wall)', nl: 'Ventilatorconvectoren (aan buitenmuur)' },
    'Standalone regeling': { en: 'Standalone control', nl: 'Standalone regeling' },
    'Centrale regeling': { en: 'Central control', nl: 'Centrale regeling' },
    'Bestaande bouw': { en: 'Existing building', nl: 'Bestaande bouw' },
    'Nieuwbouw': { en: 'New construction', nl: 'Nieuwbouw' },
    'Renovatie': { en: 'Renovation', nl: 'Renovatie' },
    'Basisopname': { en: 'Basic recording', nl: 'Basisopname' },
    'Detailopname': { en: 'Detailed recording', nl: 'Detailopname' },
    'Licht': { en: 'Light', nl: 'Licht' },
    'Middel': { en: 'Medium', nl: 'Middel' },
    'Zwaar': { en: 'Heavy', nl: 'Zwaar' },
    'Eigen opname': { en: 'Own recording', nl: 'Eigen opname' },
    'Bouwtekening': { en: 'Construction drawing', nl: 'Bouwtekening' }
  };

  const renderFormCell = (
    label: string,
    value: string,
    pathOrLocalKey: string,
    isLocal: boolean = false,
    type: 'text' | 'select' = 'text',
    options?: string[],
    hasCalendarIcon: boolean = false,
    readOnly: boolean = false,
    customOnChange?: (val: string) => void
  ) => {
    const isDash = !value || value === '-' || value.trim() === '';
    const translatedValue = (!isDash && translationMap[value]?.[locale]) ? translationMap[value][locale] : value;
    const displayVal = isDash ? '-' : translatedValue;
    const isDate = label.toLowerCase().includes('datum') || hasCalendarIcon;
    const flag = fieldFlags[pathOrLocalKey];

    let labelNode;
    if (flag === 'red') {
      labelNode = (
        <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider block w-fit">
          {label}
        </span>
      );
    } else if (flag === 'yellow') {
      labelNode = (
        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider block w-fit">
          {label}
        </span>
      );
    } else if (flag === 'green') {
      labelNode = (
        <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider block w-fit">
          {label}
        </span>
      );
    } else {
      labelNode = (
        <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">
          {label}
        </label>
      );
    }

    let borderStyle = 'border-outline-variant/15 bg-gray-50 hover:bg-gray-100/80';
    if (flag === 'red') {
      borderStyle = '!border-red-500 ring-2 ring-red-100 bg-red-50/20';
    } else if (flag === 'yellow') {
      borderStyle = '!border-amber-500 ring-2 ring-amber-100 bg-amber-50/20';
    } else if (flag === 'green') {
      borderStyle = '!border-green-500 ring-2 ring-green-100 bg-green-50/20';
    }

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5 justify-between">
          {labelNode}
          {readOnly ? (
            (() => {
              const currentFlag = fieldFlags[pathOrLocalKey];
              if (!currentFlag) return null;
              const colorClass = currentFlag === 'red' ? 'bg-red-500' : currentFlag === 'yellow' ? 'bg-amber-500' : 'bg-green-500';
              return <span className={`w-2 h-2 rounded-full ${colorClass} inline-block`} />;
            })()
          ) : (
            renderFlagCycleClicker(pathOrLocalKey)
          )}
        </div>
        <div className={`flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl border transition duration-150 ${borderStyle}`}>
          {type === 'select' && options ? (
            <>
              <select
                value={value || ''}
                disabled={readOnly}
                onChange={(e) => {
                  if (customOnChange) {
                    customOnChange(e.target.value);
                  } else if (isLocal) {
                    handleInstallationChange(pathOrLocalKey as keyof typeof installations, e.target.value);
                  } else {
                    onChange(pathOrLocalKey, e.target.value);
                  }
                }}
                className={`w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none print:hidden ${readOnly ? 'cursor-default pointer-events-none opacity-80' : 'cursor-pointer'
                  }`}
              >
                {options.map(opt => {
                  const translatedOpt = translationMap[opt]?.[locale] || opt;
                  return (
                    <option key={opt} value={opt}>{translatedOpt}</option>
                  );
                })}
              </select>
              <div className="hidden print:block w-full text-xs font-bold text-on-background leading-tight break-words whitespace-normal py-1">
                {displayVal}
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                value={displayVal}
                disabled={readOnly}
                readOnly={readOnly}
                onChange={(e) => {
                  const val = e.target.value;
                  if (customOnChange) {
                    customOnChange(val);
                  } else if (isLocal) {
                    handleInstallationChange(pathOrLocalKey as keyof typeof installations, val);
                  } else {
                    onChange(pathOrLocalKey, val);
                  }
                }}
                style={isDate ? { width: `${Math.max(displayVal.length * 7.5, 90)}px` } : undefined}
                className={`${isDate ? 'w-auto' : 'w-full'
                  } text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none print:hidden ${isDash ? 'text-on-surface-variant/30 font-semibold' : ''
                  } ${readOnly ? 'cursor-default pointer-events-none opacity-80' : ''}`}
              />
              <div className={`hidden print:block w-full text-xs font-bold leading-tight break-words whitespace-normal py-1 ${isDash ? 'text-on-surface-variant/30 font-semibold' : 'text-on-background'}`}>
                {displayVal}
              </div>
            </>
          )}
          {isDate && (
            <div className="relative inline-flex items-center">
              <button
                className="text-primary hover:text-primary-dark transition duration-150 p-0.5 rounded cursor-pointer no-print flex-shrink-0"
                title="Kies datum"
                type="button"
              >
                <Calendar size={13} className="text-[#0288d1]" />
              </button>
              <input
                type="date"
                value={parseToDateInputValue(value)}
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  if (selectedVal) {
                    const formatted = formatToDutchDate(selectedVal);
                    if (isLocal) {
                      handleInstallationChange(pathOrLocalKey as keyof typeof installations, formatted);
                    } else {
                      onChange(pathOrLocalKey, formatted);
                    }
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Kies datum"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="invoersheet-container" className="flex flex-col h-full bg-[#f1f3f4] text-[#191c1d] w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        @media print {
          /* Hide sidebar, topbar, navigation, modals, all buttons */
          aside,
          nav,
          header,
          footer,
          .no-print,
          button,
          input[type="file"] {
            display: none !important;
          }

          /* Remove all fixed height & overflow clipping from top-level layouts */
          html, body, #root, main, #invoersheet-container {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* All divs: remove overflow constraints, margins & padding on container wrappers */
          div {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
          }

          #invoersheet-container,
          #invoersheet-container > div {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            display: block !important;
          }

          /* The A4 print container */
          .print-page {
            display: block !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            min-height: 0 !important;
            height: auto !important;
          }

          /* Hide the decorative corner element */
          .print-page > div:first-child {
            display: none !important;
          }

          /* Prevent break after last element in print container */
          .print-page > *:last-child,
          #invoersheet-container > *:last-child {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          /* Allow category blocks and cards to break across pages naturally */
          .print-category-block, .print-card {
            break-inside: auto;
            page-break-inside: auto;
          }

          /* Keep form cells together */
          .grid > div {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="no-print bg-white border-b border-[#e1e3e4] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex bg-neutral-100 p-1 rounded-xl gap-0.5 text-[11px] font-black border border-neutral-250 uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('p1')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p1' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            Identificatie & Algemeen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('p2')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p2' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            Installaties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('p3')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p3' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            Constructies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('p4')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p4' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            Bouwkundig
          </button>
        </div>

        <button
          type="button"
          onClick={handlePrintA4}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs active:scale-[0.98] font-sans"
          title="Exporteer Invoersheet als A4 PDF document"
        >
          <Printer size={15} />
          <span>Exporteer A4 PDF</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center w-full">
        <div
          className="transition-transform duration-100 w-full max-w-[850px] min-h-[1100px] h-auto bg-white text-black p-10 relative border border-[#e1e3e4] shadow-md my-4 flex flex-col justify-between print-page rounded-2xl shrink-0"
        >
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-5 border-t-[40px] border-r-[40px] border-primary" />

          <div>
            <div className="border-b-[1.5px] border-primary pb-2 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-primary text-[15.5px] font-black tracking-tight uppercase">EPA Audit Rapportage</h1>
                <p className="text-neutral-900 text-[11px] font-extrabold mt-0.5">MassEPA</p>
              </div>
              <div className="text-right">
                <h1 className="text-primary text-[12px] font-black tracking-tight">Project 202605</h1>
                <p className="text-neutral-900 text-[11px] font-semibold mt-0.5">
                  {data.algemeen?.woning?.adres || 'Finstraat 1'}, {data.algemeen?.woning?.plaats?.toLowerCase().includes('almere') ? 'Almere' : (data.algemeen?.woning?.plaats || 'Almere')}
                </p>
              </div>
            </div>

            {(activeTab === 'p1' || isPrinting) && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="border-b border-neutral-250 pb-1 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider">Identificatie</h2>
                  </div>

                  <div className="print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">Bewoner</h3>
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-x-6 gap-y-4">
                        {renderFormCell('Name', data.algemeen?.bewoner?.persoon || 'Mevrouw S. van Wessum', 'algemeen.bewoner.persoon')}
                        {renderFormCell('Contact', data.algemeen?.bewoner?.telefoon || '+621354340', 'algemeen.bewoner.telefoon')}
                        {renderFormCell('Email', data.algemeen?.bewoner?.email || 'ssjonker@gmail.com', 'algemeen.bewoner.email')}
                        {renderFormCell('Adress', data.algemeen?.bewoner?.adres || '-', 'algemeen.bewoner.adres')}
                        {renderFormCell('Postcode', data.algemeen?.bewoner?.postcode || '-', 'algemeen.bewoner.postcode')}
                        {renderFormCell('Plaats', data.algemeen?.bewoner?.plaats || '-', 'algemeen.bewoner.plaats')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">Inspecteur</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-x-6 gap-y-4">
                        {renderFormCell('Inspecteur Name', data.algemeen?.inspector?.adviseur || 'Mevrouw S. van Wessum', 'algemeen.inspector.adviseur')}
                        {renderFormCell('Certificaatnummer', data.algemeen?.inspector?.certificaathouder || '5923.3337.5020', 'algemeen.inspector.certificaathouder')}
                        {renderFormCell('Certificaathouder', data.algemeen?.inspector?.gebruiker || '-', 'algemeen.inspector.gebruiker')}
                        {renderFormCell('Adress', data.algemeen?.inspector?.adres || '-', 'algemeen.inspector.adres')}
                        {renderFormCell('Postcode', data.algemeen?.inspector?.postcode || '-', 'algemeen.inspector.postcode')}
                        {renderFormCell('Plaats', data.algemeen?.inspector?.plaats || '-', 'algemeen.inspector.plaats')}
                        {renderFormCell('Telephone', data.algemeen?.inspector?.telefoon || '-', 'algemeen.inspector.telefoon')}
                        {renderFormCell('Email', data.algemeen?.inspector?.email || 'joep.esser@buildingid.nl', 'algemeen.inspector.email')}
                        <div />
                        {renderFormCell('Opnamedatum', data.algemeen?.inspector?.opnamedatum || '06 December 2024', 'algemeen.inspector.opnamedatum', false, 'text', undefined, true)}
                        {renderFormCell('Invoerdatum', data.algemeen?.inspector?.invoerdatum || '23 February 2025', 'algemeen.inspector.invoerdatum', false, 'text', undefined, true)}
                        <div />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">BID Intern</h3>
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-x-6 gap-y-4">
                        {renderFormCell('Volledige naam', data.algemeen?.bidIntern?.fullName || '-', 'algemeen.bidIntern.fullName')}
                        {renderFormCell('Telefoonnummer', data.algemeen?.bidIntern?.phoneNumber || '-', 'algemeen.bidIntern.phoneNumber')}
                        {renderFormCell('E-mailadres', data.algemeen?.bidIntern?.email || '-', 'algemeen.bidIntern.email')}
                        {renderFormCell('Contactadres', data.algemeen?.bidIntern?.contactAddress || '-', 'algemeen.bidIntern.contactAddress')}
                        <div />
                        <div />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="border-b border-neutral-250 pb-1 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider">Algemeen</h2>
                  </div>

                  <div className="print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">General details</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4">
                        {renderFormCell('Complex', data.algemeen?.woning?.technischComplex || '1690', 'algemeen.woning.technischComplex')}
                        {renderFormCell('Financieel complex', data.algemeen?.woning?.financieelComplex || '-', 'algemeen.woning.financieelComplex')}
                        {renderFormCell('Gemeente', data.algemeen?.woning?.gemeent || 'Almere', 'algemeen.woning.gemeent')}
                        {renderFormCell('Adress', data.algemeen?.woning?.adres || 'Finstraat 1', 'algemeen.woning.adres')}

                        {renderFormCell('Bouwfase', data.algemeen?.woning?.bouwfase || 'Bestaande bouw', 'algemeen.woning.bouwfase', false, 'select', ['Bestaande bouw', 'Nieuwbouw', 'Renovatie'])}
                        {renderFormCell('Opnametype', data.algemeen?.woning?.opname || 'Basisopname', 'algemeen.woning.opname', false, 'select', ['Basisopname', 'Detailopname'])}
                        {renderFormCell('Postcode', data.algemeen?.woning?.postcode || '1317JA', 'algemeen.woning.postcode')}
                        {renderFormCell('Plaats', data.algemeen?.woning?.plaats || 'Almere stad', 'algemeen.woning.plaats')}

                        {renderFormCell('Pand ID', data.algemeen?.woning?.pandId || '003410000029155', 'algemeen.woning.pandId')}
                        {renderFormCell('VBO ID', data.algemeen?.woning?.vboId || '0034010000010168', 'algemeen.woning.vboId')}
                        {renderFormCell('Wijk', data.algemeen?.woning?.wijk || 'Waterwijk', 'algemeen.woning.wijk')}
                        {renderFormCell('SVB-Status', data.algemeen?.woning?.svbStatus || 'Continue exploitation', 'algemeen.woning.svbStatus', false, 'select', ['Continue exploitation', 'Sale', 'Demolition', 'Minor maintenance', 'Major maintenance', 'Otherwise'])}

                        {renderFormCell('Bron', data.algemeen?.woning?.bron || 'BAG', 'algemeen.woning.bron', false, 'select', ['BAG', 'Bouwtekening', 'Eigen opname'])}
                        <div />
                        <div />
                        <div />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">Technical details</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4">
                        {renderFormCell('Gebouwtype', data.algemeen?.woning?.gebouwtype || 'Detached house', 'algemeen.woning.gebouwtype', false, 'select', ['Detached house', 'Apartment building unit', 'Detached house (non-self-contained units)', 'Apartment (non-self-contained units)'])}
                        {renderFormCell('Subtype', data.algemeen?.woning?.subtype || 'midTerrace', 'algemeen.woning.subtype', false, 'select', ['detached', 'endTerrace', 'midTerrace', 'semiDetached'])}
                        {renderFormCell('Daktype', data.algemeen?.woning?.daktype || 'pitchedRoof', 'algemeen.woning.daktype', false, 'select', ['pitchedRoof', 'partlyFlat', 'flatRoof'])}
                        {renderFormCell('Ligging', data.algemeen?.woning?.ligging || 'groundFloorUnit', 'algemeen.woning.ligging', false, 'select', ['groundFloorUnit', 'middleFloor', 'topFloor', 'groundWithRoof'])}

                        {renderFormCell('Gebouwhoogte', data.algemeen?.woning?.gebouwhoogte || '-', 'algemeen.woning.gebouwhoogte')}
                        {renderFormCell('Vloer constructietype', data.algemeen?.woning?.floorConstructieType || 'Licht', 'algemeen.woning.floorConstructieType', false, 'select', ['Licht', 'Middel', 'Zwaar'])}
                        {renderFormCell('Wand constructietype', data.algemeen?.woning?.wallConstructieType || 'Licht', 'algemeen.woning.wallConstructieType', false, 'select', ['Licht', 'Middel', 'Zwaar'])}
                        {renderFormCell('Leidingdoorvoeren', data.algemeen?.technical?.leidingdoorvoeren || 'Onbekend', 'algemeen.technical.leidingdoorvoeren', false, 'select', ['Onbekend', 'Ja', 'Nee'])}

                        {data.algemeen?.technical?.leidingdoorvoeren === 'Ja' ? renderFormCell('Aantal', data.algemeen?.technical?.aantal || '-', 'algemeen.technical.aantal') : <div />}
                        {renderFormCell('Aantal AVR', data.algemeen?.technical?.avr || '-', 'algemeen.technical.avr')}
                        {renderFormCell('GBO-T_1', data.algemeen?.technical?.gboTs?.[0] || '-', 'algemeen.technical.gboTs.0')}
                        {renderFormCell('GBO-T_2', data.algemeen?.technical?.gboTs?.[1] || '-', 'algemeen.technical.gboTs.1')}

                        {renderFormCell('GBO-T_3', data.algemeen?.technical?.gboTs?.[2] || '-', 'algemeen.technical.gboTs.2')}
                        <div />
                        <div />
                        <div />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'p2' || isPrinting) && (() => {
              const clientIdKey = data.clientId || 'default';
              const installationsList = (() => {
                let rawList: any[] = [];
                if (Array.isArray(data.allInstallations) && data.allInstallations.length > 0) {
                  rawList = data.allInstallations;
                } else {
                  let saved = localStorage.getItem(`mepa_installations_list_${clientIdKey}`);
                  if (!saved && data.clientId && data.clientId !== 'default') {
                    const defaultSaved = localStorage.getItem('mepa_installations_list_default');
                    if (defaultSaved) {
                      safeSetItem(`mepa_installations_list_${data.clientId}`, defaultSaved);
                      saved = defaultSaved;
                    }
                  }
                  if (saved) {
                    try {
                      const parsed = JSON.parse(saved);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        rawList = parsed;
                      }
                    } catch { }
                  }
                }
                if (rawList.length === 0) {
                  rawList = [
                    {
                      id: '1',
                      ventilatieName: data.installations?.ventMerkType || 'Itho Daalderop CVE-S',
                      verwarmingName: data.installations?.verwarmMerkType || 'Nefit Trendline HRC30',
                      tapwaterName: data.installations?.tapMerkType || 'Nefit Trendline (Interne)',
                      koelingName: data.installations?.koelMerkType || 'Niet aanwezig',
                      zonneName: data.installations?.zonMerkType || 'JA Solar Mono',
                      details: { ...data.installations }
                    }
                  ];
                }
                const activeId = localStorage.getItem('installatie_active_id_current') || '1';
                return rawList.map(item => {
                  if (item.id === activeId && data.installations) {
                    return {
                      ...item,
                      ventilatieName: data.installations.ventMerkType || item.ventilatieName,
                      verwarmingName: data.installations.verwarmMerkType || item.verwarmingName,
                      tapwaterName: data.installations.tapMerkType || item.tapwaterName,
                      koelingName: data.installations.koelMerkType || item.koelingName,
                      zonneName: data.installations.zonMerkType || item.zonneName,
                      details: { ...item.details, ...data.installations }
                    };
                  }
                  return item;
                });
              })();

              const activeInstallatieId = localStorage.getItem('installatie_active_id_current') || '1';

              return (
                <div className={`space-y-10 ${isPrinting ? 'print-section' : ''}`}>
                  <div className="border-b border-neutral-250 pb-2.5 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>Installaties</span>
                    </h2>
                    {onViewChange && (
                      <button
                        type="button"
                        onClick={() => onViewChange('installatie')}
                        className="text-[10px] font-black text-primary hover:text-primary-dark flex items-center gap-1.5 cursor-pointer bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all no-print font-sans"
                      >
                        <Wind size={11} />
                        <span>Naar Installatiepagina</span>
                      </button>
                    )}
                  </div>

                  {installationsList.map((inst, index) => {
                    const instDetails = { ...(inst.details || {}), ...(data.installations || {}) };

                    const activeCategories = inst.activeCategories || ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen'];

                    const ventSysteemVal = instDetails.ventVentilatiesysteem || '';
                    const ventSysteemType = ventSysteemVal.includes('Type D') ? 'D' :
                      ventSysteemVal.includes('Type C') ? 'C' :
                        ventSysteemVal.includes('Type A') ? 'A' :
                          ventSysteemVal.includes('Type B') ? 'B' :
                            ventSysteemVal.includes('Type E') ? 'E' : '';

                    const ventFansVal = instDetails.ventVentilatoren || 'Nominaal vermogen';

                    const verwarmSystemType = instDetails.verwarmTypeToestel || 'Individueel';
                    const isVerwarmExternal = verwarmSystemType.includes('derden') || verwarmSystemType.includes('afleverset');
                    const verwarmDistMedium = instDetails.verwarmDistributiemedium || 'Water';

                    const tapSystemType = instDetails.tapTypeInstallatie || 'Individueel';
                    const isTapExternal = tapSystemType.includes('derden') || tapSystemType.includes('afleverset');

                    const renderInstCell = (
                      label: string,
                      value: string,
                      pathOrLocalKey: string,
                      type: 'text' | 'select' = 'text',
                      options?: string[],
                      hasCalendarIcon: boolean = false
                    ) => {
                      return renderFormCell(
                        label,
                        value,
                        `inst_${inst.id}_${pathOrLocalKey}`,
                        false,
                        type,
                        options,
                        hasCalendarIcon,
                        false,
                        (newVal) => updateInstallationField(inst.id, pathOrLocalKey, newVal)
                      );
                    };

                    return (
                      <div
                        key={inst.id}
                        className="space-y-6 border border-neutral-200/80 rounded-3xl p-6 relative shadow-xs transition duration-200 print:border-none print:ring-0 print:shadow-none print:p-0 bg-white"
                      >
                        {/* Header & 3.1 Ventilatie wrapped together so they never split across page breaks */}
                        <div className="space-y-6 print:break-inside-avoid">
                          <div className="flex justify-between items-center pb-3 border-b border-neutral-200/85 print-header-keep">
                            <div className="flex items-center gap-2.5 font-sans">
                              <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                                Installatie #{index + 1}
                              </span>
                            </div>
                            {installationsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setInstallationToDelete(inst.id)}
                                className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer mr-2 no-print"
                                title="Verwijder installatie"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          {/* 3.1 Ventilatie Card */}
                          {activeCategories.includes('Ventilatie') && (
                          <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                            <div className="flex-grow md:w-[72%] print:w-[72%]">
                              <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                <span className="flex items-center gap-1.5"><Wind size={14} /> Ventilatie</span>
                                <div className="flex items-center gap-1.5 no-print">
                                  <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Ventilatie'); localStorage.setItem('installatie_view_state', 'detail'); if (onViewChange) onViewChange('installatie'); }} className="p-1.5 hover:bg-blue-50 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer" title="Bewerken"><Pencil size={13} /></button>
                                  <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Ventilatie' }) }} className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Verwijderen"><Trash2 size={13} /></button>
                                </div>
                              </h3>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                <div>{renderInstCell('SYSTEM', instDetails.ventTypeToestel || 'Individueel', 'ventTypeToestel', 'select', ['Individueel', 'Gemeenschappelijk/collectief'])}</div>
                                <div>{renderInstCell('NUMBER OF IDENTICAL SYSTEMS', instDetails.ventIdentiekeSystemen || '1', 'ventIdentiekeSystemen', 'text')}</div>
                                <div>{renderInstCell('BRAND & TYPE', instDetails.ventMerkType || '', 'ventMerkType', 'text')}</div>
                                <div>{renderInstCell('VENTILATION SYSTEM', instDetails.ventVentilatiesysteem || 'Type C', 'ventVentilatiesysteem', 'select', ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'])}</div>
                                <div>{renderInstCell('INSTALLATION YEAR', instDetails.ventSpecsBcrg || '', 'ventSpecsBcrg', 'text')}</div>
                                <div>{renderInstCell('AIR TIGHTNESS', instDetails.ventLuchtdichtheid || 'LUKA A,B of C', 'ventLuchtdichtheid', 'select', ['LUKA A,B of C', 'LUKA D', 'Geen kanaal', 'Onbekend'])}</div>
                                
                                {instDetails.ventSubsysteem && <div>{renderInstCell('RIBBON HEATING', instDetails.ventSubsysteem, 'ventSubsysteem', 'select', ['Ja', 'Nee'])}</div>}

                                {['Type A', 'Type B', 'Type C', 'Type D', 'Type E'].includes(instDetails.ventVentilatiesysteem || '') && (
                                  <>
                                    <div className="col-span-2">
                                      {renderInstCell('DEMAND CONTROL SYSTEM', instDetails.ventDemandControl || '', 'ventDemandControl', 'select',
                                        ventSysteemType === 'A' ? ['A1 Standaard (toevoer niet luchtdruk gestuurd)', 'A2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'A2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'A2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003'] :
                                          ventSysteemType === 'B' ? ['B1 Standaard', 'B2 Tijdssturing op installaties, zonder zonering', 'B3 CO2-meting per verblijfsruimte, CO2-sturing op installaties, met zonering'] :
                                            ventSysteemType === 'C' ? ['C1 Standaard', 'C2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'C2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'C2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10 Pa', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003', 'C3a Tijdsturing afvoer, zonder zonering', 'C3b Luchtdrukgestuurde toevoer delta p <= 1 PA, tijdsturing afvoer, zonder zonering', 'C3c Tijdsturing toevoer, afvoer zonder zonering', 'C4a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C4b CO2-sturing op de toevoer in ten minste de woonkamer en de hoofdslaapkamer', 'C4c Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C5a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C5b Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting'] :
                                              ventSysteemType === 'D' ? ['D1 Standaard', 'D2 Centrale WTW-installatie zonder zoneringen en zonder sturing', 'D3 Centrale WTW, sturing van afvoer CO2-meting in de WTW, geen zonering', 'D4a Tijdsturing zonder zonering', 'D4b Tijdsturing met zonering', 'D5a Centrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5b Decentrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5c Centrale WTW. CO2-metingen in ten minste de woon- en hoofdslaapkamer'] :
                                                ['E1 Systeemdeel D: decentrale WTW (Systeem D.5b)']
                                      )}
                                    </div>

                                    {ventSysteemType === 'D' && (
                                      <>
                                        <div>{renderInstCell('BYPASS PRESENT?', instDetails.ventBypass || 'Nee', 'ventBypass', 'select', ['Ja, 100% bypass', 'Ja, gedeeltelijk', 'Nee'])}</div>
                                        <div>{renderInstCell('HR EFFICIENCY (%)', instDetails.ventHrEfficiency || '', 'ventHrEfficiency', 'text')}</div>
                                      </>
                                    )}

                                    <div>{renderInstCell('FANS', instDetails.ventVentilatoren || 'Nominaal vermogen', 'ventVentilatoren', 'select', ['Nominaal vermogen', 'Nominaal vermogen onbekend', 'Kwaliteitsverklaring', 'Onbekend'])}</div>

                                    {['Nominaal vermogen', 'Kwaliteitsverklaring'].includes(ventFansVal) && (
                                      <div>{renderInstCell(ventFansVal === 'Nominaal vermogen' ? 'NOMINAL POWER (W)' : 'FLOW RATE KNOWN', instDetails.ventNomPower || '', 'ventNomPower', 'text')}</div>
                                    )}

                                    {ventFansVal === 'Onbekend' && (
                                      <>
                                        <div>{renderInstCell('MOTOR TYPE', instDetails.ventMotorType || 'Gelijkstroom', 'ventMotorType', 'select', ['Gelijkstroom', 'Wisselstroom', 'Draaistroom'])}</div>
                                        <div>{renderInstCell('FABRICATION', instDetails.ventFabrication || '', 'ventFabrication', 'select', ['tot 1980', '1980 - 1990', '1990 - 2000', '>2006'])}</div>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                              {renderInstallationMasonryGallery('Ventilatie', instDetails, inst.id)}
                            </div>
                          </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-6 mt-6">

                          {/* 3.2 Verwarming Card */}
                          {activeCategories.includes('Verwarming') && (
                          <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                            <div className="flex-grow md:w-[72%] print:w-[72%]">
                              <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                <span className="flex items-center gap-1.5"><Flame size={14} /> Verwarming</span>
                                <div className="flex items-center gap-1.5 no-print">
                                  <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Verwarming'); localStorage.setItem('installatie_view_state', 'detail'); if (onViewChange) onViewChange('installatie'); }} className="p-1.5 hover:bg-blue-50 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer" title="Bewerken"><Pencil size={13} /></button>
                                  <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Verwarming' }) }} className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Verwijderen"><Trash2 size={13} /></button>
                                </div>
                              </h3>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                <div>{renderInstCell('SYSTEM', instDetails.verwarmTypeToestel || 'Individueel', 'verwarmTypeToestel', 'select', ['Individueel', 'Gemeenschappelijk/collectief', 'Warmtelevering derden individueel', 'Warmtelevering derden gemeenschappelijk'])}</div>
                                <div>{renderInstCell('NUMBER OF IDENTICAL SYSTEMS', instDetails.verwarmIdentiekeSystemen || '1', 'verwarmIdentiekeSystemen', 'text')}</div>
                                <div>{renderInstCell('BRAND & TYPE', instDetails.verwarmMerkType || '', 'verwarmMerkType', 'text')}</div>
                                <div>{renderInstCell('INSTALLATION YEAR', instDetails.verwarmSpecsBcrg || '', 'verwarmSpecsBcrg', 'text')}</div>
                                <div>{renderInstCell('GENERATOR TYPE', instDetails.verwarmTypeopwekker || 'Gasgestookte ketel', 'verwarmTypeopwekker', 'select',
                                  !isVerwarmExternal ?
                                    ['Gasgestookte ketel', 'Elektrische verwarming', 'Moederhaard', 'Lokale gaskachel', 'Lokale oliekachel', 'Oliegestookte ketel', 'WKK', 'Warmtepomp gasinjectie', 'Warmtepomp gasmotor', 'Warmtepomp elektrisch', 'Biomassakachel', 'Biomassaketel handmatig gestookt', 'Biomassaketel automatisch gestookt'] :
                                    ['Warmtelevering derden']
                                )}</div>

                                {isVerwarmExternal && (
                                  <div>{renderInstCell('DISTRIBUTION MEDIUM', instDetails.verwarmDistributiemedium || 'Water', 'verwarmDistributiemedium', 'select', ['Water', 'Local'])}</div>
                                )}

                                {isVerwarmExternal && verwarmDistMedium === 'Water' && (
                                  <>
                                    <div>{renderInstCell('WATER FLOW TEMP', instDetails.verwarmWatertemprater || '', 'verwarmWatertemprater', 'select', ['30/27 °C', '35/30 °C', '40/35 °C', '45/40 °C', '50/42 °C', '55/47 °C', '60/50 °C', '65/55 °C', '70/60 °C', '75/65 °C', '80/60 °C', '90/70 °C'])}</div>
                                    <div>{renderInstCell('DISTRIBUTION TYPE', instDetails.verwarmDistributietype || 'Tweepijpsysteem', 'verwarmDistributietype', 'select', ['Tweepijpsysteem', 'Eenpijpsysteem'])}</div>
                                  </>
                                )}

                                <div>{renderInstCell('HR CLASS', instDetails.verwarmHrKlasse || 'Onbekend', 'verwarmHrKlasse', 'select', ['Onbekend', 'HR-107', 'HR-104', 'VR-ketel', 'Verbeterd rendement', 'Niet-condenserend'])}</div>
                                <div>{renderInstCell('NOMINAL POWER (kW)', instDetails.verwarmPower || '', 'verwarmPower', 'text')}</div>
                                <div>{renderInstCell('INSTALLATION LOCATION / CODE', instDetails.verwarmCode || '', 'verwarmCode', 'text')}</div>
                                <div>{renderInstCell('DELIVERY SYSTEM', instDetails.verwarmAfgiftesysteem || 'Radiatoren / convectoren', 'verwarmAfgiftesysteem', 'select', ['Radiatoren / convectoren', 'Ventilatorgestuurde radiatoren en/of convectoren', 'Vloerverwarming', 'Luchtverwarming', 'Overig van'])}</div>
                                <div>{renderInstCell('CONTROL', instDetails.verwarmRegeling || 'Regeling in hoofdvertrek (kamerthermostaat)', 'verwarmRegeling', 'select', ['Regeling in hoofdvertrek (kamerthermostaat)', 'Centrale regeling met individuele regeling per ruimte', 'Individuele regeling per ruimte', 'Overig of onbekend'])}</div>
                                <div>{renderInstCell('HYDRONICALLY BALANCED', instDetails.verwarmWaterzijdigIngeeregeld || 'Nee / Onbekend', 'verwarmWaterzijdigIngeeregeld', 'select', ['Nee / Onbekend', 'Ja, aangetoond (Label A)', 'Ja, waarschijnlijk'])}</div>
                              </div>
                            </div>

                            <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                              {renderInstallationMasonryGallery('Verwarming', instDetails, inst.id)}
                            </div>
                          </div>
                          )}

                          {/* 3.3 Tapwater Card */}
                          {activeCategories.includes('Tapwater') && (
                          <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                            <div className="flex-grow md:w-[72%] print:w-[72%]">
                              <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                <span className="flex items-center gap-1.5"><Droplet size={14} /> Tapwater</span>
                                <div className="flex items-center gap-1.5 no-print">
                                  <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Tapwater'); localStorage.setItem('installatie_view_state', 'detail'); if (onViewChange) onViewChange('installatie'); }} className="p-1.5 hover:bg-blue-50 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer" title="Bewerken"><Pencil size={13} /></button>
                                  <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Tapwater' }) }} className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Verwijderen"><Trash2 size={13} /></button>
                                </div>
                              </h3>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                <div>{renderInstCell('SYSTEM', instDetails.tapTypeInstallatie || 'Individueel', 'tapTypeInstallatie', 'select', ['Individueel', 'Gemeenschappelijk/collectief', 'Externe warmtelevering via een afleverset individueel', 'Externe warmtelevering via een afleverset gemeenschappelijk (centraal)'])}</div>
                                <div>{renderInstCell('NUMBER OF IDENTICAL SYSTEMS', instDetails.tapIdentiekeSystemen || '1', 'tapIdentiekeSystemen', 'text')}</div>
                                <div>{renderInstCell('BRAND & TYPE', instDetails.tapMerkType || '', 'tapMerkType', 'text')}</div>
                                <div>{renderInstCell('GENERATOR TYPE', instDetails.tapTypeOpwekker || 'Compleet toestel', 'tapTypeOpwekker', 'select',
                                  !isTapExternal ?
                                    ['Compleet toestel', 'Direct verwarmd vat', 'Indirect verwarmd vat'] :
                                    ['Externe warmtelevering via een afleverset']
                                )}</div>

                                {verwarmSystemType === 'Individueel' && (
                                  <div>{renderInstCell('DEVICE TYPE', instDetails.tapTypeToestel || 'Keukengeiser', 'tapTypeToestel', 'select', ['Keukengeiser', 'Gasgestookt warmwatertoestel (Badgeiser)', 'Gasgestookt combitoestel', '(micro) WKK', 'Elektrisch', 'Boosterwarmtepomp', 'Elektrische doorstroomverwarmer', 'Vast biobrandstoftoestel', 'Elektrische boiler', 'Warmwaterboiler'])}</div>
                                )}

                                <div>{renderInstCell('INSTALLATION YEAR', instDetails.tapSpecsBcrg || '', 'tapSpecsBcrg', 'text')}</div>
                                <div>{renderInstCell('KITCHEN DELIVERY', instDetails.tapAfgifteKeuken || '< 2 m', 'tapAfgifteKeuken', 'select', ['< 2 m', '2 m <= l < 4 m', '4 m <= l < 6 m', '6 m <= l < 8 m', '8 m <= l < 10 m', '10 m <= l < 12 m', '12 m <= l < 14 m', '>= 14 m'])}</div>
                                <div>{renderInstCell('BATHROOM DELIVERY', instDetails.tapAfgifteBadkamer || '< 2 m', 'tapAfgifteBadkamer', 'select', ['< 2 m', '2 m <= l < 4 m', '4 m <= l < 6 m', '6 m <= l < 8 m', '8 m <= l < 10 m', '10 m <= l < 12 m', '12 m <= l < 14 m', '>= 14 m'])}</div>
                                <div>{renderInstCell('CIRCULATION PIPE', instDetails.tapCirculatieleiding || 'Nee', 'tapCirculatieleiding', 'select', ['Nee', 'Ja, geïsoleerd', 'Ja, ongeïsoleerd'])}</div>
                                <div>{renderInstCell('SHOWER HEAT RECOVERY (DWTW)', instDetails.tapDwtw || 'Nee', 'tapDwtw', 'select', ['Nee', 'Ja, douchepijp-WTW', 'Ja, douchebak-WTW'])}</div>
                              </div>
                            </div>

                            <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                              {renderInstallationMasonryGallery('Tapwater', instDetails, inst.id)}
                            </div>
                          </div>
                          )}

                          {/* 3.4 Koeling Card */}
                          {activeCategories.includes('Koeling') && (
                          <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                            <div className="flex-grow md:w-[72%] print:w-[72%]">
                              <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                <span className="flex items-center gap-1.5"><Snowflake size={14} /> Koeling</span>
                                <div className="flex items-center gap-1.5 no-print">
                                  <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Koeling'); localStorage.setItem('installatie_view_state', 'detail'); if (onViewChange) onViewChange('installatie'); }} className="p-1.5 hover:bg-blue-50 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer" title="Bewerken"><Pencil size={13} /></button>
                                  <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Koeling' }) }} className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Verwijderen"><Trash2 size={13} /></button>
                                </div>
                              </h3>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                <div>{renderInstCell('SYSTEM', instDetails.koelTypeToestel || 'Individueel', 'koelTypeToestel', 'select', ['Individueel', 'Ge/collectief', 'Koudelevering derden', 'Koudelevering derden ge'])}</div>
                                <div>{renderInstCell('NUMBER OF IDENTICAL SYSTEMS', instDetails.koelIdentiekeSystemen || '1', 'koelIdentiekeSystemen', 'text')}</div>
                                <div>{renderInstCell('BRAND & TYPE', instDetails.koelMerkType || '', 'koelMerkType', 'text')}</div>
                                <div>{renderInstCell('GENERATOR TYPE', instDetails.koelTypeInstallatie || 'Compressiekoeling', 'koelTypeInstallatie', 'select', ['Compressiekoeling', 'Absorptiekoeling', 'Passieve vrije koeling'])}</div>
                                <div>{renderInstCell('EXPANSIE', instDetails.koelExpansie || 'Directe koeling in de ruimte (airconditioning)', 'koelExpansie', 'select', ['Directe koeling in de ruimte (airconditioning)', 'Directe koeling in het LBK (DX-systeem)', 'Met indirecte verdamping'])}</div>
                                <div>{renderInstCell('DISTRIBUTIEMEDIUM', instDetails.koelDistributiemedium || 'Water', 'koelDistributiemedium', 'select', ['Water', 'Lucht', 'Koudemiddel'])}</div>
                                <div>{renderInstCell('NUMBER OF GENERATORS', instDetails.koelGeneratorsCount || '1', 'koelGeneratorsCount', 'text')}</div>
                                <div>{renderInstCell('WATER FLOW TEMP', instDetails.koelWatertemprater || '6/12 °C', 'koelWatertemprater', 'select', ['6/12 °C', '12/16 °C', '12/18 °C', '17/21 °C', 'Onbekend'])}</div>
                                <div>{renderInstCell('MAIN CIRCULATION PUMP', instDetails.koelMainCirculationPump || 'Werkelijk vermogen en EI', 'koelMainCirculationPump', 'select', ['Werkelijk vermogen en EI', 'Werkelijk vermogen', 'Onbekend'])}</div>
                                <div>{renderInstCell('DELIVERY SYSTEM', instDetails.koelAfgiftesysteem || 'Vloerkoeling', 'koelAfgiftesysteem', 'select', ['Vloerkoeling', 'Wandkoeling', 'Plafondkoeling', 'Ventilatorconvectoren (aan plafond)', 'Ventilatorconvectoren (aan buitenmuur)', 'Overig of onbekend'])}</div>
                                <div>{renderInstCell('CONTROL', instDetails.koelRegeling || 'Standalone regeling', 'koelRegeling', 'select', ['Standalone regeling', 'Centrale regeling', 'Overig of onbekend'])}</div>
                              </div>
                            </div>

                            <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                              {renderInstallationMasonryGallery('Koeling', instDetails, inst.id)}
                            </div>
                          </div>
                          )}

                          {/* 3.5 Zonne-panelen Card */}
                          {activeCategories.includes('Zonne-panelen') && (
                          <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                            <div className="flex-grow md:w-[72%] print:w-[72%]">
                              <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                <span className="flex items-center gap-1.5"><Sun size={14} /> Zonne-panelen</span>
                                <div className="flex items-center gap-1.5 no-print">
                                  <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Zonne-panelen'); localStorage.setItem('installatie_view_state', 'detail'); if (onViewChange) onViewChange('installatie'); }} className="p-1.5 hover:bg-blue-50 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer" title="Bewerken"><Pencil size={13} /></button>
                                  <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Zonne-panelen' }) }} className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer" title="Verwijderen"><Trash2 size={13} /></button>
                                </div>
                              </h3>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                <div>{renderInstCell('SYSTEM', instDetails.zonTypeToestel || 'Individueel', 'zonTypeToestel', 'select', ['Individueel', 'Gemeenschappelijk/collectief'])}</div>
                                <div>{renderInstCell('NUMBER OF IDENTICAL SYSTEMS', instDetails.zonIdentiekeSystemen || '1', 'zonIdentiekeSystemen', 'text')}</div>
                                <div>{renderInstCell('BRAND & TYPE', instDetails.zonMerkType || '', 'zonMerkType', 'text')}</div>
                                <div>{renderInstCell('INSTALLATION TYPE', instDetails.zonSysteem || 'PV-panelen', 'zonSysteem', 'select', ['PV-panelen', 'PVT-panelen', 'Zonneboiler'])}</div>
                                <div>{renderInstCell('POWER / WATTPIEK', instDetails.zonWattpiekvermogen || '', 'zonWattpiekvermogen', 'text')}</div>
                                <div>{renderInstCell('COUNT / AANTAL', instDetails.zonAantal || '', 'zonAantal', 'text')}</div>
                                <div>{renderInstCell('ORIENTATION / ORIENTATIE', instDetails.zonOrientatie || 'Zuid', 'zonOrientatie', 'select', ['Zuid', 'Zuid-West', 'West', 'Oost', 'Noord'])}</div>
                                <div>{renderInstCell('TILT ANGLE / HELLINGSHOEK', instDetails.zonHellingshook || '', 'zonHellingshook', 'text')}</div>
                                <div className="col-span-2">{renderInstCell('SHADING / BOUWINTEGRATIE', instDetails.zonBouwintegratie || 'Onbekend', 'zonBouwintegratie', 'select', ['Niet geventileerd: zonder luchtspouw', 'Matig geventileerd: met luchtspouw', 'Sterk geventileerd: open draagconstructie', 'Op dakbedekking', 'Onbekend'])}</div>
                              </div>
                            </div>

                            <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                              {renderInstallationMasonryGallery('Zonne-panelen', instDetails, inst.id)}
                            </div>
                          </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-wrap items-center justify-start gap-4 no-print border-t border-neutral-200/60 pt-6 print:hidden">
                          {(() => {
                            const availableCategoriesList = [
                              { id: 'Ventilatie', label: 'Ventilatie' },
                              { id: 'Verwarming', label: 'Verwarming' },
                              { id: 'Tapwater', label: 'Tapwater' },
                              { id: 'Koeling', label: 'Koeling' },
                              { id: 'Zonne-panelen', label: 'Zonne-energie' }
                            ].filter(c => !activeCategories.includes(c.id));

                            if (availableCategoriesList.length === 0) return null;

                            return (
                              <div className="relative group/addmenu">
                                <button
                                  type="button"
                                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                                >
                                  <Plus size={14} className="stroke-[3]" /> Add System
                                </button>
                                <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden opacity-0 invisible group-hover/addmenu:opacity-100 group-hover/addmenu:visible group-focus-within/addmenu:opacity-100 group-focus-within/addmenu:visible transition-all z-[100]">
                                  {availableCategoriesList.map((cat) => (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        if (onChange) {
                                          const updated = (data.allInstallations || []).map((i: any) => {
                                            if (i.id === inst.id) {
                                              return {
                                                ...i,
                                                activeCategories: [...(i.activeCategories || ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen']), cat.id]
                                              };
                                            }
                                            return i;
                                          });
                                          onChange('allInstallations', updated);
                                        }
                                      }}
                                      className="w-full text-left px-4 py-3 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer border-b border-outline-variant/5 last:border-0"
                                    >
                                      + {cat.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {index === installationsList.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onChange) {
                                  const newId = crypto.randomUUID();
                                  const updated = [
                                    ...(data.allInstallations || []),
                                    {
                                      id: newId,
                                      activeCategories: [],
                                      ventilatieName: '',
                                      verwarmingName: '',
                                      tapwaterName: '',
                                      koelingName: '',
                                      zonneName: '',
                                      details: {}
                                    }
                                  ];
                                  onChange('allInstallations', updated);
                                }
                              }}
                              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-black rounded-xl transition-all shadow-sm hover:shadow-md uppercase text-[11px] tracking-wider active:scale-[0.98]"
                            >
                              <Plus size={14} className="stroke-[3]" /> Add New Installation
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {(activeTab === 'p3' || isPrinting) && (() => {
              const allConstructies = data.constructies || [];
              const categories: { key: 'Deur' | 'Raam' | 'Paneel' | 'Gevel' | 'Vloer' | 'Dak'; title: string; types: string[] }[] = [
                { key: 'Deur', title: 'Deuren', types: ['Deur'] },
                { key: 'Raam', title: 'Ramen', types: ['Raam'] },
                { key: 'Paneel', title: 'Panelen', types: ['Paneel'] },
                { key: 'Gevel', title: 'Gevels', types: ['Gevel'] },
                { key: 'Vloer', title: 'Vloeren', types: ['Vloer'] },
                { key: 'Dak', title: 'Daken', types: ['Dak'] },
              ];

              return (
                <div className={`space-y-8 ${isPrinting ? 'print-section' : ''}`}>
                  <div className="border-b border-neutral-250 pb-2 mb-2 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider font-sans flex items-center gap-2">
                      <Ruler size={16} />
                      <span>Constructies ({allConstructies.length})</span>
                    </h2>
                    {onViewChange && (
                      <button
                        type="button"
                        onClick={() => onViewChange('constructie')}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer no-print shrink-0 uppercase tracking-wider font-sans"
                      >
                        <Ruler size={11} />
                        Naar Constructiepagina
                      </button>
                    )}
                  </div>

                  {categories.map((cat) => {
                    const items = allConstructies.filter(c => cat.types.includes(c.type));

                    return (
                      <div key={cat.key} className="space-y-3 print-category-block">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[12px] font-black text-on-surface-variant/80 uppercase tracking-wider font-sans">
                            {cat.title} ({items.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleAddConstructieRow(cat.key)}
                            className="text-[10px] font-black text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors uppercase tracking-wider font-sans"
                          >
                            + Add {cat.key === 'Raam' ? 'ramen' : cat.key === 'Dak' ? 'daken' : cat.key.toLowerCase() + 'en'}
                          </button>
                        </div>

                        {items.length === 0 ? (
                          <div className="border border-dashed border-neutral-250 rounded-2xl p-4 bg-neutral-50/50 flex items-center justify-center text-neutral-400">
                            <span className="text-xs italic font-sans">Geen {cat.key.toLowerCase()} constructies ingevoerd in het dossier.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-6">
                            {items.map((item) => {
                              const isWindowOrDoor = item.type === 'Raam' || item.type === 'Deur' || item.type === 'Paneel';
                              const showGValue = item.type === 'Raam';
                              const valueLabel = isWindowOrDoor ? 'U-waarde' : 'Rc-waarde';
                              const displayVal = isWindowOrDoor ? (item.uWaarde || item.uGren || '-') : (item.rc || '-');
                              const cFlag = fieldFlags[`constructie_row_${item.id}`];
                              let cBorderStyle = 'border border-outline-variant/10 bg-white';
                              if (cFlag === 'red') {
                                cBorderStyle = '!border-2 !border-red-500 !bg-red-50/10 ring-2 ring-red-100';
                              } else if (cFlag === 'yellow') {
                                cBorderStyle = '!border-2 !border-amber-500 !bg-amber-50/10 ring-2 ring-amber-100';
                              } else if (cFlag === 'green') {
                                cBorderStyle = '!border-2 !border-green-500 !bg-green-50/10 ring-2 ring-green-100';
                              }

                              return (
                                <div key={item.id} className="flex flex-col md:flex-row print:flex-row gap-6 w-full items-start">
                                  <div
                                    className={`rounded-2xl p-4 w-full md:w-[300px] print:w-[300px] shrink-0 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200 print-card break-inside-avoid ${cBorderStyle}`}
                                  >
                                  <div>
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span
                                          contentEditable
                                          suppressContentEditableWarning
                                          onBlur={(e) => {
                                            const updated = [...allConstructies];
                                            const idx = updated.findIndex(c => c.id === item.id);
                                            if (idx >= 0) {
                                              updated[idx] = { ...updated[idx], naam: e.currentTarget.textContent || '' };
                                              onChange('constructies', updated as any);
                                            }
                                          }}
                                          className="text-primary text-xs font-black uppercase tracking-wide font-sans border-b border-transparent hover:border-primary/30 focus:border-primary focus:outline-none transition-colors leading-tight inline-block cursor-text flex-1"
                                          title={item.naam || item.type}
                                        >
                                          {item.naam || item.type}
                                        </span>
                                        {item.dakType && (
                                          <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded font-sans shrink-0">
                                            {item.dakType}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {renderFlagCycleClicker(`constructie_row_${item.id}`)}
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingConstructieRow({
                                                ...item,
                                                flag: fieldFlags[`constructie_row_${item.id}`] || undefined
                                              });
                                            }}
                                            className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                            title="Bewerken in popup"
                                          >
                                            <Pencil size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm('Weet je zeker dat je deze constructie wilt verwijderen?')) {
                                                onChange('constructies', (data.constructies || []).filter((c: any) => c.id !== item.id));
                                              }
                                            }}
                                            className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                            title="Verwijderen"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mb-2.5">
                                      <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">Invoer</span>
                                      <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                        <select
                                          className="w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none cursor-pointer font-sans leading-tight print:appearance-none print:bg-none"
                                          value={item.invoer || 'Beslisschema'}
                                          onChange={(e) => handleRealConstructieChange(item.id, 'invoer', e.target.value)}
                                        >
                                          <option value="Beslisschema">Beslisschema</option>
                                          <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-2 mt-1">
                                      {item.invoer === 'Kwaliteitsverklaring' && (
                                        <div>
                                          <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">Merk & Type</span>
                                          <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                            <input
                                              className="w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none font-sans"
                                              value={item.merk || ''}
                                              onChange={(e) => handleRealConstructieChange(item.id, 'merk', e.target.value)}
                                              placeholder="Voer merk & type in..."
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {(item.type === 'Raam' || item.type === 'Paneel') && (
                                        <div className={`grid ${item.type === 'Raam' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                          <div>
                                            <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">Kozijn</span>
                                            <div className="flex items-center min-h-[34px] px-2.5 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                              <select
                                                className="w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none cursor-pointer font-sans leading-tight print:appearance-none print:bg-none"
                                                value={item.kozijn || 'Kunststof'}
                                                onChange={(e) => handleRealConstructieChange(item.id, 'kozijn', e.target.value)}
                                              >
                                                <option value="Hout">Hout</option>
                                                <option value="Kunststof">Kunststof</option>
                                                <option value="Metaal thermisch onderbroken">Metaal thermisch onderbroken</option>
                                                <option value="Metaal niet thermisch onderbroken">Metaal niet thermisch onderbroken</option>
                                              </select>
                                            </div>
                                          </div>
                                          {item.type === 'Raam' && (
                                            <div>
                                              <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">Glas</span>
                                              <div className="flex items-center min-h-[34px] px-2.5 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                                <select
                                                  className="w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none cursor-pointer font-sans leading-tight print:appearance-none print:bg-none"
                                                  value={item.glas || 'HR++'}
                                                  onChange={(e) => handleRealConstructieChange(item.id, 'glas', e.target.value)}
                                                >
                                                  <option value="Enkel glas">Enkel glas</option>
                                                  <option value="Dubbel glas">Dubbel glas</option>
                                                  <option value="HR glas">HR glas</option>
                                                  <option value="HR+ glas">HR+ glas</option>
                                                  <option value="HR++ glas">HR++ glas</option>
                                                  <option value="Triple (HR+++) glas">Triple (HR+++) glas</option>
                                                </select>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {item.type === 'Raam' && (
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">U niet-grenzend</span>
                                            <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                              <input
                                                className="w-full bg-transparent border-none text-xs font-bold text-on-background font-mono focus:outline-none outline-none"
                                                value={item.uNiet || '-'}
                                                onChange={(e) => handleRealConstructieChange(item.id, 'uNiet', e.target.value)}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">U grenzend</span>
                                            <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                              <input
                                                className="w-full bg-transparent border-none text-xs font-bold text-on-background font-mono focus:outline-none outline-none"
                                                value={item.uGren || '-'}
                                                onChange={(e) => handleRealConstructieChange(item.id, 'uGren', e.target.value)}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {item.type !== 'Raam' && (
                                        <div>
                                          <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">Isolatie aanwezig</span>
                                          <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                            <select
                                              className="w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none cursor-pointer font-sans leading-tight print:appearance-none print:bg-none"
                                              value={item.isolatie || 'Ja'}
                                              onChange={(e) => handleRealConstructieChange(item.id, 'isolatie', e.target.value)}
                                            >
                                              <option value="Ja">Ja</option>
                                              <option value="Nee">Nee</option>
                                              <option value="Onbekend">Onbekend</option>
                                            </select>
                                          </div>
                                        </div>
                                      )}

                                      {item.isolatie === 'Ja' && (
                                        <div>
                                          <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">Dikte</span>
                                          <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                            <input
                                              className="w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none font-sans"
                                              value={item.dikte || '-'}
                                              onChange={(e) => handleRealConstructieChange(item.id, 'dikte', e.target.value)}
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {!isWindowOrDoor && (
                                        <div>
                                          <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">Bouwjaar</span>
                                          <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                            <input
                                              className="w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none font-sans"
                                              value={item.bouwjaar || '-'}
                                              onChange={(e) => handleRealConstructieChange(item.id, 'bouwjaar', e.target.value)}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-2">
                                    <hr className="border-outline-variant/10 my-2" />
                                    <div className={`grid ${showGValue ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                      <div>
                                        <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-0.5 font-sans">{valueLabel}</span>
                                        <div className="flex items-baseline gap-1">
                                          <input
                                            className="w-20 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-base font-black text-green-700 font-sans leading-none py-0.5"
                                            value={displayVal}
                                            onChange={(e) => handleRealConstructieChange(item.id, isWindowOrDoor ? 'uWaarde' : 'rc', e.target.value)}
                                          />
                                        </div>
                                        <span className="text-[8px] text-on-surface-variant/40 font-bold block font-sans leading-none mt-0.5">
                                          {isWindowOrDoor ? 'W/(m2.K)' : '[m2.K/W]'}
                                        </span>
                                      </div>

                                      {showGValue && (
                                        <div>
                                          <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-0.5 font-sans">G-waarde</span>
                                          <div className="flex items-baseline gap-1">
                                            <input
                                              className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-base font-black text-on-background font-sans leading-none py-0.5"
                                              value={item.g || '-'}
                                              onChange={(e) => handleRealConstructieChange(item.id, 'g', e.target.value)}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  </div>
                                  
                                  <div className="flex-1 w-full flex flex-col gap-2">
                                    {(() => {
                                      const slots = ['p1', 'p2', 'p3', 'p4'];
                                      const activePhotos: any[] = [];
                                      const originalIdx = allConstructies.indexOf(item);
                                      
                                      slots.forEach((pK, i) => {
                                        const iKey = `constructie_${item.id}_${pK}`;
                                        const allItemP = [...(item.photos || []), ...(item.photoUrl ? [item.photoUrl] : [])].filter((p: string, idx: number, arr: string[]) => arr.indexOf(p) === idx);
                                        const selIdxStr = (data.installations as any)?.[`selectedPhotoIndex_${iKey}`];
                                        
                                        const idx = selIdxStr !== undefined && selIdxStr !== '-1' ? parseInt(selIdxStr, 10) : (i < allItemP.length && selIdxStr !== '-1' ? i : -1);
                                        
                                        let url: string | undefined;
                                        if (idx !== -1) {
                                          url = allItemP[idx];
                                        }
                                        if (url && url !== '-' && url !== '') {
                                          activePhotos.push({ url, slotKey: iKey, index: i + 1, internalIndex: idx, pK });
                                        }
                                      });

                                      const handleConstructiePhotoDelete = (deletedSlotKey: string) => {
                                        const removeIdx = activePhotos.findIndex(p => p.slotKey === deletedSlotKey);
                                        if (removeIdx === -1) return;
                                        
                                        const newActivePhotos = [...activePhotos];
                                        newActivePhotos.splice(removeIdx, 1);
                                        
                                        const activeId = localStorage.getItem('installatie_active_id_current') || '1';
                                        
                                        slots.forEach((sKey, i) => {
                                          const fullKey = `constructie_${item.id}_${sKey}`;
                                          const newIndex = i < newActivePhotos.length ? newActivePhotos[i].internalIndex : -1;
                                          updateInstallationField(activeId, `selectedPhotoIndex_${fullKey}`, newIndex.toString());
                                          onChange(`installations.selectedPhotoIndex_${fullKey}`, newIndex.toString());
                                        });
                                      };

                                      const emptySlotIndex = slots.findIndex(s => !activePhotos.some(p => p.pK === s));
                                      const nextSlotKey = emptySlotIndex !== -1 ? `constructie_${item.id}_${slots[emptySlotIndex]}` : null;
                                      const nextSlotTitleIndex = emptySlotIndex !== -1 ? emptySlotIndex + 1 : -1;

                                      return (
                                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 w-full grid-flow-row-dense">
                                          {activePhotos.map((photo) => {
                                            const itemContext = { type: 'constructie' as const, id: item.id || originalIdx.toString(), index: originalIdx };
                                            return (
                                              <DynamicMasonryImage
                                                key={photo.slotKey}
                                                src={photo.url}
                                                alt={`${item.naam || 'Constructie'} ${photo.index}`}
                                                readOnly={false}
                                                slotKey={photo.slotKey}
                                                categoryName={item.naam || 'Constructie'}
                                                title={`${item.naam || item.type || 'Constructie'} ${photo.index}`}
                                                setPhotoSelectorModal={(modal) => setPhotoSelectorModal({ ...modal, itemContext })}
                                                onDelete={handleConstructiePhotoDelete}
                                                onPhotoClick={() => openLightbox(activePhotos.map(p => p.url), activePhotos.findIndex(p => p.slotKey === photo.slotKey))}
                                                makeInstActive={() => {}}
                                              />
                                            );
                                          })}
                                          
                                          {nextSlotKey && (
                                            <div
                                              onClick={() => {
                                                const itemContext = { type: 'constructie' as const, id: item.id || originalIdx.toString(), index: originalIdx };
                                                setPhotoSelectorModal({ isOpen: true, slotKey: nextSlotKey, categoryName: item.naam || 'Constructie', title: `${item.naam || item.type || 'Constructie'} ${nextSlotTitleIndex}`, visiblePhotos: activePhotos.map(p => p.url), itemContext });
                                              }}
                                              className="col-span-1 border border-[#e2e8f0] border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-neutral-100 hover:border-primary/50 text-neutral-400 aspect-[4/3] w-full print:hidden transition cursor-pointer shadow-xs p-1"
                                            >
                                              <Camera size={20} className="mb-1 opacity-50" />
                                              <span className="text-[10px] font-black uppercase tracking-wider font-sans opacity-70">{t('structural.addPhoto')}</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {(activeTab === 'p4' || isPrinting) && (() => {
              const allBouwkundig = data.bouwkundigRows || defaultBouwkundigRows;
              const categories: { key: 'Gevel' | 'Dak' | 'Vloer'; title: string; types: string[] }[] = [
                { key: 'Gevel', title: 'Gevels', types: ['Gevel'] },
                { key: 'Dak', title: 'Daken', types: ['Dak'] },
                { key: 'Vloer', title: 'Vloeren', types: ['Vloer'] },
              ];

              const handleBouwkundigRowChange = (originalIdx: number, field: string, value: string) => {
                const current = data.bouwkundigRows || defaultBouwkundigRows;
                if (originalIdx >= 0 && originalIdx < current.length) {
                  const updated = [...current];
                  const newRow = { ...updated[originalIdx], [field]: value };
                  if (field === 'oppervlakte') {
                    newRow.breedte = '';
                    newRow.hoogte = '';
                  } else if (field === 'breedte' || field === 'hoogte') {
                    const w = parseFloat(newRow.breedte?.toString().replace(',', '.') || '0') || 0;
                    const h = parseFloat(newRow.hoogte?.toString().replace(',', '.') || '0') || 0;
                    if (w > 0 && h > 0) {
                      newRow.oppervlakte = (w * h).toFixed(2);
                    }
                  }
                  updated[originalIdx] = newRow;
                  onChange('bouwkundigRows', updated as any);
                }
              };

              const renderBouwkundigCell = (
                label: string,
                value: string,
                field: string,
                originalIdx: number,
                type: 'text' | 'select' | 'readonly' = 'text',
                options?: string[]
              ) => {
                const isDash = !value || value === '-' || value.trim() === '';
                const displayVal = isDash ? '-' : value;

                return (
                  <div className="w-full flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                      <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">{label}</label>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                      {type === 'readonly' ? (
                        <div className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 leading-tight truncate">{displayVal}</div>
                      ) : type === 'select' && options ? (
                        <>
                          <select
                            value={value || ''}
                            onChange={(e) => handleBouwkundigRowChange(originalIdx, field, e.target.value)}
                            className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none cursor-pointer print:hidden"
                          >
                            {options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <div className="hidden print:block w-full text-xs font-bold text-on-background leading-tight break-words whitespace-normal py-1">
                            {value || '-'}
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            value={displayVal}
                            onChange={(e) => handleBouwkundigRowChange(originalIdx, field, e.target.value)}
                            className={`w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none print:hidden ${isDash ? 'text-on-surface-variant/30 font-semibold' : ''}`}
                          />
                          <div className={`hidden print:block w-full text-xs font-bold leading-tight break-words whitespace-normal py-1 ${isDash ? 'text-on-surface-variant/30 font-semibold' : 'text-on-background'}`}>
                            {displayVal}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className={`space-y-8 ${isPrinting ? 'print-section' : ''}`}>
                  <div className="border-b border-neutral-250 pb-2 mb-2 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider font-sans flex items-center gap-2">
                      <Layers size={16} />
                      <span>Bouwkundig ({allBouwkundig.length})</span>
                    </h2>
                    {onViewChange && (
                      <button
                        type="button"
                        onClick={() => onViewChange('bouwkundig-gevel')}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer no-print shrink-0 uppercase tracking-wider font-sans"
                      >
                        <Layers size={11} />
                        Naar Geometrypagina
                      </button>
                    )}
                  </div>

                  {categories.map((cat) => {
                    const items = allBouwkundig.filter(c => cat.types.includes(c.type));

                    return (
                      <div key={cat.key} className="space-y-3 print-category-block">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[12px] font-black text-on-surface-variant/80 uppercase tracking-wider font-sans">
                            {cat.title} ({items.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              const newRow = {
                                type: cat.key,
                                naam: `Nieuwe ${cat.key}`,
                                breedte: '',
                                hoogte: '',
                                oppervlakte: '',
                                hellingshoek: cat.key === 'Dak' ? '45' : '90',
                                grenstAan: cat.key === 'Vloer' ? 'Kruipruimte' : 'Buitenlucht'
                              };
                              setEditingBouwkundigRow(newRow as any);
                              setEditingBouwkundigIndex(allBouwkundig.length);
                              setIsBouwkundigModalOpen(true);
                            }}
                            className="text-[10px] font-black text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors uppercase tracking-wider font-sans"
                          >
                            + Add {cat.title.toLowerCase()}
                          </button>
                        </div>

                        {items.length === 0 ? (
                          <div className="text-xs font-bold text-on-surface-variant/50 italic py-4 text-center bg-neutral-50/50 rounded-2xl border border-dashed border-outline-variant/10">
                            Geen {cat.key.toLowerCase()}en gedefinieerd.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-6">
                            {items.map((item, index) => {
                              const originalIdx = allBouwkundig.indexOf(item);
                              const itemKozijnen = data.kozijnen?.filter((k: any) => {
                                if (!k.gevel) return false;
                                const linkedTo = k.gevel.split(',').map((s: string) => s.trim().toLowerCase());
                                const targets = [item.naam, item.gevel, item.id].filter(Boolean).map((s: string) => s.toString().trim().toLowerCase());
                                return targets.some(t => linkedTo.includes(t));
                              }) || [];

                              const handleKozijnChange = (kId: string, kField: string, kVal: string) => {
                                const currentKozijnen = data.kozijnen || [];
                                const updated = currentKozijnen.map(k => {
                                  if (k.id === kId) {
                                    const newK = { ...k, [kField]: kVal };
                                    if (kField === 'area') {
                                      newK.width = '';
                                      newK.height = '';
                                    } else if (kField === 'width' || kField === 'height') {
                                      const w = parseFloat(newK.width?.toString().replace(',', '.') || '0') || 0;
                                      const h = parseFloat(newK.height?.toString().replace(',', '.') || '0') || 0;
                                      if (w > 0 && h > 0) {
                                        newK.area = (w * h).toFixed(2);
                                      }
                                    }
                                    return newK;
                                  }
                                  return k;
                                });
                                onChange('kozijnen', updated as any);
                              };

                              const bFlag = fieldFlags[`bouwkundig_${originalIdx}`];
                              let bBorderStyle = 'border border-outline-variant/10 bg-white';
                              if (bFlag === 'red') {
                                bBorderStyle = '!border-2 !border-red-500 !bg-red-50/10 ring-2 ring-red-100';
                              } else if (bFlag === 'yellow') {
                                bBorderStyle = '!border-2 !border-amber-500 !bg-amber-50/10 ring-2 ring-amber-100';
                              } else if (bFlag === 'green') {
                                              bBorderStyle = '!border-2 !border-green-500 !bg-green-50/10 ring-2 ring-green-100';
                              }

                              return (
                                <div key={item.id || item.naam || index} className="flex flex-col gap-4 mb-8">
                                  <div className="flex flex-col md:flex-row print:flex-row gap-6 w-full items-start">
                                  <div className={`rounded-2xl p-4 w-full md:w-[300px] print:w-[300px] shrink-0 shadow-2xs flex flex-col ${bBorderStyle}`}>
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                    <div className="flex items-start gap-1 min-w-0 flex-1">
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleBouwkundigRowChange(originalIdx, 'naam', e.currentTarget.textContent || '')}
                                        className="text-primary text-xs font-black uppercase tracking-wide font-sans border-b-2 border-transparent hover:border-primary/30 focus:border-primary focus:outline-none transition-colors leading-tight inline-block flex-1 min-w-[50px] cursor-text"
                                      >
                                        {item.naam || item.type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {renderFlagCycleClicker(`bouwkundig_${originalIdx}`)}
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingBouwkundigRow({
                                                ...item,
                                                flag: fieldFlags[`bouwkundig_${originalIdx}`]
                                              });
                                              setEditingBouwkundigIndex(originalIdx);
                                              setIsBouwkundigModalOpen(true);
                                            }}
                                            className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                            title="Bewerken in popup"
                                          >
                                            <Pencil size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
                                                const newRows = [...allBouwkundig];
                                                newRows.splice(originalIdx, 1);
                                                onChange('bouwkundigRows', newRows);
                                              }
                                            }}
                                            className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                            title="Verwijderen"
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                    </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs font-bold flex-1">
                                        <div className="w-full flex flex-col">
                                          <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                                            <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">Constructie</label>
                                          </div>
                                          <div className="flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                            <select
                                              value={item.constructieId || ''}
                                              onChange={(e) => handleBouwkundigRowChange(originalIdx, 'constructieId', e.target.value)}
                                              className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none cursor-pointer print:appearance-none print:bg-none"
                                            >
                                              <option value="">- Selecteer Constructie -</option>
                                              {(data.constructies || []).filter(c => c.type === item.type).map(c => (
                                                <option key={c.id} value={c.id}>{c.naam || c.id}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>

                                        {item.type === 'Gevel' && (
                                          <div>
                                            {(() => {
                                              const standard = ['Voorgevel', 'Achtergevel', 'Linkergevel', 'Rechtergevel'];
                                              const current = item.gevel && item.gevel !== '-' && !standard.includes(item.gevel) ? item.gevel : null;
                                              const options = [...standard, ...(current ? [current] : []), 'Aangepaste Gevel', '-'];
                                              return renderBouwkundigCell('Gevel type', item.gevel || '-', 'gevel', originalIdx, 'select', options);
                                            })()}
                                          </div>
                                        )}

                                        {(item.type === 'Gevel' || item.type === 'Dak') && (
                                          <div>{renderBouwkundigCell('Orientation', item.orientation || '-', 'orientation', originalIdx, 'select', ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW', 'Horizontaal', '-'])}</div>
                                        )}

                                        <div>
                                          {(() => {
                                            let grenstOptions = ['Buitenlucht'];
                                            if (item.type === 'Gevel') grenstOptions = ['Buitenlucht', 'Andere woning', 'Onverwarmde ruimte', 'Grond'];
                                            else if (item.type === 'Vloer') grenstOptions = ['Kruipruimte', 'Grond', 'Buitenlucht', 'Onverwarmde kelder'];
                                            else if (item.type === 'Dak') grenstOptions = ['Buitenlucht', 'Onverwarmde ruimte', 'Andere woning'];
                                            return renderBouwkundigCell('Grenst aan', item.grenstAan || '-', 'grenstAan', originalIdx, 'select', [...grenstOptions, '-']);
                                          })()}
                                        </div>

                                        <div>{renderBouwkundigCell('Breedte (m)', item.breedte || '-', 'breedte', originalIdx)}</div>
                                        <div>{renderBouwkundigCell('Hoogte (m)', item.hoogte || '-', 'hoogte', originalIdx)}</div>

                                        {item.type === 'Vloer' && (
                                          <>
                                            <div>{renderBouwkundigCell('Perimeter (m)', item.perimeter || '-', 'perimeter', originalIdx)}</div>
                                            <div>
                                              {(() => {
                                                const linkedC = (data.constructies || []).find((c: any) => c.id === item.constructieId);
                                                const finalRc = item.rc || linkedC?.rc || '-';
                                                return renderBouwkundigCell('Rc Waarde', finalRc, 'rc', originalIdx, 'readonly');
                                              })()}
                                            </div>
                                          </>
                                        )}

                                        <div>{renderBouwkundigCell('Oppervlakte (m²)', item.oppervlakte || '-', 'oppervlakte', originalIdx, 'text')}</div>

                                        {item.type === 'Dak' && (
                                          <div>{renderBouwkundigCell('Hellingshoek', item.hellingshoek || '-', 'hellingshoek', originalIdx)}</div>
                                        )}

                                        {item.type !== 'Vloer' && (
                                          <div className="col-span-2 mt-1">
                                            <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans mb-1.5">Kozijn Koppelingen (Frame & Glass)</label>
                                            <div className="border border-outline-variant/10 rounded-xl p-2 bg-gray-50 max-h-32 overflow-y-auto space-y-1">
                                              {(!data.kozijnen || data.kozijnen.length === 0) ? (
                                                <span className="text-[9px] text-on-surface-variant/40 italic block text-center py-1">Geen kozijnen beschikbaar.</span>
                                              ) : (
                                                data.kozijnen.map((k: any) => {
                                                  const linkedTo = k.gevel ? k.gevel.split(',').map((s: string) => s.trim().toLowerCase()) : [];
                                                  const targets = [item.naam, item.gevel, item.id].filter(Boolean).map((s: string) => s.toString().trim().toLowerCase());
                                                  const isLinked = Boolean(targets.some(t => linkedTo.includes(t)));
                                                  return (
                                                    <label key={k.id} className="flex items-start gap-2 text-xs font-bold text-on-surface-variant/80 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                                                      <input
                                                        type="checkbox"
                                                        className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-3 h-3 cursor-pointer"
                                                        checked={isLinked}
                                                        onChange={(e) => {
                                                          const checked = e.target.checked;
                                                          const list = data.kozijnen || [];
                                                          const target = item.naam || item.gevel || item.id;
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
                                                          onChange('kozijnen', updated as any);
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
                                      </div>
                                    </div>


                                    <div className="flex-1 w-full flex flex-col gap-2">
                                      {(() => {
                                        const slots = ['p1', 'p2', 'p3', 'p4'];
                                        const activePhotos: any[] = [];
                                        
                                        slots.forEach((pK, i) => {
                                          const iKey = `bouwkundig_${item.id || item.naam || index}_${pK}`;
                                          const allItemP = [...(item.photos || []), ...(item.photoUrl ? [item.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => arr.indexOf(p) === i);
                                          const selIdxStr = (data.installations as any)?.[`selectedPhotoIndex_${iKey}`];
                                          
                                          const idx = selIdxStr !== undefined && selIdxStr !== '-1' ? parseInt(selIdxStr, 10) : (i < allItemP.length && selIdxStr !== '-1' ? i : -1);
                                          
                                          let url: string | undefined;
                                          if (idx !== -1) {
                                            url = allItemP[idx];
                                          }
                                          if (url && url !== '-' && url !== '') {
                                            activePhotos.push({ url, slotKey: iKey, index: i + 1, internalIndex: idx, pK });
                                          }
                                        });

                                        const handleBouwkundigPhotoDelete = (deletedSlotKey: string) => {
                                          const removeIdx = activePhotos.findIndex(p => p.slotKey === deletedSlotKey);
                                          if (removeIdx === -1) return;
                                          
                                          const newActivePhotos = [...activePhotos];
                                          newActivePhotos.splice(removeIdx, 1);
                                          
                                          const activeId = localStorage.getItem('installatie_active_id_current') || '1';
                                          
                                          slots.forEach((sKey, i) => {
                                            const fullKey = `bouwkundig_${item.id || item.naam || index}_${sKey}`;
                                            const newIndex = i < newActivePhotos.length ? newActivePhotos[i].internalIndex : -1;
                                            updateInstallationField(activeId, `selectedPhotoIndex_${fullKey}`, newIndex.toString());
                                            onChange(`installations.selectedPhotoIndex_${fullKey}`, newIndex.toString());
                                          });
                                        };

                                        const emptySlotIndex = slots.findIndex(s => !activePhotos.some(p => p.pK === s));
                                        const nextSlotKey = emptySlotIndex !== -1 ? `bouwkundig_${item.id || item.naam || index}_${slots[emptySlotIndex]}` : null;
                                        const nextSlotTitleIndex = emptySlotIndex !== -1 ? emptySlotIndex + 1 : -1;

                                        return (
                                          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 w-full grid-flow-row-dense">
                                            {activePhotos.map((photo) => {
                                              const itemContext = { type: 'bouwkundig' as const, id: item.id || item.naam || originalIdx.toString(), index: originalIdx };
                                              return (
                                                <DynamicMasonryImage
                                                  key={photo.slotKey}
                                                  src={photo.url}
                                                  alt={`${item.naam || 'Bouwkundig'} ${photo.index}`}
                                                  readOnly={false}
                                                  slotKey={photo.slotKey}
                                                  categoryName={item.naam || item.type || 'Gevel'}
                                                  title={`${item.naam || item.type || 'Gevel'} ${photo.index}`}
                                                  setPhotoSelectorModal={(modal) => setPhotoSelectorModal({ ...modal, itemContext })}
                                                  onDelete={handleBouwkundigPhotoDelete}
                                                  onPhotoClick={() => openLightbox(activePhotos.map(p => p.url), activePhotos.findIndex(p => p.slotKey === photo.slotKey))}
                                                  makeInstActive={() => {}}
                                                />
                                              );
                                            })}
                                            
                                            {nextSlotKey && (
                                              <div
                                                onClick={() => {
                                                  const itemContext = { type: 'bouwkundig' as const, id: item.id || item.naam || originalIdx.toString(), index: originalIdx };
                                                  setPhotoSelectorModal({ isOpen: true, slotKey: nextSlotKey, categoryName: item.naam || item.type || 'Gevel', title: `${item.naam || item.type || 'Gevel'} ${nextSlotTitleIndex}`, visiblePhotos: activePhotos.map(p => p.url), itemContext });
                                                }}
                                                className="col-span-1 border border-[#e2e8f0] border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-neutral-100 hover:border-primary/50 text-neutral-400 aspect-[4/3] w-full print:hidden transition cursor-pointer shadow-xs"
                                              >
                                                <Camera size={20} className="mb-1 opacity-50" />
                                                <span className="text-[10px] font-black uppercase tracking-wider font-sans opacity-70">{t('structural.addPhoto')}</span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {cat.key !== 'Vloer' && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-outline-variant/15">
                                      <div className="flex items-center justify-between mb-3">
                                      <h5 className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-wider font-sans">
                                        Gekoppelde Kozijnen ({itemKozijnen.length})
                                      </h5>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newId = `k-${Date.now()}`;
                                          const newKozijn = {
                                            id: newId,
                                            naam: `Nieuw Kozijn`,
                                            gevel: item.naam || item.gevel || item.id,
                                            width: '',
                                            height: '',
                                            area: '',
                                            constructieId: '',
                                            photos: [],
                                            photoUrl: ''
                                          };
                                          setEditingKozijnRow(newKozijn as any);
                                        }}
                                        className="text-[10px] font-black text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors uppercase tracking-wider font-sans flex items-center gap-1 print:hidden"
                                      >
                                        + Add Kozijn
                                      </button>
                                    </div>
                                    {itemKozijnen.length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4">
                                        {itemKozijnen.map((k: any, kIdx: number) => {
                                          const kImgKey = `kozijn_${k.id}`;
                                          const allKPhotos = [...(k.photos || []), ...(k.photoUrl ? [k.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => arr.indexOf(p) === i);

                                          const selectedIdxStr = (data.installations as any)?.[`selectedPhotoIndex_${kImgKey}`];
                                          let kImgUrl: string | undefined;
                                          if (selectedIdxStr !== undefined) {
                                            if (selectedIdxStr !== '-1') {
                                              kImgUrl = allKPhotos[parseInt(selectedIdxStr, 10)];
                                            }
                                          } else {
                                            kImgUrl = allKPhotos[0];
                                          }
                                          const itemContext = { type: 'kozijn' as const, id: k.id || kIdx.toString(), index: kIdx };
                                          const overstekRow = data.overstekRows?.find((r: any) => r.kozijnId === k.id && (r.gevel === item.naam || r.gevel === item.gevel)) || {};

                                          const handleOverstekChange = (field: string, val: string) => {
                                            const currentRows = data.overstekRows || [];
                                            const idx = currentRows.findIndex((r: any) => r.kozijnId === k.id && (r.gevel === item.naam || r.gevel === item.gevel));
                                            if (idx >= 0) {
                                              const updated = [...currentRows];
                                              updated[idx] = { ...updated[idx], [field]: val };
                                              onChange('overstekRows', updated as any);
                                            }
                                          };

                                          const renderKozijnCell = (
                                            label: string,
                                            value: string,
                                            field: string,
                                            type: 'text' | 'select' | 'readonly' = 'text',
                                            options?: string[]
                                          ) => {
                                            const isDash = !value || value === '-' || value.trim() === '';
                                            const displayVal = isDash ? '-' : value;

                                            return (
                                              <div className="w-full flex flex-col">
                                                <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                                                  <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">{label}</label>
                                                </div>
                                                <div className="flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                                  {type === 'readonly' ? (
                                                    <div className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 leading-tight break-words" title={displayVal}>{displayVal}</div>
                                                  ) : type === 'select' && options ? (
                                                    <>
                                                      <select
                                                        value={value || ''}
                                                        onChange={(e) => handleKozijnChange(k.id, field, e.target.value)}
                                                        className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none cursor-pointer print:hidden"
                                                      >
                                                        <option value="">- Selecteer -</option>
                                                        {options.map(opt => (
                                                          <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                      </select>
                                                      <div className="hidden print:block w-full text-xs font-bold text-on-background leading-tight break-words whitespace-normal py-1">
                                                        {value || '-'}
                                                      </div>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <input
                                                        type="text"
                                                        value={displayVal}
                                                        onChange={(e) => handleKozijnChange(k.id, field, e.target.value)}
                                                        className={`w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none print:hidden ${isDash ? 'text-on-surface-variant/30 font-semibold' : ''}`}
                                                      />
                                                      <div className={`hidden print:block w-full text-xs font-bold leading-tight break-words whitespace-normal py-1 ${isDash ? 'text-on-surface-variant/30 font-semibold' : 'text-on-background'}`}>
                                                        {displayVal}
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          };

                                          const kFlag = fieldFlags[`library_${k.id}`];
                                          let kBorderStyle = 'border border-outline-variant/10 bg-white';
                                          if (kFlag === 'red') {
                                            kBorderStyle = '!border-2 !border-red-500 !bg-red-50/10 ring-2 ring-red-100';
                                          } else if (kFlag === 'yellow') {
                                            kBorderStyle = '!border-2 !border-amber-500 !bg-amber-50/10 ring-2 ring-amber-100';
                                          } else if (kFlag === 'green') {
                                            kBorderStyle = '!border-2 !border-green-500 !bg-green-50/10 ring-2 ring-green-100';
                                          }

                                          return (
                                            <div key={k.id} className={`rounded-2xl p-4 shadow-2xs flex justify-between gap-4 relative group break-inside-avoid ${kBorderStyle}`}>
                                              <div className="flex-1 flex flex-col">
                                                <div className="flex justify-between items-start pb-2 border-b border-outline-variant/10 mb-4">
                                                  <div className="flex items-start gap-1 min-w-0 flex-1">
                                                    <span
                                                      contentEditable
                                                      suppressContentEditableWarning
                                                      onBlur={(e) => handleKozijnChange(k.id, 'naam', e.currentTarget.textContent || '')}
                                                      className="text-primary text-xs font-black uppercase tracking-wide font-sans border-b-2 border-transparent hover:border-primary/30 focus:border-primary focus:outline-none transition-colors leading-tight inline-block flex-1 min-w-[50px] cursor-text"
                                                    >
                                                      {k.naam || k.id}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    {renderFlagCycleClicker(`library_${k.id}`)}
                                                    <div className="flex items-center gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setEditingKozijnRow({
                                                            ...k,
                                                            flag: fieldFlags[`library_${k.id}`]
                                                          });
                                                        }}
                                                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                                        title="Bewerk Frame & Glass"
                                                      >
                                                        <Pencil size={11} />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          if (window.confirm('Weet je zeker dat je dit kozijn wilt verwijderen?')) {
                                                            onChange('kozijnen', (data.kozijnen || []).filter((kz: any) => kz.id !== k.id));
                                                          }
                                                        }}
                                                        className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                                        title="Verwijderen"
                                                      >
                                                        <Trash2 size={11} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs font-bold flex-1">
                                                  <div>{renderKozijnCell('Naam', k.naam || k.id || '-', 'naam')}</div>
                                                  <div>
                                                    {renderKozijnCell('Locatie', k.gevel || '-', 'gevel', 'readonly')}
                                                  </div>
                                                  <div>{renderKozijnCell('Breedte (m)', k.width || '-', 'width')}</div>
                                                  <div>{renderKozijnCell('Hoogte (m)', k.height || '-', 'height')}</div>
                                                  <div>{renderKozijnCell('Area (m²)', k.area || '-', 'area', 'text')}</div>

                                                  <div className="w-full flex flex-col">
                                                    <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                                                      <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">Constructie</label>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                                      <select
                                                        value={k.constructieId || ''}
                                                        onChange={(e) => handleKozijnChange(k.id, 'constructieId', e.target.value)}
                                                        className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none cursor-pointer print:appearance-none print:bg-none"
                                                      >
                                                        <option value="">- Selecteer Constructie -</option>
                                                        {(data.constructies || []).filter(c => ['Raam', 'Deur', 'Paneel'].includes(c.type)).map(c => (
                                                          <option key={c.id} value={c.id}>{c.naam || c.id}</option>
                                                        ))}
                                                      </select>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="w-28 md:w-36 print:w-32 flex-shrink-0 flex flex-col h-full self-stretch">
                                                {(() => {
                                                  // Use the exact same key and photos as the outer scope to stay consistent with the table view
                                                  const currentImgKey = `kozijn_${k.id}`;
                                                  const allKozijnPhotos = allKPhotos;

                                                  const selectedIdxStr = (data.installations as any)?.[`selectedPhotoIndex_${currentImgKey}`];
                                                  let kImgUrl: string | undefined;
                                                  if (selectedIdxStr !== undefined) {
                                                    if (selectedIdxStr !== '-1') {
                                                      kImgUrl = allKozijnPhotos[parseInt(selectedIdxStr, 10)];
                                                    }
                                                  } else {
                                                    kImgUrl = allKozijnPhotos[0];
                                                  }
                                                  const hasKPhoto = !!(kImgUrl && kImgUrl !== '-' && kImgUrl !== '');

                                                  return (
                                                    <div
                                                      onClick={() => {
                                                        if (hasKPhoto && kImgUrl) {
                                                          const pIdx = allKPhotos.indexOf(kImgUrl);
                                                          openLightbox(allKPhotos, pIdx >= 0 ? pIdx : 0);
                                                        } else {
                                                          setPhotoSelectorModal({ isOpen: true, slotKey: currentImgKey, categoryName: 'Kozijnen', title: k.naam || 'Kozijn', existingPhotoUrl: kImgUrl, itemContext });
                                                        }
                                                      }}
                                                      className={`group relative rounded-2xl overflow-hidden flex items-center justify-center text-center transition w-full h-full min-h-[140px] print:min-h-[140px] print:h-full cursor-pointer ${hasKPhoto ? 'border border-outline-variant/15 bg-neutral-50 shadow-2xs hover:shadow-xs hover:border-primary/50 print:border print:bg-neutral-50' : 'border border-dashed border-outline-variant/30 bg-transparent hover:bg-neutral-50/50 print:hidden'}`}
                                                    >
                                                      {hasKPhoto ? (
                                                        <>
                                                          <img src={kImgUrl} alt={k.naam || 'Kozijn foto'} className="w-full h-full object-contain p-1 print:w-full print:h-full print:object-contain" referrerPolicy="no-referrer" />
                                                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity no-print z-10">
                                                            <button
                                                              type="button"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPhotoSelectorModal({ isOpen: true, slotKey: kImgKey, categoryName: 'Kozijnen', title: k.naam || 'Kozijn', existingPhotoUrl: kImgUrl, itemContext });
                                                              }}
                                                              className="bg-primary hover:bg-primary-dark text-white rounded-full p-1.5 shadow-md transition cursor-pointer flex items-center justify-center"
                                                              title="Wijzig foto"
                                                            >
                                                              <Pencil size={11} />
                                                            </button>
                                                            <button
                                                              type="button"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (itemContext) {
                                                                  const lib = data.kozijnenLibrary || defaultKozijnenLibrary;
                                                                  let idxInLib = lib.findIndex((itemObj: any) => (itemObj.id && itemObj.id === itemContext.id) || (itemObj.naam && itemObj.naam === itemContext.id));
                                                                  if (idxInLib >= 0) {
                                                                    const libObj = lib[idxInLib];
                                                                    const allCurrent = [...(libObj.photos || []), ...(libObj.photoUrl ? [libObj.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => p && arr.indexOf(p) === i);
                                                                    const updatedPhotos = allCurrent.filter(p => p !== kImgUrl);
                                                                    const updatedLib = [...lib];
                                                                    updatedLib[idxInLib] = {
                                                                      ...libObj,
                                                                      photos: updatedPhotos,
                                                                      photoUrl: updatedPhotos[0] || ''
                                                                    };
                                                                    onChange('kozijnenLibrary', updatedLib as any);
                                                                  }

                                                                  const list = data.kozijnen || [];
                                                                  const updatedKozijnen = list.map((kItem: any) => {
                                                                    if ((kItem.id && kItem.id === itemContext.id) || (kItem.naam && kItem.naam === itemContext.id)) {
                                                                      const allCurrent = [...(kItem.photos || []), ...(kItem.photoUrl ? [kItem.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => p && arr.indexOf(p) === i);
                                                                      const updatedPhotos = allCurrent.filter(p => p !== kImgUrl);
                                                                      return {
                                                                        ...kItem,
                                                                        photos: updatedPhotos,
                                                                        photoUrl: updatedPhotos[0] || ''
                                                                      };
                                                                    }
                                                                    return kItem;
                                                                  });
                                                                  if (updatedKozijnen.length > 0) {
                                                                    onChange('kozijnen', updatedKozijnen as any);
                                                                  }
                                                                }
                                                                onChange(`installations.selectedPhotoIndex_${currentImgKey}`, '-1');
                                                              }}
                                                              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition cursor-pointer flex items-center justify-center"
                                                              title="Verwijder foto"
                                                            >
                                                              <Trash2 size={11} />
                                                            </button>
                                                          </div>
                                                        </>
                                                      ) : (
                                                        <div className="flex flex-col items-center justify-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity print:hidden">
                                                          <ImageIcon size={20} className="stroke-[1.5]" />
                                                          <span className="text-[8px] font-black uppercase tracking-wider block text-on-surface-variant/40 leading-none">{t('structural.addPhoto')}</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {photoSelectorModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-outline-variant/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-outline-variant/10">
              <h3 className="text-sm font-black text-[#191c1d] uppercase tracking-wider font-sans">
                MEDIA BIBLIOTHEEK ({(photoSelectorModal.categoryName || photoSelectorModal.title || '').toUpperCase()})
              </h3>
              <button
                type="button"
                onClick={() => setPhotoSelectorModal(null)}
                className="text-on-surface-variant/60 hover:text-on-surface-variant bg-neutral-100 hover:bg-neutral-200 rounded-full p-1.5 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/50">
              {(() => {
                const { slotKey, categoryName, itemContext } = photoSelectorModal;

                let imageFiles: any[] = [];
                let isSharedContext = false;

                if (itemContext) {
                  isSharedContext = true;
                  let rawPhotos: string[] = [];
                  if (itemContext.type === 'bouwkundig') {
                    const bRows = data.bouwkundigRows || defaultBouwkundigRows;
                    let row = bRows.find((r: any) => (r.id && r.id === itemContext.id) || (r.naam && r.naam === itemContext.id));
                    if (row) {
                      rawPhotos = [...(row.photos || []), ...(row.photoUrl ? [row.photoUrl] : [])];
                    }
                  } else if (itemContext.type === 'constructie') {
                    const allC = data.constructies || [];
                    let row = allC.find((r: any) => (r.id && r.id === itemContext.id));
                    if (row) {
                      rawPhotos = [...(row.photos || []), ...(row.photoUrl ? [row.photoUrl] : [])];
                    }
                  } else if (itemContext.type === 'kozijn') {
                    const targetId = (itemContext.id || '').toString().trim().toLowerCase();
                    const kList = data.kozijnen || [];
                    const matchingList = kList.filter((k: any) =>
                      (k.id && k.id.toString().trim().toLowerCase() === targetId) ||
                      (k.naam && k.naam.toString().trim().toLowerCase() === targetId)
                    );
                    matchingList.forEach((m: any) => {
                      rawPhotos.push(...(m.photos || []), ...(m.photoUrl ? [m.photoUrl] : []));
                    });
                    if (photoSelectorModal.existingPhotoUrl) {
                      rawPhotos.push(photoSelectorModal.existingPhotoUrl);
                    }
                  }

                  // De-duplicate
                  rawPhotos = rawPhotos.filter((p, i, arr) => arr.indexOf(p) === i);

                  // Map to the object shape expected by the modal
                  imageFiles = rawPhotos.map((url, i) => ({
                    name: `Foto ${i + 1}`,
                    type: 'image/jpeg',
                    dataUrl: url,
                    isExisting: true, // Mark as existing so deleting triggers remove logic
                    isSharedContext: true // Distinguish from the simple single existing photo
                  }));
                } else {
                  const filesKey = `files_${categoryName.replace(/[^a-zA-Z0-9_]/g, '')}`;
                  const activeId = localStorage.getItem('installatie_active_id_current') || '1';
                  const allInst = data.allInstallations || [];
                  const inst = allInst.find((i: any) => i.id === activeId);
                  
                  let files = (inst?.details?.[filesKey]) || (data.installations as any)?.[filesKey] || [];
                  imageFiles = files.filter((f: any) => f.type?.startsWith('image/'));

                  const toAdd = [
                    ...(photoSelectorModal.existingPhotoUrl ? [photoSelectorModal.existingPhotoUrl] : []),
                    ...(photoSelectorModal.visiblePhotos || [])
                  ];

                  toAdd.forEach(url => {
                    if (url && !imageFiles.some((f: any) => f.dataUrl === url)) {
                      imageFiles.unshift({
                        name: 'Bestaande foto',
                        type: 'image/jpeg',
                        dataUrl: url,
                        isExisting: true
                      });
                    }
                  });
                }

                let selectedIndexVal = (data.installations as any)?.[`selectedPhotoIndex_${slotKey}`];
                let defaultIdx = 0;
                if (slotKey.endsWith('_extra')) defaultIdx = 1;
                if (slotKey.endsWith('_p2')) defaultIdx = 1;
                if (slotKey.endsWith('_p3')) defaultIdx = 2;

                if (photoSelectorModal.existingPhotoUrl) {
                  const foundIdx = imageFiles.findIndex((f: any) => f.dataUrl === photoSelectorModal.existingPhotoUrl);
                  if (foundIdx !== -1) {
                    defaultIdx = foundIdx;
                  }
                }
                const activeIdx = selectedIndexVal !== undefined ? parseInt(selectedIndexVal, 10) : defaultIdx;

                return (
                  <>
                    {imageFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 bg-neutral-50 rounded-2xl border border-dashed border-outline-variant/15">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-outline-variant/10 flex items-center justify-center shadow-xs mb-3">
                          <ImageIcon size={24} className="text-on-surface-variant/40" />
                        </div>
                        <p className="text-xs font-bold">{t('structural.noPhotosUploaded', { name: categoryName })}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {imageFiles.map((fileObj: any, idx: number) => {
                          const isSelected = activeIdx === idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                const activeId = localStorage.getItem('installatie_active_id_current') || '1';
                                const newVal = isSelected ? '-1' : idx.toString();
                                updateInstallationField(activeId, `selectedPhotoIndex_${slotKey}`, newVal);
                                updateInstallationField(activeId, `inst_${activeId}_selectedPhotoIndex_${slotKey}`, undefined);
                                onChange(`installations.selectedPhotoIndex_${slotKey}`, newVal);
                              }}
                              className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${isSelected
                                ? 'border-primary ring-2 ring-primary/20 shadow-md'
                                : 'border-outline-variant/10 hover:border-primary/50'
                                }`}
                            >
                              <img src={fileObj.dataUrl} alt={fileObj.name} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                                    <Check size={14} className="stroke-[3]" />
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (fileObj.isSharedContext && itemContext) {
                                    if (itemContext.type === 'bouwkundig') {
                                      const rows = data.bouwkundigRows || defaultBouwkundigRows;
                                      let idxInRows = rows.findIndex((r: any) => (r.id && r.id === itemContext.id) || (r.naam && r.naam === itemContext.id));
                                      if (idxInRows >= 0) {
                                        const rowObj = rows[idxInRows];
                                        const allCurrent = [...(rowObj.photos || []), ...(rowObj.photoUrl ? [rowObj.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => p && arr.indexOf(p) === i);
                                        const updatedPhotos = allCurrent.filter(p => p !== fileObj.dataUrl);
                                        const updatedRows = [...rows];
                                        updatedRows[idxInRows] = {
                                          ...rowObj,
                                          photos: updatedPhotos,
                                          photoUrl: updatedPhotos[0] || ''
                                        };
                                        onChange('bouwkundigRows', updatedRows as any);
                                      }
                                    } else if (itemContext.type === 'kozijn') {
                                      const list = data.kozijnen || [];
                                      const updatedKozijnen = list.map((kItem: any) => {
                                        if ((kItem.id && kItem.id === itemContext.id) || (kItem.naam && kItem.naam === itemContext.id)) {
                                          const allCurrent = [...(kItem.photos || []), ...(kItem.photoUrl ? [kItem.photoUrl] : [])].filter((p: string, i: number, arr: string[]) => p && arr.indexOf(p) === i);
                                          const updatedPhotos = allCurrent.filter(p => p !== fileObj.dataUrl);
                                          return {
                                            ...kItem,
                                            photos: updatedPhotos,
                                            photoUrl: updatedPhotos[0] || ''
                                          };
                                        }
                                        return kItem;
                                      });
                                      if (updatedKozijnen.length > 0) {
                                        onChange('kozijnen', updatedKozijnen as any);
                                      }
                                    }

                                    if (activeIdx === idx) {
                                      onChange(`installations.selectedPhotoIndex_${slotKey}`, '-1');
                                    } else if (activeIdx > idx) {
                                      onChange(`installations.selectedPhotoIndex_${slotKey}`, (activeIdx - 1).toString());
                                    }
                                    return;
                                  }

                                  if (fileObj.isExisting) {
                                    removePhoto(slotKey, e as any);
                                    setPhotoSelectorModal(null);
                                    return;
                                  }

                                  const filesKey = `files_${categoryName.replace(/[^a-zA-Z0-9_]/g, '')}`;
                                  let files = (data.installations as any)?.[filesKey] || [];
                                  const fullFilesList = [...files];
                                  const targetFileIndex = fullFilesList.findIndex((f: any) => f.dataUrl === fileObj.dataUrl);
                                  if (targetFileIndex !== -1) {
                                    fullFilesList.splice(targetFileIndex, 1);
                                    
                                    const activeId = localStorage.getItem('installatie_active_id_current') || '1';
                                    updateInstallationField(activeId, filesKey, fullFilesList);

                                    if (activeIdx === idx) {
                                      updateInstallationField(activeId, `selectedPhotoIndex_${slotKey}`, '-1');
                                      updateInstallationField(activeId, `inst_${activeId}_selectedPhotoIndex_${slotKey}`, undefined);
                                      onChange(`installations.selectedPhotoIndex_${slotKey}`, '-1');
                                    } else if (activeIdx > idx) {
                                      const newIdxStr = (activeIdx - 1).toString();
                                      updateInstallationField(activeId, `selectedPhotoIndex_${slotKey}`, newIdxStr);
                                      updateInstallationField(activeId, `inst_${activeId}_selectedPhotoIndex_${slotKey}`, undefined);
                                      onChange(`installations.selectedPhotoIndex_${slotKey}`, newIdxStr);
                                    }
                                  }
                                }}
                                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-650 text-white rounded-lg p-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition shadow-sm cursor-pointer z-10"
                                title="Verwijder foto"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="p-4 border-t border-outline-variant/10 mt-auto bg-white">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (photoSelectorModal) triggerPhotoUpload(photoSelectorModal.slotKey, photoSelectorModal.itemContext as any, true);
                  }}
                  className="py-3 bg-neutral-100 hover:bg-neutral-200 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Camera"
                >
                  <Camera size={18} />
                  <span className="text-[9px] uppercase tracking-wider">Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (photoSelectorModal) triggerPhotoUpload(photoSelectorModal.slotKey, photoSelectorModal.itemContext as any, false);
                  }}
                  className="py-3 bg-neutral-100 hover:bg-neutral-200 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Upload vanaf PC"
                >
                  <Upload size={18} />
                  <span className="text-[9px] uppercase tracking-wider">Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoSelectorModal(null)}
                  className="py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title="Klaar"
                >
                  <Check size={18} />
                  <span className="text-[9px] uppercase tracking-wider">Klaar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PhotoViewerModal
        open={!!selectedPhoto}
        onClose={() => {
          setSelectedPhoto(null);
          setLightboxPhotos([]);
        }}
        slides={slidesFromUrls(lightboxPhotos.length > 0 ? lightboxPhotos : (selectedPhoto ? [selectedPhoto] : []))}
        index={lightboxIndex}
        onPrev={() => setLightboxIndex(i => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
        onNext={() => setLightboxIndex(i => (i + 1) % lightboxPhotos.length)}
        zIndexClassName="z-[99999]"
      />

      <ConstructieEditModal
        isOpen={editingConstructieRow !== null}
        onClose={() => setEditingConstructieRow(null)}
        onSave={(updated) => {
          const current = data.constructies || [];
          const idx = current.findIndex(c => c.id === updated.id);
          if (idx >= 0) {
            const next = [...current];
            next[idx] = updated;
            onChange('constructies', next as any);
          }
          setEditingConstructieRow(null);
        }}
        initialRow={editingConstructieRow}
        existingConstructies={data.constructies || []}
        data={data}
        onChangeData={onChange}
        flagKey={editingConstructieRow ? `constructie_row_${editingConstructieRow.id}` : undefined}
        onFlagChange={setFieldFlag}
      />

      <BouwkundigEditModal
        isOpen={isBouwkundigModalOpen}
        onClose={() => {
          setIsBouwkundigModalOpen(false);
          setEditingBouwkundigRow(null);
          setEditingBouwkundigIndex(null);
        }}
        onSave={(updatedRow) => {
          const rows = [...(data.bouwkundigRows || defaultBouwkundigRows)];
          if (editingBouwkundigIndex !== null && editingBouwkundigIndex >= 0) {
            rows[editingBouwkundigIndex] = updatedRow;
            
            const newFlags = { ...((data.installations as any)?.flags || {}) };
            const flagKey = `bouwkundig_${editingBouwkundigIndex}`;
            if (updatedRow.flag) newFlags[flagKey] = updatedRow.flag;
            else delete newFlags[flagKey];
            onChange('installations.flags', newFlags);
          } else {
            rows.push(updatedRow);
          }
          onChange('bouwkundigRows', rows as any);
          setIsBouwkundigModalOpen(false);
          setEditingBouwkundigRow(null);
          setEditingBouwkundigIndex(null);
        }}
        initialRow={editingBouwkundigRow}
        data={data}
        onChangeData={onChange}
        flagKey={editingBouwkundigIndex !== null ? `bouwkundig_${editingBouwkundigIndex}` : undefined}
        onFlagChange={setFieldFlag}
      />

      <KozijnEditModal
        isOpen={editingKozijnRow !== null}
        onClose={() => setEditingKozijnRow(null)}
        onSave={(updatedKozijn) => {
          const currentKozijnen = data.kozijnen || [];
          const updated = currentKozijnen.map(k => k.id === updatedKozijn.id ? updatedKozijn : k);
          
          const newFlags = { ...((data.installations as any)?.flags || {}) };
          const flagKey = `library_${updatedKozijn.id}`;
          if (updatedKozijn.flag) newFlags[flagKey] = updatedKozijn.flag;
          else delete newFlags[flagKey];
          onChange('installations.flags', newFlags);
          
          onChange('kozijnen', updated as any);
          setEditingKozijnRow(null);
        }}
        initialRow={editingKozijnRow}
        data={data}
        onChangeData={onChange}
        flagKey={editingKozijnRow ? `library_${editingKozijnRow.id}` : undefined}
        onFlagChange={setFieldFlag}
      />
      <ConfirmModal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            onChange('allInstallations', (data.allInstallations || []).map((i: any) => i.id === categoryToDelete.instId ? { ...i, activeCategories: (i.activeCategories || ['Ventilatie', 'Verwarming', 'Tapwater', 'Koeling', 'Zonne-panelen']).filter((c: string) => c !== categoryToDelete.cat) } : i));
          }
          setCategoryToDelete(null);
        }}
        title="Weet je het zeker?"
        message="Weet je zeker dat je deze categorie wilt verwijderen?"
      />
      <ConfirmModal
        isOpen={installationToDelete !== null}
        onClose={() => setInstallationToDelete(null)}
        onConfirm={() => {
          if (installationToDelete && (data.allInstallations || []).length > 1) {
            const newList = (data.allInstallations || []).filter((i: any) => i.id !== installationToDelete);
            onChange('allInstallations', newList);
            
            const activeId = localStorage.getItem('installatie_active_id_current') || '1';
            if (activeId === installationToDelete && newList.length > 0) {
              const fallbackId = newList[0].id;
              safeSetItem('installatie_active_id_current', fallbackId);
              onChange('installations', newList[0].details || {});
            }
          }
          setInstallationToDelete(null);
        }}
        title="Weet je het zeker?"
        message="Weet je zeker dat je deze gehele installatie wilt verwijderen?"
      />
    </div>
  );
};

export default InvoersheetView;
export { InvoersheetView };
