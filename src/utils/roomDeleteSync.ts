import {
  loadInstallatieFromStorage,
  saveInstallatieToStorage,
} from '../storage/installatieData';
import {
  loadHouseDesignAlgemeenHints,
  loadHouseDesignPageRaw,
} from '../storage/houseDesignPageData';
import {
  loadPhotoCaptureFromStorage,
  savePhotoCaptureToStorage,
} from '../storage/photoCaptureData';
import {
  buildInteriorFloorSections,
  collectInteriorRoomsFromUploadData,
  getSelectedRoomsForFloor,
} from './interiorRoomsFromUpload';
import type { RoomRename } from './houseDesignRooms';

export const HOUSE_DESIGN_ROOMS_CHANGED_EVENT = 'massEPA:houseDesignRoomsChanged';

const ROOM_ANDERS = 'Anders';

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

function getUploadRoomsByFloor() {
  const { numberOfFloors, hasKelder, startFloorKey } = loadHouseDesignAlgemeenHints();
  const sections = buildInteriorFloorSections(numberOfFloors, hasKelder, startFloorKey);
  const selection = loadHouseDesignPageRaw();
  return sections.map((floorId) => ({
    floorId,
    rooms: getSelectedRoomsForFloor(selection, floorId),
  }));
}

function getInstallatieLocationOptions(houseDesignRooms: string[]): string[] {
  const available = new Set<string>();
  for (const room of houseDesignRooms) {
    const location = HOUSE_DESIGN_TO_INSTALLATIE_LOCATION[room];
    if (location) available.add(location);
  }
  return INSTALLATIE_LOCATION_ORDER.filter((loc) => available.has(loc));
}

function pruneRoomsByFloor(
  byFloor: Record<string, string[]>,
  uploadRoomsByFloor: Array<{ floorId: string; rooms: string[] }>,
): Record<string, string[]> {
  const floorRoomMap = new Map(uploadRoomsByFloor.map((f) => [f.floorId, new Set(f.rooms)]));
  const result: Record<string, string[]> = {};

  for (const [floorId, selected] of Object.entries(byFloor)) {
    const floorRoomSet = floorRoomMap.get(floorId) ?? new Set<string>();
    const pruned = selected.filter((room) => floorRoomSet.has(room));
    if (pruned.length > 0) result[floorId] = pruned;
  }

  return result;
}

function applyRoomChangesToByFloor(
  byFloor: Record<string, string[]> | undefined,
  floorId: string,
  removedRoom: string,
  renamedRooms: RoomRename[],
): Record<string, string[]> {
  const next = { ...(byFloor ?? {}) };
  let floorRooms = [...(next[floorId] ?? [])];
  floorRooms = floorRooms.filter((room) => room !== removedRoom);
  for (const { from, to } of renamedRooms) {
    floorRooms = floorRooms.map((room) => (room === from ? to : room));
  }
  if (floorRooms.length === 0) {
    delete next[floorId];
  } else {
    next[floorId] = floorRooms;
  }
  return next;
}

function flattenRoomsByFloor(byFloor: Record<string, string[]>): string[] {
  const all: string[] = [];
  for (const rooms of Object.values(byFloor)) {
    for (const room of rooms) {
      if (!all.includes(room)) all.push(room);
    }
  }
  return all;
}

function cleanupInstallatieStorage(
  floorId: string,
  removedRoom: string,
  renamedRooms: RoomRename[],
): void {
  const data = loadInstallatieFromStorage();
  const uploadRoomsByFloor = getUploadRoomsByFloor();

  let ventByFloor = applyRoomChangesToByFloor(
    data.ventilatieSensorsByFloor,
    floorId,
    removedRoom,
    renamedRooms,
  );
  let coolByFloor = applyRoomChangesToByFloor(
    data.coolingRoomsByFloor,
    floorId,
    removedRoom,
    renamedRooms,
  );

  ventByFloor = pruneRoomsByFloor(ventByFloor, uploadRoomsByFloor);
  coolByFloor = pruneRoomsByFloor(coolByFloor, uploadRoomsByFloor);

  const uploadRooms = collectInteriorRoomsFromUploadData(loadHouseDesignPageRaw());
  const locationOptions = getInstallatieLocationOptions(uploadRooms);

  let heatingLocation = data.heatingLocation;
  let tapWaterLocation = data.tapWaterLocation;
  if (heatingLocation && heatingLocation !== ROOM_ANDERS && !locationOptions.includes(heatingLocation)) {
    heatingLocation = '';
  }
  if (tapWaterLocation && tapWaterLocation !== ROOM_ANDERS && !locationOptions.includes(tapWaterLocation)) {
    tapWaterLocation = '';
  }

  saveInstallatieToStorage({
    ...data,
    ventilatieSensorsByFloor: ventByFloor,
    coolingRoomsByFloor: coolByFloor,
    ventilatieSensors: flattenRoomsByFloor(ventByFloor),
    coolingRooms: flattenRoomsByFloor(coolByFloor),
    heatingLocation,
    tapWaterLocation,
  });
}

async function cleanupPhotoCaptureStorage(
  floorId: string,
  removedRoom: string,
  renamedRooms: RoomRename[],
): Promise<void> {
  const data = await loadPhotoCaptureFromStorage();
  const interior = { ...data.interior };

  delete interior[`${floorId}_${removedRoom}`];

  for (const { from, to } of renamedRooms) {
    const oldKey = `${floorId}_${from}`;
    const newKey = `${floorId}_${to}`;
    if (interior[oldKey]) {
      interior[newKey] = interior[oldKey];
      delete interior[oldKey];
    }
  }

  const validKeys = new Set<string>();
  for (const { floorId: fid, rooms } of getUploadRoomsByFloor()) {
    for (const room of rooms) {
      validKeys.add(`${fid}_${room}`);
    }
  }
  for (const key of Object.keys(interior)) {
    if (!validKeys.has(key)) {
      delete interior[key];
    }
  }

  await savePhotoCaptureToStorage({ ...data, interior });
}

/** Remove/renumber a room in Installatie and Photo Capture after House design saved. */
export function syncRoomRemovalAcrossApp(
  floorId: string,
  removedRoom: string,
  renamedRooms: RoomRename[],
): void {
  cleanupInstallatieStorage(floorId, removedRoom, renamedRooms);
  void cleanupPhotoCaptureStorage(floorId, removedRoom, renamedRooms);
  window.dispatchEvent(new CustomEvent(HOUSE_DESIGN_ROOMS_CHANGED_EVENT));
}
