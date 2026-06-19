// src/storage/installatieData.ts

export type InstallatieSectionId = 'ventilation' | 'heating' | 'tapwater' | 'solar' | 'cooling';

export const INSTALLATIE_SECTION_IDS: InstallatieSectionId[] = [
  'ventilation',
  'heating',
  'tapwater',
  'solar',
  'cooling',
];

export interface InstallatieData {
  /** Ticked sections — only these show questions (default none). */
  selectedSections: InstallatieSectionId[];

  // Ventilation
  ventilationType: 'natural' | 'mechanical' | null;
  ventilationCo2: boolean | null;
  ventilatieSensors: string[];
  /** Per-floor sensor locations (standard + Anders). */
  ventilatieSensorsByFloor?: Record<string, string[]>;
  otherVentilatieText: string;
  
  // Heating
  heatingSystemType: string;
  heatingLocation: string;
  otherHeatingLocation: string;
  emissionSystemType: string;
  controlType: string;
  
  // Tap water
  heatingSameAsWater: boolean | null;
  tapWaterGenerator: string;
  tapWaterDevice: string;
  tapWaterLocation: string;
  tapWaterCustomLocation: string;
  
  // Solar panels
  solarPanels: boolean | null;
  solarPanelCount: string;
  solarTiltAngle: string;
  solarIntegration: string;
  
  // Cooling
  activeCooling: boolean | null;
  coolingRooms: string[];
  /** Per-floor cooling rooms (standard + Anders). */
  coolingRoomsByFloor?: Record<string, string[]>;
  otherCoolingRoom: string;
  coolingGeneratorType: string;
  coolingEmissionSystem: string;
}

const LS_INSTALLATIE = 'massEPA_installatie_v1';

const defaultData: InstallatieData = {
  selectedSections: [],

  // Ventilation
  ventilationType: null,
  ventilationCo2: null,
  ventilatieSensors: [],
  otherVentilatieText: '',
  
  // Heating
  heatingSystemType: '',
  heatingLocation: '',
  otherHeatingLocation: '',
  emissionSystemType: 'Vloerverwarming',
  controlType: 'Regeling in hoofdvertrek',
  
  // Tap water
  heatingSameAsWater: null,
  tapWaterGenerator: '',
  tapWaterDevice: '',
  tapWaterLocation: '',
  tapWaterCustomLocation: '',
  
  // Solar panels
  solarPanels: null,
  solarPanelCount: '',
  solarTiltAngle: '',
  solarIntegration: 'Hoog geventileerd',
  
  // Cooling
  activeCooling: null,
  coolingRooms: [],
  otherCoolingRoom: '',
  coolingGeneratorType: '',
  coolingEmissionSystem: '',
};

function normalizeSelectedSections(value: unknown): InstallatieSectionId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is InstallatieSectionId =>
    INSTALLATIE_SECTION_IDS.includes(id as InstallatieSectionId),
  );
}

const LEGACY_HEATING_TYPE: Record<string, string> = {
  Warmtepomp: 'warmtepomp',
  Stadsverwarming: 'stadsverwarming',
};

function normalizeHeatingSystemType(value: string | undefined): string {
  if (!value) return '';
  return LEGACY_HEATING_TYPE[value] ?? value;
}

export const loadInstallatieFromStorage = (): InstallatieData => {
  const raw = localStorage.getItem(LS_INSTALLATIE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<InstallatieData>;
      return {
        ...defaultData,
        ...parsed,
        selectedSections: normalizeSelectedSections(parsed.selectedSections),
        heatingSystemType: normalizeHeatingSystemType(parsed.heatingSystemType),
        ventilationType: (parsed.ventilationType === 'natural' || parsed.ventilationType === 'mechanical')
          ? parsed.ventilationType
          : null,
      };
    } catch {
      /* ignore */
    }
  }
  return defaultData;
};

export const saveInstallatieToStorage = (data: InstallatieData) => {
  localStorage.setItem(LS_INSTALLATIE, JSON.stringify(data));
};