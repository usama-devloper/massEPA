// src/storage/kozijnGlasData.ts

import { idbGet, idbPut } from './idbKv';

export interface KozijnImageFile {
  id: string;
  base64: string; // data URL (base64)
  type: string;
  name: string;
  size: number;
}

export interface FrameGlassItem {
  id: string;
  frameType: string;
  glassType: string;
  location: string;
  floor: string;
}

export interface KozijnGlasData {
  allKozijnenSame: boolean;
  allGlasSame: boolean;
  kozijnItems: FrameGlassItem[];
  glasItems: FrameGlassItem[];
  documentImages: KozijnImageFile[];
}

export type KozijnGlasFormData = Omit<KozijnGlasData, 'documentImages'>;

const LS_KOZIJN_GLAS = 'massEPA_kozijn_glas_v1';
const IDB_KOZIJN_IMAGES = 'massEPA_kozijn_images_v1';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const createDefaultItem = (): FrameGlassItem => ({
  id: Date.now().toString(),
  frameType: '',
  glassType: '',
  location: '',
  floor: '',
});

function readLegacyBundle(): Partial<KozijnGlasData> | null {
  const raw = localStorage.getItem(LS_KOZIJN_GLAS);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<KozijnGlasData>;
  } catch {
    return null;
  }
}

function normalizeForm(parsed: Partial<KozijnGlasData> | null): KozijnGlasFormData {
  return {
    allKozijnenSame: parsed?.allKozijnenSame ?? true,
    allGlasSame: parsed?.allGlasSame ?? true,
    kozijnItems: parsed?.kozijnItems?.length ? parsed.kozijnItems : [createDefaultItem()],
    glasItems: parsed?.glasItems?.length ? parsed.glasItems : [createDefaultItem()],
  };
}

/** Form fields only (small payload for localStorage). */
export const loadKozijnGlasFormFromStorage = (): KozijnGlasFormData => {
  return normalizeForm(readLegacyBundle());
};

/** @deprecated Use loadKozijnGlasFormFromStorage + loadKozijnDocumentImages */
export const loadKozijnGlasFromStorage = (): KozijnGlasData => ({
  ...loadKozijnGlasFormFromStorage(),
  documentImages: [],
});

export async function loadKozijnDocumentImages(): Promise<KozijnImageFile[]> {
  try {
    const fromIdb = await idbGet<KozijnImageFile[]>(IDB_KOZIJN_IMAGES);
    // Only treat as persisted when the key exists (undefined = never saved yet)
    if (fromIdb !== undefined) {
      return Array.isArray(fromIdb) ? fromIdb : [];
    }

    const legacy = readLegacyBundle();
    const images = legacy?.documentImages ?? [];
    if (images.length > 0) {
      await idbPut(IDB_KOZIJN_IMAGES, images);
      saveKozijnGlasFormToStorage(normalizeForm(legacy));
    }
    return images;
  } catch {
    return [];
  }
}

export function ensureKozijnImageSrc(src: string, mimeType = 'image/jpeg'): string {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  return `data:${mimeType || 'image/jpeg'};base64,${src}`;
}

export function saveKozijnGlasFormToStorage(data: KozijnGlasFormData): void {
  localStorage.setItem(LS_KOZIJN_GLAS, JSON.stringify(data));
}

export async function saveKozijnDocumentImages(images: KozijnImageFile[]): Promise<void> {
  await idbPut(IDB_KOZIJN_IMAGES, images);
}

export async function saveKozijnGlasToStorage(data: KozijnGlasData): Promise<void> {
  const { documentImages, ...form } = data;
  saveKozijnGlasFormToStorage(form);
  await saveKozijnDocumentImages(documentImages);
}
