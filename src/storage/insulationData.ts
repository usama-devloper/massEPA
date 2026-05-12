import { INSULATION_CATEGORY_IDS } from '../i18n/insulationCategories';
import { sanitizePersistedFileMap } from '../utils/persistedFileUrl';
import { idbGet, idbPut } from './idbKv';

export const INSULATION_STORAGE_KEY = 'massEPA_insulation_v1';
export const INSULATION_IMAGES_STORAGE_KEY = 'massEPA_insulation_images_v1';

export type InsulationSpec = {
  material: string;
  customMaterial: string;
  thickness: string;
};

export type InsulationImageFile = {
  url: string;
  type: string;
  name: string;
  size: number;
};

export type InsulationStoredData = {
  insulationSpecs: Record<string, InsulationSpec>;
  doorIsolated: boolean | null;
  hasNewInsulation: boolean | null;
  selectedCategories: string[];
};

function resolveHasNewInsulation(
  parsed: Partial<InsulationStoredData>,
  insulationSpecs: Record<string, InsulationSpec>,
  selectedCategories: string[],
): boolean | null {
  if (parsed.hasNewInsulation === true || parsed.hasNewInsulation === false) {
    return parsed.hasNewInsulation;
  }
  if (selectedCategories.length > 0) return true;
  const hasSpecs = Object.values(insulationSpecs).some(
    (s) => s.material || s.customMaterial.trim() || s.thickness,
  );
  if (hasSpecs) return true;
  return null;
}

export function defaultInsulationSpecs(): Record<string, InsulationSpec> {
  return {
    'Gevel isolatie': { material: '', customMaterial: '', thickness: '' },
    'Vloer isolatie': { material: '', customMaterial: '', thickness: '' },
    'Dak isolatie': { material: '', customMaterial: '', thickness: '' },
    'Panelen isolatie': { material: '', customMaterial: '', thickness: '' },
  };
}

function mergeInsulationSpecs(
  saved: Record<string, InsulationSpec> | undefined,
): Record<string, InsulationSpec> {
  const merged = defaultInsulationSpecs();
  if (!saved || typeof saved !== 'object') return merged;

  for (const key of INSULATION_CATEGORY_IDS) {
    const spec = saved[key];
    if (!spec || typeof spec !== 'object') continue;
    merged[key] = {
      material: typeof spec.material === 'string' ? spec.material : '',
      customMaterial: typeof spec.customMaterial === 'string' ? spec.customMaterial : '',
      thickness: typeof spec.thickness === 'string' ? spec.thickness : '',
    };
  }
  return merged;
}

export function loadInsulationFromStorage(): InsulationStoredData {
  try {
    const raw = localStorage.getItem(INSULATION_STORAGE_KEY);
    if (!raw) {
      return {
        insulationSpecs: defaultInsulationSpecs(),
        doorIsolated: null,
        hasNewInsulation: null,
        selectedCategories: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<InsulationStoredData>;
    const insulationSpecs = mergeInsulationSpecs(parsed.insulationSpecs);
    const selectedCategories = Array.isArray(parsed.selectedCategories)
      ? parsed.selectedCategories.filter((c): c is string => typeof c === 'string')
      : [];

    return {
      insulationSpecs,
      doorIsolated:
        parsed.doorIsolated === true || parsed.doorIsolated === false ? parsed.doorIsolated : null,
      hasNewInsulation: resolveHasNewInsulation(parsed, insulationSpecs, selectedCategories),
      selectedCategories,
    };
  } catch {
    return {
      insulationSpecs: defaultInsulationSpecs(),
      doorIsolated: null,
      hasNewInsulation: null,
      selectedCategories: [],
    };
  }
}

export function saveInsulationToStorage(data: InsulationStoredData): void {
  try {
    localStorage.setItem(INSULATION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

function parseInsulationImagesFromJson(
  parsed: Record<string, unknown>,
): Record<string, InsulationImageFile[]> {
  const byCategory: Record<string, InsulationImageFile[]> = {};
  for (const [category, files] of Object.entries(parsed)) {
    if (!Array.isArray(files)) continue;
    byCategory[category] = files.filter(
      (f): f is InsulationImageFile =>
        !!f &&
        typeof f === 'object' &&
        typeof (f as InsulationImageFile).url === 'string' &&
        typeof (f as InsulationImageFile).type === 'string' &&
        typeof (f as InsulationImageFile).name === 'string' &&
        typeof (f as InsulationImageFile).size === 'number',
    );
  }
  return sanitizePersistedFileMap(byCategory);
}

function loadInsulationImagesFromLocalStorage(): Record<string, InsulationImageFile[]> {
  try {
    const raw = localStorage.getItem(INSULATION_IMAGES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parseInsulationImagesFromJson(parsed);
  } catch {
    return {};
  }
}

function hasAnyInsulationImages(images: Record<string, InsulationImageFile[]>): boolean {
  return Object.values(images).some((list) => list.length > 0);
}

export async function loadInsulationImagesFromStorage(): Promise<
  Record<string, InsulationImageFile[]>
> {
  try {
    const fromIdb = await idbGet<Record<string, InsulationImageFile[]>>(
      INSULATION_IMAGES_STORAGE_KEY,
    );
    if (fromIdb !== undefined) {
      return sanitizePersistedFileMap(fromIdb);
    }

    const legacy = loadInsulationImagesFromLocalStorage();
    if (hasAnyInsulationImages(legacy)) {
      await idbPut(INSULATION_IMAGES_STORAGE_KEY, legacy);
      try {
        localStorage.removeItem(INSULATION_IMAGES_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    return legacy;
  } catch {
    return {};
  }
}

export async function saveInsulationImagesToStorage(
  images: Record<string, InsulationImageFile[]>,
): Promise<void> {
  const sanitized = sanitizePersistedFileMap(images);
  await idbPut(INSULATION_IMAGES_STORAGE_KEY, sanitized);
}
