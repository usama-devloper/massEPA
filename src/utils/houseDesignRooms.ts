import {
  buildInteriorFloorSections,
  getInteriorFloorSlice,
  getSelectedRoomsForFloor,
} from './interiorRoomsFromUpload';
import {
  loadHouseDesignAlgemeenHints,
  loadHouseDesignPageRaw,
  saveHouseDesignPageMetaToStorage,
  type HouseDesignPageMeta,
} from '../storage/houseDesignPageData';

export type RoomSuggestion = {
  name: string;
  isNew: boolean;
  existingCount?: number;
};

export type RoomAddPlan = {
  suppressedStandardRooms: string[];
  customRooms: string[];
  selectedRooms: string[];
  selectedCustomRooms: string[];
  addedRoom: string;
};

export type RoomRename = { from: string; to: string };

export type RoomDeletePlan = {
  suppressedStandardRooms: string[];
  customRooms: string[];
  selectedRooms: string[];
  selectedCustomRooms: string[];
  renamedRooms: RoomRename[];
};

export const KELDER_KEY = 'KELDER';

/** English / alternate labels → Dutch storage ids (used when adding rooms). */
export const ROOM_INPUT_ALIASES: Record<string, string> = {
  BEDROOM: 'SLAAPKAMER',
  'LIVING ROOM': 'WOONKAMER',
  KITCHEN: 'KEUKEN',
  BATHROOM: 'BADKAMER',
  HALL: 'HAL',
  'METER CUPBOARD': 'MK',
  STORAGE: 'BERGING',
  CONSERVATORY: 'SERRE',
  ATTIC: 'ZOLDER',
  DORMER: 'DAKKAPEL',
  'LAUNDRY ROOM': 'WASRUIMTE',
  'DINING ROOM': 'EETKAMER',
  EXTENSION: 'AANBOUW',
  BASEMENT: 'KELDER',
  TOILET: 'WC',
  OVERLOOP: 'OVERLUIP',
  LANDING: 'OVERLUIP',
  BALCONY: 'BALKON',
};

function resolveAliasBase(base: string): string {
  return ROOM_INPUT_ALIASES[base] ?? base;
}

/** Map user input to canonical Dutch room id, keeping numbering (e.g. `Bedroom 2` → `SLAAPKAMER 2`). */
export function canonicalizeRoomInput(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (!upper) return '';
  const match = upper.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    return `${resolveAliasBase(match[1])} ${match[2]}`;
  }
  return resolveAliasBase(upper);
}

function isRoomAllowedOnFloor(roomId: string, allowedRooms: string[]): boolean {
  const upper = normalizeRoomName(roomId);
  const base = getRoomBaseName(upper);
  return allowedRooms.some((room) => {
    const allowed = normalizeRoomName(room);
    return allowed === upper || allowed === base || getRoomBaseName(allowed) === base;
  });
}

/** Resolve search text — partial English/Dutch, scoped to rooms available on this floor. */
export function resolveRoomSearchInput(input: string, allowedRooms?: string[]): string {
  const raw = normalizeRoomName(input);
  if (!raw) return raw;

  if (allowedRooms && allowedRooms.length > 0) {
    const startsWithMatches = allowedRooms.filter((room) =>
      normalizeRoomName(room).startsWith(raw),
    );
    if (startsWithMatches.length === 1) {
      return normalizeRoomName(startsWithMatches[0]);
    }

    const includesMatches = allowedRooms.filter(
      (room) =>
        normalizeRoomName(room).includes(raw) &&
        !startsWithMatches.some((match) => match === room),
    );
    if (startsWithMatches.length === 0 && includesMatches.length === 1) {
      return normalizeRoomName(includesMatches[0]);
    }
    if (startsWithMatches.length > 1) {
      return raw;
    }
  }

  const canonical = canonicalizeRoomInput(input);
  if (canonical !== raw) {
    if (!allowedRooms || isRoomAllowedOnFloor(canonical, allowedRooms)) {
      return canonical;
    }
  }

  for (const [alias, canonicalId] of Object.entries(ROOM_INPUT_ALIASES)) {
    if (alias.startsWith(raw) || alias.includes(raw)) {
      if (!allowedRooms || isRoomAllowedOnFloor(canonicalId, allowedRooms)) {
        return canonicalId;
      }
    }
  }

  return raw;
}

const KELDER_DEFAULT_ROOMS = ['KELDER', 'BERGING'] as const;

export const defaultRoomCategories: Record<string, string[]> = {
  BG: ['HAL', 'MK', 'WC', 'WOONKAMER', 'KEUKEN', 'BADKAMER', 'SLAAPKAMER', 'TECHNICAL ROOM', 'BERGING', 'SERRE', 'WASRUIMTE', 'EETKAMER'],
  '1e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '2e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '3e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '4e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '5e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '6e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '7e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '8e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
  '9e': ['HAL', 'SLAAPKAMER', 'BADKAMER', 'WC','SERRE', 'ZOLDER', 'WASRUIMTE', 'BALKON'],
};

/** Start floor: HAL. Other floors: OVERLUIP (overloop) instead of HAL. */
export const START_FLOOR_HALL_ROOM = 'HAL';
export const UPPER_FLOOR_LANDING_ROOM = 'OVERLUIP';
/** Dining room — BG template; also offered on apartment start floors (1e, 2e, …). */
export const START_FLOOR_DINING_ROOM = 'EETKAMER';

/** BG-template rooms that are not on upper-floor templates — only on BG or the Algemeen start floor. */
export const GROUND_FLOOR_ONLY_ROOMS = [
  'MK',
  'WOONKAMER',
  'KEUKEN',
  'TECHNICAL ROOM',
  'BERGING',
  START_FLOOR_DINING_ROOM,
] as const;

export function isGroundFloorOnlyRoom(room: string): boolean {
  return (GROUND_FLOOR_ONLY_ROOMS as readonly string[]).includes(normalizeRoomName(room));
}

/** Attic / dormer — only on the highest Algemeen floor (top floor). */
export const TOP_FLOOR_ONLY_ROOMS = ['ZOLDER', 'DAKKAPEL'] as const;

export function isTopFloorOnlyRoom(room: string): boolean {
  const base = getRoomBaseName(room);
  return (TOP_FLOOR_ONLY_ROOMS as readonly string[]).includes(base);
}

export function resolveTopFloorKey(
  startFloorKey?: string,
  numberOfFloors?: number,
): string {
  const hints = loadHouseDesignAlgemeenHints();
  const start = startFloorKey ?? hints.startFloorKey;
  const floors = numberOfFloors ?? hints.numberOfFloors;
  const slice = getInteriorFloorSlice(floors, start);
  return slice[slice.length - 1] ?? start;
}

function pruneTopFloorOnlySelections(
  floor: string,
  rooms: string[],
  topFloorKey: string,
): string[] {
  if (floor === topFloorKey) return rooms;
  return rooms.filter((room) => !isTopFloorOnlyRoom(room));
}

export function pruneTopFloorOnlyRoomRecords(
  records: Record<string, string[]>,
  allowedFloors: string[],
  startFloorKey: string,
  numberOfFloors?: number,
): Record<string, string[]> {
  const topFloorKey = resolveTopFloorKey(startFloorKey, numberOfFloors);
  const allowed = new Set(allowedFloors);
  const out: Record<string, string[]> = {};
  for (const [floor, rooms] of Object.entries(records)) {
    if (!allowed.has(floor)) continue;
    const pruned = pruneTopFloorOnlySelections(floor, rooms, topFloorKey);
    if (pruned.length > 0) out[floor] = pruned;
  }
  return out;
}

function includesBgExtraStandardRooms(floor: string, startFloorKey: string): boolean {
  return floor === 'BG' || (floor === startFloorKey && startFloorKey !== 'BG');
}

function mergeBgStandardRoomsOntoFloor(floorRooms: string[]): string[] {
  const seen = new Set(floorRooms);
  const merged = [...floorRooms];
  for (const room of defaultRoomCategories.BG) {
    if (!seen.has(room)) {
      merged.push(room);
      seen.add(room);
    }
  }
  return merged;
}

function resolveStartFloorKey(startFloorKey?: string): string {
  if (startFloorKey) return startFloorKey;
  return loadHouseDesignAlgemeenHints().startFloorKey;
}

function expectedHallRoomIdForFloor(floor: string, startFloorKey: string): string {
  return floor === startFloorKey ? START_FLOOR_HALL_ROOM : UPPER_FLOOR_LANDING_ROOM;
}

/** Drop stale HAL/OVERLUIP ids that don't match the chip id for this floor (e.g. OVERLUIP on 1e start). */
export function reconcileSelectedRoomsForFloor(
  floor: string,
  selectedRooms: string[],
  startFloorKey: string,
): string[] {
  const expectedHall = expectedHallRoomIdForFloor(floor, startFloorKey);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const room of selectedRooms) {
    if (room === START_FLOOR_HALL_ROOM || room === UPPER_FLOOR_LANDING_ROOM) {
      if (room !== expectedHall) continue;
    }
    if (seen.has(room)) continue;
    seen.add(room);
    result.push(room);
  }

  return result;
}

export function reconcileHouseDesignRoomMeta(
  meta: Pick<
    HouseDesignPageMeta,
    'selectedRooms' | 'selectedCustomRooms' | 'customRooms' | 'suppressedStandardRooms'
  >,
  allowedFloors: string[],
  startFloorKey: string,
  numberOfFloors?: number,
): Pick<
  HouseDesignPageMeta,
  'selectedRooms' | 'selectedCustomRooms' | 'customRooms' | 'suppressedStandardRooms'
> {
  const topFloorKey = resolveTopFloorKey(startFloorKey, numberOfFloors);
  const selectedRooms = { ...(meta.selectedRooms ?? {}) };
  const selectedCustomRooms = { ...(meta.selectedCustomRooms ?? {}) };
  const customRooms = { ...(meta.customRooms ?? {}) };

  for (const floor of allowedFloors) {
    const current = selectedRooms[floor];
    if (current) {
      let reconciled = reconcileSelectedRoomsForFloor(floor, current, startFloorKey);
      reconciled = pruneTopFloorOnlySelections(floor, reconciled, topFloorKey);
      if (reconciled.length > 0) {
        selectedRooms[floor] = reconciled;
      } else {
        delete selectedRooms[floor];
      }
    }

    if (selectedCustomRooms[floor]) {
      const pruned = pruneTopFloorOnlySelections(
        floor,
        selectedCustomRooms[floor],
        topFloorKey,
      );
      if (pruned.length > 0) {
        selectedCustomRooms[floor] = pruned;
      } else {
        delete selectedCustomRooms[floor];
      }
    }

    if (customRooms[floor]) {
      const pruned = pruneTopFloorOnlySelections(floor, customRooms[floor], topFloorKey);
      if (pruned.length > 0) {
        customRooms[floor] = pruned;
      } else {
        delete customRooms[floor];
      }
    }
  }

  return {
    ...meta,
    selectedRooms,
    selectedCustomRooms,
    customRooms,
  };
}

function mapStandardRoomsForFloor(
  rooms: readonly string[],
  floor: string,
  startFloorKey: string,
): string[] {
  if (floor === KELDER_KEY) return [...rooms];

  let mapped: string[];
  if (floor === startFloorKey) {
    mapped = rooms.filter((room) => room !== UPPER_FLOOR_LANDING_ROOM);
  } else {
    mapped = rooms.map((room) =>
      room === START_FLOOR_HALL_ROOM ? UPPER_FLOOR_LANDING_ROOM : room,
    );
  }

  if (floor === startFloorKey && startFloorKey !== 'BG') {
    mapped = mergeBgStandardRoomsOntoFloor(mapped);
  } else if (!includesBgExtraStandardRooms(floor, startFloorKey)) {
    mapped = mapped.filter((room) => !isGroundFloorOnlyRoom(room));
  }

  const topFloorKey = resolveTopFloorKey(startFloorKey);
  if (floor === topFloorKey) {
    for (const room of TOP_FLOOR_ONLY_ROOMS) {
      if (!mapped.includes(room)) {
        mapped.push(room);
      }
    }
  } else {
    mapped = mapped.filter((room) => !isTopFloorOnlyRoom(room));
  }

  return mapped;
}

function isSuppressedForFloor(
  room: string,
  floor: string,
  startFloorKey: string,
  suppressed: string[],
): boolean {
  if (suppressed.includes(room)) return true;
  if (
    floor !== startFloorKey &&
    room === UPPER_FLOOR_LANDING_ROOM &&
    suppressed.includes(START_FLOOR_HALL_ROOM)
  ) {
    return true;
  }
  if (
    floor === startFloorKey &&
    room === START_FLOOR_HALL_ROOM &&
    suppressed.includes(UPPER_FLOOR_LANDING_ROOM)
  ) {
    return true;
  }
  return false;
}

export function normalizeRoomName(name: string): string {
  return name.trim().toUpperCase();
}

export function getRoomBaseName(name: string): string {
  const upper = normalizeRoomName(name);
  const match = upper.match(/^(.+?)\s+(\d+)$/);
  return match ? match[1] : upper;
}

export function getRelatedRoomNames(existingRooms: string[], baseName: string): string[] {
  const base = normalizeRoomName(baseName);
  return existingRooms.filter((room) => {
    const upper = room.toUpperCase();
    return upper === base || upper.startsWith(`${base} `);
  });
}

export function getNextRoomName(existingRooms: string[], inputName: string): string {
  const normalized = normalizeRoomName(inputName);
  const base = getRoomBaseName(normalized);
  const related = getRelatedRoomNames(existingRooms, base);

  if (related.length === 0) {
    return normalized;
  }

  let maxNum = 0;
  const numberedPattern = new RegExp(
    `^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`,
  );

  for (const room of related) {
    const upper = room.toUpperCase();
    if (upper === base) {
      maxNum = Math.max(maxNum, 1);
      continue;
    }
    const match = upper.match(numberedPattern);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }

  return `${base} ${maxNum + 1}`;
}

export function getEffectiveStandardRooms(
  floor: string,
  suppressed: string[],
  startFloorKey?: string,
): string[] {
  const start = resolveStartFloorKey(startFloorKey);
  if (floor === KELDER_KEY) {
    return KELDER_DEFAULT_ROOMS.filter(
      (room) => !isSuppressedForFloor(room, floor, start, suppressed),
    );
  }
  const base = defaultRoomCategories[floor] || [];
  const mapped = mapStandardRoomsForFloor(base, floor, start);
  return mapped.filter((room) => !isSuppressedForFloor(room, floor, start, suppressed));
}

export function isStandardRoomForFloor(
  floor: string,
  room: string,
  startFloorKey?: string,
): boolean {
  const start = resolveStartFloorKey(startFloorKey);
  if (floor === KELDER_KEY) {
    return KELDER_DEFAULT_ROOMS.includes(room as (typeof KELDER_DEFAULT_ROOMS)[number]);
  }
  const effective = mapStandardRoomsForFloor(defaultRoomCategories[floor] || [], floor, start);
  return effective.includes(room);
}

export function getAllRoomsOnFloorFromMeta(
  floor: string,
  meta: Partial<Pick<HouseDesignPageMeta, 'customRooms' | 'selectedCustomRooms' | 'suppressedStandardRooms'>>,
): string[] {
  const suppressed = meta.suppressedStandardRooms?.[floor] ?? [];
  const standard = getEffectiveStandardRooms(floor, suppressed);
  const custom = meta.customRooms?.[floor] ?? meta.selectedCustomRooms?.[floor] ?? [];
  return [...standard, ...custom];
}

export function generateRoomSuggestions(
  input: string,
  existingRooms: string[],
): RoomSuggestion[] {
  if (!input.trim()) return [];

  const searchTerm = resolveRoomSearchInput(input, existingRooms);
  const suggestionsList: RoomSuggestion[] = [];
  const baseRoomName = getRoomBaseName(searchTerm);

  const exactMatches = existingRooms.filter(
    (room) => room === searchTerm || room.startsWith(`${searchTerm} `),
  );
  const partialMatches = existingRooms.filter(
    (room) => room.includes(searchTerm) && !exactMatches.includes(room),
  );
  const relatedBaseRooms = getRelatedRoomNames(existingRooms, baseRoomName);

  if (relatedBaseRooms.length > 0) {
    const nextName = getNextRoomName(existingRooms, searchTerm);
    suggestionsList.push({
      name: nextName,
      isNew: true,
      existingCount: relatedBaseRooms.length,
    });
  } else if (searchTerm.length > 0) {
    suggestionsList.push({ name: searchTerm, isNew: true });
  }

  exactMatches.forEach((room) => {
    if (!suggestionsList.some((s) => s.name === room)) {
      suggestionsList.push({ name: room, isNew: false });
    }
  });

  partialMatches.forEach((room) => {
    if (!suggestionsList.some((s) => s.name === room)) {
      suggestionsList.push({ name: room, isNew: false });
    }
  });

  return suggestionsList.slice(0, 8);
}

export function computeRoomAddPlan(
  floor: string,
  rawName: string,
  suppressed: string[],
  custom: string[],
  selectedRooms: string[],
  selectedCustom: string[],
): RoomAddPlan {
  const normalized = canonicalizeRoomInput(rawName);
  const base = getRoomBaseName(normalized);

  let nextSuppressed = [...suppressed];
  let nextCustom = [...custom];
  let nextSelected = [...selectedRooms];
  let nextSelectedCustom = [...selectedCustom];

  const listRooms = () => [...getEffectiveStandardRooms(floor, nextSuppressed), ...nextCustom];

  const related = getRelatedRoomNames(listRooms(), base);

  if (related.length === 0) {
    const addName = normalized;
    return {
      suppressedStandardRooms: nextSuppressed,
      customRooms: [...nextCustom, addName],
      selectedRooms: nextSelected,
      selectedCustomRooms: [...nextSelectedCustom, addName],
      addedRoom: addName,
    };
  }

  const unnumbered = related.find((room) => room.toUpperCase() === base);
  const standard = getEffectiveStandardRooms(floor, nextSuppressed);

  if (unnumbered) {
    const name1 = `${base} 1`;
    if (standard.includes(unnumbered)) {
      if (!nextSuppressed.includes(base)) {
        nextSuppressed = [...nextSuppressed, base];
      }
      if (!nextCustom.includes(name1)) {
        nextCustom = [...nextCustom, name1];
      }
      nextSelected = nextSelected.filter((room) => room !== base);
      if (!nextSelectedCustom.includes(name1)) {
        nextSelectedCustom = [...nextSelectedCustom, name1];
      }
    } else if (nextCustom.some((room) => room.toUpperCase() === base)) {
      nextCustom = nextCustom.map((room) => (room.toUpperCase() === base ? name1 : room));
      nextSelectedCustom = nextSelectedCustom.map((room) =>
        room.toUpperCase() === base ? name1 : room,
      );
      if (!nextSelectedCustom.includes(name1)) {
        nextSelectedCustom = [...nextSelectedCustom, name1];
      }
    }
  }

  const addName = getNextRoomName(listRooms(), normalized);

  if (!nextCustom.includes(addName)) {
    nextCustom = [...nextCustom, addName];
  }
  if (!nextSelectedCustom.includes(addName)) {
    nextSelectedCustom = [...nextSelectedCustom, addName];
  }

  return {
    suppressedStandardRooms: nextSuppressed,
    customRooms: nextCustom,
    selectedRooms: nextSelected,
    selectedCustomRooms: nextSelectedCustom,
    addedRoom: addName,
  };
}

function getRoomSortIndex(name: string, base: string): number {
  const upper = normalizeRoomName(name);
  if (upper === base) return 0;
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = upper.match(new RegExp(`^${escaped}\\s+(\\d+)$`));
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

/** Room bases that show a numbered “next” chip when at least one variant is selected. */
export const CHAIN_NUMBERED_ROOM_BASES = [
  'SLAAPKAMER',
  'HAL',
  'OVERLUIP',
  'AANBOUW',
  'ZOLDER',
  'WC',
  'BADKAMER',
  'BERGING',
  'KEUKEN',
  'BALKON'
] as const;

export type RoomChipItem = {
  room: string;
  selected: boolean;
  isStandardChip: boolean;
  isNext?: boolean;
};

export type FloorRoomChipGroup =
  | { kind: 'single'; chip: RoomChipItem }
  | { kind: 'chain'; base: string; chips: RoomChipItem[] };

type ChainRoomChipGroup = Extract<FloorRoomChipGroup, { kind: 'chain' }>;

function isChainNumberedRoomBase(base: string): boolean {
  return (CHAIN_NUMBERED_ROOM_BASES as readonly string[]).includes(normalizeRoomName(base));
}

/** HAL and OVERLUIP share one chain slot depending on floor. */
function chainBasesMatch(a: string, b: string): boolean {
  const left = normalizeRoomName(a);
  const right = normalizeRoomName(b);
  if (left === right) return true;
  return (
    (left === START_FLOOR_HALL_ROOM && right === UPPER_FLOOR_LANDING_ROOM) ||
    (left === UPPER_FLOOR_LANDING_ROOM && right === START_FLOOR_HALL_ROOM)
  );
}

function resolveChainBaseFromCustom(customRooms: string[], slotBase: string): string {
  const match = customRooms.find((room) => chainBasesMatch(getRoomBaseName(room), slotBase));
  return match ? getRoomBaseName(match) : slotBase;
}

function buildChainChipGroup(
  base: string,
  standardForBase: string | undefined,
  standardRooms: string[],
  customRooms: string[],
  selectedStandard: string[],
  selectedCustom: string[],
): ChainRoomChipGroup | null {
  const chips: RoomChipItem[] = [];
  const allOnFloor = [...standardRooms, ...customRooms];

  if (standardForBase) {
    chips.push({
      room: standardForBase,
      selected: selectedStandard.includes(standardForBase),
      isStandardChip: true,
    });
  }

  for (const room of customRooms) {
    if (!chainBasesMatch(getRoomBaseName(room), base)) continue;
    chips.push({
      room,
      selected: selectedCustom.includes(room),
      isStandardChip: false,
    });
  }

  if (chips.length === 0) return null;

  chips.sort((a, b) => getRoomSortIndex(a.room, base) - getRoomSortIndex(b.room, base));

  const anySelected = chips.some((chip) => chip.selected);
  if (anySelected) {
    const nextName = getNextRoomName(allOnFloor, base);
    const nextNorm = normalizeRoomName(nextName);
    const alreadyListed = chips.some((chip) => normalizeRoomName(chip.room) === nextNorm);
    const alreadyOnFloor = allOnFloor.some((room) => normalizeRoomName(room) === nextNorm);
    if (!alreadyListed && !alreadyOnFloor) {
      chips.push({
        room: nextName,
        selected: false,
        isStandardChip: false,
        isNext: true,
      });
    }
  }

  return { kind: 'chain', base, chips };
}

/** Standard + custom room chips; chain bases render selected variants plus one “next” chip. */
export function buildFloorRoomChipGroups(
  standardRooms: string[],
  selectedStandard: string[],
  customRooms: string[],
  selectedCustom: string[],
  standardSlotOrder?: string[],
): FloorRoomChipGroup[] {
  const slots = standardSlotOrder ?? standardRooms;
  const groups: FloorRoomChipGroup[] = [];
  const renderedChainBases = new Set<string>();
  const usedCustom = new Set<string>();
  const standardSet = new Set(standardRooms);

  const markChainCustomUsed = (chain: ChainRoomChipGroup) => {
    for (const chip of chain.chips) {
      if (!chip.isNext && !chip.isStandardChip) {
        usedCustom.add(chip.room);
      }
    }
  };

  const markChainBaseRendered = (base: string) => {
    renderedChainBases.add(base);
    if (chainBasesMatch(base, START_FLOOR_HALL_ROOM)) {
      renderedChainBases.add(START_FLOOR_HALL_ROOM);
      renderedChainBases.add(UPPER_FLOOR_LANDING_ROOM);
    }
  };

  const isChainBaseRendered = (base: string): boolean => {
    if (renderedChainBases.has(base)) return true;
    if (chainBasesMatch(base, START_FLOOR_HALL_ROOM)) {
      return (
        renderedChainBases.has(START_FLOOR_HALL_ROOM) ||
        renderedChainBases.has(UPPER_FLOOR_LANDING_ROOM)
      );
    }
    return false;
  };

  for (const slot of slots) {
    const slotBase = getRoomBaseName(slot);
    if (isChainNumberedRoomBase(slotBase)) {
      if (isChainBaseRendered(slotBase)) continue;

      const standardForBase = standardRooms.find((room) =>
        chainBasesMatch(getRoomBaseName(room), slotBase),
      );
      const hasCustomOfBase = customRooms.some((room) =>
        chainBasesMatch(getRoomBaseName(room), slotBase),
      );
      if (!standardForBase && !hasCustomOfBase) continue;

      const chainBase = resolveChainBaseFromCustom(customRooms, slotBase);
      markChainBaseRendered(chainBase);

      const chain = buildChainChipGroup(
        chainBase,
        standardForBase,
        standardRooms,
        customRooms,
        selectedStandard,
        selectedCustom,
      );
      if (chain) {
        groups.push(chain);
        markChainCustomUsed(chain);
      }
      continue;
    }

    if (!standardSet.has(slot)) continue;

    groups.push({
      kind: 'single',
      chip: {
        room: slot,
        selected: selectedStandard.includes(slot),
        isStandardChip: true,
      },
    });
  }

  for (const room of customRooms) {
    if (usedCustom.has(room)) continue;
    groups.push({
      kind: 'single',
      chip: {
        room,
        selected: selectedCustom.includes(room),
        isStandardChip: false,
      },
    });
  }

  return groups;
}

function buildContiguousRenumberMap(remaining: string[], base: string): Map<string, string> {
  const sorted = [...remaining].sort((a, b) => getRoomSortIndex(a, base) - getRoomSortIndex(b, base));
  const renameMap = new Map<string, string>();
  for (let i = 0; i < sorted.length; i++) {
    const newName = `${base} ${i + 1}`;
    if (sorted[i] !== newName) {
      renameMap.set(sorted[i], newName);
    }
  }
  return renameMap;
}

function applyRoomRenames(rooms: string[], renameMap: Map<string, string>): string[] {
  if (renameMap.size === 0) return rooms;
  return rooms.map((room) => renameMap.get(room) ?? room);
}

function collectRenamesFromMap(
  renameMap: Map<string, string>,
  renamedRooms: RoomRename[],
): void {
  for (const [from, to] of renameMap) {
    renamedRooms.push({ from, to });
  }
}

/** After delete: renumber remaining rooms (HAL 2→HAL 1, …); collapse to base when only one remains. */
export function computeRoomDeletePlan(
  floor: string,
  roomToDelete: string,
  suppressed: string[],
  custom: string[],
  selectedRooms: string[],
  selectedCustom: string[],
): RoomDeletePlan {
  const renamedRooms: RoomRename[] = [];
  let nextSuppressed = [...suppressed];
  let nextCustom = custom.filter((room) => room !== roomToDelete);
  let nextSelected = [...selectedRooms];
  let nextSelectedCustom = selectedCustom.filter((room) => room !== roomToDelete);

  const base = getRoomBaseName(roomToDelete);
  const remaining = getRelatedRoomNames(
    [...getEffectiveStandardRooms(floor, nextSuppressed), ...nextCustom],
    base,
  );

  if (remaining.length === 0) {
    return {
      suppressedStandardRooms: nextSuppressed,
      customRooms: nextCustom,
      selectedRooms: nextSelected,
      selectedCustomRooms: nextSelectedCustom,
      renamedRooms,
    };
  }

  if (remaining.length > 1) {
    const renameMap = buildContiguousRenumberMap(remaining, base);
    const standard = getEffectiveStandardRooms(floor, nextSuppressed);
    const unnumberedStandard = remaining.find((room) => room.toUpperCase() === base);

    if (unnumberedStandard && standard.includes(unnumberedStandard)) {
      const newName = renameMap.get(unnumberedStandard) ?? `${base} 1`;
      const wasSelected = nextSelected.includes(unnumberedStandard);

      if (!nextSuppressed.includes(base)) {
        nextSuppressed = [...nextSuppressed, base];
      }
      nextSelected = nextSelected.filter((room) => room !== unnumberedStandard);

      if (!nextCustom.includes(newName)) {
        nextCustom = [...nextCustom, newName];
      }
      if (wasSelected && !nextSelectedCustom.includes(newName)) {
        nextSelectedCustom = [...nextSelectedCustom, newName];
      }
      if (!renameMap.has(unnumberedStandard)) {
        renamedRooms.push({ from: unnumberedStandard, to: newName });
      }
    }

    nextCustom = applyRoomRenames(nextCustom, renameMap);
    nextSelectedCustom = applyRoomRenames(nextSelectedCustom, renameMap);
    collectRenamesFromMap(renameMap, renamedRooms);

    return {
      suppressedStandardRooms: nextSuppressed,
      customRooms: nextCustom,
      selectedRooms: nextSelected,
      selectedCustomRooms: nextSelectedCustom,
      renamedRooms,
    };
  }

  const sole = remaining[0];
  const wasStandardSuppressed =
    nextSuppressed.includes(base) && isStandardRoomForFloor(floor, base);

  if (wasStandardSuppressed) {
    nextSuppressed = nextSuppressed.filter((room) => room !== base);
    nextCustom = nextCustom.filter((room) => room !== sole);
    if (nextSelectedCustom.includes(sole)) {
      nextSelectedCustom = nextSelectedCustom.filter((room) => room !== sole);
      if (!nextSelected.includes(base)) {
        nextSelected = [...nextSelected, base];
      }
    }
  } else {
    nextCustom = nextCustom.map((room) => (room === sole ? base : room));
    nextSelectedCustom = nextSelectedCustom.map((room) => (room === sole ? base : room));
  }

  if (sole !== base) {
    renamedRooms.push({ from: sole, to: base });
  }

  return {
    suppressedStandardRooms: nextSuppressed,
    customRooms: nextCustom,
    selectedRooms: nextSelected,
    selectedCustomRooms: nextSelectedCustom,
    renamedRooms,
  };
}

function syncCustomRoomsToSelected(
  selectedCustom: Record<string, string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [floor, rooms] of Object.entries(selectedCustom)) {
    if (rooms.length > 0) result[floor] = [...rooms];
  }
  return result;
}

function pruneRecordToKeys<T extends string[]>(
  record: Record<string, T>,
  allowedKeys: string[],
): Record<string, T> {
  const allowed = new Set(allowedKeys);
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (allowed.has(key) && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

function applyRoomAddPlanToMeta(meta: Partial<HouseDesignPageMeta>, floor: string, plan: RoomAddPlan): HouseDesignPageMeta {
  const selectedRooms = { ...(meta.selectedRooms ?? {}) };
  const selectedCustomRooms = { ...(meta.selectedCustomRooms ?? {}) };
  const suppressedStandardRooms = { ...(meta.suppressedStandardRooms ?? {}) };

  if (plan.selectedRooms.length > 0) {
    selectedRooms[floor] = plan.selectedRooms;
  } else {
    delete selectedRooms[floor];
  }

  if (plan.selectedCustomRooms.length > 0) {
    selectedCustomRooms[floor] = plan.selectedCustomRooms;
  } else {
    delete selectedCustomRooms[floor];
  }

  if (plan.suppressedStandardRooms.length > 0) {
    suppressedStandardRooms[floor] = plan.suppressedStandardRooms;
  } else {
    delete suppressedStandardRooms[floor];
  }

  const customRooms = syncCustomRoomsToSelected(selectedCustomRooms);
  const { numberOfFloors, hasKelder, startFloorKey } = loadHouseDesignAlgemeenHints();
  const allowedKeys = buildInteriorFloorSections(numberOfFloors, hasKelder, startFloorKey);

  return {
    selectedRooms: pruneRecordToKeys(selectedRooms, allowedKeys),
    selectedCustomRooms: pruneRecordToKeys(selectedCustomRooms, allowedKeys),
    suppressedStandardRooms: pruneRecordToKeys(suppressedStandardRooms, allowedKeys),
    customRooms: pruneRecordToKeys(customRooms, allowedKeys),
  };
}

/** Add or select a room on a floor; persists to House design storage. */
export function appendCustomRoomToHouseDesign(floorId: string, rawName: string): string | null {
  const trimmed = canonicalizeRoomInput(rawName);
  if (!trimmed) return null;

  const meta = loadHouseDesignPageRaw();
  const selectedRooms = meta.selectedRooms ?? {};
  const selectedCustomRooms = meta.selectedCustomRooms ?? {};
  const suppressedStandardRooms = meta.suppressedStandardRooms ?? {};
  const customRooms = meta.customRooms ?? {};

  const alreadySelected = getSelectedRoomsForFloor(
    { selectedRooms, selectedCustomRooms, suppressedStandardRooms },
    floorId,
  );
  const normalized = normalizeRoomName(trimmed);
  const inputBase = getRoomBaseName(normalized);

  if (getRelatedRoomNames(alreadySelected, inputBase).length === 0) {
    const existing = alreadySelected.find((room) => room.toUpperCase() === normalized);
    if (existing) return existing;
  }

  const plan = computeRoomAddPlan(
    floorId,
    trimmed,
    suppressedStandardRooms[floorId] ?? [],
    customRooms[floorId] ?? [],
    selectedRooms[floorId] ?? [],
    selectedCustomRooms[floorId] ?? [],
  );

  saveHouseDesignPageMetaToStorage(applyRoomAddPlanToMeta(meta, floorId, plan));
  return plan.addedRoom;
}

/** Rooms on a floor for Anders autocomplete (available + already selected). */
export function getRoomsForSuggestions(floorId: string): string[] {
  const meta = loadHouseDesignPageRaw();
  const onFloor = getAllRoomsOnFloorFromMeta(floorId, meta);
  const selected = getSelectedRoomsForFloor(
    {
      selectedRooms: meta.selectedRooms,
      selectedCustomRooms: meta.selectedCustomRooms,
      suppressedStandardRooms: meta.suppressedStandardRooms,
    },
    floorId,
  );
  const seen = new Set<string>();
  const combined: string[] = [];
  for (const room of [...onFloor, ...selected]) {
    const key = room.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(room);
    }
  }
  return combined;
}

/** Select an existing standard/custom room or add a new one — used from Installatie Anders. */
export function addOrSelectRoomInHouseDesign(floorId: string, rawName: string): string | null {
  const trimmed = canonicalizeRoomInput(rawName);
  if (!trimmed) return null;

  const normalized = normalizeRoomName(trimmed);
  const inputBase = getRoomBaseName(normalized);

  const meta = loadHouseDesignPageRaw();
  const selectedRooms = meta.selectedRooms ?? {};
  const selectedCustomRooms = meta.selectedCustomRooms ?? {};
  const suppressedStandardRooms = meta.suppressedStandardRooms ?? {};

  const alreadySelected = getSelectedRoomsForFloor(
    { selectedRooms, selectedCustomRooms, suppressedStandardRooms },
    floorId,
  );

  // Same room family already selected → add next numbered variant (SLAAPKAMER → SLAAPKAMER 2)
  if (getRelatedRoomNames(alreadySelected, inputBase).length > 0) {
    return appendCustomRoomToHouseDesign(floorId, trimmed);
  }

  const exactSelected = alreadySelected.find((room) => room.toUpperCase() === normalized);
  if (exactSelected) return exactSelected;

  const onFloor = getAllRoomsOnFloorFromMeta(floorId, meta).find(
    (room) => room.toUpperCase() === normalized,
  );
  if (onFloor && isStandardRoomForFloor(floorId, onFloor)) {
    const current = selectedRooms[floorId] ?? [];
    if (current.includes(onFloor)) return onFloor;

    const nextMeta: HouseDesignPageMeta = {
      ...meta,
      selectedRooms: { ...selectedRooms, [floorId]: [...current, onFloor] },
      selectedCustomRooms,
      suppressedStandardRooms,
      customRooms: meta.customRooms ?? syncCustomRoomsToSelected(selectedCustomRooms),
    };
    const { numberOfFloors, hasKelder, startFloorKey } = loadHouseDesignAlgemeenHints();
    const allowedKeys = buildInteriorFloorSections(numberOfFloors, hasKelder, startFloorKey);
    saveHouseDesignPageMetaToStorage({
      selectedRooms: pruneRecordToKeys(nextMeta.selectedRooms ?? {}, allowedKeys),
      selectedCustomRooms: pruneRecordToKeys(nextMeta.selectedCustomRooms ?? {}, allowedKeys),
      suppressedStandardRooms: pruneRecordToKeys(nextMeta.suppressedStandardRooms ?? {}, allowedKeys),
      customRooms: pruneRecordToKeys(nextMeta.customRooms ?? {}, allowedKeys),
    });
    return onFloor;
  }

  return appendCustomRoomToHouseDesign(floorId, trimmed);
}
