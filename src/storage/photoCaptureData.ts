import { idbGet, idbPut } from './idbKv';
import { migratePhotoCaptureCategoryKey } from '../utils/photoCaptureRooms';
import { isPersistableFileUrl } from '../utils/persistedFileUrl';

export const PHOTO_CAPTURE_STORAGE_KEY = 'massEPA_photos_v1';

export type ExteriorPhotos = {
  voor: string[];
  achter: string[];
  links: string[];
  rechts: string[];
};

export type InteriorPhotos = Record<string, Record<string, string[]>>;

export type InteriorCategoryDetail = {
  doorIsolated?: boolean | null;
  glassType?: string;
  frameType?: string;
};

/** Per room id → category → door/window answers. */
export type InteriorCategoryDetails = Record<string, Record<string, InteriorCategoryDetail>>;

export type PhotoCaptureStoredData = {
  exterior: ExteriorPhotos;
  interior: InteriorPhotos;
  interiorDetails?: InteriorCategoryDetails;
  /** Extra numbered door/window keys per room id, e.g. `Doors 2`. */
  extraInteriorCategories?: Record<string, string[]>;
};

const EXTERIOR_KEYS = ['voor', 'achter', 'links', 'rechts'] as const;

export function emptyExteriorPhotos(): ExteriorPhotos {
  return { voor: [], achter: [], links: [], rechts: [] };
}

function sanitizeUrlList(urls: string[] | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter((u) => typeof u === 'string' && isPersistableFileUrl(u));
}

export function sanitizeExteriorPhotos(exterior: Partial<ExteriorPhotos> | undefined): ExteriorPhotos {
  const base = emptyExteriorPhotos();
  if (!exterior || typeof exterior !== 'object') return base;
  for (const key of EXTERIOR_KEYS) {
    base[key] = sanitizeUrlList(exterior[key]);
  }
  return base;
}

export function sanitizeInteriorPhotos(interior: InteriorPhotos | undefined): InteriorPhotos {
  if (!interior || typeof interior !== 'object') return {};
  const out: InteriorPhotos = {};
  for (const [roomId, categories] of Object.entries(interior)) {
    if (!categories || typeof categories !== 'object') continue;
    const cleaned: Record<string, string[]> = {};
    for (const [category, urls] of Object.entries(categories)) {
      const kept = sanitizeUrlList(urls);
      if (kept.length === 0) continue;
      const key = migratePhotoCaptureCategoryKey(category);
      cleaned[key] = [...(cleaned[key] ?? []), ...kept];
    }
    if (Object.keys(cleaned).length > 0) out[roomId] = cleaned;
  }
  return out;
}

const VALID_FRAME_TYPES = new Set(['Hout', 'Hout of kunststof', 'Kunststof', 'Metaal']);
const VALID_GLASS_TYPES = new Set([
  'HR++ Glas',
  'HR+++ Glas (Triple)',
  'Dubbel glas',
  'Enkel glas',
]);

function sanitizeInteriorCategoryDetails(
  details: InteriorCategoryDetails | undefined,
): InteriorCategoryDetails {
  if (!details || typeof details !== 'object') return {};
  const out: InteriorCategoryDetails = {};

  for (const [roomId, categories] of Object.entries(details)) {
    if (!categories || typeof categories !== 'object') continue;
    const cleaned: Record<string, InteriorCategoryDetail> = {};

    for (const [category, raw] of Object.entries(categories)) {
      if (!raw || typeof raw !== 'object') continue;
      const key = migratePhotoCaptureCategoryKey(category);
      const entry: InteriorCategoryDetail = {};

      if (raw.doorIsolated === true || raw.doorIsolated === false) {
        entry.doorIsolated = raw.doorIsolated;
      }
      if (typeof raw.glassType === 'string' && VALID_GLASS_TYPES.has(raw.glassType)) {
        entry.glassType = raw.glassType;
      }
      if (typeof raw.frameType === 'string' && VALID_FRAME_TYPES.has(raw.frameType)) {
        entry.frameType = raw.frameType;
      }

      if (Object.keys(entry).length > 0) {
        cleaned[key] = entry;
      }
    }

    if (Object.keys(cleaned).length > 0) {
      out[roomId] = cleaned;
    }
  }

  return out;
}

function sanitizeExtraInteriorCategories(
  extra: Record<string, string[]> | undefined,
): Record<string, string[]> {
  if (!extra || typeof extra !== 'object') return {};
  const out: Record<string, string[]> = {};
  for (const [roomId, categories] of Object.entries(extra)) {
    if (!Array.isArray(categories)) continue;
    const cleaned = categories
      .map((c) => migratePhotoCaptureCategoryKey(String(c)))
      .filter((c) => c.length > 0);
    if (cleaned.length > 0) out[roomId] = [...new Set(cleaned)];
  }
  return out;
}

function normalizeStoredPayload(raw: unknown): PhotoCaptureStoredData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<PhotoCaptureStoredData> & { exteriorPhotos?: ExteriorPhotos };
  const exterior = sanitizeExteriorPhotos(data.exterior ?? data.exteriorPhotos);
  const interior = sanitizeInteriorPhotos(data.interior);
  const interiorDetails = sanitizeInteriorCategoryDetails(data.interiorDetails);
  const extraInteriorCategories = sanitizeExtraInteriorCategories(data.extraInteriorCategories);
  return { exterior, interior, interiorDetails, extraInteriorCategories };
}

/** Mirror exterior counts to localStorage for dashboard progress (small payload). */
function mirrorExteriorForDashboard(exterior: ExteriorPhotos): void {
  try {
    localStorage.setItem(
      PHOTO_CAPTURE_STORAGE_KEY,
      JSON.stringify({ exterior }),
    );
  } catch {
    /* ignore quota */
  }
}

export async function loadPhotoCaptureFromStorage(): Promise<PhotoCaptureStoredData> {
  try {
    const fromIdb = await idbGet<PhotoCaptureStoredData>(PHOTO_CAPTURE_STORAGE_KEY);
    const normalized = normalizeStoredPayload(fromIdb);
    if (normalized) {
      mirrorExteriorForDashboard(normalized.exterior);
      return normalized;
    }

    const legacyRaw = localStorage.getItem(PHOTO_CAPTURE_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = normalizeStoredPayload(JSON.parse(legacyRaw));
      if (legacy) {
        await idbPut(PHOTO_CAPTURE_STORAGE_KEY, legacy);
        return legacy;
      }
    }
  } catch {
    /* ignore */
  }

  return { exterior: emptyExteriorPhotos(), interior: {}, interiorDetails: {}, extraInteriorCategories: {} };
}

export async function savePhotoCaptureToStorage(data: PhotoCaptureStoredData): Promise<void> {
  const payload: PhotoCaptureStoredData = {
    exterior: sanitizeExteriorPhotos(data.exterior),
    interior: sanitizeInteriorPhotos(data.interior),
    interiorDetails: sanitizeInteriorCategoryDetails(data.interiorDetails),
    extraInteriorCategories: sanitizeExtraInteriorCategories(data.extraInteriorCategories),
  };

  try {
    await idbPut(PHOTO_CAPTURE_STORAGE_KEY, payload);
    mirrorExteriorForDashboard(payload.exterior);
  } catch {
    /* ignore */
  }
}
