import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
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
  Snowflake,
  DoorClosed,
  FileText
} from 'lucide-react';
import { InstallationSystem } from '../../types';
import { MediaViewerModal } from '../../../../components/common/MediaViewerModal';
import { AppSelect } from '../../../../components/common/AppSelect';
import { PdfThumbnail } from '../../../../components/common/PdfThumbnail';
import { fileToPersistedUrl } from '../../../../utils/persistedFileUrl';
import { Plus } from 'lucide-react';

const isPdfUrl = (url: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.pdf') || lower.startsWith('data:application/pdf') || lower.includes('.pdf');
};

import { renderV1Field } from '../common/LegacyField';

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
  if (lbl === 'isolatie aanwezig' || lbl === 'insulation present') {
    return ['Ja', 'Nee', 'Onbekend'];
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
  flags?: Record<string, 'red' | 'yellow' | 'green' | null>;
  onUpdateFlag?: (fieldKey: string, flag: 'red' | 'yellow' | 'green' | null) => void;
  fieldRoles?: Record<string, string>;
  onUpdateFieldRole?: (fieldKey: string, role: string) => void;
  onAutoInspectField?: (fieldKey: string) => void;
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
  onUpdateInteriorSpacesData,
  flags,
  onUpdateFlag,
  fieldRoles,
  onUpdateFieldRole,
  onAutoInspectField
}) => {
  const { t } = useLanguage();
  const safeT = (key: string, fallback: string) => {
    const val = t(key);
    if (!val || val === key || val.includes('.')) return fallback;
    return val;
  };
  const [spacesData, setSpacesData] = useState<InteriorSpaceCard[]>(interiorSpacesData && interiorSpacesData.length > 0 ? interiorSpacesData : INTERIOR_SPACES_DATA);

  useEffect(() => {
    if (interiorSpacesData && interiorSpacesData.length > 0) {
      setSpacesData(interiorSpacesData);
    }
  }, [interiorSpacesData]);
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState<string>('all');
  const [customFloors, setCustomFloors] = useState<string[]>([]);
  const [deletedFloors, setDeletedFloors] = useState<string[]>([]);
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState<boolean>(false);
  const [newFloorNameInput, setNewFloorNameInput] = useState<string>('');
  const [floorToDeleteConfirm, setFloorToDeleteConfirm] = useState<{ floorKey: string; count: number } | null>(null);

  interface CustomRoomEntry {
    roomName: string;
    floorLevel: string;
  }

  const [customRooms, setCustomRooms] = useState<CustomRoomEntry[]>([]);
  const [deletedRooms, setDeletedRooms] = useState<string[]>([]);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState<boolean>(false);
  const [newRoomNameInput, setNewRoomNameInput] = useState<string>('');
  const [targetFloorForNewRoom, setTargetFloorForNewRoom] = useState<string>('Ground Floor');
  const [roomToDeleteConfirm, setRoomToDeleteConfirm] = useState<{ roomKey: string; count: number } | null>(null);

  React.useEffect(() => {
    if (isAddRoomModalOpen) {
      setTargetFloorForNewRoom(selectedFloorFilter !== 'all' ? selectedFloorFilter : 'Ground Floor');
    }
  }, [isAddRoomModalOpen, selectedFloorFilter]);

  const DEFAULT_FLOORS = ['Ground Floor', '1st Floor'];
  const DEFAULT_ROOM_FLOOR_MAP: Record<string, string> = {
    'Hal': 'Ground Floor',
    'MK': 'Ground Floor',
    'Livingroom': 'Ground Floor',
    'WC': 'Ground Floor',
    'Keuken': 'Ground Floor',
    'Slaapkamer': '1st Floor'
  };

  const getDefaultFloor = (spaceType: string) => {
    if (DEFAULT_ROOM_FLOOR_MAP[spaceType]) return DEFAULT_ROOM_FLOOR_MAP[spaceType];
    if (spaceType === 'Slaapkamer' || spaceType === 'Bedroom') return '1st Floor';
    if (spaceType === 'Zolder' || spaceType === 'Attic') return 'Attic';
    return 'Ground Floor';
  };

  const uniqueFloorsFromData = Array.from(new Set(spacesData.map(c => c.floorLevel || getDefaultFloor(c.spaceType)))).filter(f => f && !DEFAULT_FLOORS.includes(f));
  const availableFloors = Array.from(new Set([...DEFAULT_FLOORS, ...uniqueFloorsFromData, ...customFloors]))
    .filter(Boolean)
    .filter(f => !deletedFloors.includes(f));

  const getFloorLabel = (floorKey: string) => {
    if (!floorKey) return '';
    switch (floorKey) {
      case 'all': return safeT('invoersheetV2.interiorSpaces.allFloors', 'All Floors');
      case 'Ground Floor':
      case 'Begane Grond':
        return safeT('invoersheetV2.interiorSpaces.groundFloor', 'Ground Floor');
      case '1st Floor':
      case '1e Verdieping':
        return safeT('invoersheetV2.interiorSpaces.firstFloor', '1st Floor');
      case '2nd Floor':
      case '2e Verdieping':
        return safeT('invoersheetV2.interiorSpaces.secondFloor', '2nd Floor');
      case 'Attic':
      case 'Zolder':
        return safeT('invoersheetV2.interiorSpaces.attic', 'Attic');
      case 'Basement':
      case 'Kelder':
        return safeT('invoersheetV2.interiorSpaces.basement', 'Basement');
      default:
        return floorKey;
    }
  };

  const handleAddFloor = (floorName: string) => {
    const trimmed = floorName.trim();
    if (!trimmed) return;
    setDeletedFloors(prev => prev.filter(f => f !== trimmed));
    if (!customFloors.includes(trimmed) && !DEFAULT_FLOORS.includes(trimmed)) {
      setCustomFloors(prev => [...prev, trimmed]);
    }
    setSelectedFloorFilter(trimmed);
    setNewFloorNameInput('');
    setIsAddFloorModalOpen(false);
  };

  const executeDeleteFloor = () => {
    if (floorToDeleteConfirm) {
      const { floorKey } = floorToDeleteConfirm;
      setSpacesData(prev => prev.filter(c => (c.floorLevel || getDefaultFloor(c.spaceType)) !== floorKey));
      setDeletedFloors(prev => [...prev, floorKey]);
      setCustomFloors(prev => prev.filter(f => f !== floorKey));
      if (selectedFloorFilter === floorKey) {
        setSelectedFloorFilter('all');
      }
      setFloorToDeleteConfirm(null);
    }
  };

  const availableRooms = React.useMemo(() => {
    const cardsOnFloor = selectedFloorFilter === 'all'
      ? spacesData
      : spacesData.filter(c => (c.floorLevel || getDefaultFloor(c.spaceType)) === selectedFloorFilter);
    const roomsWithCardsOnFloor = Array.from(new Set(cardsOnFloor.map(c => c.spaceType)));

    if (selectedFloorFilter === 'all') {
      const allDefault = Object.keys(DEFAULT_ROOM_FLOOR_MAP);
      const allCustom = customRooms.map(r => r.roomName);
      const allCardRooms = spacesData.map(c => c.spaceType);
      return Array.from(new Set([...allDefault, ...allCardRooms, ...allCustom]))
        .filter(r => !deletedRooms.includes(r));
    } else {
      const defaultOnFloor = Object.entries(DEFAULT_ROOM_FLOOR_MAP)
        .filter(([_, floor]) => floor === selectedFloorFilter)
        .map(([room]) => room);
      
      const customOnFloor = customRooms
        .filter(r => r.floorLevel === selectedFloorFilter)
        .map(r => r.roomName);

      return Array.from(new Set([...defaultOnFloor, ...roomsWithCardsOnFloor, ...customOnFloor]))
        .filter(r => !deletedRooms.includes(r));
    }
  }, [selectedFloorFilter, spacesData, customRooms, deletedRooms]);

  React.useEffect(() => {
    if (selectedSpaceFilter !== 'all' && !availableRooms.includes(selectedSpaceFilter)) {
      setSelectedSpaceFilter('all');
    }
  }, [selectedFloorFilter, availableRooms, selectedSpaceFilter]);

  const cardsOnSelectedFloor = React.useMemo(() => {
    return selectedFloorFilter === 'all'
      ? spacesData
      : spacesData.filter(c => (c.floorLevel || getDefaultFloor(c.spaceType)) === selectedFloorFilter);
  }, [selectedFloorFilter, spacesData]);

  const filteredCards = React.useMemo(() => {
    return selectedSpaceFilter === 'all'
      ? cardsOnSelectedFloor
      : cardsOnSelectedFloor.filter(c => c.spaceType === selectedSpaceFilter);
  }, [selectedSpaceFilter, cardsOnSelectedFloor]);

  const getRoomLabel = (roomKey: string) => {
    if (!roomKey) return '';
    if (roomKey === 'all') return `${safeT('invoersheetV2.interiorSpaces.allSpaces', 'All Spaces')} (${cardsOnSelectedFloor.length})`;

    const match = roomKey.match(/^(.+?)(?:\s+(\d+))?$/);
    const baseKey = match ? match[1] : roomKey;
    const numSuffix = match && match[2] ? ` ${match[2]}` : '';

    let translatedBase = baseKey;
    switch (baseKey) {
      case 'Hal': translatedBase = safeT('invoersheetV2.interiorSpaces.hall', 'Hall'); break;
      case 'MK': translatedBase = safeT('invoersheetV2.interiorSpaces.meterCupboard', 'Meter Cupboard'); break;
      case 'Livingroom': translatedBase = safeT('invoersheetV2.interiorSpaces.livingRoom', 'Living Room'); break;
      case 'WC': translatedBase = safeT('invoersheetV2.interiorSpaces.toilet', 'Toilet'); break;
      case 'Keuken': translatedBase = safeT('invoersheetV2.interiorSpaces.kitchen', 'Kitchen'); break;
      case 'Slaapkamer': translatedBase = safeT('invoersheetV2.interiorSpaces.bedroom', 'Bedroom'); break;
      case 'Badkamer': translatedBase = safeT('invoersheetV2.interiorSpaces.bathroom', 'Bathroom'); break;
      case 'Zolder': translatedBase = safeT('invoersheetV2.interiorSpaces.attic', 'Attic'); break;
      case 'Balkon': translatedBase = safeT('invoersheetV2.interiorSpaces.balcony', 'Balcony'); break;
      case 'Studeerkamer': translatedBase = safeT('invoersheetV2.interiorSpaces.study', 'Study'); break;
      case 'Garage': translatedBase = safeT('invoersheetV2.interiorSpaces.garage', 'Garage'); break;
      case 'Berging': translatedBase = safeT('invoersheetV2.interiorSpaces.storage', 'Storage'); break;
      case 'Overloop': translatedBase = safeT('invoersheetV2.interiorSpaces.landing', 'Landing'); break;
      case 'Kantoor': translatedBase = safeT('invoersheetV2.interiorSpaces.office', 'Office'); break;
      default: translatedBase = baseKey; break;
    }

    return `${translatedBase}${numSuffix}`;
  };

  const getNextRoomName = (basePreset: string) => {
    const trimmed = basePreset.trim();
    const baseName = trimmed.replace(/\s+\d+$/, '');

    const existingRoomNames = Array.from(new Set([
      ...Object.keys(DEFAULT_ROOM_FLOOR_MAP),
      ...customRooms.map(r => r.roomName),
      ...spacesData.map(c => c.spaceType)
    ])).filter(r => !deletedRooms.includes(r));

    if (!existingRoomNames.includes(baseName)) {
      return baseName;
    }

    let maxNum = 1;
    existingRoomNames.forEach(r => {
      if (r === baseName) {
        maxNum = Math.max(maxNum, 1);
      } else {
        const match = r.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`, 'i'));
        if (match) {
          maxNum = Math.max(maxNum, parseInt(match[1], 10));
        }
      }
    });

    return `${baseName} ${maxNum + 1}`;
  };

  const handleAddRoom = (roomName: string, chosenFloor?: string) => {
    const trimmed = roomName.trim();
    if (!trimmed) return;

    const targetFloor = chosenFloor || targetFloorForNewRoom || (selectedFloorFilter !== 'all' ? selectedFloorFilter : 'Ground Floor');

    const existingRoomNames = Array.from(new Set([
      ...Object.keys(DEFAULT_ROOM_FLOOR_MAP),
      ...customRooms.map(r => r.roomName),
      ...spacesData.map(c => c.spaceType)
    ])).filter(r => !deletedRooms.includes(r));

    let finalRoomName = trimmed;

    if (existingRoomNames.includes(trimmed)) {
      const baseName = trimmed.replace(/\s+\d+$/, '');
      let maxNum = 1;
      existingRoomNames.forEach(r => {
        if (r === baseName) {
          maxNum = Math.max(maxNum, 1);
        } else {
          const match = r.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`, 'i'));
          if (match) {
            maxNum = Math.max(maxNum, parseInt(match[1], 10));
          }
        }
      });
      finalRoomName = `${baseName} ${maxNum + 1}`;
    }

    setDeletedRooms(prev => prev.filter(r => r !== finalRoomName));
    setCustomRooms(prev => {
      if (prev.some(r => r.roomName === finalRoomName && r.floorLevel === targetFloor)) return prev;
      return [...prev, { roomName: finalRoomName, floorLevel: targetFloor }];
    });

    if (selectedFloorFilter !== 'all' && selectedFloorFilter !== targetFloor) {
      setSelectedFloorFilter(targetFloor);
    }
    setSelectedSpaceFilter(finalRoomName);
    setNewRoomNameInput('');
    setIsAddRoomModalOpen(false);
  };

  const executeDeleteRoom = () => {
    if (roomToDeleteConfirm) {
      const { roomKey } = roomToDeleteConfirm;
      setSpacesData(prev => prev.filter(c => c.spaceType !== roomKey));
      setDeletedRooms(prev => [...prev, roomKey]);
      setCustomRooms(prev => prev.filter(r => r.roomName !== roomKey));
      if (selectedSpaceFilter === roomKey) {
        setSelectedSpaceFilter('all');
      }
      setRoomToDeleteConfirm(null);
    }
  };
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

  const floorScrollContainerRef = useRef<HTMLDivElement>(null);
  const activeFloorTabRef = useRef<HTMLDivElement | HTMLButtonElement>(null);
  const [showFloorLeftArrow, setShowFloorLeftArrow] = useState(false);
  const [showFloorRightArrow, setShowFloorRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  const checkFloorScroll = () => {
    if (floorScrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = floorScrollContainerRef.current;
      setShowFloorLeftArrow(scrollLeft > 0);
      setShowFloorRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    checkFloorScroll();
    window.addEventListener('resize', checkScroll);
    window.addEventListener('resize', checkFloorScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      window.removeEventListener('resize', checkFloorScroll);
    };
  }, []);

  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedSpaceFilter]);

  useEffect(() => {
    if (activeFloorTabRef.current && floorScrollContainerRef.current) {
      const container = floorScrollContainerRef.current;
      const tab = activeFloorTabRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedFloorFilter]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const scrollFloorByAmount = (amount: number) => {
    if (floorScrollContainerRef.current) {
      floorScrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
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

  const addInstallationToCurrentRoom = (category: 'floor' | 'heating' | 'tapwater' | 'solar' | 'ventilation' | 'window' | 'door' | 'cooling') => {
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
      case 'door':
        baseTitle = 'Buitendeur'; icon = 'DoorClosed';
        defaultSpecs = [
          { label: 'Name', value: 'Buitendeur 1' },
          { label: 'Brand & Type', value: '-' },
          { label: 'Isolatie aanwezig', value: 'Nee' },
          { label: 'Dikte (mm)', value: '0 mm' },
          { label: 'U-waarde', value: '1.4' }
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

    let targetFloor = selectedFloorFilter !== 'all' ? selectedFloorFilter : '';
    if (!targetFloor) {
      const customMatch = customRooms.find(r => r.roomName === selectedSpaceFilter);
      if (customMatch) {
        targetFloor = customMatch.floorLevel;
      } else {
        targetFloor = getDefaultFloor(selectedSpaceFilter);
      }
    }

    const newCard: InteriorSpaceCard = {
      id: newId,
      spaceName: `${selectedSpaceFilter}`,
      spaceType: selectedSpaceFilter as any,
      floorLevel: targetFloor,
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
    input.accept = 'image/*,application/pdf';
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
      case 'door':
        return <DoorClosed className="w-4 h-4 text-rose-600" />;
      case 'cooling':
        return <Snowflake className="w-4 h-4 text-cyan-500" />;
      default:
        return <Building className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Chapter Top Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center space-x-2.5">
            <Droplets className="w-5 h-5 text-primary" />
            <span>{t('invoersheetV2.interiorSpaces.title') === 'invoersheetV2.interiorSpaces.title' ? '4. Binnen (Ruimtes)' : t('invoersheetV2.interiorSpaces.title')}</span>
          </h1>
        </div>
      </div>

      {/* Floor Selector Bar */}
      <div className="relative flex items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 w-full overflow-hidden">
        {showFloorLeftArrow && (
          <button 
            type="button"
            onClick={() => scrollFloorByAmount(-200)}
            className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-slate-100 via-slate-100 to-transparent text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-l-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div 
          ref={floorScrollContainerRef}
          onScroll={checkFloorScroll}
          className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full px-4"
        >
          <button
            ref={selectedFloorFilter === 'all' ? (activeFloorTabRef as any) : null}
            type="button"
            onClick={() => setSelectedFloorFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              selectedFloorFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            {getFloorLabel('all')} ({spacesData.length})
          </button>

          {availableFloors.map((floorKey) => {
            const isSelected = selectedFloorFilter === floorKey;
            const countOnFloor = spacesData.filter(c => (c.floorLevel || getDefaultFloor(c.spaceType)) === floorKey).length;

            return (
              <div
                key={floorKey}
                className={`group flex-shrink-0 flex items-center rounded-lg transition-all border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <button
                  ref={isSelected ? (activeFloorTabRef as any) : null}
                  type="button"
                  onClick={() => setSelectedFloorFilter(floorKey)}
                  className="px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer flex items-center space-x-1.5"
                >
                  <span>{getFloorLabel(floorKey)}</span>
                  {countOnFloor > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {countOnFloor}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFloorToDeleteConfirm({ floorKey, count: countOnFloor });
                  }}
                  className={`pr-2 py-1.5 text-xs transition hover:scale-110 cursor-pointer ${
                    isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-500'
                  }`}
                  title={`Verwijder verdieping ${getFloorLabel(floorKey)}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setIsAddFloorModalOpen(true)}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center space-x-1 shadow-xs cursor-pointer ml-1"
            title="Voeg een verdieping toe"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{safeT('invoersheetV2.interiorSpaces.addFloor', 'Add Floor')}</span>
          </button>
        </div>

        {showFloorRightArrow && (
          <button 
            type="button"
            onClick={() => scrollFloorByAmount(200)}
            className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-slate-100 via-slate-100 to-transparent text-slate-500 hover:text-slate-900 flex items-center justify-center rounded-r-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

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
            {getRoomLabel('all')}
          </button>
          {availableRooms.map((roomKey) => {
            const isSelected = selectedSpaceFilter === roomKey;
            const roomCardsCount = cardsOnSelectedFloor.filter(c => c.spaceType === roomKey).length;
            return (
              <div
                key={roomKey}
                className={`group flex-shrink-0 flex items-center rounded-lg transition-all border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-slate-200/60'
                }`}
              >
                <button
                  ref={isSelected ? activeTabRef : null}
                  onClick={() => setSelectedSpaceFilter(roomKey)}
                  className="px-3 py-1.5 text-xs font-medium focus:outline-none cursor-pointer flex items-center space-x-1.5"
                >
                  <span>{getRoomLabel(roomKey)}</span>
                  {roomCardsCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {roomCardsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRoomToDeleteConfirm({ roomKey, count: roomCardsCount });
                  }}
                  className={`pr-2 py-1.5 text-xs transition hover:scale-110 cursor-pointer ${
                    isSelected ? 'text-emerald-200 hover:text-white' : 'text-slate-400 hover:text-red-500'
                  }`}
                  title={`Verwijder ruimte ${getRoomLabel(roomKey)}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setIsAddRoomModalOpen(true)}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center space-x-1 shadow-xs cursor-pointer ml-1"
            title="Voeg een nieuwe ruimte toe"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{safeT('invoersheetV2.interiorSpaces.addRoom', 'Add Room')}</span>
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
        {filteredCards.map((card) => {
          const isSelfFull = (spec: (typeof card.specs)[0]) => {
            if (spec.label === '---SECTION---') return true;
            const lowerLabel = spec.label.toLowerCase();
            const valStr = spec.value ? String(spec.value).trim() : '';

            // Explicit full-width fields: Area / Oppervlakte (has 3 inputs B x H = Area m²) and BCRG
            if (
              lowerLabel === 'area' ||
              lowerLabel === 'oppervlakte' ||
              lowerLabel.includes('oppervlakte') ||
              lowerLabel.includes('bcrg')
            ) {
              return true;
            }

            // Dynamic length check:
            // If value contains newline OR value length > 22 characters, it requires a full row.
            const isLongVal = valStr.includes('\n') || valStr.length > 22;

            return isLongVal;
          };

          const isolatieSpec = card.specs.find(s => {
            const lbl = s.label.toLowerCase();
            return lbl === 'isolatie aanwezig' || lbl === 'insulation present';
          });
          const isInsulated = isolatieSpec ? (isolatieSpec.value.toLowerCase() === 'ja' || isolatieSpec.value.toLowerCase() === 'yes') : true;

          const visibleSpecs = card.specs.filter(s => {
            const lbl = s.label.toLowerCase();
            if (lbl === 'dikte (mm)' || lbl === 'thickness (mm)') {
              return isInsulated;
            }
            return true;
          });

          const spans: number[] = new Array(visibleSpecs.length).fill(1);
          let col = 0;

          for (let i = 0; i < visibleSpecs.length; i++) {
            const s = visibleSpecs[i];
            if (s.label === '---SECTION---') {
              spans[i] = 2;
              col = 0;
              continue;
            }

            if (isSelfFull(s)) {
              if (col === 1 && i > 0 && spans[i - 1] === 1) {
                spans[i - 1] = 2;
              }
              spans[i] = 2;
              col = 0;
            } else {
              if (col === 0) {
                const nextSpec = visibleSpecs[i + 1];
                const nextIsFull = !nextSpec || nextSpec.label === '---SECTION---' || isSelfFull(nextSpec);
                if (nextIsFull) {
                  spans[i] = 2;
                  col = 0;
                } else {
                  spans[i] = 1;
                  col = 1;
                }
              } else {
                spans[i] = 1;
                col = 0;
              }
            }
          }

          return (
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

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs w-full">
                      {visibleSpecs.map((spec, sIdx) => {
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
                              <div key={sIdx} className="col-span-2 w-full pt-4 pb-1 first:pt-0 border-b border-slate-200/80 mb-1">
                                <h5 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                                  {spec.value === 'Ventilatie' ? <Wind className="w-4 h-4 text-teal-600" /> : <AppWindow className="w-4 h-4 text-indigo-600" />}
                                  <span>{spec.value}</span>
                                </h5>
                              </div>
                            );
                          }

                          const colSpanClass = spans[sIdx] === 2 ? 'col-span-2' : 'col-span-1';
                          const specKey = `space_${card.id}_spec_${sIdx}`;
                          const flagVal = flags?.[specKey];
                          const activeRole = fieldRoles?.[specKey] || 'INS';
                          const onFlag = onUpdateFlag ? (v: 'red' | 'yellow' | 'green' | null) => onUpdateFlag(specKey, v) : undefined;

                          return (
                        <div key={sIdx} className={colSpanClass}>
                          {renderV1Field(
                            spec.label,
                            undefined,
                            'INS',
                            flagVal || 'none',
                            undefined,
                            'text',
                            undefined,
                            <div className="flex items-center space-x-2 w-full">
                              {spec.label.toLowerCase() === 'area' || spec.label.toLowerCase() === 'oppervlakte' ? (
                                <div className="flex items-center justify-between w-full gap-1 px-1.5 py-1 text-xs">
                                  <input
                                    type="number"
                                    value={spec.length === '0' || spec.length === '-' ? '' : spec.length || ''}
                                    onChange={(e) => {
                                      onAutoInspectField?.(specKey);
                                      handleUpdateSpace(card.id, c => ({
                                        ...c,
                                        specs: c.specs.map((s, i) => {
                                          if (i !== sIdx) return s;
                                          const l = parseFloat(e.target.value) || 0;
                                          const w = parseFloat(s.width || '0') || 0;
                                          const hasBoth = l > 0 && w > 0;
                                          const newVal = hasBoth ? `${(l * w).toFixed(2)} m2` : s.value;
                                          return { ...s, length: e.target.value, value: newVal };
                                        })
                                      }));
                                    }}
                                    placeholder="L"
                                    className="flex-1 min-w-[36px] max-w-[64px] text-xs font-sans font-semibold text-slate-700 bg-white px-1.5 py-1 rounded border border-slate-200 outline-none focus:border-primary text-center shadow-2xs"
                                  />
                                  <span className="text-slate-400 font-mono text-xs font-bold shrink-0">×</span>
                                  <input
                                    type="number"
                                    value={spec.width === '0' || spec.width === '-' ? '' : spec.width || ''}
                                    onChange={(e) => {
                                      onAutoInspectField?.(specKey);
                                      handleUpdateSpace(card.id, c => ({
                                        ...c,
                                        specs: c.specs.map((s, i) => {
                                          if (i !== sIdx) return s;
                                          const w = parseFloat(e.target.value) || 0;
                                          const l = parseFloat(s.length || '0') || 0;
                                          const hasBoth = l > 0 && w > 0;
                                          const newVal = hasBoth ? `${(l * w).toFixed(2)} m2` : s.value;
                                          return { ...s, width: e.target.value, value: newVal };
                                        })
                                      }));
                                    }}
                                    placeholder="B"
                                    className="flex-1 min-w-[36px] max-w-[64px] text-xs font-sans font-semibold text-slate-700 bg-white px-1.5 py-1 rounded border border-slate-200 outline-none focus:border-primary text-center shadow-2xs"
                                  />
                                  <span className="text-slate-400 font-mono text-xs font-bold shrink-0">=</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={num === '0' || num === '0.00' || num === '-' ? '' : num}
                                    placeholder={num === '0' || num === '0.00' || num === '-' ? num : ''}
                                    onChange={(e) => {
                                      onAutoInspectField?.(specKey);
                                      handleUpdateSpace(card.id, c => ({
                                        ...c,
                                        specs: c.specs.map((s, i) => i === sIdx ? { ...s, value: (e.target.value || '0') + (unit && e.target.value !== '-' ? ' ' + unit : ''), length: '', width: '' } : s)
                                      }));
                                    }}
                                    className="flex-1 min-w-[48px] max-w-[80px] text-xs font-sans font-semibold text-slate-700 bg-white px-1.5 py-1 rounded border border-slate-200 outline-none focus:border-primary text-center shadow-2xs"
                                  />
                                  {unit && <span className="text-xs font-semibold text-slate-500 shrink-0 ml-0.5">{unit === 'm2' ? 'm²' : unit}</span>}
                                </div>
                              ) : (
                                <>
                                  {selectOptions ? (
                                    <div className="w-full flex-1">
                                      <AppSelect
                                        value={spec.value}
                                        variant="compact"
                                        searchable={false}
                                        onChange={(newValue) => {
                                          onAutoInspectField?.(specKey);
                                          handleUpdateSpace(card.id, c => {
                                            let newSpecs = c.specs.map((s) => s.label === spec.label ? { ...s, value: newValue } : s);
                                            
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
                                          });
                                        }}
                                        options={(() => {
                                          const opts = selectOptions.map(opt => ({ value: opt, label: opt }));
                                          if (!selectOptions.includes(spec.value)) {
                                            opts.unshift({ value: spec.value, label: spec.value });
                                          }
                                          return opts;
                                        })()}
                                        className={`w-full text-xs font-semibold leading-tight outline-none border-none bg-transparent ${spec.highlight ? 'text-slate-700' : 'text-slate-700'}`}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1 w-full">
                                      <input
                                        type={isNumber ? "number" : "text"}
                                        step={isNumber ? "any" : undefined}
                                        value={num === '-' || num === '0' || num === '0.00' ? '' : num}
                                        placeholder={num && num !== '-' && num !== '0' && num !== '0.00' ? num : (isNumber ? '0' : (spec.label.toLowerCase().includes('type') || spec.label.toLowerCase().includes('brand') || spec.label.toLowerCase().includes('merk') ? ((card.category === 'door' || (card.sectionTitle && (card.sectionTitle.toLowerCase().includes('deur') || card.sectionTitle.toLowerCase().includes('door')))) ? 'Bijv. K-Vision' : 'Bijv. HR++') : 'Vul in...'))}
                                        onChange={(e) => {
                                          onAutoInspectField?.(specKey);
                                          handleUpdateSpace(card.id, c => ({
                                            ...c,
                                            specs: c.specs.map((s) => s.label === spec.label ? { ...s, value: (e.target.value || (isNumber ? '0' : '-')) + (unit && e.target.value !== '-' ? ' ' + unit : '') } : s)
                                          }));
                                        }}
                                        className={`w-full text-xs font-semibold bg-transparent border-none focus:outline-none focus:ring-0 leading-tight outline-none font-sans ${spec.highlight ? 'text-slate-700' : 'text-slate-700'}`}
                                      />
                                      {unit && <span className="text-slate-500 font-bold whitespace-nowrap text-[11px]">{unit === 'm2' ? 'm²' : unit}</span>}
                                    </div>
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
                                  className={`shrink-0 inline-flex items-center justify-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition shadow-xs ${
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
                                        ? 'View'
                                        : 'Search'
                                    }
                                  </span>
                                  <Search className="w-2.5 h-2.5 text-emerald-600" />
                                </button>
                              )}
                            </div>,
                            flagVal,
                            onFlag,
                            activeRole,
                            () => onAutoInspectField?.(specKey)
                          )}
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
                      {isPdfUrl(photo.url) ? (
                        <PdfThumbnail url={photo.url} altTitle={photo.caption || 'PDF Document'} />
                      ) : (
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                        />
                      )}
                      
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
                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shadow-sm z-10"
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
        );
      })}

        {filteredCards.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200/90 p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">
                {selectedSpaceFilter === 'all'
                  ? `Nog geen ruimtes of installaties op ${getFloorLabel(selectedFloorFilter)}`
                  : `Nog geen installaties in ${getRoomLabel(selectedSpaceFilter)} (${getFloorLabel(selectedFloorFilter)})`}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedSpaceFilter === 'all'
                  ? `Klik op '+ Ruimte' om een ruimte toe te voegen aan ${getFloorLabel(selectedFloorFilter)}.`
                  : `Voeg een eerste installatie (kozijn, buitendeur, vloer, verwarming, ventilatie etc.) toe aan deze ruimte.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedSpaceFilter !== 'all' && (
        <div className="flex items-center justify-center gap-3 mt-6 mb-4 relative flex-wrap">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl transition border-2 border-slate-300 border-dashed cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>{t('invoersheetV2.interiorSpaces.addNewInstallationIn')} {getRoomLabel(selectedSpaceFilter)}</span>
          </button>

          <button
            type="button"
            onClick={() => setRoomToDeleteConfirm({ roomKey: selectedSpaceFilter, count: filteredCards.length })}
            className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-xl transition border border-red-200 cursor-pointer"
            title={`Verwijder ruimte ${getRoomLabel(selectedSpaceFilter)}`}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Ruimte Verwijderen</span>
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
                { type: 'door', label: t('invoersheetV2.interiorSpaces.types.door') || 'Buitendeur', icon: DoorClosed, color: 'text-rose-600' },
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
      {deleteConfirmation && (() => {
        const targetCard = spacesData.find(c => c.id === deleteConfirmation);
        let cardDisplayName = '';
        if (targetCard) {
          const catTrans = t(`invoersheetV2.interiorSpaces.types.${targetCard.category}`);
          const baseName = (catTrans && !catTrans.includes('.')) ? catTrans : targetCard.sectionTitle;
          const numMatch = targetCard.sectionTitle.match(/\d+/);
          const numSuffix = numMatch ? ` ${numMatch[0]}` : '';
          cardDisplayName = `${baseName}${numSuffix}`;
        }

        const modalTitle = cardDisplayName
          ? safeT('invoersheetV2.interiorSpaces.deleteInstallationNamedTitle', 'Delete "{name}"').replace('{name}', cardDisplayName)
          : safeT('invoersheetV2.interiorSpaces.deleteInstallationSpace', 'Delete Installation');

        const modalConfirm = cardDisplayName
          ? safeT('invoersheetV2.interiorSpaces.deleteInstallationConfirmation', 'Are you sure you want to permanently delete "{name}"? This cannot be undone.').replace('{name}', cardDisplayName)
          : safeT('invoersheetV2.interiorSpaces.deleteConfirmation', 'Are you sure you want to permanently delete this installation? This cannot be undone.');

        return (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
              <div className="p-5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {modalTitle}
                </h3>
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                  {modalConfirm}
                </p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {t('invoersheetV2.interiorSpaces.cancel')}
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('invoersheetV2.interiorSpaces.delete')}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {roomToDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Ruimte "{getRoomLabel(roomToDeleteConfirm.roomKey)}" Verwijderen?
              </h3>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                {roomToDeleteConfirm.count > 0
                  ? `Weet je zeker dat je de ruimte '${getRoomLabel(roomToDeleteConfirm.roomKey)}' en alle ${roomToDeleteConfirm.count} installatie(s) daarin definitief wilt verwijderen?`
                  : `Weet je zeker dat je de ruimte '${getRoomLabel(roomToDeleteConfirm.roomKey)}' wilt verwijderen?`}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setRoomToDeleteConfirm(null)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={executeDeleteRoom}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ruimte Verwijderen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {floorToDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Verdieping "{getFloorLabel(floorToDeleteConfirm.floorKey)}" Verwijderen?
              </h3>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                {floorToDeleteConfirm.count > 0
                  ? `Weet je zeker dat je verdieping '${getFloorLabel(floorToDeleteConfirm.floorKey)}' en alle ${floorToDeleteConfirm.count} installatie(s) daarin definitief wilt verwijderen?`
                  : `Weet je zeker dat je verdieping '${getFloorLabel(floorToDeleteConfirm.floorKey)}' wilt verwijderen?`}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setFloorToDeleteConfirm(null)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={executeDeleteFloor}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Verdieping Verwijderen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto pt-14 sm:pt-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
            {/* Modal Header matching 3.Exterior */}
            <div className="bg-primary text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="font-display font-semibold text-sm sm:text-base tracking-wide truncate">
                  {safeT('invoersheetV2.interiorSpaces.addNewRoomTitle', 'Add New Room')}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 font-mono truncate">
                  {safeT('invoersheetV2.interiorSpaces.addNewRoomSubtitle', 'Choose a category or enter a custom name')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setIsAddRoomModalOpen(false); setNewRoomNameInput(''); }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {safeT('invoersheetV2.interiorSpaces.selectFloor', 'SELECT FLOOR:')}
                </label>
                <AppSelect
                  value={targetFloorForNewRoom}
                  onChange={(val) => setTargetFloorForNewRoom(val)}
                  options={availableFloors.map(floorKey => ({
                    value: floorKey,
                    label: getFloorLabel(floorKey)
                  }))}
                  variant="white"
                  searchable={false}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {safeT('invoersheetV2.interiorSpaces.quickSelect', 'QUICK SELECTION (POPULAR)')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Badkamer',
                    'Slaapkamer',
                    'Zolder',
                    'Balkon',
                    'Studeerkamer',
                    'Garage',
                    'Berging',
                    'Overloop',
                    'Kantoor'
                  ].map(basePreset => {
                    const nextLabel = getNextRoomName(basePreset);
                    return (
                      <button
                        key={basePreset}
                        type="button"
                        onClick={() => handleAddRoom(nextLabel)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 rounded-lg border border-slate-200 transition text-left cursor-pointer"
                      >
                        + {getRoomLabel(nextLabel)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {safeT('invoersheetV2.interiorSpaces.orTypeCustomName', 'OR TYPE A CUSTOM NAME:')}
                </label>
                <input
                  type="text"
                  value={newRoomNameInput}
                  onChange={(e) => setNewRoomNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddRoom(newRoomNameInput);
                  }}
                  placeholder={safeT('invoersheetV2.interiorSpaces.roomNamePlaceholder', 'Bijv. Badkamer 2, Technische ruimte...')}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer matching 3.Exterior */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5 shrink-0">
              <button
                type="button"
                onClick={() => { setIsAddRoomModalOpen(false); setNewRoomNameInput(''); }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {safeT('invoersheetV2.interiorSpaces.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleAddRoom(newRoomNameInput)}
                disabled={!newRoomNameInput.trim()}
                className="px-4 py-2 bg-primary hover:bg-[#00524c] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{safeT('invoersheetV2.interiorSpaces.addRoomButton', 'Add Room')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddFloorModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto pt-14 sm:pt-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
            {/* Modal Header matching 3.Exterior */}
            <div className="bg-primary text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="font-display font-semibold text-sm sm:text-base tracking-wide truncate">
                  {safeT('invoersheetV2.interiorSpaces.addNewFloorTitle', 'Nieuwe Verdieping Toevoegen')}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 font-mono truncate">
                  {safeT('invoersheetV2.interiorSpaces.addNewFloorSubtitle', 'Kies een verdieping of voer een eigen naam in')}
                </p>
              </div>

              <button 
                type="button"
                onClick={() => { setIsAddFloorModalOpen(false); setNewFloorNameInput(''); }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  SNELLE KEUZE (VERDIEPINGEN)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Ground Floor',
                    '1st Floor',
                    '2nd Floor',
                    '3rd Floor',
                    'Attic',
                    'Basement',
                    'Roof Terrace'
                  ]
                    .filter(preset => !availableFloors.includes(preset))
                    .map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddFloor(preset)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 rounded-lg border border-slate-200 transition text-left cursor-pointer"
                    >
                      + {getFloorLabel(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  OF TYP EEN EIGEN NAAM:
                </label>
                <input
                  type="text"
                  value={newFloorNameInput}
                  onChange={(e) => setNewFloorNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddFloor(newFloorNameInput);
                  }}
                  placeholder="Bijv. Tussenverdieping, Souterrain..."
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer matching 3.Exterior */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5 shrink-0">
              <button
                type="button"
                onClick={() => { setIsAddFloorModalOpen(false); setNewFloorNameInput(''); }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                {safeT('invoersheetV2.interiorSpaces.cancel', 'Annuleren')}
              </button>
              <button
                type="button"
                onClick={() => handleAddFloor(newFloorNameInput)}
                disabled={!newFloorNameInput.trim()}
                className="px-4 py-2 bg-primary hover:bg-[#00524c] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Verdieping Toevoegen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activePhotoModal && (
        <MediaViewerModal
          onClose={() => setActivePhotoModal(null)}
          titlePrefix={activePhotoModal.title}
          files={activePhotoModal.urls.map((url) => ({ url, isPdf: isPdfUrl(url) }))}
          initialIndex={activePhotoModal.currentIndex}
          footerText={activePhotoModal.description}
        />
      )}
    </div>
  );
};


