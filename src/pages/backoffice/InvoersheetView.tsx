import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Upload,
  ArrowLeft,
  Save
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { PhotoViewerModal } from '../../components/common/PhotoViewerModal';
import { slidesFromUrls } from '../../utils/photoViewer';
import { ConstructieEditModal } from '../../components/common/ConstructieEditModal';
import { InstallatiesSchema } from '../../config/schema/InstallatiesSchema';
import { ConstructiesSchema } from '../../config/schema/ConstructiesSchema';
import { BouwkundigSchema } from '../../config/schema/BouwkundigSchema';
import { BouwkundigEditModal, BouwkundigRow } from '../../components/common/BouwkundigEditModal';
import { KozijnEditModal } from '../../components/common/KozijnEditModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { AppSelect } from '../../components/common/AppSelect';
import { IdentificatieSchema } from '../../config/schema/IdentificatieSchema';
import InstallatieView from './InstallatieView';

interface InvoersheetViewProps {
  data: InspectionData;
  onChange: (path: string, value: any) => void;
  onViewChange?: (view: any) => void;
  currentUserName?: string;
  currentUserRole?: string;
  initialTab?: 'p1' | 'p2' | 'p3' | 'p4';
  onTabChange?: (tab: 'p1' | 'p2' | 'p3' | 'p4') => void;
  scrollTarget?: any;
}
const getDynamicGridClass = (span: 1 | 2 | undefined, label: string, value: string, index?: number, arr?: any[], dataObj?: any) => {
  // Mobile span is determined by hardcoded span OR text length
  const getMobileSpan = (f: any, data: any) => {
    if (f.span === 2) return 2;
    const vStr = (data?.[f.id] !== undefined ? data[f.id] : (f.defaultValue || '')) + '';
    const len = vStr.length + (f.label || '').length;
    return len <= 35 ? 1 : 2;
  };

  const calculateHoleFillingSpan = (getSpanFn: (f: any, d: any) => 1 | 2) => {
    let finalSpan = getSpanFn({ span, label, defaultValue: value }, { [label]: value });
    if (arr && index !== undefined && span !== 2) {
      let currentCol = 0;
      for (let i = 0; i <= index; i++) {
        const f = arr[i];
        let bSpan = getSpanFn(f, dataObj);
        
        if (bSpan === 1 && currentCol === 0) {
          const nextF = arr[i + 1];
          let nextBSpan = nextF ? getSpanFn(nextF, dataObj) : null;
          if (!nextF || nextBSpan === 2) {
            bSpan = 2;
          }
        }
        
        if (i === index) {
          finalSpan = bSpan;
          break;
        }
        
        if (bSpan === 2) currentCol = 0;
        else currentCol = (currentCol + 1) % 2;
      }
    }
    return finalSpan;
  };

  const mobileSpan = calculateHoleFillingSpan(getMobileSpan);
  const mobileClass = mobileSpan === 2 ? 'col-span-2' : 'col-span-1';
  
  // On desktop, we always want fields to flow densely (1 slot) so they fit perfectly into 3/4 col layouts
  const desktopClass = 'md:col-span-1';

  return `${mobileClass} ${desktopClass}`;
};

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

const InvoersheetView: React.FC<InvoersheetViewProps> = ({
  data,
  onChange,
  onViewChange,
  currentUserName,
  currentUserRole,
  initialTab,
  onTabChange,
  scrollTarget,
}) => {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'p3' | 'p4'>(initialTab || 'p1');

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: 'p1' | 'p2' | 'p3' | 'p4') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  useEffect(() => {
    let target = scrollTarget;
    if (!target) {
      try {
        const stored = localStorage.getItem('invoersheet_scroll_target');
        if (stored) target = JSON.parse(stored);
      } catch {}
    }

    if (!target || !target.id) return;

    const rawId: string = target.id;
    const cleanFieldKey = rawId.includes('-') ? rawId.split('-').slice(1).join('-') : rawId;
    const subKey = cleanFieldKey.includes('_') ? cleanFieldKey.split('_').slice(1).join('_') : cleanFieldKey;

    let attempts = 0;
    const maxAttempts = 15;

    const tryScroll = () => {
      attempts++;
      const candidates = [
        document.getElementById(`field-algemeen_woning_${cleanFieldKey}`),
        document.getElementById(`field-algemeen_bewoner_${cleanFieldKey}`),
        document.getElementById(`field-algemeen_inspector_${cleanFieldKey}`),
        document.getElementById(`field-algemeen_technical_${cleanFieldKey}`),
        document.getElementById(`field-algemeen_bidIntern_${cleanFieldKey}`),
        document.getElementById(`field-inst_${cleanFieldKey}`),
        document.getElementById(`field-${cleanFieldKey}`),
        document.getElementById(cleanFieldKey),
        document.getElementById(rawId),
        document.getElementById(`constructie-${cleanFieldKey}`),
        document.getElementById(`kozijn-${cleanFieldKey}`),
        document.getElementById(cleanFieldKey.replace('_', '-')),
        document.querySelector(`[data-field-key="${cleanFieldKey}"]`),
        document.querySelector(`[data-field-key="${subKey}"]`),
        document.querySelector(`[data-field-id*="${cleanFieldKey}"]`),
        document.querySelector(`[data-field-id="${rawId}"]`),
      ];

      const targetEl = candidates.find(el => el != null) as HTMLElement | undefined;

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'bg-primary/10', 'transition-all', 'duration-500');
        setTimeout(() => {
          targetEl.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'bg-primary/10');
        }, 3500);

        try {
          localStorage.removeItem('invoersheet_scroll_target');
        } catch {}
      } else if (attempts < maxAttempts) {
        setTimeout(tryScroll, 100);
      }
    };

    const timer = setTimeout(tryScroll, 200);
    return () => clearTimeout(timer);
  }, [scrollTarget, activeTab]);
  const [categoryToDelete, setCategoryToDelete] = useState<{ instId: string; cat: string } | null>(null);
  const [installationToDelete, setInstallationToDelete] = useState<string | null>(null);
  const [showInstallatieModal, setShowInstallatieModal] = useState(false);
  const [constructieToDelete, setConstructieToDelete] = useState<string | null>(null);
  const [bouwkundigToDelete, setBouwkundigToDelete] = useState<number | null>(null);

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

  const [fieldRoles, setFieldRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    const clientId = data.clientId || 'default';
    try {
      const savedRoles = localStorage.getItem(`field_roles_${clientId}`);
      if (savedRoles) {
        const parsed = JSON.parse(savedRoles);
        let cleaned = false;
        Object.keys(parsed).forEach(k => {
          if (parsed[k] === 'BACK_OFFICE') {
            parsed[k] = 'SYS';
            cleaned = true;
          }
        });
        if (cleaned) {
          localStorage.setItem(`field_roles_${clientId}`, JSON.stringify(parsed));
        }
        setFieldRoles(parsed);
      }
    } catch { }
  }, [data.clientId]);

  const setFieldFlagGreen = (fieldKey: string) => {
    const res = resolveFlagNamespace(fieldKey);
    if (!res) return;

    const { storageKey, subKey } = res;
    const clientId = data.clientId || 'default';

    // Track user role
    let role = 'SYS';

    if (currentUserRole) {
      const lowerRole = currentUserRole.toLowerCase();
      if (lowerRole === 'inspector') role = 'INS';
      else if (lowerRole === 'bewoner') role = 'BWO';
      else role = 'SYS';
    } else {
      const activeUserName = currentUserName || localStorage.getItem('user_name') || 'Demo Inspector';
      if (activeUserName.toLowerCase().includes('inspector') || activeUserName.toLowerCase().includes('adviseur')) {
        role = 'INS';
      } else if (activeUserName.toLowerCase().includes('bewoner')) {
        role = 'BWO';
      }
    }

    setFieldRoles(prev => {
      const updated = { ...prev, [fieldKey]: role };
      if (storageKey.startsWith('constructie_flags_')) {
        updated[`constructie_row_${subKey}`] = role;
      }
      try {
        safeSetItem(`field_roles_${clientId}`, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    if (role !== 'INS') return;

    setFieldFlags(prev => {
      const current = prev[fieldKey];
      if (current === 'green') return prev;

      try {
        let storedObj: Record<string, any> = {};
        const saved = localStorage.getItem(storageKey);
        if (saved) storedObj = JSON.parse(saved);

        storedObj[subKey] = 'green';
        safeSetItem(storageKey, JSON.stringify(storedObj));
      } catch (e) {
        console.error('Failed to save flag to localstorage', e);
      }

      const updated = { ...prev };

      if (storageKey.startsWith('constructie_flags_')) {
        updated[`constructie_row_${subKey}`] = 'green';
        updated[`constructie_${subKey}_invoer`] = 'green';
        updated[`constructie_${subKey}_merk`] = 'green';
        updated[`constructie_${subKey}_val`] = 'green';
        updated[`constructie_${subKey}_g`] = 'green';
        updated[`constructie_${subKey}_dikte`] = 'green';
        updated[`constructie_${subKey}_code`] = 'green';
      } else {
        updated[fieldKey] = 'green';
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

  const triggerPhotoUpload = (key: string, context?: { type?: 'bouwkundig' | 'kozijn' | 'constructie', id?: string, index?: number, instId?: string }, capture?: boolean) => {
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

          if (context && (context.type === 'bouwkundig' || context.type === 'kozijn' || context.type === 'constructie')) {
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
            } else if (context.type === 'constructie') {
              const rows = data.constructies || [];
              let idx = rows.findIndex((r: any) => r.id === context.id);
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
                onChange('constructies', updatedRows as any);
                if (key) {
                  onChange(`installations.selectedPhotoIndex_${key}`, (newPhotos.length - 1).toString());
                }
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
    setFieldFlagGreen(`constructie_row_${id}`);
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



  const renderFormCell = (
    label: string,
    value: string,
    pathOrLocalKey: string,
    isLocal: boolean = false,
    type: 'text' | 'select' | 'date' = 'text',
    options?: string[],
    hasCalendarIcon: boolean = false,
    readOnly: boolean = false,
    customOnChange?: (val: string) => void
  ) => {
    const isDash = !value || value === '-' || value.trim() === '';
    const translationKey = `values.${value}`;
    const tr = t(translationKey);
    const translatedValue = (!isDash && tr !== translationKey) ? tr : value;
    const displayVal = isDash ? '' : translatedValue;
    const isDate = label.toLowerCase().includes('datum') || hasCalendarIcon;
    const flag = fieldFlags[pathOrLocalKey];

    let borderStyle = 'border-outline-variant/15 bg-gray-50 hover:bg-gray-100/80';

    let defaultRoleBadge = '';
    if (pathOrLocalKey.startsWith('algemeen.bewoner.')) {
      defaultRoleBadge = 'BWO';
    } else if (pathOrLocalKey.startsWith('algemeen.inspector.')) {
      if (['algemeen.inspector.certificaathouder', 'algemeen.inspector.gebruiker', 'algemeen.inspector.invoerdatum'].includes(pathOrLocalKey)) {
        defaultRoleBadge = 'SYS';
      } else {
        defaultRoleBadge = 'INS';
      }
    } else if (pathOrLocalKey.startsWith('algemeen.bidIntern.')) {
      defaultRoleBadge = 'SYS';
    } else if (pathOrLocalKey.startsWith('algemeen.woning.')) {
      if (['algemeen.woning.gebouwtype', 'algemeen.woning.subtype', 'algemeen.woning.daktype', 'algemeen.woning.ligging', 'algemeen.woning.bouwfase', 'algemeen.woning.opname', 'algemeen.woning.floorConstructieType', 'algemeen.woning.wallConstructieType'].includes(pathOrLocalKey)) {
        defaultRoleBadge = 'INS';
      } else {
        defaultRoleBadge = 'SYS';
      }
    } else if (pathOrLocalKey.startsWith('algemeen.technical.')) {
      defaultRoleBadge = 'SYS';
    } else if (pathOrLocalKey.startsWith('inst_')) {
      const fieldKey = pathOrLocalKey.split('_').slice(2).join('_').toLowerCase();
      if (['venttypetoestel', 'verwarmtypetoestel', 'taptypeinstallatie', 'koeltypetoestel', 'zontypetoestel', 'ventventilatoren', 'ventp'].includes(fieldKey)) {
        defaultRoleBadge = 'BWO';
      } else if (['ventmerktype', 'verwarmmerktype', 'tapmerktype', 'koelmerktype', 'zonmerktype', 'ventsysteem', 'verwarmsysteem', 'tapsysteem', 'koelsysteem'].includes(fieldKey)) {
        defaultRoleBadge = 'SYS';
      } else {
        defaultRoleBadge = 'INS';
      }
    }

    const roleBadge = fieldRoles[pathOrLocalKey] || defaultRoleBadge;
    const sanitizedId = pathOrLocalKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fieldOnlyKey = pathOrLocalKey.split('.').pop() || pathOrLocalKey.split('_').pop() || '';

    return (
      <div
        id={`field-${sanitizedId}`}
        data-field-id={pathOrLocalKey}
        data-field-key={fieldOnlyKey}
        className="w-full flex flex-col transition-all duration-300 rounded-xl"
      >
        <div className="flex items-center justify-between w-full mb-1.5">
          <label className="text-[9px] font-black text-on-surface-variant/90 tracking-wider block uppercase font-sans">
            {label}
          </label>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {roleBadge && (
              <span className="text-[9px] font-black text-neutral-500 tracking-wider leading-none select-none">
                {roleBadge}
              </span>
            )}
            {readOnly ? (
              (() => {
                const currentFlag = fieldFlags[pathOrLocalKey];
                let colorClass = 'bg-neutral-200 border-neutral-300';
                if (currentFlag === 'red') colorClass = 'bg-red-500 border-red-600';
                else if (currentFlag === 'yellow') colorClass = 'bg-amber-400 border-amber-500';
                else if (currentFlag === 'green') colorClass = 'bg-green-500 border-green-600';
                return <span className={`w-2.5 h-2.5 rounded-full border ${colorClass} inline-block`} />;
              })()
            ) : (
              renderFlagCycleClicker(pathOrLocalKey)
            )}
          </div>
        </div>
        <div className={`flex items-center justify-between gap-2 min-h-[40px] px-3 py-2 rounded-xl border transition duration-150 w-full flex-1 ${borderStyle}`}>
          {type === 'select' && options ? (
            <>
              <AppSelect
                variant="compact"
                value={value || ''}
                disabled={readOnly}
                options={options.map(opt => {
                  const transKey = `values.${opt}`;
                  const trVal = t(transKey);
                  const translatedOpt = trVal !== transKey ? trVal : opt;
                  return { label: translatedOpt, value: opt };
                })}
                onChange={(val) => {
                  setFieldFlagGreen(pathOrLocalKey);
                  if (customOnChange) {
                    customOnChange(val);
                  } else if (isLocal) {
                    handleInstallationChange(pathOrLocalKey as keyof typeof installations, val);
                  } else {
                    onChange(pathOrLocalKey, val);
                  }
                }}
              />
              <div className="hidden print:block w-full text-xs font-bold text-on-background leading-tight break-words whitespace-normal py-1 font-sans">
                {isDash ? "-" : displayVal}
              </div>
            </>
          ) : (
            <div className="relative w-full flex-1">
              <input placeholder="-"
                type={type === 'date' ? 'date' : 'text'}
                value={displayVal}
                disabled={readOnly}
                readOnly={readOnly}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldFlagGreen(pathOrLocalKey);
                  if (customOnChange) {
                    customOnChange(val);
                  } else if (isLocal) {
                    handleInstallationChange(pathOrLocalKey as keyof typeof installations, val);
                  } else {
                    onChange(pathOrLocalKey, val);
                  }
                }}
                className={`w-full text-xs font-bold text-on-background bg-transparent border-none focus:outline-none focus:ring-0 leading-tight outline-none print:hidden font-sans ${type === 'date' ? 'appearance-none date-input-custom pr-6' : ''} ${isDash ? 'text-on-surface-variant/30 font-semibold' : ''
                  } ${readOnly ? 'cursor-default pointer-events-none opacity-80' : ''}`}
              />
              {type === 'date' && (
                <Calendar size={14} strokeWidth={2.5} className="absolute right-0 top-1/2 -translate-y-1/2 text-primary pointer-events-none print:hidden" />
              )}
              <div className={`hidden print:block w-full text-xs font-bold leading-tight break-words whitespace-normal py-1 ${isDash ? 'text-on-surface-variant/30 font-semibold' : 'text-on-background'}`}>
                {isDash ? "-" : displayVal}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="invoersheet-container" className="flex flex-col h-full bg-[#f1f3f4] text-[#191c1d] w-full">
      <input placeholder="-"
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

      <div className="no-print sticky top-0 z-30 bg-white border-b border-[#e1e3e4] px-4 md:px-6 py-3 flex flex-row items-center justify-between gap-2 md:gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {onViewChange && (
            <button
              type="button"
              onClick={() => onViewChange('dashboard')}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer text-neutral-600 shrink-0"
              title={t('installations.backToOverview') || 'Terug naar overzicht'}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="relative flex-1 min-w-0">
            <div className="flex overflow-x-auto whitespace-nowrap no-scrollbar bg-neutral-100 p-1 rounded-xl gap-0.5 text-[11px] font-black border border-neutral-250 uppercase tracking-wider h-full pr-8">
            <button
              type="button"
              onClick={(e) => { handleTabChange('p1'); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p1' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              <span className="hidden sm:inline">Identificatie & Algemeen</span>
              <span className="sm:hidden">Identificatie...</span>
            </button>
            <button
              type="button"
              onClick={(e) => { handleTabChange('p2'); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p2' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Installaties
            </button>
            <button
              type="button"
              onClick={(e) => { handleTabChange('p3'); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p3' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Constructies
            </button>
            <button
              type="button"
              onClick={(e) => { handleTabChange('p4'); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p4' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Bouwkundig
            </button>
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-neutral-100 to-transparent pointer-events-none rounded-r-xl border-r border-y border-transparent" />
          </div>
        </div>

        <div className="flex items-center gap-2 w-auto justify-end">
          <button
            type="button"
            onClick={handlePrintA4}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white p-2 md:px-4 md:py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs active:scale-[0.98] font-sans shrink-0"
            title="Exporteer Invoersheet als A4 PDF document"
          >
            <Printer size={15} />
            <span className="hidden md:inline">Exporteer</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-6 flex flex-col items-center w-full">
        <div
          className="transition-transform duration-100 w-full max-w-[850px] min-h-[1100px] h-auto bg-white text-black p-3 md:p-10 relative border border-[#e1e3e4] shadow-md my-2 md:my-4 flex flex-col justify-between print-page rounded-2xl shrink-0"
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
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="border-b border-neutral-250 pb-3 mb-3 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider font-sans">Identificatie</h2>
                  </div>

                  <div className="print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-wide flex items-center justify-between font-sans">
                      <span>Bewoner</span>

                    </h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white pl-3 pr-1 py-3 md:p-4.5 shadow-none md:shadow-2xs">
                      <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-x-6 gap-y-4">
                        {IdentificatieSchema.Bewoner.map((field, index, arr) => (
                          <div key={field.id} className={getDynamicGridClass(field.span, field.label, (data.algemeen?.bewoner as any)?.[field.id] || field.defaultValue || '', index, arr)}>
                            {renderFormCell(field.label, (data.algemeen?.bewoner as any)?.[field.id] || field.defaultValue, `algemeen.bewoner.${field.id}`, false, field.type, field.options)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-wide flex items-center justify-between font-sans">
                      <span>Inspecteur</span>

                    </h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white pl-3 pr-1 py-3 md:p-4.5 shadow-none md:shadow-2xs">
                      <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-x-6 gap-y-4">
                        {IdentificatieSchema.Inspecteur.map((field, index, arr) => (
                          <div key={field.id} className={getDynamicGridClass(field.span, field.label, (data.algemeen?.inspector as any)?.[field.id] || field.defaultValue || '', index, arr)}>
                            {renderFormCell(field.label, (data.algemeen?.inspector as any)?.[field.id] || field.defaultValue, `algemeen.inspector.${field.id}`, false, field.type, field.options)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-wide flex items-center justify-between font-sans">
                      <span>BID Intern</span>

                    </h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white pl-3 pr-1 py-3 md:p-4.5 shadow-none md:shadow-2xs">
                      <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-x-6 gap-y-4">
                        {IdentificatieSchema.BidIntern.map((field, index, arr) => (
                          <div key={field.id} className={getDynamicGridClass(field.span, field.label, (data.algemeen?.bidIntern as any)?.[field.id] || field.defaultValue || '', index, arr)}>
                            {renderFormCell(field.label, (data.algemeen?.bidIntern as any)?.[field.id] || field.defaultValue, `algemeen.bidIntern.${field.id}`, false, field.type, field.options)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="border-b border-neutral-250 pb-3 mb-3 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider font-sans">Algemeen</h2>
                  </div>

                  <div className="print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-wide font-sans">General details</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white pl-3 pr-1 py-3 md:p-4.5 shadow-none md:shadow-2xs">
                      <div className="grid grid-cols-2 lg:grid-cols-4 md:grid-cols-4 print:grid-cols-4 gap-4">
                        {IdentificatieSchema.Woning.map((field, index, arr) => (
                          <div key={field.id} className={getDynamicGridClass(field.span, field.label, (data.algemeen?.woning as any)?.[field.id] || field.defaultValue || '', index, arr)}>
                            {renderFormCell(field.label, (data.algemeen?.woning as any)?.[field.id] || field.defaultValue, `algemeen.woning.${field.id}`, false, field.type, field.options)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 print:break-inside-avoid">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">Technical details</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white pl-3 pr-1 py-3 md:p-4.5 shadow-none md:shadow-2xs">
                      <div className="grid grid-cols-2 lg:grid-cols-4 md:grid-cols-4 print:grid-cols-4 gap-4">
                        {IdentificatieSchema.Technical.filter(field => !field.showIf || field.showIf(data.algemeen?.technical || {})).map((field, index, arr) => {
                          const category = (field.id === 'leidingdoorvoeren' || field.id === 'aantal' || field.id === 'avr') ? 'technical' : 'woning';
                          return (
                            <div key={field.id} className={getDynamicGridClass(field.span, field.label, (data.algemeen?.[category as keyof typeof data.algemeen] as any)?.[field.id] || field.defaultValue || '', index, arr)}>
                              {renderFormCell(field.label, (data.algemeen?.[category as keyof typeof data.algemeen] as any)?.[field.id] || field.defaultValue, `algemeen.${category}.${field.id}`, false, field.type, field.options)}
                            </div>
                          );
                        })}
                        {data.algemeen?.technical?.gboTs && data.algemeen.technical.gboTs.length > 0 ? (
                          data.algemeen.technical.gboTs.map((val: string, idx: number) => (
                            <div key={idx} className="col-span-2 md:col-span-1">
                              {renderFormCell(`GBO-T_${idx + 1}`, val || '-', `algemeen.technical.gboTs.${idx}`)}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 md:col-span-1">
                            {renderFormCell('GBO-T_1', '-', 'algemeen.technical.gboTs.0')}
                          </div>
                        )}
                        <div className="hidden md:block col-span-1" />
                        <div className="hidden md:block col-span-1" />
                        <div className="hidden md:block col-span-1" />
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
                <div className={`space-y-8 ${isPrinting ? 'print-section' : ''}`}>
                  <div className="border-b border-neutral-250 pb-2 mb-2 flex flex-wrap justify-between items-center gap-2">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>Installaties</span>
                    </h2>
                    {onViewChange && (
                      <button
                        type="button"
                        onClick={() => setShowInstallatieModal(true)}
                        className="text-[10px] font-black text-primary hover:text-primary-dark flex items-center gap-1.5 cursor-pointer bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all no-print font-sans"
                      >
                        <Wind size={11} />
                        <span>Naar Installatiepagina</span>
                      </button>
                    )}
                  </div>

                  {installationsList.map((inst, index) => {
                    const instDetails = (inst.id === activeInstallatieId && data.installations)
                      ? { ...(inst.details || {}), ...(data.installations || {}) }
                      : (inst.details || {});

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
                      type: 'text' | 'select' | 'date' = 'text',
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
                        className="space-y-4 md:space-y-6 border-0 md:border md:border-neutral-200/80 rounded-2xl md:rounded-3xl py-5 md:p-6 relative shadow-xs transition duration-200 print:border-none print:ring-0 print:shadow-none print:p-0 bg-white md:bg-white"
                      >
                        {/* Header & 3.1 Ventilatie wrapped together so they never split across page breaks */}
                        <div className="space-y-6 print:break-inside-avoid">
                          <div className="flex justify-between items-center pb-3 border-b border-neutral-200/85 print-header-keep px-4 md:px-0">
                            <div className="flex items-center gap-2.5 font-sans">
                              <span className="text-[11px] font-black text-primary uppercase tracking-wider">
                                Installatie #{index + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 no-print">
                              <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); setShowInstallatieModal(true); }} className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Bewerken"><Pencil size={11} /></button>
                              {installationsList.length > 1 && (
                                <button type="button" onClick={() => setInstallationToDelete(inst.id)} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Verwijderen"><Trash2 size={11} /></button>
                              )}
                            </div>
                          </div>

                          {/* 3.1 Ventilatie Card */}
                          {activeCategories.includes('Ventilatie') && (
                            <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-3 md:p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                              <div className="flex-grow md:w-[72%] print:w-[72%]">
                                <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                  <span className="flex items-center gap-1.5"><Wind size={14} /> Ventilatie</span>
                                  <div className="flex items-center gap-1.5 no-print">
                                    <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Ventilatie'); localStorage.setItem('installatie_view_state', 'detail'); setShowInstallatieModal(true); }} className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Bewerken"><Pencil size={13} /></button>
                                    <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Ventilatie' }) }} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Verwijderen"><Trash2 size={13} /></button>
                                  </div>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                  {InstallatiesSchema.Ventilatie.filter(field => !field.showIf || field.showIf(instDetails)).map((field, index, arr) => (
                                    <div key={field.id} className={getDynamicGridClass(field.span, field.label, instDetails[field.id] || field.defaultValue || '', index, arr, instDetails)}>
                                      {renderInstCell(field.label, instDetails[field.id] || field.defaultValue, field.id, field.type, field.optionsFn ? field.optionsFn(instDetails) : field.options)}
                                    </div>
                                  ))}
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
                            <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-3 md:p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                              <div className="flex-grow md:w-[72%] print:w-[72%]">
                                <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                  <span className="flex items-center gap-1.5"><Flame size={14} /> Verwarming</span>
                                  <div className="flex items-center gap-1.5 no-print">
                                    <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Verwarming'); localStorage.setItem('installatie_view_state', 'detail'); setShowInstallatieModal(true); }} className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Bewerken"><Pencil size={13} /></button>
                                    <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Verwarming' }) }} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Verwijderen"><Trash2 size={13} /></button>
                                  </div>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                  {InstallatiesSchema.Verwarming.filter(field => !field.showIf || field.showIf(instDetails)).map((field, index, arr) => (
                                    <div key={field.id} className={getDynamicGridClass(field.span, field.label, instDetails[field.id] || field.defaultValue || '', index, arr, instDetails)}>
                                      {renderInstCell(field.label, instDetails[field.id] || field.defaultValue, field.id, field.type, field.optionsFn ? field.optionsFn(instDetails) : field.options)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                                {renderInstallationMasonryGallery('Verwarming', instDetails, inst.id)}
                              </div>
                            </div>
                          )}

                          {/* 3.3 Tapwater Card */}
                          {activeCategories.includes('Tapwater') && (
                            <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-3 md:p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                              <div className="flex-grow md:w-[72%] print:w-[72%]">
                                <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                  <span className="flex items-center gap-1.5"><Droplet size={14} /> Tapwater</span>
                                  <div className="flex items-center gap-1.5 no-print">
                                    <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Tapwater'); localStorage.setItem('installatie_view_state', 'detail'); setShowInstallatieModal(true); }} className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Bewerken"><Pencil size={13} /></button>
                                    <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Tapwater' }) }} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Verwijderen"><Trash2 size={13} /></button>
                                  </div>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                  {InstallatiesSchema.Tapwater.filter(field => !field.showIf || field.showIf(instDetails)).map((field, index, arr) => (
                                    <div key={field.id} className={getDynamicGridClass(field.span, field.label, instDetails[field.id] || field.defaultValue || '', index, arr, instDetails)}>
                                      {renderInstCell(field.label, instDetails[field.id] || field.defaultValue, field.id, field.type, field.optionsFn ? field.optionsFn(instDetails) : field.options)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                                {renderInstallationMasonryGallery('Tapwater', instDetails, inst.id)}
                              </div>
                            </div>
                          )}

                          {/* 3.4 Koeling Card */}
                          {activeCategories.includes('Koeling') && (
                            <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-3 md:p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                              <div className="flex-grow md:w-[72%] print:w-[72%]">
                                <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                  <span className="flex items-center gap-1.5"><Snowflake size={14} /> Koeling</span>
                                  <div className="flex items-center gap-1.5 no-print">
                                    <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Koeling'); localStorage.setItem('installatie_view_state', 'detail'); setShowInstallatieModal(true); }} className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Bewerken"><Pencil size={13} /></button>
                                    <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Koeling' }) }} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Verwijderen"><Trash2 size={13} /></button>
                                  </div>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                  {InstallatiesSchema.Koeling.filter(field => !field.showIf || field.showIf(instDetails)).map((field, index, arr) => (
                                    <div key={field.id} className={getDynamicGridClass(field.span, field.label, instDetails[field.id] || field.defaultValue || '', index, arr, instDetails)}>
                                      {renderInstCell(field.label, instDetails[field.id] || field.defaultValue, field.id, field.type, field.optionsFn ? field.optionsFn(instDetails) : field.options)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                                {renderInstallationMasonryGallery('Koeling', instDetails, inst.id)}
                              </div>
                            </div>
                          )}

                          {/* 3.5 Zonne-panelen Card */}
                          {activeCategories.includes('Zonne-panelen') && (
                            <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-3 md:p-4.5 shadow-2xs flex flex-col md:flex-row print:flex-row gap-5 print-card">
                              <div className="flex-grow md:w-[72%] print:w-[72%]">
                                <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                                  <span className="flex items-center gap-1.5"><Sun size={14} /> Zonne-panelen</span>
                                  <div className="flex items-center gap-1.5 no-print">
                                    <button type="button" onClick={() => { localStorage.setItem('installatie_active_id_current', inst.id); localStorage.setItem('installatie_selected_category', 'Zonne-panelen'); localStorage.setItem('installatie_view_state', 'detail'); setShowInstallatieModal(true); }} className="bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Bewerken"><Pencil size={13} /></button>
                                    <button type="button" onClick={() => { setCategoryToDelete({ instId: inst.id, cat: 'Zonne-panelen' }) }} className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs" title="Verwijderen"><Trash2 size={13} /></button>
                                  </div>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-3 mt-1">
                                  {InstallatiesSchema['Zonne-panelen'].filter(field => !field.showIf || field.showIf(instDetails)).map((field, index, arr) => (
                                    <div key={field.id} className={getDynamicGridClass(field.span, field.label, instDetails[field.id] || field.defaultValue || '', index, arr, instDetails)}>
                                      {renderInstCell(field.label, instDetails[field.id] || field.defaultValue, field.id, field.type, field.optionsFn ? field.optionsFn(instDetails) : field.options)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="w-full md:w-[28%] print:w-[28%] flex-shrink-0 flex flex-col gap-2.5 print:break-inside-avoid">
                                {renderInstallationMasonryGallery('Zonne-panelen', instDetails, inst.id)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-wrap items-center justify-start gap-4 no-print border-t border-neutral-200/60 pt-6 print:hidden px-4 md:px-0">
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
                                <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border-0 md:border md:border-outline-variant/10 overflow-hidden opacity-0 invisible group-hover/addmenu:opacity-100 group-hover/addmenu:visible group-focus-within/addmenu:opacity-100 group-focus-within/addmenu:visible transition-all z-[100]">
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
                  <div className="border-b border-neutral-250 pb-2 mb-2 flex flex-wrap justify-between items-center gap-2">
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
                              const displayVal = isWindowOrDoor ? (item.uWaarde || item.uGren || '') : (item.rc || '');
                              const cFlag = fieldFlags[`constructie_row_${item.id}`];
                              let cOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 border border-outline-variant/20';
                              if (cFlag === 'red') {
                                cOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 !border-2 !border-red-500 !bg-red-50/10 ring-4 ring-red-100';
                              } else if (cFlag === 'yellow') {
                                cOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 !border-2 !border-amber-500 !bg-amber-50/10 ring-4 ring-amber-100';
                              } else if (cFlag === 'green') {
                                cOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 !border-2 !border-green-500 !bg-green-50/10 ring-4 ring-green-100';
                              }

                              return (
                                <div
                                  key={item.id}
                                  id={`constructie-${item.id}`}
                                  data-field-id={`constructie-${item.id}`}
                                  data-field-key={item.id}
                                  className={`flex flex-col md:flex-row print:flex-row gap-6 w-full items-start ${cOuterWrapper}`}
                                >
                                  <div
                                    className={`rounded-2xl p-4 w-full md:w-[300px] print:w-[300px] shrink-0 shadow-none md:shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200 print-card break-inside-avoid border border-outline-variant/10 bg-white`}
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
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[8px] font-black text-neutral-900 tracking-wider leading-none select-none">{fieldRoles[`constructie_row_${item.id}`] || 'INS'}</span>
                                            {renderFlagCycleClicker(`constructie_row_${item.id}`)}
                                          </div>
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
                                                setConstructieToDelete(item.id);
                                              }}
                                              className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                              title="Verwijderen"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-4 text-xs font-bold w-full">
                                        {ConstructiesSchema.map((field, index, arr) => {
                                          if (field.showIf && !field.showIf(item)) return null;

                                          const currentValue = item[field.id as keyof typeof item] as string || field.defaultValue || '';
                                          const options = field.optionsFn ? field.optionsFn(item) : field.options || [];

                                          return (
                                            <div key={field.id} className={getDynamicGridClass(field.span, field.label, currentValue, index, arr, item)}>
                                              <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-1 font-sans">{field.label}</span>
                                              <div className="flex items-center min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                                {field.type === 'select' ? (
                                                  <AppSelect
                                                    variant="compact"
                                                    value={currentValue}
                                                    options={options.map(opt => ({ label: opt, value: opt }))}
                                                    onChange={(val) => handleRealConstructieChange(item.id, field.id, val)}
                                                  />
                                                ) : (
                                                  <input placeholder="-"
                                                    className={`w-full bg-transparent border-none text-xs font-bold text-on-background focus:outline-none outline-none font-sans ${field.readonly ? 'text-neutral-400' : ''}`}
                                                    value={currentValue}
                                                    readOnly={field.readonly}
                                                    onChange={(e) => {
                                                      if (!field.readonly) {
                                                        handleRealConstructieChange(item.id, field.id, e.target.value);
                                                      }
                                                    }}
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="mt-2">
                                      <hr className="border-outline-variant/10 my-2" />
                                      <div className={`grid ${showGValue ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                        <div>
                                          <span className="text-[9px] text-on-surface-variant/40 font-black tracking-wider uppercase block mb-0.5 font-sans">{valueLabel}</span>
                                          <div className="flex items-baseline gap-1">
                                            <input placeholder="-"
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
                                              <input placeholder="-"
                                                className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-base font-black text-on-background font-sans leading-none py-0.5"
                                                value={item.g || ''}
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
                                                makeInstActive={() => { }}
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
                setFieldFlagGreen(`bouwkundig_${originalIdx}`);
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
                type: 'text' | 'select' | 'readonly' | 'date' = 'text',
                options?: string[]
              ) => {
                const isDash = !value || value === '-' || value.trim() === '';
                const displayVal = isDash ? '' : value;

                return (
                  <div className="w-full flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                      <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">{label}</label>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                      {type === 'readonly' ? (
                        <div className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 leading-tight truncate">{isDash ? "-" : displayVal}</div>
                      ) : type === 'select' && options ? (
                        <>
                          <AppSelect
                            variant="compact"
                            value={value || ''}
                            options={options.map(opt => ({ label: opt, value: opt }))}
                            onChange={(val) => handleBouwkundigRowChange(originalIdx, field, val)}
                          />
                          <div className="hidden print:block w-full text-xs font-bold text-on-background leading-tight break-words whitespace-normal py-1">
                            {value || '-'}
                          </div>
                        </>
                      ) : (
                        <>
                          <input placeholder="-"
                            type="text"
                            value={displayVal}
                            onChange={(e) => handleBouwkundigRowChange(originalIdx, field, e.target.value)}
                            className={`w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none print:hidden ${isDash ? 'text-on-surface-variant/30 font-semibold' : ''}`}
                          />
                          <div className={`hidden print:block w-full text-xs font-bold leading-tight break-words whitespace-normal py-1 ${isDash ? 'text-on-surface-variant/30 font-semibold' : 'text-on-background'}`}>
                            {isDash ? "-" : displayVal}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className={`space-y-8 ${isPrinting ? 'print-section' : ''}`}>
                  <div className="border-b border-neutral-250 pb-2 mb-2 flex flex-wrap justify-between items-center gap-2">
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
                                setFieldFlagGreen(`library_${kId}`);
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
                              let bOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 border border-outline-variant/20';
                              if (bFlag === 'red') {
                                bOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 !border-2 !border-red-500 !bg-red-50/10 ring-4 ring-red-100';
                              } else if (bFlag === 'yellow') {
                                bOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 !border-2 !border-amber-500 !bg-amber-50/10 ring-4 ring-amber-100';
                              } else if (bFlag === 'green') {
                                bOuterWrapper = 'rounded-[24px] p-2 md:p-4 -mx-2 md:-mx-4 transition-all duration-200 !border-2 !border-green-500 !bg-green-50/10 ring-4 ring-green-100';
                              }

                              return (
                                <div
                                  key={item.id || item.naam || index}
                                  id={`bouwkundig-${originalIdx}`}
                                  data-field-id={`geometry-bouwkundig_${originalIdx}`}
                                  data-field-key={`bouwkundig_${originalIdx}`}
                                  className="flex flex-col gap-4 mb-8"
                                >
                                  <div className={`flex flex-col md:flex-row print:flex-row gap-6 w-full items-start ${bOuterWrapper}`}>
                                    <div className={`rounded-2xl p-4 w-full md:w-[300px] print:w-[300px] shrink-0 shadow-none md:shadow-2xs flex flex-col border border-outline-variant/10 bg-white`}>
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
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[8px] font-black text-neutral-900 tracking-wider leading-none select-none">{fieldRoles[`bouwkundig_${originalIdx}`] || 'INS'}</span>
                                            {renderFlagCycleClicker(`bouwkundig_${originalIdx}`)}
                                          </div>
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
                                                setBouwkundigToDelete(originalIdx);
                                              }}
                                              className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-full p-1.5 transition cursor-pointer flex items-center justify-center print:hidden shadow-xs"
                                              title="Verwijderen"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-4 text-xs font-bold flex-1">
                                        <div className="col-span-2 w-full flex flex-col">
                                          <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                                            <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">Constructie</label>
                                          </div>
                                          <div className="flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                            <AppSelect
                                              variant="compact"
                                              value={item.constructieId || ''}
                                              onChange={(val) => handleBouwkundigRowChange(originalIdx, 'constructieId', val)}
                                              options={[{label: '- Selecteer Constructie -', value: ''}, ...(data.constructies || []).filter(c => c.type === item.type).map(c => ({ label: c.naam || c.id, value: c.id }))]}
                                            />
                                          </div>
                                        </div>

                                        {BouwkundigSchema.map((field, index, arr) => {
                                          if (field.showIf && !field.showIf(item)) return null;

                                          let currentValue = item[field.id as keyof typeof item] as string || field.defaultValue || '';
                                          if (field.id === 'rc') {
                                            const linkedC = (data.constructies || []).find((c: any) => c.id === item.constructieId);
                                            currentValue = item.rc || linkedC?.rc || '-';
                                          }
                                          const options = field.optionsFn ? field.optionsFn(item) : field.options || [];

                                          return (
                                            <div key={field.id} className={getDynamicGridClass(field.span, field.label, currentValue, index, arr, item)}>
                                              {renderBouwkundigCell(
                                                field.label,
                                                currentValue,
                                                field.id,
                                                originalIdx,
                                                field.readonly ? 'readonly' : field.type,
                                                options
                                              )}
                                            </div>
                                          );
                                        })}

                                        {item.type !== 'Vloer' && (
                                          <div className="col-span-2 mt-1">
                                            <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans mb-1.5">Kozijn Koppelingen (Frame & Glass)</label>
                                            <div className="border-0 md:border md:border-outline-variant/10 rounded-xl p-2 bg-gray-50 max-h-32 overflow-y-auto space-y-1">
                                              {(!data.kozijnen || data.kozijnen.length === 0) ? (
                                                <span className="text-[9px] text-on-surface-variant/40 italic block text-center py-1">Geen kozijnen beschikbaar.</span>
                                              ) : (
                                                data.kozijnen.map((k: any) => {
                                                  const linkedTo = k.gevel ? k.gevel.split(',').map((s: string) => s.trim().toLowerCase()) : [];
                                                  const targets = [item.naam, item.gevel, item.id].filter(Boolean).map((s: string) => s.toString().trim().toLowerCase());
                                                  const isLinked = Boolean(targets.some(t => linkedTo.includes(t)));
                                                  return (
                                                    <label key={k.id} className="flex items-start gap-2 text-xs font-bold text-on-surface-variant/80 cursor-pointer p-1 rounded hover:bg-white transition-colors">
                                                      <input placeholder="-"
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
                                                  makeInstActive={() => { }}
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
                                        <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-4">
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
                                              type: 'text' | 'select' | 'readonly' | 'date' = 'text',
                                              options?: string[]
                                            ) => {
                                              const isDash = !value || value === '-' || value.trim() === '';
                                              const displayVal = isDash ? '' : value;

                                              return (
                                                <div className="w-full flex flex-col">
                                                  <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                                                    <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">{label}</label>
                                                  </div>
                                                  <div className="flex items-center justify-between gap-1.5 min-h-[34px] px-3 py-1 rounded-xl bg-gray-50 border border-outline-variant/15 hover:bg-gray-100/80 transition duration-150">
                                                    {type === 'readonly' ? (
                                                      <div className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 leading-tight break-words" title={isDash ? "-" : displayVal}>{isDash ? "-" : displayVal}</div>
                                                    ) : type === 'select' && options ? (
                                                      <>
                                                        <AppSelect
                                                          variant="compact"
                                                          value={value || ''}
                                                          options={options.map(opt => ({ label: opt, value: opt }))}
                                                          onChange={(val) => handleKozijnChange(k.id, field, val)}
                                                        />
                                                        <div className="hidden print:block w-full text-xs font-bold text-on-background leading-tight break-words whitespace-normal py-1">
                                                          {value || '-'}
                                                        </div>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <input placeholder="-"
                                                          type="text"
                                                          value={displayVal}
                                                          onChange={(e) => handleKozijnChange(k.id, field, e.target.value)}
                                                          className={`w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none print:hidden ${isDash ? 'text-on-surface-variant/30 font-semibold' : ''}`}
                                                        />
                                                        <div className={`hidden print:block w-full text-xs font-bold leading-tight break-words whitespace-normal py-1 ${isDash ? 'text-on-surface-variant/30 font-semibold' : 'text-on-background'}`}>
                                                          {isDash ? "-" : displayVal}
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
                                              <div
                                                key={k.id}
                                                id={`kozijn-${k.id}`}
                                                data-field-id={`kozijn-${k.id}`}
                                                data-field-key={`library_${k.id}`}
                                                className={`rounded-2xl p-4 shadow-none md:shadow-2xs flex justify-between gap-4 relative group break-inside-avoid ${kBorderStyle}`}
                                              >
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
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="text-[8px] font-black text-neutral-900 tracking-wider leading-none select-none">{fieldRoles[`library_${k.id}`] || 'INS'}</span>
                                                        {renderFlagCycleClicker(`library_${k.id}`)}
                                                      </div>
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

                                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-4 text-xs font-bold flex-1">
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
                                                        <AppSelect
                                                          variant="compact"
                                                          value={k.constructieId || ''}
                                                          onChange={(val) => handleKozijnChange(k.id, 'constructieId', val)}
                                                          options={[{label: '- Selecteer Constructie -', value: ''}, ...(data.constructies || []).filter(c => ['Raam', 'Deur', 'Paneel'].includes(c.type)).map(c => ({ label: c.naam || c.id, value: c.id }))]}
                                                        />
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
                                                        className={`group relative rounded-2xl overflow-hidden flex items-center justify-center text-center transition w-full h-full min-h-[140px] print:min-h-[140px] print:h-full cursor-pointer ${hasKPhoto ? 'border border-outline-variant/15 bg-neutral-50 shadow-none md:shadow-2xs hover:shadow-xs hover:border-primary/50 print:border print:bg-neutral-50' : 'border border-dashed border-outline-variant/30 bg-transparent hover:bg-neutral-50/50 print:hidden'}`}
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
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-0 md:border md:border-outline-variant/10 animate-in fade-in zoom-in-95 duration-150">
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
                        <div className="w-16 h-16 rounded-2xl bg-white border-0 md:border md:border-outline-variant/10 flex items-center justify-center shadow-xs mb-3">
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
        onSave={handleSaveConstructieRow}
        initialRow={editingConstructieRow}
        existingConstructies={data.constructies || []}
        data={data}
        onChangeData={onChange}
        flagKey={editingConstructieRow ? `constructie_row_${editingConstructieRow.id}` : undefined}
        onFlagChange={setFieldFlag}
        onFieldEdit={setFieldFlagGreen}
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
        onFieldEdit={setFieldFlagGreen}
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
        onFieldEdit={setFieldFlagGreen}
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
      <ConfirmModal
        isOpen={constructieToDelete !== null}
        onClose={() => setConstructieToDelete(null)}
        onConfirm={() => {
          if (constructieToDelete !== null) {
            const allConstructies = data.constructies || [];
            const updated = allConstructies.filter((c: any) => c.id !== constructieToDelete);
            onChange('constructies', updated as any);
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
            const current = data.bouwkundigRows || defaultBouwkundigRows;
            const updated = current.filter((_: any, idx: number) => idx !== bouwkundigToDelete);
            onChange('bouwkundigRows', updated as any);
          }
          setBouwkundigToDelete(null);
        }}
        title="Weet je het zeker?"
        message="Weet je zeker dat je dit bouwkundig element wilt verwijderen?"
      />
      {showInstallatieModal && createPortal(
        <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/40 font-sans" onClick={() => setShowInstallatieModal(false)}>
          <div
            className="bg-white shadow-2xl overflow-y-auto rounded-2xl w-[95%] md:w-[70%] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-sans font-black text-lg tracking-tight text-on-background">Installatie Bewerken</h2>
              <button
                onClick={() => setShowInstallatieModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <InstallatieView
                data={data}
                onChange={onChange}
                isModal={true}
                onFieldEdit={setFieldFlagGreen}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default InvoersheetView;
export { InvoersheetView };






