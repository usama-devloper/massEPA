import React, { useState } from 'react';
import { LayoutDashboard, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { InspectionData } from './backofficeTypes';

interface BackOfficeDashboardProps {
  data: InspectionData;
  onViewChange: (view: any) => void;
}

export const BackOfficeDashboard: React.FC<BackOfficeDashboardProps> = ({ data, onViewChange }) => {
  const { t, locale } = useLanguage();

  const [expandedColors, setExpandedColors] = useState<Record<string, boolean>>({
    red: true,
    yellow: false,
    green: false,
  });

  const toggleColor = (color: string) => {
    setExpandedColors(prev => ({ ...prev, [color]: !prev[color] }));
  };

  const getTranslation = (key: string, nlFallback: string, enFallback: string): string => {
    const res = t(key);
    if (res === key || !res) {
      return locale === 'en' ? enFallback : nlFallback;
    }
    return res;
  };

  const getFlagsList = () => {
    const clientId = data?.clientId || 'default';
    
    // 1. General flags
    let algemeen: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(`algemeen_flags_${clientId}`);
      if (saved) algemeen = JSON.parse(saved);
    } catch {}

    // 2. Installation flags
    let installatie: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(`installatie_flags_${clientId}`);
      if (saved) installatie = JSON.parse(saved);
    } catch {}

    // 3. Construction flags
    let constructie: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(`constructie_flags_${clientId}`);
      if (saved) constructie = JSON.parse(saved);
    } catch {}

    // 4. Kozijn flags
    let kozijn: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(`kozijn_flags_${clientId}`);
      if (saved) kozijn = JSON.parse(saved);
    } catch {}

    // 5. Geometry flags
    let geometry: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(`geometry_flags_${clientId}`);
      if (saved) geometry = JSON.parse(saved);
    } catch {}

    // 6. Photo flags
    let fotos: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(`fotos_flags_${clientId}`);
      if (saved) fotos = JSON.parse(saved);
    } catch {}

    const items: Array<{
      id: string;
      label: string;
      section: string;
      viewTarget: string;
      subTabTarget?: string;
      color: 'red' | 'yellow' | 'green';
    }> = [];

    const generalKeyLabels: Record<string, string> = {
      bouwfase: getTranslation('general.bouwfase', 'Bouwfase', 'Construction Phase'),
      opname: getTranslation('general.opnameType', 'Opname type', 'Inspection Type'),
      adres: getTranslation('general.address', 'Adres', 'Address'),
      gebouwtype: getTranslation('general.buildingType', 'Gebouwtype', 'Building Type'),
      subtype: getTranslation('general.buildingSubtype', 'Subtype', 'Subtype'),
      ligging: getTranslation('general.buildingLocation', 'Ligging', 'Location'),
      daktype: getTranslation('general.roofType', 'Daktype', 'Roof Type'),
      gebouwhoogte: getTranslation('general.buildingHeight', 'Gebouwhoogte', 'Building Height'),
      postcode: getTranslation('general.postalCode', 'Postcode', 'Postal Code'),
      pandId: getTranslation('general.pandId', 'Pand ID', 'Building ID'),
      vboId: getTranslation('general.vboId', 'VBO ID', 'Utility ID'),
      plaats: getTranslation('general.city', 'Plaats', 'City'),
      wijk: getTranslation('general.district', 'Wijk', 'District'),
      gemeent: getTranslation('general.municipality', 'Gemeente', 'Municipality'),
      svbStatus: getTranslation('general.svbStatus', 'SVB-Type', 'SVB Status'),
      bron: getTranslation('general.source', 'Bron', 'Source'),
      persoon: getTranslation('general.residentName', 'Naam bewoner', 'Resident name'),
      telefoon: getTranslation('general.phone', 'Telefoon', 'Phone'),
      email: getTranslation('general.email', 'E-mail', 'Email'),
      adviseur: getTranslation('general.inspectorName', 'Naam inspecteur', 'Inspector name'),
      certificaathouder: getTranslation('general.certificateNumber', 'Certificaatnummer', 'Certificate number'),
      gebruiker: getTranslation('general.certificateHolder', 'Certificaathouder', 'Certificate holder'),
      opnamedatum: getTranslation('general.inspectionDate', 'Opnamedatum', 'Inspection date'),
      invoerdatum: getTranslation('general.entryDate', 'Invoerdatum', 'Entry date'),
      leidingdoorvoeren: getTranslation('general.pipePenetrations', 'Leidingdoorvoeren', 'Pipe penetrations'),
      avr: getTranslation('general.avr', 'AVR', 'AVR'),
      aantal: getTranslation('general.aantal', 'Aantal', 'Amount'),
      fullName: getTranslation('general.fullName', 'Contactpersoon', 'Full name'),
      phoneNumber: getTranslation('general.phoneNumber', 'Telefoonnummer', 'Phone number'),
      contactAddress: getTranslation('general.contactAddress', 'Contactadres', 'Contact address')
    };

    const getInstallLabel = (key: string): string => {
      const isEn = locale === 'en';
      if (key.includes('system') || key.startsWith('system_')) return isEn ? 'System' : 'Systeem';
      if (key.includes('count') || key.startsWith('count_')) return isEn ? 'Number of identical systems' : 'Aantal identieke systemen';
      if (key.includes('brand') || key.startsWith('brand_')) return isEn ? 'Brand & Type' : 'Merk & Type';
      
      const labels: Record<string, { nl: string; en: string }> = {
        ventSysteem: { nl: 'Systeem type', en: 'System type' },
        ventMerkType: { nl: 'Merk & Type', en: 'Brand & Type' },
        ventSpecsBcrg: { nl: 'Kwaliteitsverklaring/BCRG', en: 'Specs/BCRG' },
        ventVentilatiesysteem: { nl: 'Ventilatiesysteem', en: 'Ventilation system' },
        ventSubsysteem: { nl: 'Subsysteem', en: 'Subsystem' },
        ventLuchtdichtheid: { nl: 'Luchtdichtheid', en: 'Airtightness' },
        ventVentilatoren: { nl: 'Ventilatoren', en: 'Fans' },
        ventTypeVentilator: { nl: 'Type ventilator', en: 'Fan type' },
        ventCode: { nl: 'Code', en: 'Code' },
        ventHrEfficiency: { nl: 'HR-rendement', en: 'HR efficiency' },
        ventNomPower: { nl: 'Nominaal vermogen', en: 'Nominal power' },
        ventMotorType: { nl: 'Motortype', en: 'Motor type' },
        ventFabrication: { nl: 'Fabricage', en: 'Fabrication' },
        ventDemandControl: { nl: 'Vraaggestuurd', en: 'Demand control' },
        ventBypass: { nl: 'Bypass', en: 'Bypass' },

        verwarmSysteem: { nl: 'Systeem type', en: 'System type' },
        verwarmMerkType: { nl: 'Merk & Type', en: 'Brand & Type' },
        verwarmSpecsBcrg: { nl: 'Kwaliteitsverklaring/BCRG', en: 'Specs/BCRG' },
        verwarmTypeopwekker: { nl: 'Type opwekker', en: 'Generator type' },
        verwarmTypeToestel: { nl: 'Type toestel', en: 'Device type' },
        verwarmDistributiemedium: { nl: 'Distributiemedium', en: 'Distribution medium' },
        verwarmWatertemprater: { nl: 'Watertemperatuur', en: 'Water temperature' },
        verwarmAfgiftesysteem: { nl: 'Afgiftesysteem', en: 'Emission system' },
        verwarmCode: { nl: 'Code', en: 'Code' },
        verwarmRegeling: { nl: 'Regeling', en: 'Regulation' },
        verwarmWaterzijdigIngeeregeld: { nl: 'Waterzijdig ingeregeld', en: 'Hydronically balanced' },
        verwarmDistributietype: { nl: 'Distributietype', en: 'Distribution type' },
        verwarmPower: { nl: 'Nominaal vermogen', en: 'Nominal power' },

        tapSysteem: { nl: 'Systeem type', en: 'System type' },
        tapMerkType: { nl: 'Merk & Type', en: 'Brand & Type' },
        tapSpecsBcrg: { nl: 'Kwaliteitsverklaring/BCRG', en: 'Specs/BCRG' },
        tapTypeInstallatie: { nl: 'Type installatie', en: 'Installation type' },
        tapTypeOpwekker: { nl: 'Type opwekker', en: 'Generator type' },
        tapTypeToestel: { nl: 'Type toestel', en: 'Device type' },
        tapCode: { nl: 'Code', en: 'Code' },
        tapAfgifteKeuken: { nl: 'Afgifte keuken', en: 'Emission kitchen' },
        tapAfgifteBadkamer: { nl: 'Afgifte badkamer', en: 'Emission bathroom' },
        tapCirculatieleiding: { nl: 'Circulatieleiding', en: 'Circulation pipe' },
        tapDwtw: { nl: 'DWTW', en: 'DWTW' },

        koelSysteem: { nl: 'Systeem type', en: 'System type' },
        koelMerkType: { nl: 'Merk & Type', en: 'Brand & Type' },
        koelSpecsBcrg: { nl: 'Kwaliteitsverklaring/BCRG', en: 'Specs/BCRG' },
        koelTypeInstallatie: { nl: 'Type installatie', en: 'Installation type' },
        koelExpansie: { nl: 'Expansie', en: 'Expansion' },
        koelCode: { nl: 'Code', en: 'Code' },
        koelDistributiemedium: { nl: 'Distributiemedium', en: 'Distribution medium' },
        koelWatertemprater: { nl: 'Watertemperatuur', en: 'Water temperature' },
        koelAfgiftesysteem: { nl: 'Afgiftesysteem', en: 'Emission system' },
        koelRegeling: { nl: 'Regeling', en: 'Regulation' },
        koelGeneratorsCount: { nl: 'Generators count', en: 'Generators count' },
        koelMainCirculationPump: { nl: 'Hoofdcirculatiepomp', en: 'Main circulation pump' },

        zonSysteem: { nl: 'Systeem type', en: 'System type' },
        zonMerkType: { nl: 'Merk & Type', en: 'Brand & Type' },
        zonSpecsBcrg: { nl: 'Kwaliteitsverklaring/BCRG', en: 'Specs/BCRG' },
        zonAantal: { nl: 'Aantal panelen', en: 'Panels count' },
        zonHellingshook: { nl: 'Hellingshoek', en: 'Tilt angle' },
        zonCode: { nl: 'Code', en: 'Code' },
        zonOppPerPanelen: { nl: 'Oppervlakte per paneel', en: 'Area per panel' },
        zonWattpiekvermogen: { nl: 'Wattpiekvermogen', en: 'Watt-peak power' },
        zonBouwintegratie: { nl: 'Bouwintegratie', en: 'Building integration' },
        zonOrientatie: { nl: 'Oriëntatie', en: 'Orientation' }
      };

      const match = labels[key];
      if (match) {
        return isEn ? match.en : match.nl;
      }
      return key;
    };

    const getInstallTab = (key: string): string => {
      if (key.startsWith('vent') || key.endsWith('Ventilatie')) return 'Ventilatie';
      if (key.startsWith('verwarm') || key.endsWith('Verwarming')) return 'Verwarming';
      if (key.startsWith('tap') || key.endsWith('Tapwater')) return 'Tapwater';
      if (key.startsWith('koel') || key.endsWith('Koeling')) return 'Koeling';
      if (key.startsWith('zon') || key.endsWith('Zonne-panelen')) return 'Zonne-panelen';
      return 'Verwarming';
    };

    // 1. Process general
    Object.entries(algemeen).forEach(([key, color]) => {
      if (color) {
        // Skip aantal flag if leidingdoorvoeren is not 'Ja'
        if (key === 'aantal' && data.algemeen?.technical?.leidingdoorvoeren !== 'Ja') {
          return;
        }

        items.push({
          id: `algemeen-${key}`,
          label: generalKeyLabels[key] || key,
          section: 'Algemeen',
          viewTarget: 'algemeen',
          color
        });
      }
    });

    // 2. Process installations
    Object.entries(installatie).forEach(([fullKey, color]) => {
      if (color) {
        // Strip installation prefix if present (e.g. "1_verwarmSpecsBcrg" -> "verwarmSpecsBcrg")
        const key = fullKey.includes('_') ? fullKey.split('_').slice(1).join('_') : fullKey;
        const subTab = getInstallTab(key);
        items.push({
          id: `installatie-${fullKey}`,
          label: `${getInstallLabel(key)} (${subTab})`,
          section: `Installaties`,
          viewTarget: 'installatie',
          subTabTarget: subTab,
          color
        });
      }
    });

    // 3. Process constructions
    Object.entries(constructie).forEach(([key, color]) => {
      if (color) {
        const row = data.constructies?.find(c => c.id === key);
        if (row) {
          items.push({
            id: `constructie-${key}`,
            label: `[${row.type}] ${row.naam || 'Naamloos'}`,
            section: 'Bouwkundig',
            viewTarget: 'constructie',
            subTabTarget: row.type,
            color
          });
        }
      }
    });

    // 4. Process Kozijnen
    Object.entries(kozijn).forEach(([key, color]) => {
      if (color) {
        const row = data.kozijnen?.find(k => k.id === key);
        if (row) {
          items.push({
            id: `kozijn-${key}`,
            label: `[Kozijn] ${row.naam || 'Naamloos'}`,
            section: 'Kozijnen',
            viewTarget: 'geometry-kozijn',
            color
          });
        }
      }
    });

    // 5. Process Geometry/Bouwkundig (Gevel, Vloer, Dak, Overstek)
    Object.entries(geometry).forEach(([key, color]) => {
      if (color) {
        if (key.startsWith('bouwkundig_')) {
          const idx = parseInt(key.replace('bouwkundig_', ''), 10);
          const row = data.bouwkundigRows?.[idx];
          if (row) {
            items.push({
              id: `geometry-${key}`,
              label: `[${row.type}] ${row.naam || 'Naamloos'}`,
              section: row.type || 'Bouwkundig',
              viewTarget: row.type === 'Gevel' ? 'bouwkundig-gevel' : (row.type === 'Vloer' ? 'bouwkundig-vloer' : 'bouwkundig-dak'),
              color
            });
          }
        } else if (key.startsWith('overstek_')) {
          const idx = parseInt(key.replace('overstek_', ''), 10);
          const row = data.overstekRows?.[idx];
          if (row) {
            items.push({
              id: `geometry-${key}`,
              label: `[Overstek] ${row.gevel || ''} (${row.conclusion || 'Naamloos'})`,
              section: 'Overstek',
              viewTarget: 'geometry-overstek',
              color
            });
          }
        } else if (key.startsWith('library_')) {
          const libId = key.replace('library_', '');
          const row = data.kozijnenLibrary?.find(k => k.id === libId) || data.kozijnen?.find(k => k.id === libId);
          if (row) {
            items.push({
              id: `geometry-${key}`,
              label: `[Kozijn] ${row.naam || 'Naamloos'}`,
              section: 'Kozijnen',
              viewTarget: 'geometry-kozijn',
              color
            });
          }
        }
      }
    });

    // 6. Process Photos
    Object.entries(fotos).forEach(([key, color]) => {
      if (color) {
        const row = data.constructies?.find(c => c.id === key);
        if (row) {
          items.push({
            id: `fotos-${key}`,
            label: `[Foto's] ${row.naam || 'Naamloos'}`,
            section: "Foto's",
            viewTarget: 'woningdossier',
            color
          });
        }
      }
    });

    return items;
  };

  const allFlags = getFlagsList();
  const redFlags = allFlags.filter(i => i.color === 'red');
  const yellowFlags = allFlags.filter(i => i.color === 'yellow');
  const greenFlags = allFlags.filter(i => i.color === 'green');

  const handleNavigate = (item: any) => {
    if (item.subTabTarget) {
      if (item.viewTarget === 'installatie') {
        localStorage.setItem('installatie_selected_category', item.subTabTarget);
        // Extract installation ID from item.id (format: "installatie-1689..._verwarmSpecsBcrg")
        const keyPart = item.id.replace('installatie-', '');
        if (keyPart.includes('_')) {
          const instId = keyPart.split('_')[0];
          localStorage.setItem('installatie_active_id', instId);
        }
      } else if (item.viewTarget === 'constructie') {
        localStorage.setItem('constructie_active_tab', item.subTabTarget);
      }
    }
    onViewChange(item.viewTarget);
  };

  const calculateAlgemeenPercentage = (): number => {
    if (!data?.algemeen) return 0;

    const fieldsToCheck = [
      data.algemeen.woning?.bouwfase,
      data.algemeen.woning?.opname,
      data.algemeen.woning?.adres,
      data.algemeen.woning?.gebouwtype,
      data.algemeen.woning?.subtype,
      data.algemeen.woning?.ligging,
      data.algemeen.woning?.daktype,
      data.algemeen.woning?.gebouwhoogte,
      data.algemeen.woning?.postcode,
      data.algemeen.woning.pandId,
      data.algemeen.woning.vboId,
      data.algemeen.woning.plaats,
      data.algemeen.woning.wijk,
      data.algemeen.woning.gemeent,
      data.algemeen.woning.svbStatus,
      data.algemeen.woning.bron,
      data.algemeen.technical?.leidingdoorvoeren,
      data.algemeen.technical?.avr,
    ];

    const filledFields = fieldsToCheck.filter(
      (field) => field !== undefined && field !== null && String(field).trim() !== ''
    );

    const gboTs = data.algemeen.technical?.gboTs || [];
    const hasFilledGboT = gboTs.length > 0 && gboTs.every(
      (val) => val !== undefined && val !== null && String(val).trim() !== ''
    );

    const totalFields = fieldsToCheck.length + 1;
    const filledCount = filledFields.length + (hasFilledGboT ? 1 : 0);

    return Math.round((filledCount / totalFields) * 100);
  };

  const algemeenPercent = calculateAlgemeenPercentage();

  return (
    <div className="flex-1 bg-background p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Title */}
        <div className="pb-2">
          <h1 className="text-3xl font-black text-on-background tracking-tight">
            {t('nav.dashboard') || 'Overzicht'}
          </h1>
        </div>

        {/* Dashboard stats grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 border border-outline-variant/10 rounded-2xl shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <div className="text-4xl font-display font-black text-primary mb-2">A++</div>
            <div className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-bold text-center">
              {t('dashboard.energyLabelPrelim') || 'Energy Label'}
            </div>
          </div>
          <div className="bg-white p-6 border border-outline-variant/10 rounded-2xl shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <div className="text-4xl font-display font-black text-on-surface-variant/80 mb-2">72.4</div>
            <div className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-bold text-center">
              EP1 (kWh/m²)
            </div>
          </div>
          <div className="bg-white p-6 border border-outline-variant/10 rounded-2xl shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <div className="text-4xl font-display font-black text-on-surface-variant/80 mb-2">94.2</div>
            <div className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-bold text-center">
              EP2 (kWh/m²)
            </div>
          </div>
          <div className="bg-white p-6 border border-outline-variant/10 rounded-2xl shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
            <div className="text-4xl font-display font-black text-emerald-600 mb-2">82%</div>
            <div className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-bold text-center">
              EP3
            </div>
          </div>
        </div>

        {/* Recent findings and Completion progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Findings Card */}
          <div className="bg-white p-5 border border-outline-variant/10 rounded-2xl shadow-sm flex flex-col h-[320px]">
            <h3 className="font-display font-black text-sm text-on-background mb-4 flex items-center gap-2 shrink-0">
              <LayoutDashboard size={16} className="text-primary" />
              {t('dashboard.recentFindings') || 'Recente bevindingen'}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              
              {/* Red Flags Group */}
              <div>
                <div 
                  onClick={() => toggleColor('red')}
                  className="flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer hover:bg-red-50/40 border border-red-100/50 bg-red-50/20 text-red-700 font-bold transition-all select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider font-black">Rood (Fout / Actie vereist)</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-black rounded-full leading-none">{redFlags.length}</span>
                  </div>
                  {expandedColors.red ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedColors.red && (
                  <ul className="mt-2 pl-2 space-y-1 border-l border-red-100/70 ml-4 animate-in slide-in-from-top-1 duration-150">
                    {redFlags.length === 0 ? (
                      <li className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-wider py-2 pl-2">Geen rode vlaggen gevonden</li>
                    ) : (
                      redFlags.map(item => (
                        <li 
                          key={item.id} 
                          onClick={() => handleNavigate(item)}
                          className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg hover:bg-red-50/50 cursor-pointer text-on-surface-variant hover:text-red-700 font-semibold group transition-all"
                        >
                          <span className="text-[8px] font-black uppercase text-on-surface-variant/40 bg-gray-100 px-1 py-0.5 rounded leading-none group-hover:bg-red-100 group-hover:text-red-800 select-none">{item.section}</span>
                          <span className="flex-1 truncate">{item.label}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* Yellow Flags Group */}
              <div>
                <div 
                  onClick={() => toggleColor('yellow')}
                  className="flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer hover:bg-amber-50/40 border border-amber-100/50 bg-amber-50/20 text-amber-700 font-bold transition-all select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] uppercase tracking-wider font-black">Geel (Twijfel / Controle)</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full leading-none">{yellowFlags.length}</span>
                  </div>
                  {expandedColors.yellow ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedColors.yellow && (
                  <ul className="mt-2 pl-2 space-y-1 border-l border-amber-100/70 ml-4 animate-in slide-in-from-top-1 duration-150">
                    {yellowFlags.length === 0 ? (
                      <li className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-wider py-2 pl-2">Geen gele vlaggen gevonden</li>
                    ) : (
                      yellowFlags.map(item => (
                        <li 
                          key={item.id} 
                          onClick={() => handleNavigate(item)}
                          className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg hover:bg-amber-50/50 cursor-pointer text-on-surface-variant hover:text-amber-700 font-semibold group transition-all"
                        >
                          <span className="text-[8px] font-black uppercase text-on-surface-variant/40 bg-gray-100 px-1 py-0.5 rounded leading-none group-hover:bg-amber-100 group-hover:text-amber-800 select-none">{item.section}</span>
                          <span className="flex-1 truncate">{item.label}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* Green Flags Group */}
              <div>
                <div 
                  onClick={() => toggleColor('green')}
                  className="flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer hover:bg-green-50/40 border border-green-100/50 bg-green-50/20 text-green-700 font-bold transition-all select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                    <span className="text-[10px] uppercase tracking-wider font-black">Groen (Akkoord / Gecontroleerd)</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-black rounded-full leading-none">{greenFlags.length}</span>
                  </div>
                  {expandedColors.green ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                {expandedColors.green && (
                  <ul className="mt-2 pl-2 space-y-1 border-l border-green-100/70 ml-4 animate-in slide-in-from-top-1 duration-150">
                    {greenFlags.length === 0 ? (
                      <li className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-wider py-2 pl-2">Geen groene vlaggen gevonden</li>
                    ) : (
                      greenFlags.map(item => (
                        <li 
                          key={item.id} 
                          onClick={() => handleNavigate(item)}
                          className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg hover:bg-green-50/50 cursor-pointer text-on-surface-variant hover:text-green-700 font-semibold group transition-all"
                        >
                          <span className="text-[8px] font-black uppercase text-on-surface-variant/40 bg-gray-100 px-1 py-0.5 rounded leading-none group-hover:bg-green-100 group-hover:text-green-800 select-none">{item.section}</span>
                          <span className="flex-1 truncate">{item.label}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white p-5 border border-outline-variant/10 rounded-2xl shadow-sm">
            <h3 className="font-display font-black text-sm text-on-background mb-4 flex items-center gap-2">
              <Save size={16} className="text-primary" />
              {t('dashboard.inspectionStatus') || 'Inspectiestatus'}
            </h3>
            <div className="space-y-4">
              <div className="cursor-pointer hover:opacity-90" onClick={() => onViewChange('algemeen')}>
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant/50 mb-1.5 uppercase tracking-wide">
                  <span>{t('dashboard.algemeenCompletion') || 'Algemene Gegevens'}</span>
                  <span>{algemeenPercent}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${algemeenPercent}%` }}
                  />
                </div>
              </div>
              <div className="cursor-pointer hover:opacity-90" onClick={() => onViewChange('installatie')}>
                <div className="flex justify-between text-[10px] font-bold text-on-surface-variant/50 mb-1.5 uppercase tracking-wide">
                  <span>{t('dashboard.technicalSpecs') || 'Technische specificaties'}</span>
                  <span>45%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[45%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BackOfficeDashboard;
