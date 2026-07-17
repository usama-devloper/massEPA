import React, { useState, useRef, useEffect } from 'react';
import { InspectionData } from './backofficeTypes';
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
  Ruler
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface InvoersheetViewProps {
  data: InspectionData;
  onChange: (path: string, value: string) => void;
  onViewChange?: (view: any) => void;
}

const InvoersheetView: React.FC<InvoersheetViewProps> = ({ data, onChange, onViewChange }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'p3' | 'p4'>('p1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadKeyRef = useRef<string | null>(null);

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

  const [constructies, setConstructies] = useState<any[]>([
    { id: '1', category: 'Deur', subtitle: 'Beslisschema', type: '-', code: '-', isolatie: 'Ja', valueLabel: 'U-waarde', value: '2.00', gValue: '-' },
    { id: '2', category: 'Raam', subtitle: 'Kwaliteitsverklaring', type: 'K-Vision HR++', kozijn: 'Kunststof', glas: 'HR++', code: '2022156GK', valueLabel: 'U-waarde', value: '1.10', gValue: '0.46' },
    { id: '3', category: 'Raam', subtitle: 'Kwaliteitsverklaring', type: 'Velux GGL FK06', kozijn: 'Kunststof', glas: 'HR++', code: '2023163GK', valueLabel: 'U-waarde', value: '1.30', gValue: '0.46' },
    { id: '4', category: 'Gevel', subtitle: 'Kwaliteitsverklaring', type: 'H2Foam Lite', dikte: '60 mm', code: '20210007GK', valueLabel: 'Rc-value', value: '1.56', gValue: '-' },
    { id: '5', category: 'Vloer', subtitle: 'Beslisschema', type: '-', dikte: '90', code: '-', valueLabel: 'Rc-value', value: '2.15', gValue: '-' },
    { id: '6', category: 'Platdak', subtitle: 'Beslisschema', type: 'PUR/PIR', dikte: '100', code: '-', valueLabel: 'Rc-value', value: '2.44', gValue: '-' },
    { id: '7', category: 'Hellenddak', subtitle: 'Kwaliteitsverklaring', type: 'Unidek Reno dekfolie', dikte: '189', code: '20210140GK', valueLabel: 'Rc-value', value: '6.32', gValue: '-' },
  ]);

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
    if (fieldKey.startsWith('installations.') || fieldKey.startsWith('installations_')) {
      let subKey = fieldKey;
      if (fieldKey.startsWith('installations.')) {
        subKey = fieldKey.substring('installations.'.length);
      } else if (fieldKey.startsWith('installations_')) {
        subKey = fieldKey.substring('installations_'.length);
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
      
      return {
        storageKey: `installatie_flags_${clientId}`,
        subKey
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
      const cardIndex = parseInt(parts[1], 10);
      const rowId = constructies[cardIndex]?.id || String(cardIndex + 1);
      return {
        storageKey: `constructie_flags_${clientId}`,
        subKey: rowId
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
      } catch {}

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
      } catch {}

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
            const fieldKeySuffix = reverseMap[k] || k;
            compiledFlags[`installations.${fieldKeySuffix}`] = parsed[k];
            compiledFlags[`installations_${fieldKeySuffix}`] = parsed[k];
          });
        }
      } catch {}

      // 4. Load constructie flags
      try {
        const saved = localStorage.getItem(`constructie_flags_${clientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach(rowId => {
            compiledFlags[`constructie_row_${rowId}`] = parsed[rowId];
            const idx = constructies.findIndex(c => c.id === rowId);
            if (idx !== -1) {
              compiledFlags[`constructie_${idx}_subtitle`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_type`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_value`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_gValue`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_dikte`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_code`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_kozijn`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_glas`] = parsed[rowId];
              compiledFlags[`constructie_${idx}_isolatie`] = parsed[rowId];
            }
          });
        }
      } catch {}

      setFieldFlags(compiledFlags);
    };

    loadFlags();

    window.addEventListener('storage', loadFlags);
    window.addEventListener('focus', loadFlags);
    return () => {
      window.removeEventListener('storage', loadFlags);
      window.removeEventListener('focus', loadFlags);
    };
  }, [data.clientId, constructies]);

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
        localStorage.setItem(storageKey, JSON.stringify(storedObj));
      } catch (e) {
        console.error('Failed to save flag to localstorage', e);
      }

      const updated = { ...prev };
      
      if (storageKey.startsWith('constructie_flags_')) {
        updated[`constructie_row_${subKey}`] = next;
        const idx = constructies.findIndex(c => c.id === subKey);
        if (idx !== -1) {
          updated[`constructie_${idx}_subtitle`] = next;
          updated[`constructie_${idx}_type`] = next;
          updated[`constructie_${idx}_value`] = next;
          updated[`constructie_${idx}_gValue`] = next;
          updated[`constructie_${idx}_dikte`] = next;
          updated[`constructie_${idx}_code`] = next;
          updated[`constructie_${idx}_kozijn`] = next;
          updated[`constructie_${idx}_glas`] = next;
          updated[`constructie_${idx}_isolatie`] = next;
        }
      } else {
        updated[fieldKey] = next;
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

  useEffect(() => {
    if (!data.constructies || data.constructies.length === 0) return;
    
    setConstructies(prev => {
      const nextConstructies = [...prev];
      const usedIds = new Set<string>();

      const deur = data.constructies.find(c => c.type === 'Deur');
      if (deur) {
        usedIds.add(deur.id);
        nextConstructies[0] = {
          ...nextConstructies[0],
          id: deur.id,
          subtitle: deur.invoer || nextConstructies[0].subtitle,
          type: deur.merk || deur.naam || nextConstructies[0].type,
          code: deur.code || nextConstructies[0].code,
          isolatie: deur.isolatie || nextConstructies[0].isolatie,
          value: deur.uGren || deur.uNiet || nextConstructies[0].value,
          gValue: deur.g || nextConstructies[0].gValue
        };
      }

      const raam1 = data.constructies.find(c => c.type === 'Raam');
      if (raam1) {
        usedIds.add(raam1.id);
        nextConstructies[1] = {
          ...nextConstructies[1],
          id: raam1.id,
          subtitle: raam1.invoer || nextConstructies[1].subtitle,
          type: raam1.merk || raam1.naam || nextConstructies[1].type,
          kozijn: raam1.kozijn || (nextConstructies[1] as any).kozijn,
          glas: raam1.glas || (nextConstructies[1] as any).glas,
          code: raam1.code || nextConstructies[1].code,
          value: raam1.uGren || raam1.uNiet || nextConstructies[1].value,
          gValue: raam1.g || nextConstructies[1].gValue
        };
      }

      const raam2 = data.constructies.find(c => c.type === 'Raam' && !usedIds.has(c.id));
      if (raam2) {
        usedIds.add(raam2.id);
        nextConstructies[2] = {
          ...nextConstructies[2],
          id: raam2.id,
          subtitle: raam2.invoer || nextConstructies[2].subtitle,
          type: raam2.merk || raam2.naam || nextConstructies[2].type,
          kozijn: raam2.kozijn || (nextConstructies[2] as any).kozijn,
          glas: raam2.glas || (nextConstructies[2] as any).glas,
          code: raam2.code || nextConstructies[2].code,
          value: raam2.uGren || raam2.uNiet || nextConstructies[2].value,
          gValue: raam2.g || nextConstructies[2].gValue
        };
      }

      const gevel = data.constructies.find(c => c.type === 'Gevel');
      if (gevel) {
        usedIds.add(gevel.id);
        nextConstructies[3] = {
          ...nextConstructies[3],
          id: gevel.id,
          subtitle: gevel.invoer || nextConstructies[3].subtitle,
          type: gevel.merk || gevel.naam || nextConstructies[3].type,
          dikte: gevel.dikte || (nextConstructies[3] as any).dikte,
          code: gevel.code || nextConstructies[3].code,
          value: gevel.rc || nextConstructies[3].value
        };
      }

      const vloer = data.constructies.find(c => c.type === 'Vloer');
      if (vloer) {
        usedIds.add(vloer.id);
        nextConstructies[4] = {
          ...nextConstructies[4],
          id: vloer.id,
          subtitle: vloer.invoer || nextConstructies[4].subtitle,
          type: vloer.merk || vloer.naam || nextConstructies[4].type,
          dikte: vloer.dikte || (nextConstructies[4] as any).dikte,
          code: vloer.code || nextConstructies[4].code,
          value: vloer.rc || nextConstructies[4].value
        };
      }

      const platdak = data.constructies.find(c => c.type === 'Dak' && c.dakType === 'Plat dak');
      if (platdak) {
        usedIds.add(platdak.id);
        nextConstructies[5] = {
          ...nextConstructies[5],
          id: platdak.id,
          subtitle: platdak.invoer || nextConstructies[5].subtitle,
          type: platdak.merk || platdak.naam || nextConstructies[5].type,
          dikte: platdak.dikte || (nextConstructies[5] as any).dikte,
          code: platdak.code || nextConstructies[5].code,
          value: platdak.rc || nextConstructies[5].value
        };
      }

      const hellenddak = data.constructies.find(c => c.type === 'Dak' && c.dakType !== 'Plat dak');
      if (hellenddak) {
        usedIds.add(hellenddak.id);
        nextConstructies[6] = {
          ...nextConstructies[6],
          id: hellenddak.id,
          subtitle: hellenddak.invoer || nextConstructies[6].subtitle,
          type: hellenddak.merk || hellenddak.naam || nextConstructies[6].type,
          dikte: hellenddak.dikte || (nextConstructies[6] as any).dikte,
          code: hellenddak.code || nextConstructies[6].code,
          value: hellenddak.rc || nextConstructies[6].value
        };
      }

      return nextConstructies;
    });
  }, [data.constructies]);

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
    kozijnenAchterdak: [
      { id: 'S1_1', area: '0.78', constructie: 'Velux GGL FX', zonwering: 'Geen', hb: '', bb: '', ho: '', belemmering: 'Geen', imgKey: null },
      { id: 'S1_2', area: '0.78', constructie: 'Velux GGL FX', zonwering: 'Geen', hb: '', bb: '', ho: '', belemmering: 'Geen', imgKey: null },
    ],
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
      localStorage.setItem(`invoersheet_images_${currentAddress}`, JSON.stringify(images));
    } catch (e) {
      console.error('Failed to save invoersheet images to localStorage:', e);
    }
  }, [images, currentAddress]);

  const triggerPhotoUpload = (key: string) => {
    activeUploadKeyRef.current = key;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const keyToCategoryMap: Record<string, string> = {
    vent: 'Ventilatie',
    vent_extra: 'Ventilatie',
    ketel: 'Verwarming',
    ketel_extra: 'Verwarming',
    tapwater: 'Tapwater',
    koeling: 'Koeling',
    solar: 'Zonne-panelen'
  };

  const getCategoryPhotoUrl = (category: string, index: number = 0): string | undefined => {
    const key = `files_${category.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const files: any[] = (data.installations as any)?.[key] || [];
    const imageFiles = files.filter(f => f.type?.startsWith('image/'));
    return imageFiles[index]?.dataUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = activeUploadKeyRef.current;
    if (file && key) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImages(prev => ({
          ...prev,
          [key]: dataUrl
        }));

        const category = keyToCategoryMap[key];
        if (category) {
          const filesKey = `files_${category.replace(/[^a-zA-Z0-9_]/g, '')}`;
          const existingFiles = [...((data.installations as any)?.[filesKey] || [])];
          const index = key.endsWith('_extra') ? 1 : 0;
          const newFileObj = {
            name: file.name || 'unnamed_image.jpg',
            type: file.type || 'image/jpeg',
            size: `${Math.round(dataUrl.length / 1024)} KB`,
            dataUrl
          };

          if (existingFiles.length > index) {
            existingFiles[index] = newFileObj;
          } else {
            while (existingFiles.length < index) {
              existingFiles.push({ name: 'placeholder', type: 'image/jpeg', dataUrl: '' });
            }
            existingFiles.push(newFileObj);
          }
          onChange(`installations.${filesKey}`, existingFiles as any);
        }
      };
      reader.readAsDataURL(file);
    }
    activeUploadKeyRef.current = null;
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

  const handleConstructieRowChange = (index: number, key: string, val: string) => {
    setConstructies(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });

    const editedLocalRow = { ...constructies[index], [key]: val };
    const targetId = editedLocalRow.id;

    const existingIndex = data.constructies ? data.constructies.findIndex(item => item.id === targetId) : -1;
    let updatedGlobalConstructies = data.constructies ? [...data.constructies] : [];

    if (existingIndex !== -1) {
      const item = updatedGlobalConstructies[existingIndex];
      const updatedItem = { ...item };
      
      if (key === 'subtitle') updatedItem.invoer = val;
      else if (key === 'type') updatedItem.merk = val;
      else if (key === 'code') updatedItem.code = val;
      else if (key === 'isolatie') updatedItem.isolatie = val;
      else if (key === 'dikte') updatedItem.dikte = val;
      else if (key === 'kozijn') updatedItem.kozijn = val;
      else if (key === 'glas') updatedItem.glas = val;
      else if (key === 'value') {
        if (item.type === 'Raam' || item.type === 'Deur' || item.type === 'Paneel') {
          updatedItem.uGren = val;
        } else {
          updatedItem.rc = val;
        }
      }
      else if (key === 'gValue') updatedItem.g = val;

      updatedGlobalConstructies[existingIndex] = updatedItem;
    } else {
      let type: 'Deur' | 'Raam' | 'Gevel' | 'Vloer' | 'Dak' = 'Deur';
      let dakType: string | undefined = undefined;
      
      if (index === 0) type = 'Deur';
      else if (index === 1 || index === 2) type = 'Raam';
      else if (index === 3) type = 'Gevel';
      else if (index === 4) type = 'Vloer';
      else if (index === 5) {
        type = 'Dak';
        dakType = 'Plat dak';
      }
      else if (index === 6) {
        type = 'Dak';
        dakType = 'Hellend dak';
      }

      const newId = `c-invoer-${Date.now()}`;
      const newGlobalItem: any = {
        id: newId,
        type,
        naam: `${type} ${editedLocalRow.type || ''}`,
        invoer: key === 'subtitle' ? val : editedLocalRow.subtitle,
        merk: key === 'type' ? val : editedLocalRow.type,
        code: key === 'code' ? val : editedLocalRow.code,
        isolatie: key === 'isolatie' ? val : editedLocalRow.isolatie,
        dikte: key === 'dikte' ? val : (editedLocalRow as any).dikte,
        kozijn: key === 'kozijn' ? val : (editedLocalRow as any).kozijn,
        glas: key === 'glas' ? val : (editedLocalRow as any).glas,
        dakType
      };

      if (type === 'Raam' || type === 'Deur') {
        newGlobalItem.uGren = key === 'value' ? val : editedLocalRow.value;
        newGlobalItem.g = key === 'gValue' ? val : editedLocalRow.gValue;
      } else {
        newGlobalItem.rc = key === 'value' ? val : editedLocalRow.value;
      }

      setConstructies(prev => {
        const copy = [...prev];
        copy[index].id = newId;
        return copy;
      });

      updatedGlobalConstructies.push(newGlobalItem);
    }

    onChange('constructies', updatedGlobalConstructies as any);
  };

  const renderInstallationPhotoSlot = (key: string, label: string, categoryName: string, index: number = 0) => {
    const activeUrl = getCategoryPhotoUrl(categoryName, index) || images[key];
    return (
      <div 
        onClick={() => triggerPhotoUpload(key)}
        className="group relative border border-[#e2e8f0] rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center text-center cursor-pointer hover:bg-neutral-100 hover:border-primary/50 transition aspect-square w-full shadow-xs"
      >
        {activeUrl && activeUrl !== '-' && activeUrl !== '' ? (
          <>
            <img src={activeUrl} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity no-print z-10">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(key, e);
                }}
                className="bg-red-500 hover:bg-red-65 text-white rounded-lg p-1 shadow-sm transition cursor-pointer"
                title="Verwijder foto"
              >
                <Trash2 size={11} />
              </button>
            </div>
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-on-surface-variant/30 gap-1.5 p-2">
            <ImageIcon size={20} className="stroke-[1.5]" />
            <span className="text-[8px] font-black uppercase tracking-wider block text-on-surface-variant/40 leading-none">{label}</span>
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
    type: 'text' | 'select' = 'text',
    options?: string[],
    hasCalendarIcon: boolean = false
  ) => {
    const isDash = !value || value === '-' || value.trim() === '';
    const displayVal = isDash ? '-' : value;
    const isDate = label.toLowerCase().includes('datum') || hasCalendarIcon;

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-[9px] font-black text-on-surface-variant/40 tracking-wider block uppercase font-sans">{label}</label>
          {renderFlagCycleClicker(pathOrLocalKey)}
        </div>
        <div className="flex items-center justify-between gap-1.5 min-h-[28px] px-2.5 py-1 rounded-xl bg-gray-50 border border-outline-variant/10 hover:bg-gray-100 transition duration-150">
          {type === 'select' && options ? (
            <select
              value={value || ''}
              onChange={(e) => {
                if (isLocal) {
                  handleInstallationChange(pathOrLocalKey as keyof typeof installations, e.target.value);
                } else {
                  onChange(pathOrLocalKey, e.target.value);
                }
              }}
              className="w-full text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none cursor-pointer"
            >
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={displayVal}
              onChange={(e) => {
                const val = e.target.value;
                if (isLocal) {
                  handleInstallationChange(pathOrLocalKey as keyof typeof installations, val);
                } else {
                  onChange(pathOrLocalKey, val);
                }
              }}
              style={isDate ? { width: `${Math.max(displayVal.length * 7.5, 90)}px` } : undefined}
              className={`${
                isDate ? 'w-auto' : 'w-full'
              } text-xs font-bold text-on-background bg-transparent border-none p-0 focus:outline-none focus:ring-0 leading-tight outline-none ${
                isDash ? 'text-on-surface-variant/30 font-semibold' : ''
              }`}
            />
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

      <div className="no-print bg-white border-b border-[#e1e3e4] px-6 py-4 flex flex-wrap items-center justify-center gap-4 shrink-0 shadow-xs">
        <div className="flex bg-neutral-100 p-1 rounded-xl gap-0.5 text-[11px] font-black border border-neutral-250 uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('p1')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p1' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            1. Identificatie & Algemeen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('p2')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p2' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            2. Installaties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('p3')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p3' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            3. Constructies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('p4')}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'p4' ? 'bg-primary text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            4. Bouwkundig
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center w-full">
        <div 
          className="transition-transform duration-100 w-full max-w-[850px] min-h-[1100px] h-fit bg-white text-black p-10 relative border border-[#e1e3e4] shadow-md my-4 flex flex-col justify-between print-page rounded-2xl"
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

            {activeTab === 'p1' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="border-b border-neutral-250 pb-1 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider">1. Identificatie</h2>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">Bewoner</h3>
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        {renderFormCell('Name', data.algemeen?.bewoner?.persoon || 'Mevrouw S. van Wessum', 'algemeen.bewoner.persoon')}
                        {renderFormCell('Contact', data.algemeen?.bewoner?.telefoon || '+621354340', 'algemeen.bewoner.telefoon')}
                        {renderFormCell('Email', data.algemeen?.bewoner?.email || 'ssjonker@gmail.com', 'algemeen.bewoner.email')}
                        {renderFormCell('Adress', data.algemeen?.bewoner?.adres || '-', 'algemeen.bewoner.adres')}
                        {renderFormCell('Postcode', data.algemeen?.bewoner?.postcode || '-', 'algemeen.bewoner.postcode')}
                        {renderFormCell('Plaats', data.algemeen?.bewoner?.plaats || '-', 'algemeen.bewoner.plaats')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">Adviseur</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        {renderFormCell('Adviseur Name', data.algemeen?.inspector?.adviseur || 'Mevrouw S. van Wessum', 'algemeen.inspector.adviseur')}
                        {renderFormCell('Certificaathouder', data.algemeen?.inspector?.certificaathouder || '5923.3337.5020', 'algemeen.inspector.certificaathouder')}
                        {renderFormCell('Gebruikersnaam', data.algemeen?.inspector?.gebruiker || '-', 'algemeen.inspector.gebruiker')}
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

                  <div className="pt-1">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">BID Intern</h3>
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
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
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider">2. Algemeen</h2>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">2.1 General details</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                        {renderFormCell('SVB-Status', data.algemeen?.woning?.svbStatus || 'Concept', 'algemeen.woning.svbStatus', false, 'select', ['Definitief', 'Concept'])}
                        
                        {renderFormCell('Bron', data.algemeen?.woning?.bron || 'BAG', 'algemeen.woning.bron', false, 'select', ['BAG', 'Bouwtekening', 'Eigen opname'])}
                        <div />
                        <div />
                        <div />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <h3 className="text-xs font-black text-primary mb-1.5 uppercase tracking-wide">2.2 Technical details</h3>
                    <div className="border-t border-r border-b border-l-4 border-l-primary border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {renderFormCell('Gebouwtype', data.algemeen?.woning?.gebouwtype || 'Woonhuis', 'algemeen.woning.gebouwtype', false, 'select', ['Woonhuis', 'Woongebouw', 'Woonwagen'])}
                        {renderFormCell('Subtype', data.algemeen?.woning?.subtype || 'Tussenwoning', 'algemeen.woning.subtype', false, 'select', ['Tussenwoning', 'Hoekwoning', 'Eindwoning', 'Twee-onder-één-kap', 'Vrijstaande woning'])}
                        {renderFormCell('Daktype', data.algemeen?.woning?.daktype || 'Zadeldak', 'algemeen.woning.daktype', false, 'select', ['Zadeldak', 'Plat dak', 'Lessenaarsdak', 'Schilddak', 'Mansardedak'])}
                        {renderFormCell('Ligging', data.algemeen?.woning?.ligging || 'Beschut', 'algemeen.woning.ligging', false, 'select', ['Beschut', 'Niet beschut'])}

                        {renderFormCell('Gebouwhoogte', data.algemeen?.woning?.gebouwhoogte || '-', 'algemeen.woning.gebouwhoogte')}
                        {renderFormCell('Vloer constructietype', data.algemeen?.woning?.floorConstructieType || 'Licht', 'algemeen.woning.floorConstructieType', false, 'select', ['Licht', 'Middel', 'Zwaar'])}
                        {renderFormCell('Wand constructietype', data.algemeen?.woning?.wallConstructieType || 'Licht', 'algemeen.woning.wallConstructieType', false, 'select', ['Licht', 'Middel', 'Zwaar'])}
                        {renderFormCell('Leidingdoorvoeren', data.algemeen?.technical?.leidingdoorvoeren || 'Onbekend', 'algemeen.technical.leidingdoorvoeren', false, 'select', ['Onbekend', 'Ja', 'Nee'])}

                        {renderFormCell('Aantal AVR', data.algemeen?.technical?.avr || '-', 'algemeen.technical.avr')}
                        {renderFormCell('Aantal', data.algemeen?.technical?.aantal || '-', 'algemeen.technical.aantal')}
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

            {activeTab === 'p2' && (() => {
              const ventSysteemVal = data.installations?.ventVentilatiesysteem || '';
              const ventSysteemType = ventSysteemVal.includes('Type D') ? 'D' :
                                      ventSysteemVal.includes('Type C') ? 'C' :
                                      ventSysteemVal.includes('Type A') ? 'A' :
                                      ventSysteemVal.includes('Type B') ? 'B' :
                                      ventSysteemVal.includes('Type E') ? 'E' : '';

              const ventFansVal = data.installations?.ventVentilatoren || 'Nominaal vermogen';
              
              const verwarmSystemType = data.installations?.verwarmTypeToestel || 'Individueel';
              const isVerwarmExternal = verwarmSystemType.includes('derden') || verwarmSystemType.includes('afleverset');
              const verwarmDistMedium = data.installations?.verwarmDistributiemedium || 'Water';

              const tapSystemType = data.installations?.tapTypeInstallatie || 'Individueel';
              const isTapExternal = tapSystemType.includes('derden') || tapSystemType.includes('afleverset');

              return (
                <div className="space-y-6">
                  <div className="border-b border-neutral-250 pb-2.5 flex justify-between items-center">
                    <h2 className="text-sm font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span>3. Installaties</span>
                    </h2>
                    {onViewChange && (
                      <button 
                        type="button"
                        onClick={() => onViewChange('installatie')}
                        className="text-[10px] font-black text-primary hover:text-primary-dark flex items-center gap-1.5 cursor-pointer bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all"
                      >
                        <Wind size={11} />
                        <span>Naar Installatiepagina</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* 3.1 Ventilatie Card */}
                    <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row gap-5">
                      <div className="flex-grow md:w-[72%]">
                        <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                          <span className="flex items-center gap-1.5"><Wind size={14} /> 3.1 Ventilatie</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                          <div>{renderFormCell('SYSTEM', data.installations?.ventTypeToestel || 'Individueel', 'installations.ventTypeToestel', false, 'select', ['Individueel', 'Gemeenschappelijk/collectief'])}</div>
                          <div>{renderFormCell('NUMBER OF IDENTICAL SYSTEMS', data.installations?.ventIdentiekeSystemen || '1', 'installations.ventIdentiekeSystemen', false, 'text')}</div>
                          <div>{renderFormCell('BRAND & TYPE', data.installations?.ventMerkType || '', 'installations.ventMerkType', false, 'text')}</div>
                          <div>{renderFormCell('VENTILATION SYSTEM', data.installations?.ventVentilatiesysteem || '', 'installations.ventVentilatiesysteem', false, 'select', ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'])}</div>
                          <div>{renderFormCell('INSTALLATION YEAR', data.installations?.ventSpecsBcrg || '', 'installations.ventSpecsBcrg', false, 'text')}</div>
                          <div>{renderFormCell('AIR TIGHTNESS', data.installations?.ventLuchtdichtheid || 'LUKA A,B of C', 'installations.ventLuchtdichtheid', false, 'select', ['LUKA A,B of C', 'LUKA D', 'Geen kanaal', 'Onbekend'])}</div>
                          <div>{renderFormCell('RIBBON HEATING PRESENT', data.installations?.ventSubsysteem || 'Nee', 'installations.ventSubsysteem', false, 'select', ['Ja', 'Nee'])}</div>
                          
                          {['A', 'B', 'C', 'D', 'E'].includes(ventSysteemType) && (
                            <div>
                              {renderFormCell('DEMAND CONTROL SYSTEM', data.installations?.ventDemandControl || '', 'installations.ventDemandControl', false, 'select', 
                                ventSysteemType === 'A' ? ['A1 Standaard (toevoer niet luchtdruk gestuurd)', 'A2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'A2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'A2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003'] :
                                ventSysteemType === 'B' ? ['B1 Standaard', 'B2 Tijdssturing op installaties, zonder zonering', 'B3 CO2-meting per verblijfsruimte, CO2-sturing op installaties, met zonering'] :
                                ventSysteemType === 'C' ? ['C1 Standaard', 'C2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'C2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'C2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10 Pa', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003', 'C3a Tijdsturing afvoer, zonder zonering', 'C3b Luchtdrukgestuurde toevoer delta p <= 1 PA, tijdsturing afvoer, zonder zonering', 'C3c Tijdsturing toevoer, afvoer zonder zonering', 'C4a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C4b CO2-sturing op de toevoer in ten minste de woonkamer en de hoofdslaapkamer', 'C4c Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C5a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting', 'C5b Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-meting'] :
                                ventSysteemType === 'D' ? ['D1 Standaard', 'D2 Centrale WTW-installatie zonder zoneringen en zonder sturing', 'D3 Centrale WTW, sturing van afvoer CO2-meting in de WTW, geen zonering', 'D4a Tijdsturing zonder zonering', 'D4b Tijdsturing met zonering', 'D5a Centrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5b Decentrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5c Centrale WTW. CO2-metingen in ten minste de woon- en hoofdslaapkamer'] :
                                ['E1 Systeemdeel D: decentrale WTW (Systeem D.5b)']
                              )}
                            </div>
                          )}

                          {ventSysteemType === 'D' && (
                            <>
                              <div>{renderFormCell('BYPASS PRESENT?', data.installations?.ventBypass || 'Nee', 'installations.ventBypass', false, 'select', ['Ja, 100% bypass', 'Ja, gedeeltelijk', 'Nee'])}</div>
                              <div>{renderFormCell('HR EFFICIENCY (%)', data.installations?.ventHrEfficiency || '', 'installations.ventHrEfficiency', false, 'text')}</div>
                            </>
                          )}

                          <div>{renderFormCell('FANS', data.installations?.ventVentilatoren || 'Nominaal vermogen', 'installations.ventVentilatoren', false, 'select', ['Nominaal vermogen', 'Nominaal vermogen onbekend', 'Kwaliteitsverklaring', 'Onbekend'])}</div>

                          {['Nominaal vermogen', 'Kwaliteitsverklaring'].includes(ventFansVal) && (
                            <div>{renderFormCell(ventFansVal === 'Nominaal vermogen' ? 'NOMINAL POWER (W)' : 'FLOW RATE KNOWN', data.installations?.ventNomPower || '', 'installations.ventNomPower', false, 'text')}</div>
                          )}

                          {ventFansVal === 'Onbekend' && (
                            <>
                              <div>{renderFormCell('MOTOR TYPE', data.installations?.ventMotorType || 'Gelijkstroom', 'installations.ventMotorType', false, 'select', ['Gelijkstroom', 'Wisselstroom', 'Draaistroom'])}</div>
                              <div>{renderFormCell('FABRICATION', data.installations?.ventFabrication || '', 'installations.ventFabrication', false, 'select', ['tot 1980', '1980 - 1990', '1990 - 2000', '>2006'])}</div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-full md:w-[28%] flex-shrink-0 flex flex-row md:flex-col gap-2.5">
                        <div className="flex-1 min-w-[100px]">
                          {renderInstallationPhotoSlot('vent', 'Ventilatie 1', 'Ventilatie', 0)}
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          {renderInstallationPhotoSlot('vent_extra', 'Ventilatie 2', 'Ventilatie', 1)}
                        </div>
                      </div>
                    </div>

                    {/* 3.2 Verwarming Card */}
                    <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row gap-5">
                      <div className="flex-grow md:w-[72%]">
                        <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                          <span className="flex items-center gap-1.5"><Flame size={14} /> 3.2 Verwarming</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                          <div>{renderFormCell('SYSTEM', data.installations?.verwarmTypeToestel || 'Individueel', 'installations.verwarmTypeToestel', false, 'select', ['Individueel', 'Gemeenschappelijk/collectief', 'Warmtelevering derden individueel', 'Warmtelevering derden gemeenschappelijk'])}</div>
                          <div>{renderFormCell('NUMBER OF IDENTICAL SYSTEMS', data.installations?.verwarmIdentiekeSystemen || '1', 'installations.verwarmIdentiekeSystemen', false, 'text')}</div>
                          <div>{renderFormCell('BRAND & TYPE', data.installations?.verwarmMerkType || '', 'installations.verwarmMerkType', false, 'text')}</div>
                          <div>{renderFormCell('INSTALLATION YEAR', data.installations?.verwarmSpecsBcrg || '', 'installations.verwarmSpecsBcrg', false, 'text')}</div>
                          <div>{renderFormCell('GENERATOR TYPE', data.installations?.verwarmTypeopwekker || 'Gasgestookte ketel', 'installations.verwarmTypeopwekker', false, 'select', 
                            !isVerwarmExternal ? 
                            ['Gasgestookte ketel', 'Elektrische verwarming', 'Moederhaard', 'Lokale gaskachel', 'Lokale oliekachel', 'Oliegestookte ketel', 'WKK', 'Warmtepomp gasinjectie', 'Warmtepomp gasmotor', 'Warmtepomp elektrisch', 'Biomassakachel', 'Biomassaketel handmatig gestookt', 'Biomassaketel automatisch gestookt'] :
                            ['Warmtelevering derden']
                          )}</div>

                          {isVerwarmExternal && (
                            <div>{renderFormCell('DISTRIBUTION MEDIUM', data.installations?.verwarmDistributiemedium || 'Water', 'installations.verwarmDistributiemedium', false, 'select', ['Water', 'Local'])}</div>
                          )}

                          {isVerwarmExternal && verwarmDistMedium === 'Water' && (
                            <>
                              <div>{renderFormCell('WATER FLOW TEMP', data.installations?.verwarmWatertemprater || '', 'installations.verwarmWatertemprater', false, 'select', ['30/27 °C', '35/30 °C', '40/35 °C', '45/40 °C', '50/42 °C', '55/47 °C', '60/50 °C', '65/55 °C', '70/60 °C', '75/65 °C', '80/60 °C', '90/70 °C'])}</div>
                              <div>{renderFormCell('DISTRIBUTION TYPE', data.installations?.verwarmDistributietype || 'Tweepijpsysteem', 'installations.verwarmDistributietype', false, 'select', ['Tweepijpsysteem', 'Eenpijpsysteem'])}</div>
                            </>
                          )}

                          <div>{renderFormCell('HR CLASS', data.installations?.verwarmHrKlasse || 'Onbekend', 'installations.verwarmHrKlasse', false, 'select', ['Onbekend', 'HR-107', 'HR-104', 'VR-ketel', 'Verbeterd rendement', 'Niet-condenserend'])}</div>
                          <div>{renderFormCell('NOMINAL POWER (kW)', data.installations?.verwarmPower || '', 'installations.verwarmPower', false, 'text')}</div>
                          <div>{renderFormCell('INSTALLATION LOCATION / CODE', data.installations?.verwarmCode || '', 'installations.verwarmCode', false, 'text')}</div>
                          <div>{renderFormCell('DELIVERY SYSTEM', data.installations?.verwarmAfgiftesysteem || 'Radiatoren / convectoren', 'installations.verwarmAfgiftesysteem', false, 'select', ['Radiatoren / convectoren', 'Ventilatorgestuurde radiatoren en/of convectoren', 'Vloerverwarming', 'Luchtverwarming', 'Overig van'])}</div>
                          <div>{renderFormCell('CONTROL', data.installations?.verwarmRegeling || 'Regeling in hoofdvertrek (kamerthermostaat)', 'installations.verwarmRegeling', false, 'select', ['Regeling in hoofdvertrek (kamerthermostaat)', 'Centrale regeling met individuele regeling per ruimte', 'Individuele regeling per ruimte', 'Overig of onbekend'])}</div>
                          <div>{renderFormCell('HYDRONICALLY BALANCED', data.installations?.verwarmWaterzijdigIngeeregeld || 'Nee / Onbekend', 'installations.verwarmWaterzijdigIngeeregeld', false, 'select', ['Nee / Onbekend', 'Ja, aangetoond (Label A)', 'Ja, waarschijnlijk'])}</div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-[28%] flex-shrink-0 flex flex-row md:flex-col gap-2.5">
                        <div className="flex-1 min-w-[100px]">
                          {renderInstallationPhotoSlot('ketel', 'Verwarming 1', 'Verwarming', 0)}
                        </div>
                        <div className="flex-1 min-w-[100px]">
                          {renderInstallationPhotoSlot('ketel_extra', 'Verwarming 2', 'Verwarming', 1)}
                        </div>
                      </div>
                    </div>

                    {/* 3.3 Tapwater Card */}
                    <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row gap-5">
                      <div className="flex-grow md:w-[72%]">
                        <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                          <span className="flex items-center gap-1.5"><Droplet size={14} /> 3.3 Tapwater</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                          <div>{renderFormCell('SYSTEM', data.installations?.tapTypeInstallatie || 'Individueel', 'installations.tapTypeInstallatie', false, 'select', ['Individueel', 'Gemeenschappelijk/collectief', 'Externe warmtelevering via een afleverset individueel', 'Externe warmtelevering via een afleverset gemeenschappelijk (centraal)'])}</div>
                          <div>{renderFormCell('NUMBER OF IDENTICAL SYSTEMS', data.installations?.tapIdentiekeSystemen || '1', 'installations.tapIdentiekeSystemen', false, 'text')}</div>
                          <div>{renderFormCell('BRAND & TYPE', data.installations?.tapMerkType || '', 'installations.tapMerkType', false, 'text')}</div>
                          <div>{renderFormCell('GENERATOR TYPE', data.installations?.tapTypeOpwekker || 'Compleet toestel', 'installations.tapTypeOpwekker', false, 'select', 
                            !isTapExternal ? 
                            ['Compleet toestel', 'Direct verwarmd vat', 'Indirect verwarmd vat'] :
                            ['Externe warmtelevering via een afleverset']
                          )}</div>

                          {tapSystemType === 'Individueel' && (
                            <div>{renderFormCell('DEVICE TYPE', data.installations?.tapTypeToestel || 'Keukengeiser', 'installations.tapTypeToestel', false, 'select', ['Keukengeiser', 'Gasgestookt warmwatertoestel (Badgeiser)', 'Gasgestookt combitoestel', '(micro) WKK', 'Elektrisch', 'Boosterwarmtepomp', 'Elektrische doorstroomverwarmer', 'Vast biobrandstoftoestel', 'Elektrische boiler', 'Warmwaterboiler'])}</div>
                          )}

                          <div>{renderFormCell('INSTALLATION YEAR', data.installations?.tapSpecsBcrg || '', 'installations.tapSpecsBcrg', false, 'text')}</div>
                          <div>{renderFormCell('KITCHEN DELIVERY', data.installations?.tapAfgifteKeuken || '< 2 m', 'installations.tapAfgifteKeuken', false, 'select', ['< 2 m', '2 m <= l < 4 m', '4 m <= l < 6 m', '6 m <= l < 8 m', '8 m <= l < 10 m', '10 m <= l < 12 m', '12 m <= l < 14 m', '>= 14 m'])}</div>
                          <div>{renderFormCell('BATHROOM DELIVERY', data.installations?.tapAfgifteBadkamer || '< 2 m', 'installations.tapAfgifteBadkamer', false, 'select', ['< 2 m', '2 m <= l < 4 m', '4 m <= l < 6 m', '6 m <= l < 8 m', '8 m <= l < 10 m', '10 m <= l < 12 m', '12 m <= l < 14 m', '>= 14 m'])}</div>
                          <div>{renderFormCell('CIRCULATION PIPE', data.installations?.tapCirculatieleiding || 'Nee', 'installations.tapCirculatieleiding', false, 'select', ['Nee', 'Ja, geïsoleerd', 'Ja, ongeïsoleerd'])}</div>
                          <div>{renderFormCell('SHOWER HEAT RECOVERY (DWTW)', data.installations?.tapDwtw || 'Nee', 'installations.tapDwtw', false, 'select', ['Nee', 'Ja, douchepijp-WTW', 'Ja, douchebak-WTW'])}</div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-[28%] flex-shrink-0 flex flex-col">
                        <div className="w-full">
                          {renderInstallationPhotoSlot('tapwater', 'Tapwater', 'Tapwater', 0)}
                        </div>
                      </div>
                    </div>

                    {/* 3.4 Koeling Card */}
                    <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row gap-5">
                      <div className="flex-grow md:w-[72%]">
                        <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                          <span className="flex items-center gap-1.5"><Snowflake size={14} /> 3.4 Koeling</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                          <div>{renderFormCell('SYSTEM', data.installations?.koelTypeToestel || 'Individueel', 'installations.koelTypeToestel', false, 'select', ['Individueel', 'Ge/collectief', 'Koudelevering derden', 'Koudelevering derden ge'])}</div>
                          <div>{renderFormCell('NUMBER OF IDENTICAL SYSTEMS', data.installations?.koelIdentiekeSystemen || '1', 'installations.koelIdentiekeSystemen', false, 'text')}</div>
                          <div>{renderFormCell('BRAND & TYPE', data.installations?.koelMerkType || '', 'installations.koelMerkType', false, 'text')}</div>
                          <div>{renderFormCell('GENERATOR TYPE', data.installations?.koelTypeInstallatie || 'Compressiekoeling', 'installations.koelTypeInstallatie', false, 'select', ['Compressiekoeling', 'Absorptiekoeling', 'Passieve vrije koeling'])}</div>
                          <div>{renderFormCell('EXPANSIE', data.installations?.koelExpansie || 'Directe koeling in de ruimte (airconditioning)', 'installations.koelExpansie', false, 'select', ['Directe koeling in de ruimte (airconditioning)', 'Directe koeling in het LBK (DX-systeem)', 'Met indirecte verdamping'])}</div>
                          <div>{renderFormCell('DISTRIBUTIEMEDIUM', data.installations?.koelDistributiemedium || 'Water', 'installations.koelDistributiemedium', false, 'select', ['Water', 'Lucht', 'Koudemiddel'])}</div>
                          <div>{renderFormCell('NUMBER OF GENERATORS', data.installations?.koelGeneratorsCount || '1', 'installations.koelGeneratorsCount', false, 'text')}</div>
                          <div>{renderFormCell('WATER FLOW TEMP', data.installations?.koelWatertemprater || '6/12 °C', 'installations.koelWatertemprater', false, 'select', ['6/12 °C', '12/16 °C', '12/18 °C', '17/21 °C', 'Onbekend'])}</div>
                          <div>{renderFormCell('MAIN CIRCULATION PUMP', data.installations?.koelMainCirculationPump || 'Werkelijk vermogen en EI', 'installations.koelMainCirculationPump', false, 'select', ['Werkelijk vermogen en EI', 'Werkelijk vermogen', 'Onbekend'])}</div>
                          <div>{renderFormCell('DELIVERY SYSTEM', data.installations?.koelAfgiftesysteem || 'Vloerkoeling', 'installations.koelAfgiftesysteem', false, 'select', ['Vloerkoeling', 'Wandkoeling', 'Plafondkoeling', 'Ventilatorconvectoren (aan plafond)', 'Ventilatorconvectoren (aan buitenmuur)', 'Overig of onbekend'])}</div>
                          <div>{renderFormCell('CONTROL', data.installations?.koelRegeling || 'Standalone regeling', 'installations.koelRegeling', false, 'select', ['Standalone regeling', 'Centrale regeling', 'Overig of onbekend'])}</div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-[28%] flex-shrink-0 flex flex-col">
                        <div className="w-full">
                          {renderInstallationPhotoSlot('koeling', 'Koeling', 'Koeling', 0)}
                        </div>
                      </div>
                    </div>

                    {/* 3.5 Zonne-panelen Card */}
                    <div className="border border-outline-variant/10 border-l-4 border-l-primary rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col md:flex-row gap-5">
                      <div className="flex-grow md:w-[72%]">
                        <h3 className="text-xs font-black text-primary mb-3 flex items-center justify-between gap-1.5 w-full uppercase tracking-wider font-sans">
                          <span className="flex items-center gap-1.5"><Sun size={14} /> 3.5 Zonne-panelen</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-1">
                          <div>{renderFormCell('SYSTEM', data.installations?.zonTypeToestel || 'Individueel', 'installations.zonTypeToestel', false, 'select', ['Individueel', 'Gemeenschappelijk/collectief'])}</div>
                          <div>{renderFormCell('NUMBER OF IDENTICAL SYSTEMS', data.installations?.zonIdentiekeSystemen || '1', 'installations.zonIdentiekeSystemen', false, 'text')}</div>
                          <div>{renderFormCell('BRAND & TYPE', data.installations?.zonMerkType || '', 'installations.zonMerkType', false, 'text')}</div>
                          <div>{renderFormCell('INSTALLATION TYPE', data.installations?.zonSysteem || 'PV-panelen', 'installations.zonSysteem', false, 'select', ['PV-panelen', 'PVT-panelen', 'Zonneboiler'])}</div>
                          <div>{renderFormCell('POWER / WATTPIEK', data.installations?.zonWattpiekvermogen || '', 'installations.zonWattpiekvermogen', false, 'text')}</div>
                          <div>{renderFormCell('COUNT / AANTAL', data.installations?.zonAantal || '', 'installations.zonAantal', false, 'text')}</div>
                          <div>{renderFormCell('ORIENTATION / ORIENTATIE', data.installations?.zonOrientatie || 'Zuid', 'installations.zonOrientatie', false, 'select', ['Zuid', 'Zuid-West', 'West', 'Oost', 'Noord'])}</div>
                          <div>{renderFormCell('TILT ANGLE / HELLINGSHOEK', data.installations?.zonHellingshook || '', 'installations.zonHellingshook', false, 'text')}</div>
                          <div className="col-span-2">{renderFormCell('SHADING / BOUWINTEGRATIE', data.installations?.zonBouwintegratie || 'Onbekend', 'installations.zonBouwintegratie', false, 'select', ['Niet geventileerd: zonder luchtspouw', 'Matig geventileerd: met luchtspouw', 'Sterk geventileerd: open draagconstructie', 'Op dakbedekking', 'Onbekend'])}</div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-[28%] flex-shrink-0 flex flex-col">
                        <div className="w-full">
                          {renderInstallationPhotoSlot('solar', 'Zonne-panelen', 'Zonne-panelen', 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'p3' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-250 pb-2 mb-2 flex justify-between items-center">
                  <h2 className="text-sm font-black text-primary uppercase tracking-wider font-sans">
                    4. Constructies
                  </h2>
                  {onViewChange && (
                    <button
                      type="button"
                      onClick={() => onViewChange('constructie')}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer no-print shrink-0 uppercase tracking-wider"
                    >
                      <Ruler size={11} />
                      Naar Constructiepagina
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-[12px] font-black text-on-surface-variant/80 uppercase tracking-wider font-sans">
                    4.1 Deur / Raam / Paneel
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* CARD 1: DEUR */}
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary text-xs font-black uppercase tracking-wide">Deur</span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                            <Check size={10} strokeWidth={3} /> Isolatie
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <select 
                            className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-neutral-400 italic text-[10px] font-semibold text-on-surface-variant/50 font-sans outline-none cursor-pointer"
                            value={constructies[0]?.subtitle || 'Beslisschema'}
                            onChange={(e) => handleConstructieRowChange(0, 'subtitle', e.target.value)}
                          >
                            <option value="Beslisschema">Beslisschema</option>
                            <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                          </select>
                          {renderFlagCycleClicker('constructie_0_subtitle')}
                        </div>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            {renderCardLabel('Merk & Type', 'constructie_0_type')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={constructies[0]?.type || '-'}
                              onChange={(e) => handleConstructieRowChange(0, 'type', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Code', 'constructie_0_code')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-black text-on-background py-0.5 font-mono"
                              value={constructies[0]?.code || '-'}
                              onChange={(e) => handleConstructieRowChange(0, 'code', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Insulation present', 'constructie_0_isolatie')}
                            <select 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5 outline-none cursor-pointer"
                              value={constructies[0]?.isolatie || 'Ja'}
                              onChange={(e) => handleConstructieRowChange(0, 'isolatie', e.target.value)}
                            >
                              <option value="Ja">Ja</option>
                              <option value="Nee">Nee</option>
                              <option value="Onbekend">Onbekend</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <hr className="border-outline-variant/5 my-3" />
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <div>
                            {renderCardLabel('U-waarde', 'constructie_0_value')}
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <input 
                                className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-on-background"
                                value={constructies[0]?.value || '2.00'}
                                onChange={(e) => handleConstructieRowChange(0, 'value', e.target.value)}
                              />
                            </div>
                            <span className="text-[8px] text-on-surface-variant/30 font-bold block mt-0.5">W/(m2.K)</span>
                          </div>
                          <div>
                            {renderCardLabel('G-waarde', 'constructie_0_gValue')}
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <input 
                                className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-on-background"
                                value={constructies[0]?.gValue || '-'}
                                onChange={(e) => handleConstructieRowChange(0, 'gValue', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: RAAM */}
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary text-xs font-black uppercase tracking-wide">Raam</span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                            <Check size={10} strokeWidth={3} /> Isolatie
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <select 
                            className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-neutral-400 italic text-[10px] font-semibold text-on-surface-variant/50 font-sans outline-none cursor-pointer"
                            value={constructies[1]?.subtitle || 'Kwaliteitsverklaring'}
                            onChange={(e) => handleConstructieRowChange(1, 'subtitle', e.target.value)}
                          >
                            <option value="Beslisschema">Beslisschema</option>
                            <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                          </select>
                          {renderFlagCycleClicker('constructie_1_subtitle')}
                        </div>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            {renderCardLabel('Merk & Type', 'constructie_1_type')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={constructies[1]?.type || 'K-Vision HR++'}
                              onChange={(e) => handleConstructieRowChange(1, 'type', e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              {renderCardLabel('frameType', 'constructie_1_kozijn')}
                              <select 
                                className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-[11px] font-bold text-on-background py-0.5 outline-none cursor-pointer"
                                value={(constructies[1] as any)?.kozijn || 'Kunststof'}
                                onChange={(e) => handleConstructieRowChange(1, 'kozijn', e.target.value)}
                              >
                                <option value="Hout">Hout</option>
                                <option value="Kunststof">Kunststof</option>
                                <option value="Metaal thermisch onderbroken">Metaal thermisch onderbroken</option>
                                <option value="Metaal niet thermisch onderbroken">Metaal niet thermisch onderbroken</option>
                              </select>
                            </div>
                            <div>
                              {renderCardLabel('glassType', 'constructie_1_glas')}
                              <select 
                                className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-[11px] font-bold text-on-background py-0.5 outline-none cursor-pointer"
                                value={(constructies[1] as any)?.glas || 'HR++'}
                                onChange={(e) => handleConstructieRowChange(1, 'glas', e.target.value)}
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
                          <div>
                            {renderCardLabel('Code', 'constructie_1_code')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-black text-on-background py-0.5 font-mono"
                              value={constructies[1]?.code || '2022156GK'}
                              onChange={(e) => handleConstructieRowChange(1, 'code', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <hr className="border-outline-variant/5 my-3" />
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <div>
                            {renderCardLabel('U-waarde', 'constructie_1_value')}
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <input 
                                className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-on-background"
                                value={constructies[1]?.value || '1.10'}
                                onChange={(e) => handleConstructieRowChange(1, 'value', e.target.value)}
                              />
                            </div>
                            <span className="text-[8px] text-on-surface-variant/30 font-bold block mt-0.5">W/(m2.K)</span>
                          </div>
                          <div>
                            {renderCardLabel('G-waarde', 'constructie_1_gValue')}
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <input 
                                className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-on-background"
                                value={constructies[1]?.gValue || '0.46'}
                                onChange={(e) => handleConstructieRowChange(1, 'gValue', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 3: RAAM (DAK) */}
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary text-xs font-black uppercase tracking-wide">Raam (Dak)</span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                            <Check size={10} strokeWidth={3} /> Isolatie
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <select 
                            className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-neutral-400 italic text-[10px] font-semibold text-on-surface-variant/50 font-sans outline-none cursor-pointer"
                            value={constructies[2]?.subtitle || 'Kwaliteitsverklaring'}
                            onChange={(e) => handleConstructieRowChange(2, 'subtitle', e.target.value)}
                          >
                            <option value="Beslisschema">Beslisschema</option>
                            <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                          </select>
                          {renderFlagCycleClicker('constructie_2_subtitle')}
                        </div>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            {renderCardLabel('Merk & Type', 'constructie_2_type')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={constructies[2]?.type || 'Velux GGL FK06'}
                              onChange={(e) => handleConstructieRowChange(2, 'type', e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              {renderCardLabel('frameType', 'constructie_2_kozijn')}
                              <select 
                                className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-[11px] font-bold text-on-background py-0.5 outline-none cursor-pointer"
                                value={(constructies[2] as any)?.kozijn || 'Kunststof'}
                                onChange={(e) => handleConstructieRowChange(2, 'kozijn', e.target.value)}
                              >
                                <option value="Hout">Hout</option>
                                <option value="Kunststof">Kunststof</option>
                                <option value="Metaal thermisch onderbroken">Metaal thermisch onderbroken</option>
                                <option value="Metaal niet thermisch onderbroken">Metaal niet thermisch onderbroken</option>
                              </select>
                            </div>
                            <div>
                              {renderCardLabel('glassType', 'constructie_2_glas')}
                              <select 
                                className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-[11px] font-bold text-on-background py-0.5 outline-none cursor-pointer"
                                value={(constructies[2] as any)?.glas || 'HR++'}
                                onChange={(e) => handleConstructieRowChange(2, 'glas', e.target.value)}
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
                          <div>
                            {renderCardLabel('Code', 'constructie_2_code')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-black text-on-background py-0.5 font-mono"
                              value={constructies[2]?.code || '2023163GK'}
                              onChange={(e) => handleConstructieRowChange(2, 'code', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <hr className="border-outline-variant/5 my-3" />
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <div>
                            {renderCardLabel('U-waarde', 'constructie_2_value')}
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <input 
                                className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-on-background"
                                value={constructies[2]?.value || '1.30'}
                                onChange={(e) => handleConstructieRowChange(2, 'value', e.target.value)}
                              />
                            </div>
                            <span className="text-[8px] text-on-surface-variant/30 font-bold block mt-0.5">W/(m2.K)</span>
                          </div>
                          <div>
                            {renderCardLabel('G-waarde', 'constructie_2_gValue')}
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <input 
                                className="w-16 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-on-background"
                                value={constructies[2]?.gValue || '0.46'}
                                onChange={(e) => handleConstructieRowChange(2, 'gValue', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <h3 className="text-[12px] font-black text-on-surface-variant/80 uppercase tracking-wider font-sans">
                    4.2 Gevel / Vloer / Platdak / Hellenddak
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* CARD 4: GEVEL */}
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary text-xs font-black uppercase tracking-wide">Gevel</span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                            <Check size={10} strokeWidth={3} /> Isolatie
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <select 
                            className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-neutral-400 italic text-[10px] font-semibold text-on-surface-variant/50 font-sans outline-none cursor-pointer"
                            value={constructies[3]?.subtitle || 'Kwaliteitsverklaring'}
                            onChange={(e) => handleConstructieRowChange(3, 'subtitle', e.target.value)}
                          >
                            <option value="Beslisschema">Beslisschema</option>
                            <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                          </select>
                          {renderFlagCycleClicker('constructie_3_subtitle')}
                        </div>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            {renderCardLabel('Merk & Type', 'constructie_3_type')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={constructies[3]?.type || 'H2Foam Lite'}
                              onChange={(e) => handleConstructieRowChange(3, 'type', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Insulation present', 'constructie_3_isolatie')}
                            <select 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5 outline-none cursor-pointer"
                              value={constructies[3]?.isolatie || 'Ja'}
                              onChange={(e) => handleConstructieRowChange(3, 'isolatie', e.target.value)}
                            >
                              <option value="Ja">Ja</option>
                              <option value="Nee">Nee</option>
                              <option value="Onbekend">Onbekend</option>
                            </select>
                          </div>
                          <div>
                            {renderCardLabel('Thickness', 'constructie_3_dikte')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={(constructies[3] as any)?.dikte || '60 mm'}
                              onChange={(e) => handleConstructieRowChange(3, 'dikte', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Code', 'constructie_3_code')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-black text-on-background py-0.5 font-mono"
                              value={constructies[3]?.code || '20210007GK'}
                              onChange={(e) => handleConstructieRowChange(3, 'code', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <hr className="border-outline-variant/5 my-3" />
                        <div>
                          {renderCardLabel('Rc-value', 'constructie_3_value')}
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <input 
                              className="w-24 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-green-700"
                              value={constructies[3]?.value || '1.56'}
                              onChange={(e) => handleConstructieRowChange(3, 'value', e.target.value)}
                            />
                          </div>
                          <span className="text-[8px] text-on-surface-variant/40 font-bold block mt-0.5">[m2.K/W]</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 5: VLOER */}
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary text-xs font-black uppercase tracking-wide">Vloer</span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                            <Check size={10} strokeWidth={3} /> Isolatie
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <select 
                            className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-neutral-400 italic text-[10px] font-semibold text-on-surface-variant/50 font-sans outline-none cursor-pointer"
                            value={constructies[4]?.subtitle || 'Beslisschema'}
                            onChange={(e) => handleConstructieRowChange(4, 'subtitle', e.target.value)}
                          >
                            <option value="Beslisschema">Beslisschema</option>
                            <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                          </select>
                          {renderFlagCycleClicker('constructie_4_subtitle')}
                        </div>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            {renderCardLabel('Merk & Type', 'constructie_4_type')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={constructies[4]?.type || '-'}
                              onChange={(e) => handleConstructieRowChange(4, 'type', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Insulation present', 'constructie_4_isolatie')}
                            <select 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5 outline-none cursor-pointer"
                              value={constructies[4]?.isolatie || 'Ja'}
                              onChange={(e) => handleConstructieRowChange(4, 'isolatie', e.target.value)}
                            >
                              <option value="Ja">Ja</option>
                              <option value="Nee">Nee</option>
                              <option value="Onbekend">Onbekend</option>
                            </select>
                          </div>
                          <div>
                            {renderCardLabel('Thickness', 'constructie_4_dikte')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={(constructies[4] as any)?.dikte || '90 mm'}
                              onChange={(e) => handleConstructieRowChange(4, 'dikte', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Code', 'constructie_4_code')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-black text-on-background py-0.5 font-mono"
                              value={constructies[4]?.code || '-'}
                              onChange={(e) => handleConstructieRowChange(4, 'code', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <hr className="border-outline-variant/5 my-3" />
                        <div>
                          {renderCardLabel('Rc-value', 'constructie_4_value')}
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <input 
                              className="w-24 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-green-700"
                              value={constructies[4]?.value || '2.15'}
                              onChange={(e) => handleConstructieRowChange(4, 'value', e.target.value)}
                            />
                          </div>
                          <span className="text-[8px] text-on-surface-variant/40 font-bold block mt-0.5">[m2.K/W]</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 6: PLATDAK */}
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary text-xs font-black uppercase tracking-wide">Platdak</span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                            <Check size={10} strokeWidth={3} /> Isolatie
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <select 
                            className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-neutral-400 italic text-[10px] font-semibold text-on-surface-variant/50 font-sans outline-none cursor-pointer"
                            value={constructies[5]?.subtitle || 'Beslisschema'}
                            onChange={(e) => handleConstructieRowChange(5, 'subtitle', e.target.value)}
                          >
                            <option value="Beslisschema">Beslisschema</option>
                            <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                          </select>
                          {renderFlagCycleClicker('constructie_5_subtitle')}
                        </div>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            {renderCardLabel('Merk & Type', 'constructie_5_type')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={constructies[5]?.type || 'PUR/PIR'}
                              onChange={(e) => handleConstructieRowChange(5, 'type', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Insulation present', 'constructie_5_isolatie')}
                            <select 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5 outline-none cursor-pointer"
                              value={constructies[5]?.isolatie || 'Ja'}
                              onChange={(e) => handleConstructieRowChange(5, 'isolatie', e.target.value)}
                            >
                              <option value="Ja">Ja</option>
                              <option value="Nee">Nee</option>
                              <option value="Onbekend">Onbekend</option>
                            </select>
                          </div>
                          <div>
                            {renderCardLabel('Thickness', 'constructie_5_dikte')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={(constructies[5] as any)?.dikte || '100 mm'}
                              onChange={(e) => handleConstructieRowChange(5, 'dikte', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Code', 'constructie_5_code')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-black text-on-background py-0.5 font-mono"
                              value={constructies[5]?.code || '-'}
                              onChange={(e) => handleConstructieRowChange(5, 'code', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <hr className="border-outline-variant/5 my-3" />
                        <div>
                          {renderCardLabel('Rc-value', 'constructie_5_value')}
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <input 
                              className="w-24 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-green-700"
                              value={constructies[5]?.value || '2.44'}
                              onChange={(e) => handleConstructieRowChange(5, 'value', e.target.value)}
                            />
                          </div>
                          <span className="text-[8px] text-on-surface-variant/40 font-bold block mt-0.5">[m2.K/W]</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                    {/* CARD 7: HELLENDDAK */}
                    <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition duration-200">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-primary text-xs font-black uppercase tracking-wide">Hellenddak</span>
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none">
                            <Check size={10} strokeWidth={3} /> Isolatie
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <select 
                            className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-neutral-400 italic text-[10px] font-semibold text-on-surface-variant/50 font-sans outline-none cursor-pointer"
                            value={constructies[6]?.subtitle || 'Kwaliteitsverklaring'}
                            onChange={(e) => handleConstructieRowChange(6, 'subtitle', e.target.value)}
                          >
                            <option value="Beslisschema">Beslisschema</option>
                            <option value="Kwaliteitsverklaring">Kwaliteitsverklaring</option>
                          </select>
                          {renderFlagCycleClicker('constructie_6_subtitle')}
                        </div>
                        
                        <div className="space-y-2 mt-1">
                          <div>
                            {renderCardLabel('Merk & Type', 'constructie_6_type')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={constructies[6]?.type || 'Unidek Reno dekfolie'}
                              onChange={(e) => handleConstructieRowChange(6, 'type', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Insulation present', 'constructie_6_isolatie')}
                            <select 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5 outline-none cursor-pointer"
                              value={constructies[6]?.isolatie || 'Ja'}
                              onChange={(e) => handleConstructieRowChange(6, 'isolatie', e.target.value)}
                            >
                              <option value="Ja">Ja</option>
                              <option value="Nee">Nee</option>
                              <option value="Onbekend">Onbekend</option>
                            </select>
                          </div>
                          <div>
                            {renderCardLabel('Thickness', 'constructie_6_dikte')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-bold text-on-background py-0.5"
                              value={(constructies[6] as any)?.dikte || '189 mm'}
                              onChange={(e) => handleConstructieRowChange(6, 'dikte', e.target.value)}
                            />
                          </div>
                          <div>
                            {renderCardLabel('Code', 'constructie_6_code')}
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs font-black text-on-background py-0.5 font-mono"
                              value={constructies[6]?.code || '20210140GK'}
                              onChange={(e) => handleConstructieRowChange(6, 'code', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <hr className="border-outline-variant/5 my-3" />
                        <div>
                          {renderCardLabel('Rc-value', 'constructie_6_value')}
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <input 
                              className="w-24 bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-lg font-black text-green-700"
                              value={constructies[6]?.value || '6.32'}
                              onChange={(e) => handleConstructieRowChange(6, 'value', e.target.value)}
                            />
                          </div>
                          <span className="text-[8px] text-on-surface-variant/40 font-bold block mt-0.5">[m2.K/W]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'p4' && (
              <div className="space-y-6">
                <div className="space-y-1 pb-1 border-b border-outline-variant/10">
                  <h2 className="text-sm font-black font-sans text-primary uppercase tracking-wider">5. Bouwkundig</h2>
                  <h3 className="text-xs font-black font-sans text-primary/80 pl-2 uppercase tracking-wide">5.1 Gevel</h3>
                  <h4 className="text-[11px] font-black font-sans text-primary/70 pl-4 uppercase tracking-normal">5.1.1 Voorgevel</h4>
                </div>

                <div className="flex flex-col md:flex-row gap-6 mt-3 w-full">
                  <div className="border border-outline-variant/10 rounded-2xl bg-white p-4.5 w-full md:w-[300px] shadow-2xs flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs font-bold">
                      <div>
                        <span className="text-[9px] font-black text-on-surface-variant/40 block mb-0.5 uppercase tracking-wide">Isolatie</span>
                        <input 
                          className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs text-on-background font-bold py-0.5"
                          value={bouwkundig.voorgevelIso}
                          onChange={(e) => setBouwkundig(prev => ({ ...prev, voorgevelIso: e.target.value }))}
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-on-surface-variant/40 block mb-0.5 uppercase tracking-wide">Orientation</span>
                        <input 
                          className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs text-on-background font-bold py-0.5"
                          value={bouwkundig.voorgevelOri}
                          onChange={(e) => setBouwkundig(prev => ({ ...prev, voorgevelOri: e.target.value }))}
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-on-surface-variant/40 block mb-0.5 uppercase tracking-wide">Grenst aan</span>
                        <input 
                          className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs text-on-background font-bold py-0.5"
                          value={bouwkundig.voorgevelGrens}
                          onChange={(e) => setBouwkundig(prev => ({ ...prev, voorgevelGrens: e.target.value }))}
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-on-surface-variant/40 block mb-0.5 uppercase tracking-wide">Oppervlakte</span>
                        <input 
                          className="w-full bg-transparent border-b border-transparent hover:border-dashed hover:border-neutral-300 focus:outline-none focus:border-primary text-xs text-on-background font-bold py-0.5"
                          value={bouwkundig.voorgevelArea}
                          onChange={(e) => setBouwkundig(prev => ({ ...prev, voorgevelArea: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {['voorgevel_p1', 'voorgevel_p2', 'voorgevel_p3'].map((key) => {
                      const imgUrl = images[key];
                      return (
                        <div 
                          key={key} 
                          onClick={() => triggerPhotoUpload(key)}
                          className="group relative border border-outline-variant/10 hover:border-primary/50 rounded-2xl overflow-hidden bg-neutral-50 shadow-2xs hover:shadow-xs transition duration-200 cursor-pointer aspect-[4/3]"
                        >
                          {imgUrl ? (
                            <>
                              <img 
                                src={imgUrl} 
                                alt="Voorgevel" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-1.5 right-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePhoto(key, e);
                                  }}
                                  className="bg-red-500 hover:bg-red-65 text-white rounded-lg p-1.5 shadow-sm transition cursor-pointer flex items-center justify-center"
                                  title="Verwijder foto"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/30 gap-1">
                              <Camera size={20} />
                              <span className="text-[9px] font-black uppercase tracking-wider">Foto</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 pointer-events-none">
                            <Camera size={14} /> Upload
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {bouwkundig.kozijnenVoorgevel.map((k, index) => {
                    const imgKey = k.imgKey || (k.id === 'W4' ? 'voorgevel_p3' : 'kozijnD1');
                    const imgUrl = images[imgKey];
                    return (
                      <div 
                        key={k.id}
                        className="border border-outline-variant/10 rounded-2xl bg-white p-5 shadow-2xs flex justify-between gap-5 relative group"
                      >
                        <div className="flex-1 flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-center py-0.5 border-b border-dashed border-outline-variant/10">
                            <span className="font-bold text-on-surface-variant/80 text-xs">Tag</span>
                            <div className="flex items-center gap-1.5 justify-end">
                              <input 
                                className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-20 py-0.5"
                                value={k.id}
                                onChange={(e) => {
                                  const copy = [...bouwkundig.kozijnenVoorgevel];
                                  copy[index].id = e.target.value;
                                  setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-dashed border-outline-variant/10">
                            <span className="font-bold text-on-surface-variant/80 text-xs">Area</span>
                            <input 
                              className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-24 py-0.5"
                              value={k.area}
                              onChange={(e) => {
                                const copy = [...bouwkundig.kozijnenVoorgevel];
                                  copy[index].area = e.target.value;
                                  setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-dashed border-outline-variant/10">
                            <span className="font-bold text-on-surface-variant/80 text-xs">Constructie</span>
                            <input 
                              className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-28 py-0.5"
                              value={k.constructie}
                              onChange={(e) => {
                                const copy = [...bouwkundig.kozijnenVoorgevel];
                                copy[index].constructie = e.target.value;
                                setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-dashed border-outline-variant/10">
                            <span className="font-bold text-on-surface-variant/80 text-xs">Zonwering</span>
                            <input 
                              className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-24 py-0.5"
                              value={k.zonwering}
                              onChange={(e) => {
                                const copy = [...bouwkundig.kozijnenVoorgevel];
                                copy[index].zonwering = e.target.value;
                                setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-dashed border-outline-variant/10">
                            <span className="font-bold text-on-surface-variant/80 text-xs">hb</span>
                            <input 
                              className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-20 py-0.5 placeholder-neutral-300"
                              placeholder="..."
                              value={k.hb}
                              onChange={(e) => {
                                const copy = [...bouwkundig.kozijnenVoorgevel];
                                copy[index].hb = e.target.value;
                                setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-dashed border-outline-variant/10">
                            <span className="font-bold text-on-surface-variant/80 text-xs">bb</span>
                            <input 
                              className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-20 py-0.5 placeholder-neutral-300"
                              placeholder="..."
                              value={k.bb}
                              onChange={(e) => {
                                const copy = [...bouwkundig.kozijnenVoorgevel];
                                copy[index].bb = e.target.value;
                                setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-b border-dashed border-outline-variant/10">
                            <span className="font-bold text-on-surface-variant/80 text-xs">ho</span>
                            <input 
                              className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-20 py-0.5 placeholder-neutral-300"
                              placeholder="..."
                              value={k.ho}
                              onChange={(e) => {
                                const copy = [...bouwkundig.kozijnenVoorgevel];
                                copy[index].ho = e.target.value;
                                setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center py-0.5">
                            <span className="font-bold text-on-surface-variant/80 text-xs">Belemmering</span>
                            <input 
                              className="bg-transparent text-xs font-bold text-on-background text-right focus:outline-none hover:bg-neutral-50 rounded px-1 w-24 py-0.5"
                              value={k.belemmering}
                              onChange={(e) => {
                                const copy = [...bouwkundig.kozijnenVoorgevel];
                                copy[index].belemmering = e.target.value;
                                setBouwkundig(prev => ({ ...prev, kozijnenVoorgevel: copy }));
                              }}
                            />
                          </div>
                        </div>

                        <div 
                          onClick={() => triggerPhotoUpload(imgKey)}
                          className="w-[120px] rounded-2xl overflow-hidden bg-neutral-50 flex items-center justify-center relative shadow-2xs hover:shadow-xs cursor-pointer transition select-none border border-outline-variant/10 group-hover:border-primary/50 aspect-square"
                        >
                          {imgUrl ? (
                            <>
                              <img 
                                src={imgUrl} 
                                alt={`${k.id}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-1.5 right-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePhoto(imgKey, e);
                                  }}
                                  className="bg-red-500 hover:bg-red-65 text-white rounded-lg p-1.5 shadow-sm transition cursor-pointer flex items-center justify-center"
                                  title="Verwijder foto"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-on-surface-variant/30 gap-1">
                              <ImageIcon size={24} />
                              <span className="text-[9px] font-black uppercase">Foto</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 pointer-events-none">
                            <Camera size={14} /> Upload
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoersheetView;
export { InvoersheetView };
