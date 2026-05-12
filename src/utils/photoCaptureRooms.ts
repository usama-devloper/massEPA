import { canonicalizeRoomInput, getRoomBaseName, normalizeRoomName } from './houseDesignRooms';

/** Photo categories per room type (numbered variants use the same base type). */
export const PHOTO_CAPTURE_ROOM_CATEGORIES: Record<string, string[]> = {
  WOONKAMER: ['Full room view', 'Windows', 'Heating control panel', 'Ventilation panel'],
  SLAAPKAMER: ['Window', 'Heating system'],
  KEUKEN: ['Window', 'CO₂ sensor'],
  BADKAMER: ['Window', 'Heating system'],
  HAL: ['Doors', 'Window'],
  MK: ['Heating system - merk & type', 'PV system - merk & type'],
  WC: ['Window'],
  BERGING: ['General View'],
  'TECHNICAL ROOM': ['General View'],
  WASRUIMTE: ['General View'],
  EETKAMER: ['Window'],
  AANBOUW: ['General View'],
  ZOLDER: ['General View', 'Roof windows'],
  DAKKAPEL: ['General View', 'Windows'],
  SERRE: ['General View'],
  VLOERISOLATIE: ['General View'],
  OVERLUIP: ['General View'],
  default: ['General View', 'Doors', 'Window'],
};

/**
 * Resolve numbered / aliased room names to the base type used for categories & example photos.
 * e.g. `SLAAPKAMER 2` → `SLAAPKAMER`, `Bedroom 1` → `SLAAPKAMER`
 */
export function getPhotoCaptureRoomKey(roomName: string): string {
  const canonical = canonicalizeRoomInput(roomName);
  const base = getRoomBaseName(canonical);
  if (base in PHOTO_CAPTURE_ROOM_CATEGORIES) return base;
  return base;
}

/** Legacy MK category labels → current display/storage keys. */
const PHOTO_CAPTURE_CATEGORY_ALIASES: Record<string, string> = {
  'Heating system (opwekker) with merk & type': 'Heating system - merk & type',
  'PV system (if available) with merk & type': 'PV system - merk & type',
};

export const PHOTO_CAPTURE_DOOR_CATEGORIES = ['Doors'] as const;

export const PHOTO_CAPTURE_WINDOW_CATEGORIES = ['Window', 'Windows', 'Roof windows'] as const;

export function isPhotoCaptureDoorCategory(category: string): boolean {
  return (PHOTO_CAPTURE_DOOR_CATEGORIES as readonly string[]).includes(category);
}

export function isPhotoCaptureWindowCategory(category: string): boolean {
  return (PHOTO_CAPTURE_WINDOW_CATEGORIES as readonly string[]).includes(category);
}

export function migratePhotoCaptureCategoryKey(category: string): string {
  return PHOTO_CAPTURE_CATEGORY_ALIASES[category] ?? category;
}

export function getPhotoCaptureCategories(roomName: string): string[] {
  const key = getPhotoCaptureRoomKey(roomName);
  return PHOTO_CAPTURE_ROOM_CATEGORIES[key] ?? PHOTO_CAPTURE_ROOM_CATEGORIES.default;
}

export function isPhotoCaptureBedroom(roomName: string): boolean {
  return getPhotoCaptureRoomKey(roomName) === 'SLAAPKAMER';
}

export function getPhotoCaptureBedroomNumber(roomName: string): number {
  return getPhotoCaptureRoomNumber(roomName, 'SLAAPKAMER');
}

/** Sort index within a room family: unnumbered = 0, `HAL 2` = 2, unknown suffix = last. */
export function getPhotoCaptureRoomNumber(roomName: string, baseName?: string): number {
  const canonical = canonicalizeRoomInput(roomName);
  const base = baseName ? normalizeRoomName(baseName) : getRoomBaseName(canonical);
  if (canonical === base) return 0;
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = canonical.match(new RegExp(`^${escaped}\\s+(\\d+)$`));
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function familyRoomsForBase(rooms: string[], base: string): string[] {
  const normalizedBase = normalizeRoomName(base);
  return rooms
    .filter((room) => getRoomBaseName(canonicalizeRoomInput(room)) === normalizedBase)
    .sort(
      (a, b) =>
        getPhotoCaptureRoomNumber(a, normalizedBase) - getPhotoCaptureRoomNumber(b, normalizedBase),
    );
}

/**
 * Order rooms by floor priority. HAL 1 (or unnumbered HAL) stays in the HAL slot;
 * HAL 2+ is inserted just before SLAAPKAMER. Other families group at their slot (MK 1, MK 2, …).
 */
export function sortPhotoCaptureRoomsByPriority(
  rooms: string[],
  priority: readonly string[],
  options?: { skipHalWhenOverluip?: boolean; hasOverluip?: boolean },
): string[] {
  const used = new Set<string>();
  const result: string[] = [];

  const markUsed = (room: string) => {
    result.push(room);
    used.add(room);
  };

  const appendFamily = (base: string) => {
    for (const room of familyRoomsForBase(rooms, base)) {
      if (!used.has(room)) markUsed(room);
    }
  };

  const appendHalOverflow = () => {
    for (const room of familyRoomsForBase(rooms, 'HAL')) {
      if (used.has(room)) continue;
      if (getPhotoCaptureRoomNumber(room, 'HAL') >= 2) markUsed(room);
    }
  };

  for (const slot of priority) {
    if (slot === 'HAL') {
      if (options?.skipHalWhenOverluip && options.hasOverluip) continue;
      const halFirst = familyRoomsForBase(rooms, 'HAL').find(
        (room) => getPhotoCaptureRoomNumber(room, 'HAL') <= 1,
      );
      if (halFirst && !used.has(halFirst)) markUsed(halFirst);
      continue;
    }

    if (slot === 'SLAAPKAMER') {
      appendHalOverflow();
      appendFamily('SLAAPKAMER');
      continue;
    }

    appendFamily(slot);
  }

  for (const room of rooms) {
    if (!used.has(room)) markUsed(room);
  }

  return result;
}

export const PHOTO_CAPTURE_BG_ROOM_PRIORITY = [
  'HAL',
  'MK',
  'WC',
  'BADKAMER',
  'WOONKAMER',
  'KEUKEN',
  'EETKAMER',
  'SLAAPKAMER',
  'BERGING',
  'TECHNICAL ROOM',
  'AANBOUW',
  'SERRE',
] as const;

export const PHOTO_CAPTURE_UPPER_FLOOR_ROOM_PRIORITY = [
  'OVERLUIP',
  'HAL',
  'SLAAPKAMER',
  'WC',
  'BADKAMER',
  'AANBOUW',
  'ZOLDER',
] as const;

export type PhotoCaptureSection =
  | { type: 'exterior'; id: 'voor' | 'achter' | 'links' | 'rechts' }
  | { type: 'floor'; id: string; label: string; emoji: string };

const PHOTO_CAPTURE_FLOOR_META: Record<string, { label: string; emoji: string }> = {
  BG: { label: 'BG (Begane grond)', emoji: '🏠' },
  KELDER: { label: 'KELDER', emoji: '🏚️' },
  '1e': { label: '1e (Eerste verdieping)', emoji: '🏠' },
  '2e': { label: '2e (Tweede verdieping)', emoji: '🏠' },
  '3e': { label: '3e (Derde verdieping)', emoji: '🏠' },
  '4e': { label: '4e (Vierde verdieping)', emoji: '🏠' },
  '5e': { label: '5e (Vijfde verdieping)', emoji: '🏠' },
  '6e': { label: '6e (Zesde verdieping)', emoji: '🏠' },
  '7e': { label: '7e (Zevende verdieping)', emoji: '🏠' },
  '8e': { label: '8e (Achtste verdieping)', emoji: '🏠' },
  '9e': { label: '9e (Negende verdieping)', emoji: '🏠' },
};

function photoCaptureFloorSection(floorId: string): PhotoCaptureSection {
  const meta = PHOTO_CAPTURE_FLOOR_META[floorId] ?? { label: floorId, emoji: '🏠' };
  return { type: 'floor', id: floorId, label: meta.label, emoji: meta.emoji };
}

/**
 * Photo Capture accordion order:
 * voorgevel → start floor (BG, or 1e/2e when apartment) → kelder → achter/links/rechts → remaining floors.
 */
export function buildPhotoCaptureSectionOrder(
  floorSections: string[],
  startFloorKey: string,
): PhotoCaptureSection[] {
  const sections: PhotoCaptureSection[] = [{ type: 'exterior', id: 'voor' }];

  const startFloor = floorSections.includes('BG') ? 'BG' : startFloorKey;
  const placed = new Set<string>();

  if (floorSections.includes(startFloor)) {
    sections.push(photoCaptureFloorSection(startFloor));
    placed.add(startFloor);
  }

  if (floorSections.includes('KELDER')) {
    sections.push(photoCaptureFloorSection('KELDER'));
    placed.add('KELDER');
  }

  for (const facadeId of ['achter', 'links', 'rechts'] as const) {
    sections.push({ type: 'exterior', id: facadeId });
  }

  for (const floor of floorSections) {
    if (placed.has(floor)) continue;
    sections.push(photoCaptureFloorSection(floor));
    placed.add(floor);
  }

  return sections;
}

/** Start floor uses BG room priority; upper floors use upper-floor priority. */
export function sortPhotoCaptureRoomsForFloor(
  floor: string,
  rooms: string[],
  startFloorKey: string,
): string[] {
  if (floor === 'KELDER') return [...rooms];
  if (floor === startFloorKey || floor === 'BG') {
    return sortPhotoCaptureRoomsByPriority(rooms, PHOTO_CAPTURE_BG_ROOM_PRIORITY);
  }
  const hasOverluip = rooms.some((room) => room.toUpperCase() === 'OVERLUIP');
  return sortPhotoCaptureRoomsByPriority(rooms, PHOTO_CAPTURE_UPPER_FLOOR_ROOM_PRIORITY, {
    skipHalWhenOverluip: true,
    hasOverluip,
  });
}
