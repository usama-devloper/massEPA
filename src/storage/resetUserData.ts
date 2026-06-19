import { ALGEMEEN_STORAGE_KEY } from './algemeenData';
import { HOUSE_DESIGN_PAGE_STORAGE_KEY } from './houseDesignPageData';
import {
  INSULATION_IMAGES_STORAGE_KEY,
  INSULATION_STORAGE_KEY,
} from './insulationData';
import { PHOTO_CAPTURE_STORAGE_KEY } from './photoCaptureData';
import { buildingAnswersIdbKey, normalizeAddressKey } from './buildingAnswers';
import { idbDelete } from './idbKv';

const LS_INSTALLATIE = 'massEPA_installatie_v1';
const LS_KOZIJN_GLAS = 'massEPA_kozijn_glas_v1';
const LS_INTERIOR = 'massEPA_photoInterior_v1';
const LS_INTERIOR_ROOMS = 'massEPA_photoInteriorRooms_v1';
const IDB_HOUSE_DESIGN_FILES = 'massEPA_upload_files_v1';
const IDB_KOZIJN_IMAGES = 'massEPA_kozijn_images_v1';

const LOCAL_STORAGE_KEYS = [
  ALGEMEEN_STORAGE_KEY,
  HOUSE_DESIGN_PAGE_STORAGE_KEY,
  INSULATION_STORAGE_KEY,
  INSULATION_IMAGES_STORAGE_KEY,
  LS_INSTALLATIE,
  LS_KOZIJN_GLAS,
  PHOTO_CAPTURE_STORAGE_KEY,
  LS_INTERIOR,
  LS_INTERIOR_ROOMS,
] as const;

const INDEXED_DB_KEYS = [
  PHOTO_CAPTURE_STORAGE_KEY,
  IDB_HOUSE_DESIGN_FILES,
  INSULATION_IMAGES_STORAGE_KEY,
  IDB_KOZIJN_IMAGES,
] as const;

function removeLocalStorageKeys(): void {
  for (const key of LOCAL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore private mode */
    }
  }
}

async function clearIndexedDbKeys(): Promise<void> {
  await Promise.all(
    INDEXED_DB_KEYS.map((key) =>
      idbDelete(key).catch(() => {
        /* ignore */
      }),
    ),
  );
}

async function clearBuildingAnswers(address: string | undefined): Promise<void> {
  const addressKey = address?.trim() ? normalizeAddressKey(address) : '';
  if (!addressKey) return;
  try {
    await idbDelete(buildingAnswersIdbKey(addressKey));
  } catch {
    /* ignore */
  }
}

/** Clears audit/dossier data filled by the user. Keeps login, profile, theme, and language. */
export async function resetFilledUserData(address?: string): Promise<void> {
  removeLocalStorageKeys();
  await clearIndexedDbKeys();
  await clearBuildingAnswers(address);
  window.dispatchEvent(new CustomEvent('massEPA:userDataReset'));
}
