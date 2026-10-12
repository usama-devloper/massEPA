export type EnergyLabel = 'A++++' | 'A+++' | 'A++' | 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface EnvelopeElement {
  id: string;
  code: string; // e.g. "GEV-01"
  name: string; // e.g. "Voorgevel metselwerk spouw"
  type: 'gevel' | 'dak' | 'vloer' | 'raam' | 'deur';
  orientation: 'N' | 'NO' | 'O' | 'ZO' | 'Z' | 'ZW' | 'W' | 'NW' | 'Horizontaal';
  area: number; // m²
  length?: number; // m
  width?: number; // m
  rc?: number; // m²K/W for opaque
  uValue?: number; // W/m²K for transparent
  glazingType?: string;
  gValue?: number; // Solar transmission
  insulationType: string;
  insulationThicknessMm: number;
  qualityStatement: boolean;
  bcrgCode?: string;
  inspectionPhotoUrl?: string;
  verified: boolean;
  notes?: string;
}

export interface InstallationSystem {
  heatingType: 'Warmtepomp (Lucht/Water)' | 'Warmtepomp (Bodem/Water)' | 'Hybride Warmtepomp + HR-ketel' | 'HR-107 CV-ketel' | 'Stadsverwarming';
  heatingEfficiencyCOP: number;
  tapwaterType: 'Geïntegreerde boiler warmtepomp' | 'Combiketel HR' | 'Zonneboiler + naverwarmer' | 'Elektrische boiler' | 'Stadsverwarming afleverset';
  ventilationType: 'Natuurlijke toevoer + afvoer (Systeem A)' | 'Mechanische afvoer (Systeem C)' | 'Balansventilatie met WTW (Systeem D)' | 'Vraaggestuurde ventilatie CO2';
  wtwEfficiencyPct: number; // e.g. 92%
  solarPvPanelsCount: number;
  solarPvWpPerPanel: number;
  solarPvOrientation: 'Z' | 'ZO' | 'ZW' | 'O' | 'W';
  solarPvInclinationDeg: number;
  hasSolarBoiler: boolean;
  coolingPresent: boolean;
}

export interface BagIdentification {
  pandId: string;
  vboId: string;
  address: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  municipality: string;
  constructionYear: number;
  usageFunction: string;
  usableAreaAg: number; // m²
  lossAreaAls: number; // m²
  compactnessAlsAg: number;
  volumeM3: number;
  floorsCount: number;
  buildingType: 'Tussenwoning' | 'Hoekwoning' | 'Twee-onder-één-kap' | 'Vrijstaand' | 'Appartement (tussen)' | 'Appartement (dak)' | 'Kop-eind-of hoekligging' | string;
}

export interface InspectionPin {
  id: string;
  xPct: number; // 0 - 100%
  yPct: number; // 0 - 100%
  elementId?: string;
  title: string;
  tag: string;
  description: string;
  type: 'envelope' | 'window' | 'installation' | 'defect' | 'bcrg';
  status: 'verified' | 'pending' | 'flagged';
  photoUrl?: string;
}

export interface DrawingItem {
  id: string;
  title: string;
  type: 'blueprint' | 'elevation' | 'photo' | 'thermal';
  url: string;
  caption: string;
  pins: InspectionPin[];
}

export interface ValidationItem {
  id: string;
  ruleCode: string;
  chapter: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  isResolved: boolean;
}

export interface BewonerInfo {
  name: string;
  contact: string;
  postcode: string;
  email: string;
  address: string;
  plaats?: string;
}

export interface InspectorInfo {
  name: string;
  contact: string;
  email: string;
  address: string;
  postcode?: string;
  plaats?: string;
}

export interface GeneralDetailsInfo {
  bouwfase: string;
  opnametype: string;
  gebouwtype: string;
  subtype: string;
  daktypeLigging: string;
  gebouwhoogte: string;
}

export interface GboData {
  l: string;
  w: string;
  a: string;
}

export interface TechnicalDetailsInfo {
  vloerConstructie: string;
  wandConstructie: string;
  leidingdoorvoeren: string;
  aantal: string;
  avr: string;
  gbo1: GboData;
  gbo2?: GboData;
  gbo3?: GboData;
}

export interface ProjectDossier {
  dossierNumber: string;
  status: 'In opname' | 'Controle NTA 8800' | 'Gereed voor afmelding' | 'Afgemeld EP-Online';
  inspectionDate: string;
  invoerdatum?: string;
  inspectorName: string;
  inspectorCertNumber: string;
  certificationInstitute: string;
  calculationSoftware: string;
  softwareVersion: string;
  protocolVersion: string; // NTA 8800:2024
  bag: BagIdentification;
  bewoner?: BewonerInfo;
  inspector?: InspectorInfo;
  generalDetails?: GeneralDetailsInfo;
  technicalDetails?: TechnicalDetailsInfo;
  envelope: EnvelopeElement[];
  installations: InstallationSystem;
  drawings: DrawingItem[];
  validationRules: ValidationItem[];
  facadesData?: any[];
  interiorSpacesData?: any[];
}
