export const ALGEMEEN_STORAGE_KEY = 'algemeenData';

export type AlgemeenStoredData = {
  buildingType: string;
  position: string;
  location: string;
  numberOfFloors: number | null;
  city: string;
  hasKelder: boolean | null;
  hasKruipruimte: boolean | null;
  whichFloor: string | null;
  hasFloorPlans: boolean | null;
  renovationStatus: string;
  renovationYear: string;
  bouwjaar: string;
  floorArea: string;
  buurt: string;
  wijk: string;
  gemeente: string;
  gebouwhoogte: string;
};

export function loadAlgemeenFromStorage(): Partial<AlgemeenStoredData> {
  try {
    const raw = localStorage.getItem(ALGEMEEN_STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<AlgemeenStoredData> = {};

    if (typeof p.buildingType === 'string') out.buildingType = p.buildingType;
    if (typeof p.position === 'string') out.position = p.position;
    if (typeof p.location === 'string') out.location = p.location;
    if (typeof p.numberOfFloors === 'number' && !Number.isNaN(p.numberOfFloors)) {
      out.numberOfFloors = Math.min(10, Math.max(1, p.numberOfFloors));
    } else if (p.numberOfFloors === null) {
      out.numberOfFloors = null;
    }
    if (typeof p.city === 'string') out.city = p.city;
    if (typeof p.hasKelder === 'boolean') out.hasKelder = p.hasKelder;
    if (typeof p.hasKruipruimte === 'boolean') out.hasKruipruimte = p.hasKruipruimte;
    if (typeof p.whichFloor === 'string') out.whichFloor = p.whichFloor;
    else if (p.whichFloor === null) out.whichFloor = null;
    if (p.hasFloorPlans === true || p.hasFloorPlans === false) out.hasFloorPlans = p.hasFloorPlans;
    if (typeof p.renovationStatus === 'string') out.renovationStatus = p.renovationStatus;
    if (typeof p.renovationYear === 'string') out.renovationYear = p.renovationYear;
    if (typeof p.bouwjaar === 'string') out.bouwjaar = p.bouwjaar;
    if (typeof p.floorArea === 'string') out.floorArea = p.floorArea;
    if (typeof p.buurt === 'string') out.buurt = p.buurt;
    if (typeof p.wijk === 'string') out.wijk = p.wijk;
    if (typeof p.gemeente === 'string') out.gemeente = p.gemeente;
    if (typeof p.gebouwhoogte === 'string') out.gebouwhoogte = p.gebouwhoogte;

    return out;
  } catch {
    return {};
  }
}

export function saveAlgemeenToStorage(data: AlgemeenStoredData): void {
  try {
    localStorage.setItem(ALGEMEEN_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

export function isApartmentBuildingType(buildingType: string | null | undefined): boolean {
  return (
    buildingType === 'Woning in een appartementencomplex' ||
    buildingType ===
      'Woning in een appartementencomplex met niet zelfstandige wooneenheden met eigen adressen'
  );
}

export function mergeAlgemeenInStorage(patch: Partial<AlgemeenStoredData>): void {
  const existing = loadAlgemeenFromStorage();
  saveAlgemeenToStorage({
    buildingType: existing.buildingType ?? 'Eengezinswoning',
    position: existing.position ?? 'Vrijstaand',
    location: existing.location ?? 'Hellend Dak',
    numberOfFloors: existing.numberOfFloors ?? null,
    city: existing.city ?? '',
    hasKelder: existing.hasKelder ?? null,
    hasKruipruimte: existing.hasKruipruimte ?? null,
    whichFloor: existing.whichFloor ?? null,
    hasFloorPlans: existing.hasFloorPlans ?? null,
    renovationStatus: existing.renovationStatus ?? 'Nee',
    renovationYear: existing.renovationYear ?? '',
    bouwjaar: existing.bouwjaar ?? '',
    floorArea: existing.floorArea ?? '',
    buurt: existing.buurt ?? '',
    wijk: existing.wijk ?? '',
    gemeente: existing.gemeente ?? '',
    gebouwhoogte: existing.gebouwhoogte ?? '',
    ...patch,
  });
}
