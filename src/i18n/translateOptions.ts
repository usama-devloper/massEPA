import type { TranslateFn } from '../context/LanguageContext';

/** Map stored Dutch/domain values → i18n key (labels stay in JSON). */
function pick(value: string, map: Record<string, string>, t: TranslateFn): string {
  const key = map[value];
  if (!key) return value;
  const text = t(key);
  return text === key ? value : text;
}

const ALGEMEEN_OPTIONS: Record<string, string> = {
  Eengezinswoning: 'algemeen.options.buildingType.detachedHouse',
  'Woning in een appartementencomplex': 'algemeen.options.buildingType.apartment',
  'Eengezinswoning met niet zelfstandig wooneenheden met eigen adressen':
    'algemeen.options.buildingType.detachedNonSelfContained',
  'Woning in een appartementencomplex met niet zelfstandige wooneenheden met eigen adressen':
    'algemeen.options.buildingType.apartmentNonSelfContained',
  Vrijstaand: 'algemeen.options.position.detached',
  'Kop-eind-of hoekligging': 'algemeen.options.position.endTerrace',
  Tussenligging: 'algemeen.options.position.midTerrace',
  'Twee onder een kap': 'algemeen.options.position.semiDetached',
  'Hellend Dak': 'algemeen.options.location.pitchedRoof',
  'Deels plat dak': 'algemeen.options.location.partlyFlat',
  'Plat dak / zonder kap': 'algemeen.options.location.flatRoof',
  'Onderste verdieping': 'algemeen.options.location.groundFloorUnit',
  Tussenverdieping: 'algemeen.options.location.middleFloor',
  'Bovenste verdieping': 'algemeen.options.location.topFloor',
  'Onderste verdieping met dak': 'algemeen.options.location.groundWithRoof',
  'Begane grond': 'algemeen.options.whichFloor.ground',
  '1e verdieping': 'algemeen.options.whichFloor.first',
  '2e verdieping': 'algemeen.options.whichFloor.second',
  '3e verdieping': 'algemeen.options.whichFloor.third',
  '4e verdieping': 'algemeen.options.whichFloor.fourth',
  '5e verdieping': 'algemeen.options.whichFloor.fifth',
  '6e verdieping': 'algemeen.options.whichFloor.sixth',
  '7e verdieping': 'algemeen.options.whichFloor.seventh',
  '8e verdieping': 'algemeen.options.whichFloor.eighth',
  '9e verdieping': 'algemeen.options.whichFloor.ninth',
};

const UPLOAD_ROOMS: Record<string, string> = {
  HAL: 'upload.rooms.hal',
  MK: 'upload.rooms.mk',
  WC: 'upload.rooms.wc',
  WOONKAMER: 'upload.rooms.livingRoom',
  KEUKEN: 'upload.rooms.kitchen',
  BADKAMER: 'upload.rooms.bathroom',
  SLAAPKAMER: 'upload.rooms.bedroom',
  'TECHNICAL ROOM': 'upload.rooms.technicalRoom',
  BERGING: 'upload.rooms.storage',
  AANBOUW: 'upload.rooms.extension',
  SERRE: 'upload.rooms.conservatory',
  ZOLDER: 'upload.rooms.attic',
  DAKKAPEL: 'upload.rooms.dormer',
  WASRUIMTE: 'upload.rooms.wasruimte',
  EETKAMER: 'upload.rooms.eetkamer',
  OVERLUIP: 'upload.rooms.overluip',
};

const UPLOAD_FLOORS: Record<string, string> = {
  BG: 'upload.floors.ground',
  '1e': 'upload.floors.first',
  '2e': 'upload.floors.second',
  '3e': 'upload.floors.third',
  '4e': 'upload.floors.fourth',
  '5e': 'upload.floors.fifth',
  '6e': 'upload.floors.sixth',
  '7e': 'upload.floors.seventh',
  '8e': 'upload.floors.eighth',
  '9e': 'upload.floors.ninth',
};

const UPLOAD_CONSTRUCTION: Record<string, string> = {
  Licht: 'upload.construction.light',
  Zwaar: 'upload.construction.heavy',
  'Zeer zwaar': 'upload.construction.veryHeavy',
};

export function translateAlgemeenOption(value: string, t: TranslateFn): string {
  if (/^SLAAPKAMER \d+$/.test(value)) {
    return t('upload.rooms.bedroomN', { n: value.replace('SLAAPKAMER ', '') });
  }
  return pick(value, ALGEMEEN_OPTIONS, t);
}

export function translateUploadRoom(value: string, t: TranslateFn): string {
  if (/^SLAAPKAMER \d+$/.test(value)) {
    return t('upload.rooms.bedroomN', { n: value.replace('SLAAPKAMER ', '') });
  }
  const numbered = value.match(/^(.+?) (\d+)$/);
  if (numbered) {
    const [, base, num] = numbered;
    const baseLabel = pick(base, UPLOAD_ROOMS, t);
    if (baseLabel !== base) {
      return `${baseLabel} ${num}`;
    }
  }
  return pick(value, UPLOAD_ROOMS, t);
}

export function translateUploadFloor(value: string, t: TranslateFn): string {
  return pick(value, UPLOAD_FLOORS, t);
}

export function translateUploadConstruction(value: string, t: TranslateFn): string {
  return pick(value, UPLOAD_CONSTRUCTION, t);
}

const HEATING_TYPES: Record<string, string> = {
  'HR ketel': 'installatie.heatingTypes.hrKetel',
  'CV ketel': 'installatie.heatingTypes.cvKetel',
  warmtepomp: 'installatie.heatingTypes.warmtepomp',
  stadsverwarming: 'installatie.heatingTypes.stadsverwarming',
  Lucht: 'installatie.heatingTypes.lucht',
  Warmtepomp: 'installatie.heatingTypes.warmtepomp',
  Stadsverwarming: 'installatie.heatingTypes.stadsverwarming',
};

export function translateHeatingType(value: string, t: TranslateFn): string {
  return pick(value, HEATING_TYPES, t);
}

const KOZIJN_FRAME: Record<string, string> = {
  Hout: 'kozijn.options.frame.hout',
  'Hout of kunststof': 'kozijn.options.frame.houtKunststof',
  Kunststof: 'kozijn.options.frame.kunststof',
  Metaal: 'kozijn.options.frame.metaal',
};

const KOZIJN_GLASS: Record<string, string> = {
  'HR++ Glas': 'kozijn.options.glass.hrpp',
  'HR+++ Glas (Triple)': 'kozijn.options.glass.hrppp',
  'Dubbel glas': 'kozijn.options.glass.dubbel',
  'Enkel glas': 'kozijn.options.glass.enkel',
};

const KOZIJN_LOCATION: Record<string, string> = {
  Voor: 'kozijn.options.location.voor',
  Achter: 'kozijn.options.location.achter',
  Links: 'kozijn.options.location.links',
  Rechts: 'kozijn.options.location.rechts',
};

const KOZIJN_FLOOR: Record<string, string> = {
  'Begane grond': 'algemeen.options.whichFloor.ground',
  'Eerste verdieping': 'algemeen.options.whichFloor.first',
  'Tweede verdieping': 'algemeen.options.whichFloor.second',
  'Derde verdieping': 'algemeen.options.whichFloor.third',
  'Vierde verdieping': 'algemeen.options.whichFloor.fourth',
  'Vijfde verdieping': 'algemeen.options.whichFloor.fifth',
  'Zesde verdieping': 'algemeen.options.whichFloor.sixth',
  'Zevende verdieping': 'algemeen.options.whichFloor.seventh',
  'Achtste verdieping': 'algemeen.options.whichFloor.eighth',
  'Negende verdieping': 'algemeen.options.whichFloor.ninth',
};

export function translateKozijnFrameType(value: string, t: TranslateFn): string {
  return pick(value, KOZIJN_FRAME, t);
}

export function translateKozijnGlassType(value: string, t: TranslateFn): string {
  return pick(value, KOZIJN_GLASS, t);
}

export function translateKozijnLocation(value: string, t: TranslateFn): string {
  return pick(value, KOZIJN_LOCATION, t);
}

export function translateKozijnFloor(value: string, t: TranslateFn): string {
  return pick(value, KOZIJN_FLOOR, t);
}
