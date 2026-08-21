/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConstructionRow {
  id: string;
  type: 'Deur' | 'Raam' | 'Paneel' | 'Gevel' | 'Vloer' | 'Dak';
  naam: string;
  locatie?: string;
  invoer?: string;
  isolatie?: string;
  kozijn?: string;
  glas?: string;
  merk?: string;
  type_desc?: string;
  dakType?: string;
  orientation?: string;
  area?: string;
  dikte?: string;
  bouwjaar?: string;
  rc?: string;
  rcWw?: string;
  rcWb?: string;
  rcWbWater?: string;
  uNiet?: string;
  uGren?: string;
  g?: string;
  gInvoer?: string;
  code?: string;
  photoUrl?: string;
  photoTag?: string;
  photos?: string[];
  uWaarde?: string;
  flag?: 'red' | 'yellow' | 'green';
}

export interface KozijnRow {
  id: string;
  gevel: string;
  naam: string;
  width: string;
  height: string;
  area: string;
  constructieId: string;
  flag?: 'red' | 'yellow' | 'green';
  photos?: string[];
  photoUrl?: string;
}

export interface InstallatieRow {
  id: string;
  activeCategories?: string[];
  ventilatieName?: string;
  verwarmingName?: string;
  tapwaterName?: string;
  koelingName?: string;
  zonneName?: string;
  details?: any;
}

export interface InspectionData {
  id?: string;
  clientId?: string;
  status?: string;
  algemeen: {
    woning: {
      bouwfase: string;
      opname: string;
      adres: string;
      gebouwtype: string;
      subtype: string;
      ligging: string;
      daktype: string;
      gebouwhoogte: string;
      postcode: string;
      pandId: string;
      vboId: string;
      plaats: string;
      wijk: string;
      gemeent: string;
      technischComplex: string;
      financieelComplex: string;
      svbStatus: string;
      bron: string;
      floorConstructieType: string;
      wallConstructieType: string;
      photos?: string[];
    };
    bewoner: {
      nummer: string;
      persoon: string;
      adres: string;
      postcode: string;
      plaats: string;
      telefoon: string;
      email: string;
      photos?: string[];
    };
    inspector: {
      adviseur: string;
      adres: string;
      postcode: string;
      plaats: string;
      telefoon: string;
      email: string;
      certificaathouder: string;
      gebruiker: string;
      opnamedatum: string;
      invoerdatum: string;
    };
    technical: {
      gboTs: string[];
      leidingdoorvoeren: string;
      aantal: string;
      avr: string;
    };
    bidIntern: {
      fullName: string;
      phoneNumber: string;
      email: string;
      contactAddress: string;
    };
  };
  constructies: ConstructionRow[];
  kozijnen: KozijnRow[];
  overstekRows?: any[];
  bouwkundigRows?: any[];
  kozijnenLibrary?: any[];
  allInstallations?: InstallatieRow[];
  overstek: {
    overstekAanwezig: string;
    overstekDiepte: string;
    overstekBreedte: string;
    belemmeringAanwezig: string;
    belemmeringType: string;
    belemmeringHoogte: string;
    belemmeringAfstand: string;
    zonnehoekCorrectie: string;
    notities: string;
  };
  installations: {
    ventSysteem: string;
    ventMerkType: string;
    ventSpecsBcrg: string;
    ventVentilatiesysteem: string;
    ventSubsysteem: string;
    ventLuchtdichtheid: string;
    ventVentilatoren: string;
    ventTypeVentilator: string;
    ventCode: string;

    verwarmSysteem: string;
    verwarmMerkType: string;
    verwarmSpecsBcrg: string;
    verwarmTypeopwekker: string;
    verwarmTypeToestel: string;
    verwarmDistributiemedium: string;
    verwarmWatertemprater: string;
    verwarmAfgiftesysteem: string;
    verwarmCode: string;
    verwarmRegeling: string;

    tapSysteem: string;
    tapMerkType: string;
    tapSpecsBcrg: string;
    tapTypeInstallatie: string;
    tapTypeOpwekker: string;
    tapTypeToestel: string;
    tapCode: string;
    tapAfgifteKeuken: string;
    tapAfgifteBadkamer: string;
    tapCirculatieleiding: string;
    tapDwtw: string;

    koelSysteem: string;
    koelMerkType: string;
    koelSpecsBcrg: string;
    koelTypeInstallatie: string;
    koelExpansie: string;
    koelCode: string;
    koelDistributiemedium: string;
    koelWatertemprater: string;
    koelAfgiftesysteem: string;
    koelRegeling: string;

    zonSysteem: string;
    zonMerkType: string;
    zonSpecsBcrg: string;
    zonAantal: string;
    zonHellingshook: string;
    zonCode: string;
    zonOppPerPanelen: string;
    zonWattpiekvermogen: string;
    zonBouwintegratie: string;
    zonOrientatie?: string;

    // Additional optional fields to prevent key conflicts
    ventHrEfficiency?: string;
    ventNomPower?: string;
    ventMotorType?: string;
    ventFabrication?: string;
    ventDemandControl?: string;
    ventBypass?: string;
    verwarmWaterzijdigIngeeregeld?: string;
    verwarmHrKlasse?: string;
    verwarmDistributietype?: string;
    verwarmPower?: string;
    koelGeneratorsCount?: string;
    koelMainCirculationPump?: string;
    zonTypeToestel?: string;
    ventTypeToestel?: string;
    koelTypeToestel?: string;
    ventIdentiekeSystemen?: string;
    tapIdentiekeSystemen?: string;
    koelIdentiekeSystemen?: string;
    verwarmIdentiekeSystemen?: string;
    zonIdentiekeSystemen?: string;
  };
}

export type ViewType =
  | 'inventory'
  | 'dashboard'
  | 'bewoner'
  | 'inspector'
  | 'bid-intern'
  | 'algemeen'
  | 'constructie'
  | 'installatie'
  | 'geometry'
  | 'geometry-overstek'
  | 'geometry-bouwkundig'
  | 'geometry-kozijn'
  | 'bouwkundig-gevel'
  | 'bouwkundig-vloer'
  | 'bouwkundig-dak'
  | 'identificatie'
  | 'woningdossier'
  | 'invoersheet'
  | 'settings';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  profile_picture?: string;
  role: string;
}
