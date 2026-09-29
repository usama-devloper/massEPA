import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { INTERIOR_SPACES_DATA, InteriorSpaceCard, SpacePhoto } from '../../data/interiorSpacesData';
import { 
  Flame, 
  Sun, 
  Wind, 
  Droplets, 
  Layers, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  X, 
  Trash2,
  AlertTriangle,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Building,
  Camera,
  AppWindow,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  Snowflake
} from 'lucide-react';
import { InstallationSystem } from '../../types';
import { MediaViewerModal } from '../../../../../components/common/MediaViewerModal';
import { AppSelect } from '../../../../../components/common/AppSelect';
import { fileToPersistedUrl } from '../../../../../utils/persistedFileUrl';
import { Plus } from 'lucide-react';

const getSelectOptions = (category: string, label: string, facadesData?: any[], specs?: any[]): string[] | null => {
  const lbl = label.toLowerCase();
  if (lbl === 'systeem') {
    if (category === 'heating') return ['Individueel', 'Gemeenschappelijk/collectief', 'Warmtelevering derden individueel', 'Warmtelevering derden gemeenschappelijk'];
    if (category === 'tapwater') return ['Individueel', 'Gemeenschappelijk/collectief', 'Externe warmtelevering via een afleverset individueel', 'Externe warmtelevering via een afleverset gemeenschappelijk (centraal)'];
    if (category === 'ventilation') return ['Individueel', 'Collectief'];
    if (category === 'solar') return ['PV-panelen', 'Zonneboiler', 'Geen'];
    if (category === 'cooling') return ['Individueel', 'Ge/collectief', 'Koudelevering derden', 'Koudelevering derden ge'];
  }
  if (lbl === 'grenst aan') {
    return ['Buitenlucht', 'Grond', 'Aangrenzend pand', 'Kruipruimte', 'Kelder'];
  }
  if (lbl === 'oriëntatie' || lbl === 'orientatie') {
    return ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
  }
  if (lbl === 'type elektromotor' || lbl === 'type ventilator') {
    return ['Gelijkstroom', 'Wisselstroom'];
  }
  if (lbl === 'natuurlijke ventilatie' || lbl === 'circulatieleiding aanwezig' || lbl === 'ventilatie' || lbl === 'dwtw') {
    return ['Ja', 'Nee'];
  }
  if (lbl === 'bouwintegratie') {
    return ['Niet geventileerd: zonder luchtspouw', 'Matig geventileerd: met luchtspouw', 'Sterk geventileerd: open draagconstructie', 'Onbekend'];
  }
  if (lbl === 'type opwekker') {
    const systeemSpec = specs?.find(s => s.label.toLowerCase() === 'systeem');
    const systeemValue = systeemSpec ? systeemSpec.value : '';
    
    if (category === 'tapwater') {
      if (systeemValue.includes('Externe warmtelevering via een afleverset')) {
        return ['Externe warmtelevering via een afleverset'];
      }
      if (systeemValue === 'Gemeenschappelijk/collectief') {
        return ['Compleet toestel', 'Direct verwarmd vat', 'Indirect verwarmd vat', 'onbekend'];
      }
      return ['Compleet toestel', 'Direct verwarmd vat', 'Indirect verwarmd vat'];
    }
    if (category === 'cooling') {
      return ['Compressiekoeling', 'Absorptiekoeling', 'Passieve vrije koeling'];
    }

    // Default to heating logic
    if (systeemValue.includes('derden')) {
      return ['Warmtelevering derden'];
    }
    return [
      'Lokale gaskachel', 'Lokale oliekachel', 'Elektrische verwarming', 'Moederhaard',
      'Gasgestookte ketel', 'Oliegestookte ketel', 'WKK', 'Warmtepomp gasinjectie',
      'Warmtepomp gasmotor', 'Warmtepomp elektrisch', 'Biomassakachel',
      'Biomassaketel handmatig gestookt', 'Biomassaketel automatisch gestookt'
    ];
  }
  if (lbl === 'distributiemedium') {
    return ['Water', 'Local'];
  }
  if (lbl === 'wateraanvoertemperatuur') {
    if (category === 'cooling') {
      return ['6/12 °C', '12/16 °C', '12/18 °C', '17/21 °C', 'Onbekend'];
    }
    return ['30/27 °C', '35/30 °C', '40/35 °C', '45/40 °C', '50/42 °C', '55/47 °C', '60/50 °C', '65/55 °C', '70/60 °C', '75/65 °C', '80/60 °C', '90/70 °C'];
  }
  if (lbl === 'afgiftesysteem') {
    return ['Radiatoren / convectoren', 'Ventilatorgestuurde radiatoren en/of convectoren', 'Vloerverwarming', 'Luchtverwarming', 'Overig van'];
  }
  if (lbl === 'afgiftesysteem keuken' || lbl === 'afgiftesysteem badkamer') {
    return ['< 2 m', '2 m <= 1 < 4 m', '4 m <= 1 < 6 m', '6 m <= 1 < 8 m', '8 m <= 1 < 10 m', '10 m <= 1 < 12 m', '12 m <= 1 < 14 m', '>= 14 m'];
  }
  if (lbl === 'ventilatiesysteem') {
    return ['A Natuurlijke ventilatie', 'B Mechanische afvoer', 'C Mechanische afvoer', 'D Mechanische balansventilatie', 'E Gecombineerd systeem'];
  }
  if (lbl === 'subsysteem') {
    const vsSpec = specs?.find(s => s.label.toLowerCase() === 'ventilatiesysteem');
    const vs = vsSpec ? vsSpec.value : '';
    if (vs.startsWith('A')) return ['A1 Standaard (toevoer niet luchtdruk gestuurd)', 'A2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'A2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'A2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003'];
    if (vs.startsWith('B')) return ['B1 Standaard', 'B2 Tijdssturing op installaties, zonder zonering', 'B3 CO2-meting per verblijfsruimte, CO2-sturing op installaties, met zonering'];
    if (vs.startsWith('C')) return ['C1 Standaard', 'C2a Luchtdrukgestuurde toevoer delta p <= 1 Pa', 'C2b Luchtdrukgestuurde toevoer 1 Pa < delta p <= 5 Pa', 'C2c Luchtdrukgestuurde toevoer 5 Pa < delta p <= 10 Pa', 'Type onbekend, zelfregelende klep aanwezig, bouwjaar rekenzone', 'Type onbekend, zelfregelende klep aanwezig, geplaatst > 2003', 'C3a Tijdsturing afvoer, zonder zonering', 'C3b Luchtdrukgestuurde toevoer delta p <= 1 PA, tijdsturing afvoer, zonder zor', 'C3c Tijdsturing toevoer, afvoer zonder zonering', 'C4a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-m', 'C4b CO2-sturing op de toevoer in ten minste de woonk. en de hoofdslaapk., zo', 'C4c Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-m', 'C5a Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-m', 'C5b Luchtdrukgestuurde toevoer delta p <= 1 Pa, sturing op afvoer door CO2-m'];
    if (vs.startsWith('D')) return ['D1 Standaard', 'D2 Centrale WTW-installatie zonder zoneringen en zonder sturing', 'D3 Centrale WTW, sturing van afvoer CO2-meting in de WTW, geen zonering', 'D4a Tijdsturing zonder zonering', 'D4b Tijdsturing met zonering', 'D5a Centrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5b Decentrale WTW. CO2-metingen in ten minste de woonkamer en de hoofdslaapkamer', 'D5c Centrale WTW. CO2-metingen in ten minste de woon- en hoofdslaapkamer'];
    if (vs.startsWith('E')) return ['E1 Systeemdeel D: decentrale WTW (Systeem D.5b); Systeemdeel met een'];
    return [];
  }
  if (lbl === 'luchtdichtheidsklasse') {
    return ['LUKA A B of C', 'LUKA D', 'Geen kanaal', 'Onbekend'];
  }
  if (lbl === 'opgave ventilatoren') {
    return ['Nominaal vermogen', 'Nominaal vermogen onbekend', 'Kwaliteitsverklaring', 'Onbekend'];
  }
  if (lbl === 'regeling') {
    return ['Regeling in hoofdvertrek (kamerthermostaat)', 'Centrale regeling met individuele regeling per ruimte', 'Individuele regeling per ruimte', 'Overig of onbekend'];
  }
  if (lbl === 'rbw-waarde wanden kruipruimte') {
    if (facadesData && facadesData.length > 0) {
      return Array.from(new Set(facadesData.map(f => {
        const title = f.title || f.gevelType || 'Gevel';
        return title;
      })));
    }
    return ['Voorgevel', 'Achtergevel', 'Linkergevel', 'Rechtergevel'];
  }
  if (lbl === 'invoermethode') {
    return ['Decision Tree', 'Quality Declaration'];
  }
  if (lbl === 'isolatie aanwezig') {
    return ['Nee', 'Ja'];
  }
  if (lbl === 'overstek & belemmering' || lbl === 'overstek/belemm.') {
    return [
      'Automatic', 'Minimal obstruction', 'Overhang', 'Other obstacle',
      'Complete obstruction', 'Constant hindrance', 'Side obstruction',
      'Overhang + (side) obstruction'
    ];
  }
  if (lbl === 'zonwering') {
    return [
      'Geen zonwering', 'Vaste zonwering', 'Buitenscherm', 'Knikarmscherm',
      'Schermen (buiten)', 'Jaloezieën (buiten)', 'Gemetalliseerde oppervlakken (binnen)',
      'Rolluiken (buiten)', 'Automatisch'
    ];
  }
  if (lbl === 'generator type') {
    return ['Compressiekoeling', 'Absorptiekoeling', 'Passieve vrije koeling'];
  }
  if (lbl === 'expansie') {
    return ['Directe koeling in de ruimte (airconditioning)', 'Directe koeling in het LBK (DX-systeem)', 'Met indirecte verdamping'];
  }
  if (lbl === 'delivery system' || lbl === 'type afgiftesysteem' || (lbl === 'afgiftesysteem' && category === 'cooling')) {
    return ['Vloerkoeling', 'Wandkoeling', 'Plafondkoeling', 'Ventilatorconvectoren (aan plafond)', 'Ventilatorconvectoren (aan buitenmuur)', 'Overig of onbekend'];
  }
  if (lbl === 'aantal opwekkers') {
    return ['Een', 'Twee', 'Drie'];
  }
  if (lbl === 'kwaliteitsverklaring koude opwekker') {
    return ['Ja', 'Nee'];
  }
  if (lbl === 'hoofdcirculatiepomp') {
    return ['Werkelijk vermogen en EI', 'Werkelijk vermogen', 'Onbekend'];
  }
  if (lbl === 'type regeling afgiftesysteem') {
    return ['Standalone regeling', 'Centrale regeling', 'Overig of onbekend'];
  }
  return null;
}

interface InteriorSpacesSectionProps {
  installations: InstallationSystem;
  facadesData?: any[];
  onUpdateInstallations: (updated: Partial<InstallationSystem>) => void;
  usableAreaAg: number;
  onSwitchToCalculationTab?: () => void;
  onOpenBcrgCode?: (code: string) => void;
  onUpdateSpacesCount?: (count: number) => void;
  interiorSpacesData?: InteriorSpaceCard[];
  onUpdateInteriorSpacesData?: (data: InteriorSpaceCard[]) => void;
}

export const InteriorSpacesSection: React.FC<InteriorSpacesSectionProps> = ({
  installations,
  facadesData,
  onUpdateInstallations,
  usableAreaAg,
  onSwitchToCalculationTab,
  onOpenBcrgCode,
  onUpdateSpacesCount,
  interiorSpacesData,
  onUpdateInteriorSpacesData
}) => {
  const { t } = useLanguage();
  const [spacesData, setSpacesData] = useState<InteriorSpaceCard[]>(interiorSpacesData && interiorSpacesData.length > 0 ? interiorSpacesData : INTERIOR_SPACES_DATA);
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState<'all' | 'Hal' | 'MK' | 'Livingroom' | 'WC' | 'Keuken' | 'Slaapkamer'>('all');
  const [activePhotoModal, setActivePhotoModal] = useState<{
    title: string;
    urls: string[];
    currentIndex: number;
    description?: string;
  } | null>(null);
  const [copiedBcrg, setCopiedBcrg] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedSpaceFilter]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    if (onUpdateSpacesCount) {
      onUpdateSpacesCount(spacesData.length);
    }
    if (onUpdateInteriorSpacesData) {
      onUpdateInteriorSpacesData(spacesData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacesData]);

  const filteredCards = selectedSpaceFilter === 'all'
    ? spacesData
    : spacesData.filter(c => c.spaceType === selectedSpaceFilter);

  const handleUpdateSpace = (cardId: string, updater: (card: InteriorSpaceCard) => InteriorSpaceCard) => {
    setSpacesData(prev => prev.map(c => c.id === cardId ? updater(c) : c));
  };

  const handleRemoveSpace = (cardId: string) => {
    setDeleteConfirmation(cardId);
  };

  const executeDelete = () => {
    if (deleteConfirmation) {
      setSpacesData(prev => prev.filter(c => c.id !== deleteConfirmation));
      setDeleteConfirmation(null);
    }
  };

  const addInstallationToCurrentRoom = (category: 'floor' | 'heating' | 'tapwater' | 'solar' | 'ventilation' | 'window' | 'cooling') => {
    if (selectedSpaceFilter === 'all') return;
    
    setIsAdding(false);

    const newId = `space-${selectedSpaceFilter.toLowerCase()}-${category}-${Date.now()}`;
    
    // Determine section title and icon based on category
    let baseTitle = '';
    let icon = '';
    let defaultSpecs: any[] = [];
    
    switch (category) {
      case 'floor':
        baseTitle = 'Vloer'; icon = 'Layers';
        defaultSpecs = [
          { label: 'Isolatie', value: '-' }, 
          { label: 'Grenst aan', value: 'Buitenlucht' }, 
          { label: 'Area', value: '0 m2', length: '', width: '' }, 
          { label: 'Perimeter', value: '0 m' },
          { label: 'Bodemisolatie kruipruimte', value: 'Ongeisoleerd' },
          { label: 'Rbw-waarde wanden kruipruimte', value: 'Onbekend' }
        ];
        break;
      case 'heating':
        baseTitle = 'Verwarming'; icon = 'Flame';
        defaultSpecs = [
          { label: 'Systeem', value: 'Individueel' }, 
          { label: 'Brand & Type', value: '-' }, 
          { label: 'BCRG', value: '-' },
          { label: 'Type opwekker', value: 'Gasgestookte ketel' },
          { label: 'Distributiemedium', value: 'Water' },
          { label: 'Wateraanvoertemperatuur', value: '90/70 °C' },
          { label: 'Afgiftesysteem', value: 'Radiatoren / convectoren' },
          { label: 'Regeling', value: 'Regeling in hoofdvertrek' }
        ];
        break;
      case 'tapwater':
        baseTitle = 'Tapwater'; icon = 'Droplets';
        defaultSpecs = [
          { label: 'Systeem', value: 'Individueel' }, 
          { label: 'Brand & Type', value: '-' }, 
          { label: 'BCRG', value: '-' },
          { label: 'Opwekker', value: 'Compleet toestel' },
          { label: 'Aflevertemperatuur', value: 'Onbekend' },
          { label: 'Afgiftesysteem keuken', value: '< 2 m' },
          { label: 'Afgiftesysteem badkamer', value: '< 2 m' },
          { label: 'Circulatieleiding aanwezig', value: 'Nee' }
        ];
        break;
      case 'solar':
        baseTitle = 'Zonne-Energie'; icon = 'Sun';
        defaultSpecs = [
          { label: 'Brand & Type', value: '-' },
          { label: 'BCRG', value: '-' },
          { label: 'Hellingshoek', value: '0' },
          { label: 'Aantal', value: '0' },
          { label: 'Orientatie', value: 'Z' },
          { label: 'Wattpiekvermogen', value: '0' },
          { label: 'Bouwintegratie', value: 'Niet geventileerd: zonder luchtspouw' }
        ];
        break;
      case 'ventilation':
        baseTitle = 'Ventilatie'; icon = 'Wind';
        defaultSpecs = [
          { label: 'Systeem', value: 'Individueel' }, 
          { label: 'Brand & Type', value: '-' }, 
          { label: 'BCRG', value: '-' },
          { label: 'Ventilatiesysteem', value: 'C Mechanische afvoer' },
          { label: 'Subsysteem', value: 'C1 Standaard' },
          { label: 'Luchtdichtheidsklasse', value: 'Onbekend' },
          { label: 'Opgave ventilatoren', value: 'Onbekend' },
          { label: 'Type elektromotor', value: 'Wisselstroom' },
          { label: 'Natuurlijke ventilatie', value: 'Nee' }
        ];
        break;
      case 'window':
        baseTitle = 'Kozijn'; icon = 'AppWindow';
        defaultSpecs = [
          { label: 'Brand & Type', value: '-' },
          { label: 'Oppervlakte', value: '0 m2', length: '', width: '' },
          { label: 'Invoermethode', value: 'Decision Tree' },
          { label: 'Isolatie aanwezig', value: 'Nee' },
          { label: 'U-waarde', value: '1.0' },
          { label: 'g [-]', value: '0.6' },
          { label: 'Overstek & Belemmering', value: 'Minimal obstruction' },
          { label: 'Zonwering', value: 'Geen zonwering' }
        ];
        break;
      case 'cooling':
        baseTitle = 'Koeling'; icon = 'Snowflake';
        defaultSpecs = [
          { label: 'Systeem', value: 'Individueel' },
          { label: 'Totaal gebruiksoppervlakte systeem', value: '0 m2' },
          { label: 'Aantal opwekkers', value: 'Een' },
          { label: 'Brand & Type', value: '-' },
          { label: 'Installatiejaar', value: '0' },
          { label: 'Type opwekker', value: 'Compressiekoeling' },
          { label: 'Expansie', value: 'Directe koeling in de ruimte (airconditioning)' },
          { label: 'Totaal vermogen opwekker [kW]', value: '0' },
          { label: 'Kwaliteitsverklaring koude opwekker', value: 'Nee' },
          { label: 'Rendement / EER [-]', value: '0' },
          { label: 'Code', value: '-' },
          { label: 'Distributiemedium', value: 'Water' },
          { label: 'Wateraanvoertemperatuur', value: 'Onbekend' },
          { label: 'Hoofdcirculatiepomp', value: 'Onbekend' },
          { label: 'Vermogen hoofdcirculatiepomp [W]', value: '0' },
          { label: 'Aantal bouwlagen leidingen', value: '0' },
          { label: 'Type Afgiftesysteem', value: 'Vloerkoeling' },
          { label: 'Type regeling afgiftesysteem', value: 'Standalone regeling' }
        ];
        break;
    }

    const existingTitles = spacesData
      .filter(c => c.spaceType === selectedSpaceFilter && c.category === category)
      .map(c => c.sectionTitle);

    let highestNumber = 1;
    existingTitles.forEach(t => {
      const match = t.match(/\d+$/);
      if (match) {
        highestNumber = Math.max(highestNumber, parseInt(match[0], 10));
      }
    });
    
    const newNumber = existingTitles.length > 0 ? highestNumber + 1 : 1;
    const finalSectionTitle = newNumber > 1 ? `${baseTitle} ${newNumber}` : baseTitle;

    const newCard: InteriorSpaceCard = {
      id: newId,
      spaceName: `${selectedSpaceFilter}`,
      spaceType: selectedSpaceFilter as any,
      sectionTitle: finalSectionTitle,
      category,
      icon,
      badgeCode: '',
      specs: defaultSpecs,
      photos: []
    };
    
    setSpacesData(prev => [...prev, newCard]);
  };

  const handleUploadPhoto = (cardId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length > 0) {
        const newUrls = await Promise.all(
          files.map(async (file) => await fileToPersistedUrl(file))
        );
        handleUpdateSpace(cardId, (card) => {
          const newPhotos = newUrls.map((url, idx) => ({
            id: `photo-${Date.now()}-${idx}`,
            url,
            caption: t('invoersheetV2.interiorSpaces.newInspectionPhotoAdded')
          }));
          return { ...card, photos: [...card.photos, ...newPhotos] };
        });
      }
    };
    input.click();
  };

  const handleCopyBcrg = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedBcrg(code);
    setTimeout(() => setCopiedBcrg(null), 2000);
  };

  const getCategoryIcon = (category: InteriorSpaceCard['category']) => {
    switch (category) {
      case 'floor':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'heating':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'tapwater':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'solar':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'ventilation':
        return <Wind className="w-4 h-4 text-teal-600" />;
      case 'window':
        return <AppWindow className="w-4 h-4 text-indigo-600" />;
      case 'cooling':
        return <Snowflake className="w-4 h-4 text-cyan-500" />;
      default:
        return <Building className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Smart Filter Tabs */}
      <div className="relative flex items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 w-full overflow-hidden">
        {showLeftArrow && (
          <button 
            onClick={() => scrollByAmount(-200)}
            className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-slate-100 via-slate-100 to-transparent text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-l-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-4"
        >
          <button
            ref={selectedSpaceFilter === 'all' ? activeTabRef : null}
            onClick={() => setSelectedSpaceFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedSpaceFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {t('invoersheetV2.interiorSpaces.allSpaces')} ({spacesData.length})
          </button>
          <button
            ref={selectedSpaceFilter === 'Hal' ? activeTabRef : null}
            onClick={() => setSelectedSpaceFilter('Hal')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedSpaceFilter === 'Hal'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {t('invoersheetV2.interiorSpaces.hall')}
          </button>
          <button
            ref={selectedSpaceFilter === 'MK' ? activeTabRef : null}
            onClick={() => setSelectedSpaceFilter('MK')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedSpaceFilter === 'MK'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {t('invoersheetV2.interiorSpaces.meterCupboard')}
          </button>
          <button
            ref={selectedSpaceFilter === 'Livingroom' ? activeTabRef : null}
            onClick={() => setSelectedSpaceFilter('Livingroom')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedSpaceFilter === 'Livingroom'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {t('invoersheetV2.interiorSpaces.livingRoom')}
          </button>
          <button
            ref={selectedSpaceFilter === 'WC' ? activeTabRef : null}
            onClick={() => setSelectedSpaceFilter('WC')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedSpaceFilter === 'WC'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {t('invoersheetV2.interiorSpaces.toilet')}
          </button>
          <button
            ref={selectedSpaceFilter === 'Keuken' ? activeTabRef : null}
            onClick={() => setSelectedSpaceFilter('Keuken')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedSpaceFilter === 'Keuken'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {t('invoersheetV2.interiorSpaces.kitchen')}
          </button>
          <button
            ref={selectedSpaceFilter === 'Slaapkamer' ? activeTabRef : null}
            onClick={() => setSelectedSpaceFilter('Slaapkamer')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedSpaceFilter === 'Slaapkamer'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {t('invoersheetV2.interiorSpaces.bedroom')}
          </button>
        </div>

        {showRightArrow && (
          <button 
            onClick={() => scrollByAmount(200)}
            className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-slate-100 via-slate-100 to-transparent text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-r-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Interior Space Cards List */}
      <div className="space-y-6">
        {filteredCards.map((card) => (
          <div 
            key={card.id} 
            className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-slate-300"
          >
            {/* Header bar matching the Visuals / Exterior chapter design */}
            <div className="bg-primary text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">

                <h3 className="font-display font-semibold text-base tracking-wide flex items-center space-x-2">
                  <span className="text-emerald-500">{card.spaceName === 'MK' ? t('invoersheetV2.interiorSpaces.meterCupboard') : card.spaceName === 'Hal' ? t('invoersheetV2.interiorSpaces.hall') : card.spaceName === 'Livingroom' ? t('invoersheetV2.interiorSpaces.livingRoom') : card.spaceName === 'WC' ? t('invoersheetV2.interiorSpaces.toilet') : card.spaceName === 'Keuken' ? t('invoersheetV2.interiorSpaces.kitchen') : card.spaceName === 'Slaapkamer' ? t('invoersheetV2.interiorSpaces.bedroom') : card.spaceName}</span>
                  <span className="text-slate-300 font-normal">•</span>
                  <span className="text-white">{t(`invoersheetV2.interiorSpaces.types.${card.category}`)} {card.sectionTitle.replace(/[^\d]/g, '')}</span>
                </h3>
              </div>
              
              <button
                onClick={() => handleRemoveSpace(card.id)}
                className="text-white/60 hover:text-red-300 transition-colors p-1"
                title={t('invoersheetV2.interiorSpaces.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Main Card Content: Specs on Left, Photos on Right */}
            <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Technical Specifications Box */}
              <div className="lg:col-span-7 xl:col-span-7">
                <div className="rounded-2xl border-2 border-slate-300/80 bg-slate-50/40 p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-bold text-base text-primary flex items-center space-x-2 tracking-tight">
                      {getCategoryIcon(card.category)}
                      <span>{t(`invoersheetV2.interiorSpaces.types.${card.category}`)} {card.sectionTitle.replace(/[^\d]/g, '')}</span>
                    </h4>

                  </div>

                  <dl className="space-y-2.5 text-xs">
                    {card.specs.map((spec, sIdx) => {
                      const extractValueAndUnit = (val: string, label: string) => {
                        const lbl = label.toLowerCase();
                        if (['hellingshoek', 'aantal', 'wattpiekvermogen'].includes(lbl)) {
                          const parsed = parseFloat(val);
                          return { num: isNaN(parsed) ? val : parsed.toString(), unit: null, isNumber: true };
                        }
                        const match = val.match(/^(.*?)\s*(m2|m|mm|W|kW|°|Wp)$/i);
                        if (match) {
                          const numPart = match[1].trim();
                          if (!isNaN(Number(numPart))) {
                            return { num: numPart, unit: match[2], isNumber: true };
                          }
                        }
                        return { num: val, unit: null, isNumber: false };
                      };
                      const { num, unit, isNumber } = extractValueAndUnit(spec.value, spec.label);
                      const selectOptions = getSelectOptions(card.category, spec.label, facadesData, card.specs);

                      if (spec.label === '---SECTION---') {
                        return (
                          <div key={sIdx} className="col-span-full pt-4 pb-2 first:pt-0 border-b border-slate-200/80 mb-2">
                            <h5 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                              {spec.value === 'Ventilatie' ? <Wind className="w-4 h-4 text-teal-600" /> : <AppWindow className="w-4 h-4 text-indigo-600" />}
                              <span>{spec.value}</span>
                            </h5>
                          </div>
                        );
                      }

                      return (
                        <div 
                        key={sIdx}
                        className="flex flex-col sm:flex-row sm:items-baseline justify-between py-1 border-b border-slate-100 last:border-0 gap-1"
                      >
                        <dt className="font-semibold text-slate-800 min-w-[160px] flex items-center space-x-1">
                          <span>{spec.label}</span>
                          <span>:</span>
                        </dt>
                        <dd className="sm:text-right font-medium text-slate-900 flex items-center sm:justify-end space-x-2">
                          {spec.label.toLowerCase() === 'area' || spec.label.toLowerCase() === 'oppervlakte' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={spec.length || ''}
                                onChange={(e) => handleUpdateSpace(card.id, c => ({
                                  ...c,
                                  specs: c.specs.map((s, i) => {
                                    if (i !== sIdx) return s;
                                    const l = parseFloat(e.target.value) || 0;
                                    const w = parseFloat(s.width || '0') || 0;
                                    const a = (l * w).toFixed(2);
                                    return { ...s, length: e.target.value, value: `${a} m2` };
                                  })
                                }))}
                                placeholder="L"
                                className="w-14 text-xs font-mono font-semibold text-slate-900 bg-slate-50 px-1 py-0.5 rounded border border-slate-200 outline-none focus:border-primary text-center"
                              />
                              <span className="text-slate-400 font-mono text-xs">×</span>
                              <input
                                type="number"
                                value={spec.width || ''}
                                onChange={(e) => handleUpdateSpace(card.id, c => ({
                                  ...c,
                                  specs: c.specs.map((s, i) => {
                                    if (i !== sIdx) return s;
                                    const w = parseFloat(e.target.value) || 0;
                                    const l = parseFloat(s.length || '0') || 0;
                                    const a = (l * w).toFixed(2);
                                    return { ...s, width: e.target.value, value: `${a} m2` };
                                  })
                                }))}
                                placeholder="B"
                                className="w-14 text-xs font-mono font-semibold text-slate-900 bg-slate-50 px-1 py-0.5 rounded border border-slate-200 outline-none focus:border-primary text-center"
                              />
                              <span className="text-slate-400 font-mono text-xs">=</span>
                              <input
                                type="number"
                                step="any"
                                value={num}
                                onChange={(e) => handleUpdateSpace(card.id, c => ({
                                  ...c,
                                  specs: c.specs.map((s, i) => i === sIdx ? { ...s, value: e.target.value + (unit ? ' ' + unit : ''), length: '', width: '' } : s)
                                }))}
                                className={`w-20 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary outline-none ${spec.highlight ? 'font-bold text-primary' : 'text-slate-700'}`}
                              />
                              {unit && <span className="text-slate-500">{unit === 'm2' ? 'm²' : unit}</span>}
                            </div>
                          ) : (
                            <>
                              {selectOptions ? (
                                <div className="w-full max-w-[200px]">
                                  <AppSelect
                                    value={spec.value}
                                    variant="compact"
                                    searchable={false}
                                    onChange={(newValue) => handleUpdateSpace(card.id, c => {
                                      let newSpecs = c.specs.map((s, i) => i === sIdx ? { ...s, value: newValue } : s);
                                      
                                      // Auto-reset dependent fields
                                      if (spec.label.toLowerCase() === 'systeem') {
                                        newSpecs = newSpecs.map(s => {
                                          if (s.label.toLowerCase() === 'type opwekker') {
                                            if (card.category === 'tapwater') {
                                              const isExterne = newValue.includes('Externe warmtelevering via een afleverset');
                                              if (isExterne) {
                                                return { ...s, value: 'Externe warmtelevering via een afleverset' };
                                              } else {
                                                if (s.value === 'Externe warmtelevering via een afleverset' || (newValue === 'Individueel' && s.value === 'onbekend')) {
                                                  return { ...s, value: 'Compleet toestel' };
                                                }
                                              }
                                            } else if (card.category === 'heating') {
                                              const isDerden = newValue.toLowerCase().includes('derden');
                                              if (isDerden) {
                                                return { ...s, value: 'Warmtelevering derden' };
                                              } else {
                                                if (s.value === 'Warmtelevering derden') {
                                                  return { ...s, value: 'Gasgestookte ketel' };
                                                }
                                              }
                                            }
                                          }
                                          return s;
                                        });
                                      }

                                      if (spec.label.toLowerCase() === 'ventilatiesysteem') {
                                        newSpecs = newSpecs.map(s => {
                                          if (s.label.toLowerCase() === 'subsysteem') {
                                            if (newValue.startsWith('A')) return { ...s, value: 'A1 Standaard (toevoer niet luchtdruk gestuurd)' };
                                            if (newValue.startsWith('B')) return { ...s, value: 'B1 Standaard' };
                                            if (newValue.startsWith('C')) return { ...s, value: 'C1 Standaard' };
                                            if (newValue.startsWith('D')) return { ...s, value: 'D1 Standaard' };
                                            if (newValue.startsWith('E')) return { ...s, value: 'E1 Systeemdeel D: decentrale WTW (Systeem D.5b); Systeemdeel met een' };
                                          }
                                          return s;
                                        });
                                      }
                                      
                                      return { ...c, specs: newSpecs };
                                    })}
                                    options={(() => {
                                      const opts = selectOptions.map(opt => ({ value: opt, label: opt }));
                                      if (!selectOptions.includes(spec.value)) {
                                        opts.unshift({ value: spec.value, label: spec.value });
                                      }
                                      return opts;
                                    })()}
                                    className={`text-right ${spec.highlight ? 'text-primary' : 'text-slate-800'}`}
                                  />
                                </div>
                              ) : (
                                <>
                                  <input
                                    type={isNumber ? "number" : "text"}
                                    step={isNumber ? "any" : undefined}
                                    value={num}
                                    onChange={(e) => handleUpdateSpace(card.id, c => ({
                                      ...c,
                                      specs: c.specs.map((s, i) => i === sIdx ? { ...s, value: e.target.value + (unit ? ' ' + unit : '') } : s)
                                    }))}
                                    className={`bg-white border hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary/20 rounded px-2 py-1 outline-none transition-all ${isNumber ? 'w-24 text-right' : 'w-full sm:w-[200px] sm:text-left'} ${spec.highlight ? 'font-bold text-primary border-primary/30' : 'text-slate-700 border-slate-200'}`}
                                  />
                                  {unit && <span className="text-slate-500">{unit === 'm2' ? 'm²' : unit}</span>}
                                </>
                              )}
                            </>
                          )}
                          {/* BCRG Button Logic */}
                          {((spec.bcrg) || (spec.label.toLowerCase() === 'bcrg')) && (
                            <button
                              onClick={() => {
                                const codeToCopy = (spec.bcrg || spec.value) !== '-' ? (spec.bcrg || spec.value) : '';
                                if (codeToCopy) {
                                  handleCopyBcrg(codeToCopy!);
                                }
                                onOpenBcrgCode?.(codeToCopy!);
                              }}
                              className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-mono transition shadow-xs ${
                                (spec.bcrg || spec.value) !== '-' && (spec.bcrg || spec.value)
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                              }`}
                              title={t('invoersheetV2.interiorSpaces.copyOrOpenBcrg')}
                            >
                              <span>
                                {copiedBcrg === (spec.bcrg || spec.value) 
                                  ? t('invoersheetV2.interiorSpaces.copied') 
                                  : (spec.bcrg || spec.value) !== '-' && (spec.bcrg || spec.value)
                                    ? t('invoersheetV2.interiorSpaces.viewBcrg')
                                    : t('invoersheetV2.interiorSpaces.searchBcrg')
                                }
                              </span>
                              <Search className="w-3 h-3 text-emerald-600" />
                            </button>
                          )}
                        </dd>
                      </div>
                      );
                    })}
                  </dl>
                </div>
              </div>

              {/* Right Column: Visual Photo Gallery */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-2">
                <div className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-primary" />
                    <span>{t('invoersheetV2.interiorSpaces.auditPhotosAndEvidence')}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{t('invoersheetV2.interiorSpaces.clickToEnlarge')}</span>
                </div>

                <div className="max-h-[320px] overflow-y-auto pr-2">
                  <div className="flex flex-wrap gap-4">
                  {card.photos.map((photo) => (
                    <div 
                      key={photo.id}
                      onClick={() => {
                        setActivePhotoModal({
                          title: `${card.spaceName} - ${card.sectionTitle}`,
                          urls: card.photos.map(p => p.url),
                          currentIndex: card.photos.findIndex(p => p.id === photo.id),
                          description: photo.caption
                        });
                      }}
                      className="group relative cursor-pointer bg-slate-900 rounded-xl overflow-hidden shadow-2xs border border-slate-200 aspect-[4/3] flex flex-col justify-between w-full sm:w-[calc(50%-0.5rem)] lg:w-full xl:w-[calc(50%-0.5rem)] shrink-0"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                      />
                      
                      {/* Hover Overlay with Zoom Icon */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                        <div className="p-2 bg-white/90 rounded-full text-slate-900 shadow-md">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Delete Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateSpace(card.id, (c) => ({
                            ...c,
                            photos: c.photos.filter((p) => p.id !== photo.id)
                          }));
                        }}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition shadow-sm z-10"
                        title={t('invoersheetV2.interiorSpaces.deletePhoto')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Tag Chip */}
                      {photo.tag && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5">
                          <span className="block truncate bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded text-center">
                            {photo.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div
                    onClick={() => handleUploadPhoto(card.id)}
                    className="group relative cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-xl overflow-hidden shadow-2xs border-2 border-dashed border-slate-300 aspect-square flex flex-col items-center justify-center transition"
                  >
                    <Plus className="w-8 h-8 text-slate-400 group-hover:text-primary transition mb-2" />
                    <span className="text-xs font-medium text-slate-500 group-hover:text-primary transition">{t('invoersheetV2.interiorSpaces.addPhoto')}</span>
                  </div>
                  </div>
                </div>


              </div>
            </div>

          </div>
        ))}
      </div>

      {selectedSpaceFilter !== 'all' && (
        <div className="flex justify-center mt-6 mb-4 relative">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl transition border-2 border-slate-300 border-dashed"
          >
            <Plus className="w-4 h-4" />
            <span>{t('invoersheetV2.interiorSpaces.addNewInstallationIn')} {selectedSpaceFilter === 'MK' ? t('invoersheetV2.interiorSpaces.meterCupboard') : selectedSpaceFilter === 'Hal' ? t('invoersheetV2.interiorSpaces.hall') : selectedSpaceFilter === 'Livingroom' ? t('invoersheetV2.interiorSpaces.livingRoom') : selectedSpaceFilter === 'WC' ? t('invoersheetV2.interiorSpaces.toilet') : selectedSpaceFilter === 'Keuken' ? t('invoersheetV2.interiorSpaces.kitchen') : selectedSpaceFilter === 'Slaapkamer' ? t('invoersheetV2.interiorSpaces.bedroom') : selectedSpaceFilter}</span>
          </button>
          
          {isAdding && (
            <>
              <div 
                className="fixed inset-0 z-[5]" 
                onClick={() => setIsAdding(false)}
              />
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
                <div className="py-1 relative z-10">
              {[
                { type: 'floor', label: t('invoersheetV2.interiorSpaces.types.floor'), icon: Layers, color: 'text-emerald-600' },
                { type: 'heating', label: t('invoersheetV2.interiorSpaces.types.heating'), icon: Flame, color: 'text-amber-600' },
                { type: 'tapwater', label: t('invoersheetV2.interiorSpaces.types.tapwater'), icon: Droplets, color: 'text-sky-600' },
                { type: 'ventilation', label: t('invoersheetV2.interiorSpaces.types.ventilation'), icon: Wind, color: 'text-teal-600' },
                { type: 'solar', label: t('invoersheetV2.interiorSpaces.types.solar'), icon: Sun, color: 'text-amber-500' },
                { type: 'window', label: t('invoersheetV2.interiorSpaces.types.window'), icon: AppWindow, color: 'text-indigo-600' },
                { type: 'cooling', label: t('invoersheetV2.interiorSpaces.types.cooling') || 'Koeling', icon: Snowflake, color: 'text-cyan-500' }
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => addInstallationToCurrentRoom(opt.type as any)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center space-x-2 transition"
                >
                  <opt.icon className={`w-4 h-4 ${opt.color}`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      )}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {t('invoersheetV2.interiorSpaces.deleteInstallationSpace')}
              </h3>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                {t('invoersheetV2.interiorSpaces.deleteConfirmation')}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
              >
                {t('invoersheetV2.interiorSpaces.cancel')}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-xs transition flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('invoersheetV2.interiorSpaces.delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activePhotoModal && (
        <MediaViewerModal
          onClose={() => setActivePhotoModal(null)}
          titlePrefix={activePhotoModal.title}
          files={activePhotoModal.urls.map((url) => ({ url, isPdf: false }))}
          initialIndex={activePhotoModal.currentIndex}
          footerText={activePhotoModal.description}
        />
      )}
    </div>
  );
};


