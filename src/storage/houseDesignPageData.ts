import { isApartmentBuildingType, loadAlgemeenFromStorage } from './algemeenData';
import { whichFloorLabelToKey } from '../utils/interiorRoomsFromUpload';
import { sanitizePersistedFiles } from '../utils/persistedFileUrl';
import { idbGet, idbPut } from './idbKv';

/** Kept as `uploadPageData` so existing browser data keeps loading. */
export const HOUSE_DESIGN_PAGE_STORAGE_KEY = 'uploadPageData';
const IDB_HOUSE_DESIGN_FILES = 'massEPA_upload_files_v1';

export type HouseDesignFileEntry = {
  url: string;
  type: string;
  name: string;
  size: number;
};

export type HouseDesignPageStoredData = {
  files: HouseDesignFileEntry[];
  selectedRooms: Record<string, string[]>;
  customRooms: Record<string, string[]>;
  selectedCustomRooms: Record<string, string[]>;
  suppressedStandardRooms: Record<string, string[]>;
};

export type HouseDesignPageMeta = Omit<HouseDesignPageStoredData, 'files'>;

function readHouseDesignLocalStorageRaw(): Partial<HouseDesignPageStoredData> | null {
  try {
    const raw = localStorage.getItem(HOUSE_DESIGN_PAGE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<HouseDesignPageStoredData>;
  } catch {
    return null;
  }
}

function parseHouseDesignMeta(
  parsed: Partial<HouseDesignPageStoredData> | null,
): Partial<HouseDesignPageMeta> {
  if (!parsed) return {};
  return {
    selectedRooms:
      parsed.selectedRooms && typeof parsed.selectedRooms === 'object'
        ? parsed.selectedRooms
        : undefined,
    customRooms:
      parsed.customRooms && typeof parsed.customRooms === 'object'
        ? parsed.customRooms
        : undefined,
    selectedCustomRooms:
      parsed.selectedCustomRooms && typeof parsed.selectedCustomRooms === 'object'
        ? parsed.selectedCustomRooms
        : undefined,
    suppressedStandardRooms:
      parsed.suppressedStandardRooms && typeof parsed.suppressedStandardRooms === 'object'
        ? parsed.suppressedStandardRooms
        : undefined,
  };
}

/** Room / floor-plan meta only (localStorage). Files are stored in IndexedDB. */
export function loadHouseDesignPageRaw(): Partial<HouseDesignPageStoredData> {
  const parsed = readHouseDesignLocalStorageRaw();
  const meta = parseHouseDesignMeta(parsed);
  return {
    ...meta,
    files: sanitizePersistedFiles(parsed?.files),
  };
}

export async function loadHouseDesignFilesFromStorage(): Promise<HouseDesignFileEntry[]> {
  try {
    const fromIdb = await idbGet<HouseDesignFileEntry[]>(IDB_HOUSE_DESIGN_FILES);
    if (fromIdb !== undefined) {
      return sanitizePersistedFiles(Array.isArray(fromIdb) ? fromIdb : []);
    }

    const parsed = readHouseDesignLocalStorageRaw();
    const legacy = sanitizePersistedFiles(parsed?.files);
    if (legacy.length > 0) {
      await idbPut(IDB_HOUSE_DESIGN_FILES, legacy);
      const meta = parseHouseDesignMeta(parsed);
      saveHouseDesignPageMetaToStorage({
        selectedRooms: meta.selectedRooms ?? {},
        customRooms: meta.customRooms ?? {},
        selectedCustomRooms: meta.selectedCustomRooms ?? {},
        suppressedStandardRooms: meta.suppressedStandardRooms ?? {},
      });
    }
    return legacy;
  } catch {
    return [];
  }
}

export function saveHouseDesignPageMetaToStorage(meta: HouseDesignPageMeta): void {
  try {
    localStorage.setItem(HOUSE_DESIGN_PAGE_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    /* ignore quota / private mode */
  }
}

export async function saveHouseDesignFilesToStorage(files: HouseDesignFileEntry[]): Promise<void> {
  await idbPut(IDB_HOUSE_DESIGN_FILES, sanitizePersistedFiles(files));
}

export function saveHouseDesignPageToStorage(data: HouseDesignPageStoredData): void {
  const { files, ...meta } = data;
  saveHouseDesignPageMetaToStorage(meta);
  void saveHouseDesignFilesToStorage(files);
}

export async function saveHouseDesignPageToStorageAsync(
  data: HouseDesignPageStoredData,
): Promise<void> {
  const { files, ...meta } = data;
  saveHouseDesignPageMetaToStorage(meta);
  await saveHouseDesignFilesToStorage(files);
}

export function loadHouseDesignAlgemeenHints(): {
  numberOfFloors: number;
  hasKelder: boolean;
  startFloorKey: string;
} {
  const algemeen = loadAlgemeenFromStorage();
  const floors =
    typeof algemeen.numberOfFloors === 'number' && algemeen.numberOfFloors > 0
      ? algemeen.numberOfFloors
      : 2;
  const startFloorKey = isApartmentBuildingType(algemeen.buildingType)
    ? whichFloorLabelToKey(algemeen.whichFloor)
    : 'BG';
  const hasKelderRaw = algemeen.hasKelder === true;
  return {
    numberOfFloors: floors,
    hasKelder: hasKelderRaw && startFloorKey === 'BG',
    startFloorKey,
  };
}
