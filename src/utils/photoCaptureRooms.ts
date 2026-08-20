import { canonicalizeRoomInput, getRoomBaseName, normalizeRoomName } from './houseDesignRooms';
import { loadAlgemeenFromStorage } from '../storage/algemeenData';
import { loadInstallatieFromStorage } from '../storage/installatieData';

/** Photo categories per room type (numbered variants use the same base type). */
export const PHOTO_CAPTURE_ROOM_CATEGORIES: Record<string, string[]> = {
  WOONKAMER: ['Full room view', 'Windows', 'Heating control panel', 'Ventilation panel', 'Heating system'],
  SLAAPKAMER: ['Window', 'Heating system', 'Ventilation grill'],
  KEUKEN: ['Window', 'CO₂ sensor', 'Ventilation grill', 'Heating system'],
  BADKAMER: ['Window', 'Heating system', 'Ventilation grill'],
  HAL: ['Doors', 'Window', 'Heating system'],
  MK: ['Heating system - merk & type', 'PV system - merk & type', 'Tapwater system - brand & type'],
  WC: ['Window', 'Ventilation grill', 'Heating system'],
  BERGING: ['General View'],
  'TECHNICAL ROOM': ['General View'],
  WASRUIMTE: ['General View'],
  EETKAMER: ['Window', 'Heating system'],
  AANBOUW: ['General View'],
  ZOLDER: ['General View', 'Roof windows', 'Heating system'],
  DAKKAPEL: ['General View', 'Windows'],
  SERRE: ['General View'],
  VLOERISOLATIE: ['General View'],
  OVERLUIP: ['General View'],
  BALKON: ['General View'],
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

export function migratePhotoCaptureCategoryKey(category: string): string {
  return PHOTO_CAPTURE_CATEGORY_ALIASES[category] ?? category;
}

/** Strip optional instance suffix, e.g. `Doors 2` → `Doors`. */
export function getPhotoCaptureCategoryBase(category: string): string {
  const key = migratePhotoCaptureCategoryKey(category.trim());
  const match = key.match(/^(Doors|Window|Windows|Roof windows)(?:\s+(\d+))?$/);
  if (match) return match[1];
  return key;
}

export function getPhotoCaptureCategoryNumber(category: string): number {
  const key = migratePhotoCaptureCategoryKey(category.trim());
  const match = key.match(/^(Doors|Window|Windows|Roof windows)(?:\s+(\d+))?$/);
  if (!match) return 1;
  return match[2] ? parseInt(match[2], 10) : 1;
}

export function buildPhotoCaptureCategoryInstance(baseCategory: string, number: number): string {
  if (number <= 1) return baseCategory;
  return `${baseCategory} ${number}`;
}

const MULTI_INSTANCE_CATEGORY_BASES = new Set([
  'Doors',
  'Window',
  'Windows',
  'Roof windows',
]);

export function isPhotoCaptureMultiInstanceCategory(category: string): boolean {
  return MULTI_INSTANCE_CATEGORY_BASES.has(getPhotoCaptureCategoryBase(category));
}

export function isPhotoCaptureDoorCategory(category: string): boolean {
  return getPhotoCaptureCategoryBase(category) === 'Doors';
}

export function isPhotoCaptureWindowCategory(category: string): boolean {
  const base = getPhotoCaptureCategoryBase(category);
  return base === 'Window' || base === 'Windows' || base === 'Roof windows';
}

export function nextPhotoCaptureCategoryInstance(
  existingCategories: Iterable<string>,
  baseCategory: string,
): string {
  let max = 1;
  for (const category of existingCategories) {
    if (getPhotoCaptureCategoryBase(category) === baseCategory) {
      max = Math.max(max, getPhotoCaptureCategoryNumber(category));
    }
  }
  return buildPhotoCaptureCategoryInstance(baseCategory, max + 1);
}

export function countPhotoCaptureCategoryInstances(
  categories: Iterable<string>,
  baseCategory: string,
): number {
  let count = 0;
  for (const category of categories) {
    if (getPhotoCaptureCategoryBase(category) === baseCategory) count += 1;
  }
  return count;
}

/** Base categories plus numbered door/window instances for a room. */
export function buildPhotoCaptureCategoryList(
  roomName: string,
  roomId: string,
  extraCategoriesByRoom: Record<string, string[]>,
  interiorPhotos: Record<string, Record<string, string[]>>,
  interiorDetails: Record<string, Record<string, unknown>>,
): string[] {
  const baseCategories = [...getPhotoCaptureCategories(roomName)];
  const isBgHall = getPhotoCaptureRoomKey(roomName) === 'HAL' && roomId.startsWith('BG_');
  if (isBgHall) {
    try {
      const algemeen = loadAlgemeenFromStorage();
      if (algemeen.hasKruipruimte === true) {
        baseCategories.push('Crawl space');
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const installatie = loadInstallatieFromStorage();
    if (installatie.activeCooling === true) {
      const canonicalRoom = canonicalizeRoomInput(roomName);
      const isCoolingRoom = installatie.coolingRooms.some(r => canonicalizeRoomInput(r) === canonicalRoom);
      if (isCoolingRoom && !baseCategories.includes('Cooling system')) {
        baseCategories.push('Cooling system');
      }
    }
  } catch {
    /* ignore */
  }

  const known = new Set<string>([
    ...(extraCategoriesByRoom[roomId] ?? []),
    ...Object.keys(interiorPhotos[roomId] ?? {}),
    ...Object.keys(interiorDetails[roomId] ?? {}),
  ]);

  const result: string[] = [];
  const placed = new Set<string>();

  for (const base of baseCategories) {
    if (isPhotoCaptureMultiInstanceCategory(base)) {
      const numberedFirst = buildPhotoCaptureCategoryInstance(base, 1);
      const instances = [...known]
        .filter((c) => getPhotoCaptureCategoryBase(c) === base)
        .sort(
          (a, b) =>
            getPhotoCaptureCategoryNumber(a) - getPhotoCaptureCategoryNumber(b),
        );

      if (instances.length === 0) {
        result.push(base);
        placed.add(base);
      } else if (instances.includes(numberedFirst)) {
        for (const instance of instances) {
          if (!placed.has(instance)) {
            result.push(instance);
            placed.add(instance);
          }
        }
      } else {
        result.push(base);
        placed.add(base);
        for (const instance of instances.filter((c) => c !== base)) {
          if (!placed.has(instance)) {
            result.push(instance);
            placed.add(instance);
          }
        }
      }
    } else {
      result.push(base);
      placed.add(base);
    }
  }

  return result;
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
 * front side (voor) → left side (links) → right side (rechts) → BG/starting floor → kelder (if available) → back side (achter) → remaining floors.
 */
export function buildPhotoCaptureSectionOrder(
  floorSections: string[],
  startFloorKey: string,
): PhotoCaptureSection[] {
  const sections: PhotoCaptureSection[] = [];
  const placed = new Set<string>();

  // 1. front side (voor)
  sections.push({ type: 'exterior', id: 'voor' });

  // 2. left side (links)
  sections.push({ type: 'exterior', id: 'links' });

  // 3. right side (rechts)
  sections.push({ type: 'exterior', id: 'rechts' });

  // 4. BG (or starting floor if no BG is present)
  const startFloor = floorSections.includes('BG') ? 'BG' : startFloorKey;
  if (floorSections.includes(startFloor)) {
    sections.push(photoCaptureFloorSection(startFloor));
    placed.add(startFloor);
  }

  // 5. kelder (if kelder is available)
  if (floorSections.includes('KELDER')) {
    sections.push(photoCaptureFloorSection('KELDER'));
    placed.add('KELDER');
  }

  // 6. Back side (achter)
  sections.push({ type: 'exterior', id: 'achter' });

  // 7. and then 1e, 2e .... (remaining floors)
  for (const floor of floorSections) {
    if (!placed.has(floor)) {
      sections.push(photoCaptureFloorSection(floor));
      placed.add(floor);
    }
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
