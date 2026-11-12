// src/pages/InstallatiePage.tsx
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, X, Home, AlertTriangle } from 'lucide-react';
import { AppSelect } from '../components/common/AppSelect';
import { InstallatieSectionIcon } from '../components/common/InstallatieSectionIcon';
import { TopBar } from '../components/common/TopBar';
import { AppSidebar } from '../components/common/AppSidebar';
import { HouseDesignRoomsModal } from '../components/common/HouseDesignRoomsModal';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { PageBackLink } from '../components/common/PageBackLink';
import { BackToTop } from '../components/common/BackToTop';
import { StepContinueFooter } from '../components/common/StepContinueFooter';
import { Toast } from '../components/common/Toast';
import { Step, UserRole } from '../types';
import { debouncedSyncInstallatie, syncInstallatieToAPI } from '../storage/bewonerAutoSync';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../context/LanguageContext';
import {
  loadInstallatieFromStorage,
  saveInstallatieToStorage,
  type InstallatieData,
  type InstallatieSectionId,
} from '../storage/installatieData';
import {
  loadHouseDesignAlgemeenHints,
  loadHouseDesignPageRaw,
} from '../storage/houseDesignPageData';
import {
  buildInteriorFloorSections,
  collectInteriorRoomsFromUploadData,
  getSelectedRoomsForFloor,
  KELDER_FLOOR_KEY,
  type InteriorRoomsByFloor,
} from '../utils/interiorRoomsFromUpload';
import {
  translateHeatingType,
  translateUploadFloor,
  translateUploadRoom,
} from '../i18n/translateOptions';
import type { TranslateFn } from '../context/LanguageContext';
import { HOUSE_DESIGN_ROOMS_CHANGED_EVENT } from '../utils/roomDeleteSync';

const ROOM_ANDERS = 'Anders';

function getHouseDesignRoomSelection() {
  const raw = loadHouseDesignPageRaw();
  return {
    selectedRooms: raw.selectedRooms ?? {},
    selectedCustomRooms: raw.selectedCustomRooms ?? {},
    suppressedStandardRooms: raw.suppressedStandardRooms ?? {},
  };
}

function getUploadSelectedRooms(): string[] {
  return collectInteriorRoomsFromUploadData(getHouseDesignRoomSelection());
}

function getUploadRoomsByFloor(): InteriorRoomsByFloor[] {
  const { numberOfFloors, hasKelder, startFloorKey } = loadHouseDesignAlgemeenHints();
  const sections = buildInteriorFloorSections(numberOfFloors, hasKelder, startFloorKey);
  const selection = getHouseDesignRoomSelection();
  return sections.map((floorId) => ({
    floorId,
    rooms: getSelectedRoomsForFloor(selection, floorId),
  }));
}

function interiorFloorLabel(floorId: string, t: TranslateFn): string {
  if (floorId === KELDER_FLOOR_KEY) return t('upload.floors.kelder');
  return translateUploadFloor(floorId, t);
}

function getCustomManualRooms(selected: string[], uploadRooms: string[]): string[] {
  const uploadSet = new Set(uploadRooms);
  return selected.filter((s) => s !== ROOM_ANDERS && !uploadSet.has(s));
}

function getFloorCustomRooms(
  floorId: string,
  byFloor: Record<string, string[]>,
  floorUploadRooms: string[],
): string[] {
  const uploadSet = new Set(floorUploadRooms);
  return (byFloor[floorId] ?? []).filter((r) => r !== ROOM_ANDERS && !uploadSet.has(r));
}

function flattenRoomsByFloor(byFloor: Record<string, string[]>): string[] {
  const all: string[] = [];
  Object.values(byFloor).forEach((rooms) => {
    rooms.forEach((room) => {
      if (!all.includes(room)) all.push(room);
    });
  });
  return all;
}

function countRoomsByFloor(byFloor: Record<string, string[]>): number {
  return Object.values(byFloor).reduce((sum, rooms) => sum + rooms.length, 0);
}

function migrateFlatRoomsToByFloor(
  flat: string[],
  uploadRoomsByFloor: InteriorRoomsByFloor[],
  uploadRooms: string[],
): Record<string, string[]> {
  const customs = getCustomManualRooms(flat, uploadRooms);
  const result: Record<string, string[]> = {};

  for (const room of flat) {
    if (customs.includes(room)) continue;
    const match = uploadRoomsByFloor.find(({ rooms }) => rooms.includes(room));
    if (!match) continue;
    const existing = result[match.floorId] ?? [];
    if (!existing.includes(room)) {
      result[match.floorId] = [...existing, room];
    }
  }

  if (customs.length > 0) {
    const lastId = uploadRoomsByFloor[uploadRoomsByFloor.length - 1]?.floorId ?? 'BG';
    result[lastId] = [...(result[lastId] ?? []), ...customs];
  }

  return result;
}

function pruneRoomsByFloor(
  byFloor: Record<string, string[]>,
  uploadRoomsByFloor: InteriorRoomsByFloor[],
): Record<string, string[]> {
  const floorRoomMap = new Map(uploadRoomsByFloor.map((f) => [f.floorId, f.rooms]));
  const result: Record<string, string[]> = {};

  for (const [floorId, selected] of Object.entries(byFloor)) {
    const floorRooms = floorRoomMap.get(floorId) ?? [];
    const floorRoomSet = new Set(floorRooms);
    const pruned = selected.filter((room) => floorRoomSet.has(room));
    if (pruned.length > 0) result[floorId] = pruned;
  }

  return result;
}

function loadRoomsByFloor(
  savedByFloor: Record<string, string[]> | undefined,
  flat: string[],
  uploadRoomsByFloor: InteriorRoomsByFloor[],
  uploadRooms: string[],
): Record<string, string[]> {
  if (savedByFloor && Object.keys(savedByFloor).length > 0) {
    return pruneRoomsByFloor(savedByFloor, uploadRoomsByFloor);
  }
  return pruneRoomsByFloor(
    migrateFlatRoomsToByFloor(flat, uploadRoomsByFloor, uploadRooms),
    uploadRoomsByFloor,
  );
}

function toggleFloorRoom(
  byFloor: Record<string, string[]>,
  floorId: string,
  room: string,
): Record<string, string[]> {
  const current = byFloor[floorId] ?? [];
  const next = current.includes(room)
    ? current.filter((r) => r !== room)
    : [...current, room];
  if (next.length === 0) {
    const { [floorId]: _, ...rest } = byFloor;
    return rest;
  }
  return { ...byFloor, [floorId]: next };
}



/**
 * Keep current House design picks, Anders, and free-text Anders locations.
 * Drop stale standard room ids (e.g. KEUKEN) no longer selected on House design.
 */
function pruneRoomSelections(selected: string[], uploadRooms: string[]): string[] {
  const uploadSet = new Set(uploadRooms);
  return selected.filter((s) => s !== ROOM_ANDERS && uploadSet.has(s));
}


function migrateLegacyAndersText(selected: string[], otherText: string): string[] {
  const trimmed = otherText.trim();
  if (!trimmed || selected.includes(trimmed)) {
    return selected;
  }
  return [...selected, trimmed];
}

interface InstallatiePageProps {
  currentStep: Step;
  setCurrentStep: (step: Step) => void;
  onLogout: () => void;
  onManageProfile?: () => void;
  onOpenSettings?: () => void;
  onLogoClick?: () => void;
  userName: string;
  selectedRole: UserRole;
  profilePhoto?: string;
}

const HEATING_TYPES = ['HR ketel', 'CV ketel', 'warmtepomp', 'stadsverwarming', 'Lucht', 'gas-fired boiler'] as const;

const LEGACY_HEATING_TYPE: Record<string, (typeof HEATING_TYPES)[number]> = {
  Warmtepomp: 'warmtepomp',
  Stadsverwarming: 'stadsverwarming',
};

function normalizeHeatingSystemType(value: string): string {
  if (!value) return '';
  return LEGACY_HEATING_TYPE[value] ?? value;
}
/** House design room id → Installatie heating/tap-water location label. */
const HOUSE_DESIGN_TO_INSTALLATIE_LOCATION: Record<string, string> = {
  MK: 'Meterkast',
  'TECHNICAL ROOM': 'Techniekruimte',
  BERGING: 'Berging',
  ZOLDER: 'Zolder',
};

const INSTALLATIE_LOCATION_ORDER = [
  'Meterkast',
  'Techniekruimte',
  'Berging',
  'Zolder',
] as const;

function getInstallatieLocationOptions(houseDesignRooms: string[]): string[] {
  const available = new Set<string>();
  for (const room of houseDesignRooms) {
    const location = HOUSE_DESIGN_TO_INSTALLATIE_LOCATION[room];
    if (location) available.add(location);
  }
  return INSTALLATIE_LOCATION_ORDER.filter((loc) => available.has(loc));
}

function toLocationSelectOptions(locations: string[]): { value: string; label: string }[] {
  return [
    ...locations.map((loc) => ({ value: loc, label: loc })),
    { value: ROOM_ANDERS, label: ROOM_ANDERS },
  ];
}
const VENTILATION_OPWEKKER_OPTIONS = [
  'ClimaRad Classic Solution',
  'ORCON MVS-15RH CO2B',
  'BUVA BOXSTREAM 2',
  'ZEHNDER Comfofan Silent R',
  'STORK CMF E P RFZ',
  'ITHO CVE ECOFAN 2 PE',
  'Duco RoofFan',
  'Zehnder MX110',
  'ORCON MVS-10RH CO2',
  'ORCON MVS 15P',
  'ClimaRad Maxibox',
  'STORK RPV 17',
  'STORK RPM 19/24 P',
  'ORCON MVS 7 14',
  'ORCON MVP 3W',
  'ORCON MVS 15 RHB CO2',
  'Zehnder MXD 210 D ZMV',
  'Anders',
];

const EMISSION_TYPES = ['Radiatoren', 'Luchtverwarming', 'Vloerverwarming'] as const;
const CONTROL_TYPES = ['Regeling in hoofdvertrek', 'Centrale regeling met naregeling per vertrek', 'Individuele regeling per vertrek', 'Overige regeling'] as const;
const GENERATOR_TYPES = [
  'Compression cooling-electric',
  'Compression cooling-gas',
  'Cold storage-groundwater',
  'Cold storage-soil',
  'Cold storage-surface water',
  'External cold supply',
  'Absorption cooling-gas',
  'Absorption cooling-external heat supply',
  'Absorption cooling-CHP',
  'Booster'
] as const;
const EMISSION_SYSTEMS = [
  'Direct expansion in the room',
  'Direct expansie in de luchtbehandelingskast',
  'Watergedragen distributiesysteem'
] as const;
const TAP_WATER_GENERATORS = ['Elektrische boiler', 'Gas boiler', 'Zonneboiler'] as const;
const TAP_WATER_DEVICES = ['Indirect gestookt', 'Direct gestookt'] as const;
const SOLAR_INTEGRATIONS = ['Niet geventileerd', 'Matig geventileerd', 'Hoog geventileerd'] as const;

export const InstallatiePage = ({
  currentStep,
  setCurrentStep,
  onLogout,
  onManageProfile,
  onOpenSettings,
  onLogoClick,
  userName,
  selectedRole,
  profilePhoto,
}: InstallatiePageProps) => {
  const { t } = useLanguage();
  const { toast, setToast, showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [houseDesignRevision, setHouseDesignRevision] = useState(0);
  const [editRoomsModalOpen, setEditRoomsModalOpen] = useState(false);
  
  // Load saved data from storage on mount
  const savedData = loadInstallatieFromStorage();
  const uploadRoomsOnMount = getUploadSelectedRooms();
  const uploadRoomsByFloorOnMount = getUploadRoomsByFloor();
  const ventSensorsFlatOnMount = pruneRoomSelections(
    migrateLegacyAndersText(savedData.ventilatieSensors, savedData.otherVentilatieText).filter(
      (s) => s !== ROOM_ANDERS,
    ),
    uploadRoomsOnMount,
  );
  const coolingRoomsFlatOnMount = pruneRoomSelections(
    migrateLegacyAndersText(savedData.coolingRooms, savedData.otherCoolingRoom).filter(
      (s) => s !== ROOM_ANDERS,
    ),
    uploadRoomsOnMount,
  );
  const initialVentSensorsByFloor = loadRoomsByFloor(
    savedData.ventilatieSensorsByFloor,
    ventSensorsFlatOnMount,
    uploadRoomsByFloorOnMount,
    uploadRoomsOnMount,
  );
  const initialCoolRoomsByFloor = loadRoomsByFloor(
    savedData.coolingRoomsByFloor,
    coolingRoomsFlatOnMount,
    uploadRoomsByFloorOnMount,
    uploadRoomsOnMount,
  );

  // Ventilation state
  const [ventilationType, setVentilationType] = useState<'natural' | 'mechanical' | null>(
    savedData.ventilationType ?? null,
  );
  const [ventilationCo2, setVentilationCo2] = useState<boolean | null>(savedData.ventilationCo2);
  const [ventilationOpwekker, setVentilationOpwekker] = useState<string>(
    savedData.ventilationOpwekker ?? '',
  );
  const [otherVentilationOpwekker, setOtherVentilationOpwekker] = useState<string>(
    savedData.otherVentilationOpwekker ?? '',
  );
  const [ventSensorsByFloor, setVentSensorsByFloor] = useState<Record<string, string[]>>(
    () => initialVentSensorsByFloor,
  );
  const [otherVentilatieText, setOtherVentilatieText] = useState('');
  const [ventAndersEditorFloor, setVentAndersEditorFloor] = useState<string | null>(null);
  const [ventAndersFloors, setVentAndersFloors] = useState<string[]>(() =>
    uploadRoomsByFloorOnMount
      .filter(
        ({ floorId, rooms }) =>
          getFloorCustomRooms(floorId, initialVentSensorsByFloor, rooms).length > 0,
      )
      .map(({ floorId }) => floorId),
  );

  const uploadRoomsByFloor = useMemo(
    () => getUploadRoomsByFloor(),
    [currentStep, houseDesignRevision],
  );
  const houseDesignSelectedRooms = useMemo(
    () => getUploadSelectedRooms(),
    [currentStep, houseDesignRevision],
  );
  const installatieLocationOptions = useMemo(
    () => getInstallatieLocationOptions(houseDesignSelectedRooms),
    [houseDesignSelectedRooms],
  );
  const locationSelectOptions = useMemo(
    () => toLocationSelectOptions(installatieLocationOptions),
    [installatieLocationOptions],
  );

  // Heating state
  const [heatingSystemType, setHeatingSystemType] = useState<string>(
    normalizeHeatingSystemType(savedData.heatingSystemType),
  );
  const [heatingLocation, setHeatingLocation] = useState<string>(savedData.heatingLocation);
  const [otherHeatingLocation, setOtherHeatingLocation] = useState<string>(savedData.otherHeatingLocation);
  const [emissionSystemType, setEmissionSystemType] = useState<string>(savedData.emissionSystemType);
  const [controlType, setControlType] = useState<string>(savedData.controlType);
  
  // Tap water state
  const [heatingSameAsWater, setHeatingSameAsWater] = useState<boolean | null>(savedData.heatingSameAsWater);
  const [tapWaterGenerator, setTapWaterGenerator] = useState<string>(savedData.tapWaterGenerator);
  const [tapWaterDevice, setTapWaterDevice] = useState<string>(savedData.tapWaterDevice);
  const [tapWaterLocation, setTapWaterLocation] = useState<string>(savedData.tapWaterLocation);
  const [tapWaterCustomLocation, setTapWaterCustomLocation] = useState<string>(savedData.tapWaterCustomLocation);
  
  // Solar panels state
  const [solarPanels, setSolarPanels] = useState<boolean | null>(savedData.solarPanels);
  const [solarPanelCount, setSolarPanelCount] = useState<string>(savedData.solarPanelCount);
  const [solarTiltAngle, setSolarTiltAngle] = useState<string>(savedData.solarTiltAngle);
  const [solarIntegration, setSolarIntegration] = useState<string>(savedData.solarIntegration);
  
  // Cooling state
  const [activeCooling, setActiveCooling] = useState<boolean | null>(savedData.activeCooling);
  const [coolRoomsByFloor, setCoolRoomsByFloor] = useState<Record<string, string[]>>(
    () => initialCoolRoomsByFloor,
  );
  const [otherCoolingRoom, setOtherCoolingRoom] = useState('');
  const [coolAndersEditorFloor, setCoolAndersEditorFloor] = useState<string | null>(null);
  const [coolAndersFloors, setCoolAndersFloors] = useState<string[]>(() =>
    uploadRoomsByFloorOnMount
      .filter(
        ({ floorId, rooms }) =>
          getFloorCustomRooms(floorId, initialCoolRoomsByFloor, rooms).length > 0,
      )
      .map(({ floorId }) => floorId),
  );
  const [coolingGeneratorType, setCoolingGeneratorType] = useState<string>(savedData.coolingGeneratorType);
  const [coolingEmissionSystem, setCoolingEmissionSystem] = useState<string>(savedData.coolingEmissionSystem);

  // Drop room picks that are no longer on House design
  useEffect(() => {
    setVentSensorsByFloor((prev) => {
      const next = pruneRoomsByFloor(prev, uploadRoomsByFloor);
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
    setCoolRoomsByFloor((prev) => {
      const next = pruneRoomsByFloor(prev, uploadRoomsByFloor);
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
  }, [uploadRoomsByFloor]);

  // Live sync when a room is removed from House design (even in another step)
  useEffect(() => {
    const handleHouseDesignRoomsChanged = () => {
      setHouseDesignRevision((v) => v + 1);
      const saved = loadInstallatieFromStorage();
      const uploadByFloor = getUploadRoomsByFloor();
      setVentSensorsByFloor(
        pruneRoomsByFloor(saved.ventilatieSensorsByFloor ?? {}, uploadByFloor),
      );
      setCoolRoomsByFloor(
        pruneRoomsByFloor(saved.coolingRoomsByFloor ?? {}, uploadByFloor),
      );
      setHeatingLocation(saved.heatingLocation);
      setTapWaterLocation(saved.tapWaterLocation);
    };

    window.addEventListener(HOUSE_DESIGN_ROOMS_CHANGED_EVENT, handleHouseDesignRoomsChanged);
    return () => {
      window.removeEventListener(HOUSE_DESIGN_ROOMS_CHANGED_EVENT, handleHouseDesignRoomsChanged);
    };
  }, []);

  // Drop heating/tap-water locations no longer available from House design
  useEffect(() => {
    const allowed = new Set(installatieLocationOptions);
    setHeatingLocation((prev) => {
      if (!prev || prev === ROOM_ANDERS) return prev;
      return allowed.has(prev) ? prev : '';
    });
    setTapWaterLocation((prev) => {
      if (!prev || prev === ROOM_ANDERS) return prev;
      return allowed.has(prev) ? prev : '';
    });
  }, [installatieLocationOptions]);

  const [selectedSections, setSelectedSections] = useState<InstallatieSectionId[]>(
    () => savedData.selectedSections ?? [],
  );

  // UI state — collapsed until ticked (tick auto-expands)
  const [expandedSections, setExpandedSections] = useState<InstallatieSectionId[]>([]);

  const clearSection = (section: InstallatieSectionId) => {
    switch (section) {
      case 'ventilation':
        setVentilationType(null);
        setVentilationCo2(null);
        setVentilationOpwekker('');
        setOtherVentilationOpwekker('');
        clearVentilationSensors();
        break;
      case 'heating':
        setHeatingSystemType('');
        setHeatingLocation('');
        setOtherHeatingLocation('');
        setEmissionSystemType('');
        setControlType('');
        break;
      case 'tapwater':
        setHeatingSameAsWater(null);
        setTapWaterGenerator('');
        setTapWaterDevice('');
        setTapWaterLocation('');
        setTapWaterCustomLocation('');
        break;
      case 'solar':
        setSolarPanels(null);
        setSolarPanelCount('');
        setSolarTiltAngle('');
        setSolarIntegration('');
        break;
      case 'cooling':
        setActiveCooling(null);
        setCoolRoomsByFloor({});
        setOtherCoolingRoom('');
        setCoolAndersFloors([]);
        setCoolAndersEditorFloor(null);
        setCoolingGeneratorType('');
        setCoolingEmissionSystem('');
        break;
    }
  };

  const handleTickClick = (section: InstallatieSectionId) => {
    if (selectedSections.includes(section)) {
      setSelectedSections((prev) => prev.filter((s) => s !== section));
      setExpandedSections((prev) => prev.filter((s) => s !== section));
      clearSection(section);
    } else {
      setSelectedSections((prev) => [...prev, section]);
      setExpandedSections([section]);
    }
  };

  const isSectionSelected = (section: InstallatieSectionId) =>
    selectedSections.includes(section);

  const toggleSection = (section: InstallatieSectionId) => {
    if (!selectedSections.includes(section)) return;
    setExpandedSections((prev) => (prev.includes(section) ? [] : [section]));
  };

  const isExpanded = (section: InstallatieSectionId) => expandedSections.includes(section);

  const clearVentilationSensors = () => {
    setVentSensorsByFloor({});
    setOtherVentilatieText('');
    setVentAndersFloors([]);
    setVentAndersEditorFloor(null);
  };

  const handleVentilationTypeClick = (type: 'natural' | 'mechanical') => {
    if (ventilationType === type) {
      setVentilationType(null);
      setVentilationCo2(null);
      clearVentilationSensors();
    } else {
      setVentilationType(type);
      if (type === 'natural') {
        setVentilationCo2(null);
        clearVentilationSensors();
      }
    }
  };

  const handleVentilationCo2Click = (value: boolean) => {
    if (ventilationCo2 === value) {
      setVentilationCo2(null);
      clearVentilationSensors();
    } else {
      setVentilationCo2(value);
      if (!value) clearVentilationSensors();
    }
  };

  const handleHeatingSameAsWaterClick = (value: boolean) => {
    if (heatingSameAsWater === value) {
      setHeatingSameAsWater(null);
    } else {
      setHeatingSameAsWater(value);
    }
  };

  const handleSolarPanelsClick = (value: boolean) => {
    if (solarPanels === value) {
      setSolarPanels(null);
    } else {
      setSolarPanels(value);
    }
  };

  const handleActiveCoolingClick = (value: boolean) => {
    if (activeCooling === value) {
      setActiveCooling(null);
    } else {
      setActiveCooling(value);
    }
  };

  const ventilatieSensorsFlat = useMemo(
    () => flattenRoomsByFloor(ventSensorsByFloor),
    [ventSensorsByFloor],
  );
  const coolingRoomsFlat = useMemo(
    () => flattenRoomsByFloor(coolRoomsByFloor),
    [coolRoomsByFloor],
  );

  // Save data to storage whenever anything changes
  useEffect(() => {
    const installData = {
      selectedSections,
      ventilationType,
      ventilationCo2,
      ventilationOpwekker,
      otherVentilationOpwekker,
      ventilatieSensors: ventilatieSensorsFlat,
      ventilatieSensorsByFloor: ventSensorsByFloor,
      otherVentilatieText,
      heatingSystemType,
      heatingLocation,
      otherHeatingLocation,
      emissionSystemType,
      controlType,
      heatingSameAsWater,
      tapWaterGenerator,
      tapWaterDevice,
      tapWaterLocation,
      tapWaterCustomLocation,
      solarPanels,
      solarPanelCount,
      solarTiltAngle,
      solarIntegration,
      solarBrandAndType,
      activeCooling,
      coolingRooms: coolingRoomsFlat,
      coolingRoomsByFloor: coolRoomsByFloor,
      otherCoolingRoom,
      coolingGeneratorType,
      coolingEmissionSystem,
      coolingBrandAndType,
      coolingYearBuilt,
    };
    saveInstallatieToStorage(installData);
    debouncedSyncInstallatie(installData);
    return;
    // legacy save call:
    saveInstallatieToStorage({
      selectedSections,
      ventilationType,
      ventilationCo2,
      ventilationOpwekker,
      otherVentilationOpwekker,
      ventilatieSensors: ventilatieSensorsFlat,
      ventilatieSensorsByFloor: ventSensorsByFloor,
      otherVentilatieText,
      heatingSystemType,
      heatingLocation,
      otherHeatingLocation,
      emissionSystemType,
      controlType,
      heatingSameAsWater,
      tapWaterGenerator,
      tapWaterDevice,
      tapWaterLocation,
      tapWaterCustomLocation,
      solarPanels,
      solarPanelCount,
      solarTiltAngle,
      solarIntegration,
      activeCooling,
      coolingRooms: coolingRoomsFlat,
      coolingRoomsByFloor: coolRoomsByFloor,
      otherCoolingRoom,
      coolingGeneratorType,
      coolingEmissionSystem,
    });
  }, [
    selectedSections,
    ventilationType,
    ventilationCo2,
    ventilationOpwekker,
    otherVentilationOpwekker,
    ventilatieSensorsFlat,
    ventSensorsByFloor,
    otherVentilatieText,
    heatingSystemType,
    heatingLocation,
    otherHeatingLocation,
    emissionSystemType,
    controlType,
    heatingSameAsWater,
    tapWaterGenerator,
    tapWaterDevice,
    tapWaterLocation,
    tapWaterCustomLocation,
    solarPanels,
    solarPanelCount,
    solarTiltAngle,
    solarIntegration,
    activeCooling,
    coolingRoomsFlat,
    coolRoomsByFloor,
    otherCoolingRoom,
    coolingGeneratorType,
    coolingEmissionSystem,
  ]);

  const handleContinue = () => {
    // Save before navigating
    saveInstallatieToStorage({
      selectedSections,
      ventilationType,
      ventilationCo2,
      ventilationOpwekker,
      otherVentilationOpwekker,
      ventilatieSensors: ventilatieSensorsFlat,
      ventilatieSensorsByFloor: ventSensorsByFloor,
      otherVentilatieText,
      heatingSystemType,
      heatingLocation,
      otherHeatingLocation,
      emissionSystemType,
      controlType,
      heatingSameAsWater,
      tapWaterGenerator,
      tapWaterDevice,
      tapWaterLocation,
      tapWaterCustomLocation,
      solarPanels,
      solarPanelCount,
      solarTiltAngle,
      solarIntegration,
      activeCooling,
      coolingRooms: coolingRoomsFlat,
      coolingRoomsByFloor: coolRoomsByFloor,
      otherCoolingRoom,
      coolingGeneratorType,
      coolingEmissionSystem,
    });
    setCurrentStep(Step.PHOTO_CAPTURE);
  };

  const isBackOfficeOrInspector = selectedRole === UserRole.BACK_OFFICE || selectedRole === UserRole.INSPECTOR;

  const isInstallatieSectionComplete = (sectionId: InstallatieSectionId): boolean => {
    switch (sectionId) {
      case 'ventilation':
        if (!ventilationType) return false;
        if (ventilationType === 'mechanical') {
          if (!ventilationOpwekker) return false;
          if (ventilationOpwekker === 'Anders' && !otherVentilationOpwekker.trim()) return false;
          if (ventilationCo2 === null) return false;
        }
        return true;
      case 'heating':
        if (!heatingSystemType || !heatingLocation) return false;
        if (heatingLocation === 'Anders' && !otherHeatingLocation.trim()) return false;
        if (selectedRole !== UserRole.CLIENT) {
          if (!emissionSystemType || !controlType) return false;
        }
        return true;
      case 'tapwater':
        if (heatingSameAsWater === null) return false;
        if (heatingSameAsWater === false) {
          if (!tapWaterGenerator || !tapWaterLocation) return false;
          if (tapWaterLocation === 'Anders' && !tapWaterCustomLocation.trim()) return false;
          if (selectedRole !== UserRole.CLIENT) {
            if (!tapWaterDevice) return false;
          }
        }
        return true;
      case 'solar':
        if (solarPanels === null) return false;
        if (solarPanels === true) {
          if (!solarPanelCount.trim()) return false;
          if (selectedRole !== UserRole.CLIENT) {
            if (!solarTiltAngle.trim() || !solarIntegration) return false;
          }
        }
        return true;
      case 'cooling':
        if (activeCooling === null) return false;
        if (activeCooling === true) {
          if (coolingRoomsFlat.length === 0) return false;
          if (selectedRole !== UserRole.CLIENT) {
            if (!coolingGeneratorType || !coolingEmissionSystem) return false;
          }
        }
        return true;
      default:
        return false;
    }
  };

  const [didAutoExpand, setDidAutoExpand] = useState(false);
  useEffect(() => {
    if (selectedSections.length === 0 || didAutoExpand) return;

    const toExpand = selectedSections.filter((s) => !isInstallatieSectionComplete(s));
    if (toExpand.length > 0) {
      setExpandedSections(toExpand);
    }
    setDidAutoExpand(true);
  }, [selectedSections, didAutoExpand]);



  return (
    <div className="bg-background min-h-screen">
      <TopBar
        showMenu={true}
        showUserMenu={true}
        userName={userName}
        onMenuClick={() => setMobileMenuOpen(true)}
        onManageProfile={onManageProfile || (() => {})}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onLogoClick={onLogoClick}
        profilePhoto={profilePhoto}
      />

      <AppSidebar 
        currentStep={currentStep} 
        handleStepChange={setCurrentStep} 
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />
      
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        currentStep={currentStep} 
        handleStepChange={setCurrentStep}
        onLogout={onLogout}
        userName={userName}
        selectedRole={selectedRole}
      />

      {/* Changed pb-8 to pb-28 to prevent button overlap */}
      <main className="app-page-main md:ml-64 pb-28">
        <BackToTop />
        
        <div className="app-shell-content">
          <PageBackLink label={t('installatie.backToInsulation')} onClick={() => setCurrentStep(Step.INSULATION_DETAILS)} />

          <header className="app-page-title text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-on-surface tracking-tighter">{t('installatie.title')}</h1>
          </header>

          <div className="space-y-4">
            {/* Ventilation Section */}
            {(() => {
              const isVentComplete = !isSectionSelected('ventilation') || isInstallatieSectionComplete('ventilation');
              return (
                <div
                  className={`${isSectionSelected('ventilation') && isExpanded('ventilation') ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border transition-all overflow-hidden ${
                    !isVentComplete ? 'border-amber-500/30' : 'border-outline-variant/10'
                  }`}
                  style={!isVentComplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTickClick('ventilation');
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                            isSectionSelected('ventilation')
                              ? 'bg-primary text-white'
                              : 'border-2 border-gray-300 bg-white'
                          }`}
                          title={t('installatie.selectSection')}
                        >
                          {isSectionSelected('ventilation') && <Check size={14} strokeWidth={3} />}
                        </button>
                        <InstallatieSectionIcon
                          section="ventilation"
                          selected={isSectionSelected('ventilation')}
                        />
                        <div
                          className={`flex-1 min-w-0 ${isSectionSelected('ventilation') ? 'cursor-pointer' : ''}`}
                          onClick={() => isSectionSelected('ventilation') && toggleSection('ventilation')}
                        >
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-black text-lg text-primary">{t('installatie.ventilation')}</h2>
                            {!isVentComplete && (
                              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          {isSectionSelected('ventilation') && ventilationType && (
                            <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5">
                              {(() => {
                                if (ventilationType === 'natural') {
                                  return t('installatie.ventilationTypes.natural');
                                }
                                const opwekker = ventilationOpwekker === 'Anders' ? otherVentilationOpwekker : ventilationOpwekker;
                                const co2Text = ventilationCo2 !== null
                                  ? ` • ${ventilationCo2 ? 'CO2 sensor present' : 'No CO2 sensor'}`
                                  : '';
                                return `${t('installatie.ventilationTypes.mechanical')}${opwekker ? ` • ${opwekker}` : ''}${co2Text}`;
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSectionSelected('ventilation') && (
                        <button
                          type="button"
                          className="text-gray-400 flex-shrink-0 ml-2"
                          onClick={() => toggleSection('ventilation')}
                        >
                          {isExpanded('ventilation') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSectionSelected('ventilation') && isExpanded('ventilation') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-white rounded-b-2xl space-y-4">
                          <div className="pt-4">
                            <p className="text-sm font-bold text-gray-700 mb-3">{t('installatie.ventilationType')}</p>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => handleVentilationTypeClick('natural')}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                  ventilationType === 'natural'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {t('installatie.ventilationTypes.natural')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVentilationTypeClick('mechanical')}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                  ventilationType === 'mechanical'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {t('installatie.ventilationTypes.mechanical')}
                              </button>
                            </div>
                          </div>

                          {ventilationType === 'mechanical' && (
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                              {ventilationOpwekker !== 'Anders' ? (
                                <AppSelect
                                  label={t('installatie.ventilationOpwekker')}
                                  value={ventilationOpwekker}
                                  onChange={setVentilationOpwekker}
                                  placeholder={t('installatie.selectVentilationOpwekker')}
                                  options={VENTILATION_OPWEKKER_OPTIONS.map((val) => ({
                                    value: val,
                                    label: val === 'Anders' ? t('common.other') || 'Anders' : val,
                                  }))}
                                />
                              ) : (
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    {t('installatie.ventilationOpwekker')}
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={otherVentilationOpwekker}
                                      onChange={(e) => setOtherVentilationOpwekker(e.target.value)}
                                      placeholder={t('installatie.enterVentilationOpwekker')}
                                      className="w-full rounded-xl border border-gray-200 bg-white p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setVentilationOpwekker('');
                                        setOtherVentilationOpwekker('');
                                      }}
                                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
                                    >
                                      <ChevronDown size={18} />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm font-bold text-gray-700 mb-3">{t('installatie.ventilationCo2')}</p>
                                <div className="flex gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => handleVentilationCo2Click(true)}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                      ventilationCo2 === true
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {t('common.yes')}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleVentilationCo2Click(false)}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                      ventilationCo2 === false
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {t('common.no')}
                                  </button>
                                </div>
                              </div>

                              {ventilationCo2 === true && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                                      {t('installatie.sensorLocation')}
                                    </label>
                                    <div className="space-y-3">
                                      {uploadRoomsByFloor.map(({ floorId, rooms }) => (
                                        <div key={floorId}>
                                          <p className="text-[10px] font-black uppercase tracking-wider text-primary/80 mb-1.5">
                                            {interiorFloorLabel(floorId, t)}
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {rooms.map((loc) => (
                                              <button
                                                key={`${floorId}-${loc}`}
                                                type="button"
                                                onClick={() => {
                                                  setVentSensorsByFloor((prev) => toggleFloorRoom(prev, floorId, loc));
                                                }}
                                                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
                                                  (ventSensorsByFloor[floorId] ?? []).includes(loc)
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                              >
                                                {translateUploadRoom(loc, t)}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="pt-3">
                                      <button
                                        type="button"
                                        onClick={() => setEditRoomsModalOpen(true)}
                                        className="px-4 py-2 border border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                                      >
                                        <Home size={12} />
                                        {t('upload.editRoomsButton') || 'Edit House Design Rooms'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* Heating Section */}
            {(() => {
              const isHeatingComplete = !isSectionSelected('heating') || isInstallatieSectionComplete('heating');
              return (
                <div
                  className={`${isSectionSelected('heating') && isExpanded('heating') ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border transition-all overflow-hidden ${
                    !isHeatingComplete ? 'border-amber-500/30' : 'border-outline-variant/10'
                  }`}
                  style={!isHeatingComplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTickClick('heating');
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                            isSectionSelected('heating')
                              ? 'bg-primary text-white'
                              : 'border-2 border-gray-300 bg-white'
                          }`}
                          title={t('installatie.selectSection')}
                        >
                          {isSectionSelected('heating') && <Check size={14} strokeWidth={3} />}
                        </button>
                        <InstallatieSectionIcon section="heating" selected={isSectionSelected('heating')} />
                        <div
                          className={`flex-1 min-w-0 ${isSectionSelected('heating') ? 'cursor-pointer' : ''}`}
                          onClick={() => isSectionSelected('heating') && toggleSection('heating')}
                        >
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-black text-lg text-primary">{t('installatie.heating')}</h2>
                            {!isHeatingComplete && (
                              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          {isSectionSelected('heating') && heatingLocation && (
                            <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5">
                              {translateHeatingType(heatingSystemType, t)} • {heatingLocation === 'Anders' ? otherHeatingLocation : heatingLocation}
                            </p>
                          )}
                      </div>
                      </div>
                      {isSectionSelected('heating') && (
                        <button
                          type="button"
                          className="text-gray-400 flex-shrink-0 ml-2"
                          onClick={() => toggleSection('heating')}
                        >
                          {isExpanded('heating') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSectionSelected('heating') && isExpanded('heating') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-white rounded-b-2xl space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <AppSelect
                              label={t('installatie.heatingType')}
                              value={heatingSystemType}
                              onChange={setHeatingSystemType}
                              placeholder={t('installatie.selectHeatingType')}
                              options={HEATING_TYPES.map((type) => ({
                                value: type,
                                label: translateHeatingType(type, t),
                              }))}
                            />
                            
                            {/* Heating Location with Anders pattern */}
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                {t('installatie.location')}
                              </label>
                              {heatingLocation !== 'Anders' ? (
                                <AppSelect
                                  value={heatingLocation}
                                  onChange={setHeatingLocation}
                                  placeholder={t('installatie.selectLocation')}
                                  options={locationSelectOptions}
                                  searchable={true}
                                />
                              ) : (
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={otherHeatingLocation}
                                    onChange={(e) => setOtherHeatingLocation(e.target.value)}
                                    placeholder={t('installatie.enterLocation')}
                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHeatingLocation('');
                                      setOtherHeatingLocation('');
                                    }}
                                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
                                  >
                                    <ChevronDown size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {isBackOfficeOrInspector && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t border-gray-100">
                              <AppSelect
                                label={t('installatie.emissionType')}
                                value={emissionSystemType}
                                onChange={setEmissionSystemType}
                                placeholder={t('installatie.selectEmissionType')}
                                options={EMISSION_TYPES.map((type) => ({ value: type, label: type }))}
                              />
                              <AppSelect
                                label={t('installatie.controlType')}
                                value={controlType}
                                onChange={setControlType}
                                placeholder={t('installatie.selectControlType')}
                                options={CONTROL_TYPES.map((type) => ({ value: type, label: type }))}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* Tap Water Section */}
            {(() => {
              const isTapwaterComplete = !isSectionSelected('tapwater') || isInstallatieSectionComplete('tapwater');
              return (
                <div
                  className={`${isSectionSelected('tapwater') && isExpanded('tapwater') ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border transition-all overflow-hidden ${
                    !isTapwaterComplete ? 'border-amber-500/30' : 'border-outline-variant/10'
                  }`}
                  style={!isTapwaterComplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTickClick('tapwater');
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                            isSectionSelected('tapwater')
                              ? 'bg-primary text-white'
                              : 'border-2 border-gray-300 bg-white'
                          }`}
                          title={t('installatie.selectSection')}
                        >
                          {isSectionSelected('tapwater') && <Check size={14} strokeWidth={3} />}
                        </button>
                        <InstallatieSectionIcon section="tapwater" selected={isSectionSelected('tapwater')} />
                        <div
                          className={`flex-1 min-w-0 ${isSectionSelected('tapwater') ? 'cursor-pointer' : ''}`}
                          onClick={() => isSectionSelected('tapwater') && toggleSection('tapwater')}
                        >
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-black text-lg text-primary">{t('installatie.tapwater')}</h2>
                            {!isTapwaterComplete && (
                              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          {isSectionSelected('tapwater') && heatingSameAsWater !== null && (
                            <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5">
                              {heatingSameAsWater ? 'Same as heating' : 'Separate system'}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSectionSelected('tapwater') && (
                        <button
                          type="button"
                          className="text-gray-400 flex-shrink-0 ml-2"
                          onClick={() => toggleSection('tapwater')}
                        >
                          {isExpanded('tapwater') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSectionSelected('tapwater') && isExpanded('tapwater') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-white rounded-b-2xl space-y-4">
                          <div>
                            <p className="text-sm font-bold text-gray-700 mb-3">{t('installatie.tapwaterSame')}</p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleHeatingSameAsWaterClick(true)}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                  heatingSameAsWater === true
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {t('common.yes')}
                              </button>
                              <button 
                                onClick={() => handleHeatingSameAsWaterClick(false)}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                  heatingSameAsWater === false
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {t('common.no')}
                              </button>
                            </div>
                          </div>

                          {heatingSameAsWater === false && (
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <AppSelect
                                  label={t('installatie.generatorType')}
                                  value={tapWaterGenerator}
                                  onChange={setTapWaterGenerator}
                                  placeholder={t('installatie.selectGeneratorType')}
                                  options={TAP_WATER_GENERATORS.map((type) => ({
                                    value: type,
                                    label: type,
                                  }))}
                                />
                                {isBackOfficeOrInspector && (
                                  <AppSelect
                                    label={t('installatie.deviceType')}
                                    value={tapWaterDevice}
                                    onChange={setTapWaterDevice}
                                    placeholder={t('installatie.selectDeviceType')}
                                    options={TAP_WATER_DEVICES.map((type) => ({
                                      value: type,
                                      label: type,
                                    }))}
                                  />
                                )}
                              </div>
                              
                              {/* Tap Water Location with Anders pattern */}
                              <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                  {t('installatie.location')}
                                </label>
                                {tapWaterLocation !== 'Anders' ? (
                                  <AppSelect
                                    value={tapWaterLocation}
                                    onChange={setTapWaterLocation}
                                    placeholder={t('installatie.selectLocation')}
                                    options={locationSelectOptions}
                                    searchable={true}
                                  />
                                ) : (
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={tapWaterCustomLocation}
                                      onChange={(e) => setTapWaterCustomLocation(e.target.value)}
                                      placeholder="Enter custom location name..."
                                      className="w-full rounded-xl border border-gray-200 bg-white p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTapWaterLocation('');
                                        setTapWaterCustomLocation('');
                                      }}
                                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
                                    >
                                      <ChevronDown size={18} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* Solar Panels Section */}
            {(() => {
              const isSolarComplete = !isSectionSelected('solar') || isInstallatieSectionComplete('solar');
              return (
                <div
                  className={`${isSectionSelected('solar') && isExpanded('solar') ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border transition-all overflow-hidden ${
                    !isSolarComplete ? 'border-amber-500/30' : 'border-outline-variant/10'
                  }`}
                  style={!isSolarComplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTickClick('solar');
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                            isSectionSelected('solar')
                              ? 'bg-primary text-white'
                              : 'border-2 border-gray-300 bg-white'
                          }`}
                          title={t('installatie.selectSection')}
                        >
                          {isSectionSelected('solar') && <Check size={14} strokeWidth={3} />}
                        </button>
                        <InstallatieSectionIcon section="solar" selected={isSectionSelected('solar')} />
                        <div
                          className={`flex-1 min-w-0 ${isSectionSelected('solar') ? 'cursor-pointer' : ''}`}
                          onClick={() => isSectionSelected('solar') && toggleSection('solar')}
                        >
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-black text-lg text-primary">{t('installatie.solar')}</h2>
                            {!isSolarComplete && (
                              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          {isSectionSelected('solar') && solarPanels !== null && (
                            <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5">
                              {solarPanels ? `${solarPanelCount || '?'} panels installed` : 'No solar panels'}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSectionSelected('solar') && (
                        <button
                          type="button"
                          className="text-gray-400 flex-shrink-0 ml-2"
                          onClick={() => toggleSection('solar')}
                        >
                          {isExpanded('solar') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSectionSelected('solar') && isExpanded('solar') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-white rounded-b-2xl space-y-4">
                          <div>
                            <p className="text-sm font-bold text-gray-700 mb-3">{t('installatie.solarInstalled')}</p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleSolarPanelsClick(true)}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                  solarPanels === true
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {t('common.yes')}
                              </button>
                              <button 
                                onClick={() => handleSolarPanelsClick(false)}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                  solarPanels === false
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {t('common.no')}
                              </button>
                            </div>
                          </div>

                          {solarPanels === true && (
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Number of Panels - No limit (max removed) */}
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                    {t('installatie.panelCount')}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={solarPanelCount}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value, 10);
                                      if (e.target.value === '') {
                                        setSolarPanelCount('');
                                      } else if (!isNaN(value) && value >= 0) {
                                        setSolarPanelCount(e.target.value);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="8"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                                {/* Tilt Angle */}
                                {isBackOfficeOrInspector && (
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                      {t('installatie.tiltAngle')}
                                    </label>
                                    <div className="flex items-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="90"
                                        step="1"
                                        value={solarTiltAngle}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value, 10);
                                          if (e.target.value === '') {
                                            setSolarTiltAngle('');
                                          } else if (!isNaN(value) && value >= 0 && value <= 90) {
                                            setSolarTiltAngle(e.target.value);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                            e.preventDefault();
                                          }
                                        }}
                                        placeholder="35°"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      />
                                      <span className="ml-2 text-sm text-gray-500">°</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Building Integration */}
                              {isBackOfficeOrInspector && (
                                <AppSelect
                                  label={t('installatie.buildingIntegration')}
                                  value={solarIntegration}
                                  onChange={setSolarIntegration}
                                  placeholder={t('installatie.selectIntegrationType')}
                                  options={SOLAR_INTEGRATIONS.map((type) => ({
                                    value: type,
                                    label: type,
                                  }))}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}

            {/* Cooling Section */}
                {(() => {
                  const isCoolingComplete = !isSectionSelected('cooling') || isInstallatieSectionComplete('cooling');
                  return (
                    <div
                      className={`${isSectionSelected('cooling') && isExpanded('cooling') ? 'bg-[#e2e3dd]' : 'bg-white'} rounded-2xl shadow-sm border transition-all overflow-hidden ${
                        !isCoolingComplete ? 'border-amber-500/30' : 'border-outline-variant/10'
                      }`}
                      style={!isCoolingComplete ? { background: 'rgba(245, 158, 11, 0.05)' } : undefined}
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTickClick('cooling');
                              }}
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                                isSectionSelected('cooling')
                                  ? 'bg-primary text-white'
                                  : 'border-2 border-gray-300 bg-white'
                              }`}
                              title={t('installatie.selectSection')}
                            >
                              {isSectionSelected('cooling') && <Check size={14} strokeWidth={3} />}
                            </button>
                            <InstallatieSectionIcon section="cooling" selected={isSectionSelected('cooling')} />
                            <div
                              className={`flex-1 min-w-0 ${isSectionSelected('cooling') ? 'cursor-pointer' : ''}`}
                              onClick={() => isSectionSelected('cooling') && toggleSection('cooling')}
                            >
                              <div className="flex items-center gap-2">
                                <h2 className="font-display font-black text-lg text-primary">{t('installatie.cooling')}</h2>
                                {!isCoolingComplete && (
                                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" />
                                )}
                              </div>
                              {isSectionSelected('cooling') && activeCooling !== null && (
                                <p className="text-[10px] font-black uppercase tracking-wider text-primary mt-0.5">
                                  {activeCooling
                                    ? `${countRoomsByFloor(coolRoomsByFloor)} room(s) have cooling`
                                    : 'No active cooling'}
                                </p>
                              )}
                            </div>
                          </div>
                          {isSectionSelected('cooling') && (
                            <button 
                              type="button"
                              className="text-gray-400 flex-shrink-0 ml-2"
                              onClick={() => toggleSection('cooling')}
                            >
                              {isExpanded('cooling') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isSectionSelected('cooling') && isExpanded('cooling') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-white rounded-b-2xl space-y-4">
                              <div>
                                <p className="text-sm font-bold text-gray-700 mb-3">{t('installatie.activeCooling')}</p>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleActiveCoolingClick(true)}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                      activeCooling === true
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {t('common.yes')}
                                  </button>
                                  <button
                                    onClick={() => handleActiveCoolingClick(false)}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                      activeCooling === false
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {t('common.no')}
                                  </button>
                                </div>
                              </div>

                              {activeCooling === true && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                  <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                                      {t('installatie.coolingRooms')}
                                    </label>
                                    <div className="space-y-3">
                                      {(() => {
                                        const allowedBases = ['WOONKAMER', 'SLAAPKAMER', 'KEUKEN', 'EETKAMER'];
                                        const filteredFloors = uploadRoomsByFloor
                                          .map(({ floorId, rooms }) => ({
                                            floorId,
                                            rooms: rooms.filter((room) => {
                                              const base = room.replace(/\s+\d+$/, '').toUpperCase();
                                              return allowedBases.includes(base);
                                            }),
                                          }))
                                          .filter(({ rooms }) => rooms.length > 0);

                                        if (filteredFloors.length === 0) {
                                          return (
                                            <p className="text-xs text-gray-500 italic">
                                              {t('installatie.noCoolingRoomsAvailable')}
                                            </p>
                                          );
                                        }

                                        return filteredFloors.map(({ floorId, rooms }) => (
                                          <div key={floorId}>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-primary/80 mb-1.5">
                                              {interiorFloorLabel(floorId, t)}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {rooms.map((room) => (
                                                <button
                                                  key={`${floorId}-${room}`}
                                                  type="button"
                                                  onClick={() => {
                                                    setCoolRoomsByFloor((prev) => toggleFloorRoom(prev, floorId, room));
                                                  }}
                                                  className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${
                                                    (coolRoomsByFloor[floorId] ?? []).includes(room)
                                                      ? 'bg-primary text-white shadow-md'
                                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                  }`}
                                                >
                                                  {translateUploadRoom(room, t)}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                    <div className="pt-3">
                                      <button
                                        type="button"
                                        onClick={() => setEditRoomsModalOpen(true)}
                                        className="px-4 py-2 border border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                                      >
                                        <Home size={12} />
                                        {t('upload.editRoomsButton') || 'Edit House Design Rooms'}
                                      </button>
                                    </div>
                                  </div>

                                  {isBackOfficeOrInspector && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4">
                                      <AppSelect
                                        label={t('installatie.generatorType')}
                                        value={coolingGeneratorType}
                                        onChange={setCoolingGeneratorType}
                                        placeholder={t('installatie.selectGeneratorType')}
                                        options={GENERATOR_TYPES.map((type) => ({
                                          value: type,
                                          label: type,
                                        }))}
                                        searchable={true}
                                      />
                                      <AppSelect
                                        label={t('installatie.emissionSystem')}
                                        value={coolingEmissionSystem}
                                        onChange={setCoolingEmissionSystem}
                                        placeholder={t('installatie.selectEmissionSystem')}
                                        options={EMISSION_SYSTEMS.map((type) => ({
                                          value: type,
                                          label: type,
                                        }))}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}
          </div>
        </div>
      </main>

      <StepContinueFooter onClick={handleContinue} label={t('installatie.continuePhotos')} />

      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {editRoomsModalOpen && (
          <HouseDesignRoomsModal
            open={editRoomsModalOpen}
            onClose={() => setEditRoomsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};