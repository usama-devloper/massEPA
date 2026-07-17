import { HOUSE_DESIGN_PAGE_STORAGE_KEY } from '../storage/houseDesignPageData';

/** Default BG rooms when House design has no selection yet (matches typical dev / reference flow). */
export const DEFAULT_INTERIOR_ROOMS_BG = ['HAL', 'MK', 'WC', 'WOONKAMER'] as const;

export const KELDER_FLOOR_KEY = 'KELDER';

export const INTERIOR_FLOOR_ORDER = [
  'BG',
  '1e',
  '2e',
  '3e',
  '4e',
  '5e',
  '6e',
  '7e',
  '8e',
  '9e',
] as const;

/** Algemeen “Welke verdieping?” labels → House design floor keys. */
const WHICH_FLOOR_LABEL_TO_KEY: Record<string, (typeof INTERIOR_FLOOR_ORDER)[number]> = {
  'Begane grond': 'BG',
  '1e verdieping': '1e',
  '2e verdieping': '2e',
  '3e verdieping': '3e',
  '4e verdieping': '4e',
  '5e verdieping': '5e',
  '6e verdieping': '6e',
  '7e verdieping': '7e',
  '8e verdieping': '8e',
  '9e verdieping': '9e',
};

/** Dutch display labels aligned with INTERIOR_FLOOR_ORDER (Kozijn / legacy UI). */
export const INTERIOR_FLOOR_DISPLAY_LABELS = [
  'Begane grond',
  'Eerste verdieping',
  'Tweede verdieping',
  'Derde verdieping',
  'Vierde verdieping',
  'Vijfde verdieping',
  'Zesde verdieping',
  'Zevende verdieping',
  'Achtste verdieping',
  'Negende verdieping',
] as const;

export function whichFloorLabelToKey(whichFloor: string | null | undefined): string {
  if (!whichFloor) return 'BG';
  return WHICH_FLOOR_LABEL_TO_KEY[whichFloor] ?? 'BG';
}

/** Consecutive unit floors from a start key (e.g. 1e + 2 → 1e, 2e). */
export function getInteriorFloorSlice(
  numberOfFloors: number,
  startFloorKey: string = 'BG',
): string[] {
  const startIndex = INTERIOR_FLOOR_ORDER.indexOf(
    startFloorKey as (typeof INTERIOR_FLOOR_ORDER)[number],
  );
  const fromIndex = startIndex >= 0 ? startIndex : 0;
  const floors = Math.max(1, numberOfFloors);
  return [...INTERIOR_FLOOR_ORDER.slice(fromIndex, fromIndex + floors)];
}

export function getInteriorFloorDisplayLabels(
  numberOfFloors: number,
  startFloorKey: string = 'BG',
): string[] {
  return getInteriorFloorSlice(numberOfFloors, startFloorKey).map((key) => {
    const idx = INTERIOR_FLOOR_ORDER.indexOf(key as (typeof INTERIOR_FLOOR_ORDER)[number]);
    return INTERIOR_FLOOR_DISPLAY_LABELS[idx] ?? key;
  });
}

const STANDARD_INTERIOR_ROOM_IDS = new Set([
  'HAL',
  'MK',
  'WC',
  'WOONKAMER',
  'KEUKEN',
  'BADKAMER',
  'SLAAPKAMER',
  'TECHNICAL ROOM',
  'BERGING',
  'AANBOUW',
  'SERRE',
  'ZOLDER',
  'DAKKAPEL',
  'WASRUIMTE',
  'EETKAMER',
  'BALKON',
]);

/** Standard House design room chip ids (incl. numbered bedrooms). */
export function isStandardInteriorRoomId(room: string): boolean {
  if (STANDARD_INTERIOR_ROOM_IDS.has(room)) return true;
  return /^SLAAPKAMER \d+$/.test(room);
}

export type HouseDesignRoomSelection = {
  selectedRooms?: Record<string, string[]>;
  selectedCustomRooms?: Record<string, string[]>;
  suppressedStandardRooms?: Record<string, string[]>;
};

export type InteriorRoomsByFloor = {
  floorId: string;
  rooms: string[];
};

/** Floor sections in display order (Kelder first when present, then from start floor). */
export function buildInteriorFloorSections(
  numberOfFloors: number,
  hasKelder: boolean,
  startFloorKey: string = 'BG',
): string[] {
  const sections: string[] = [];
  const effectiveKelder = hasKelder && startFloorKey === 'BG';
  if (effectiveKelder) sections.push(KELDER_FLOOR_KEY);
  sections.push(...getInteriorFloorSlice(numberOfFloors, startFloorKey));
  return sections;
}

/** Selected rooms on one floor — mirrors House design getSelectedRoomList(). */
export function getSelectedRoomsForFloor(
  data: HouseDesignRoomSelection,
  floorId: string,
): string[] {
  const suppressed = data.suppressedStandardRooms?.[floorId] ?? [];
  const standard = (data.selectedRooms?.[floorId] ?? []).filter(
    (room) => !suppressed.includes(room),
  );
  const custom = data.selectedCustomRooms?.[floorId] ?? [];
  return [...standard, ...custom];
}

export function collectInteriorRoomsByFloor(
  data: HouseDesignRoomSelection,
  sections: string[],
): InteriorRoomsByFloor[] {
  return sections
    .map((floorId) => ({
      floorId,
      rooms: getSelectedRoomsForFloor(data, floorId),
    }))
    .filter((group) => group.rooms.length > 0);
}

/**
 * Active rooms selected on House design — flat deduped list (legacy helpers).
 * Excludes suppressed standard rooms.
 */
export function collectInteriorRoomsFromUploadData(data: HouseDesignRoomSelection): string[] {
  const allRooms: string[] = [];
  const floors = new Set([
    ...Object.keys(data.selectedRooms ?? {}),
    ...Object.keys(data.selectedCustomRooms ?? {}),
    ...Object.keys(data.suppressedStandardRooms ?? {}),
  ]);

  floors.forEach((floor) => {
    getSelectedRoomsForFloor(data, floor).forEach((room) => {
      if (!allRooms.includes(room)) allRooms.push(room);
    });
  });

  return allRooms;
}

/** Rooms to show on Photos → INTERIOR (from House design selection, or BG defaults). */
export function loadInteriorRoomNamesForPhotos(): string[] {
  try {
    const raw = localStorage.getItem(HOUSE_DESIGN_PAGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HouseDesignRoomSelection;
      const fromUpload = collectInteriorRoomsFromUploadData(parsed);
      if (fromUpload.length > 0) return fromUpload;
    }
  } catch {
    /* ignore */
  }
  return [...DEFAULT_INTERIOR_ROOMS_BG];
}
