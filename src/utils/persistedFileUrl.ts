/** Blob URLs are session-only; use data URLs for localStorage / reload survival. */

export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

export function isPersistableFileUrl(url: string): boolean {
  return url.startsWith('data:');
}

export async function fileToPersistedUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function filesToPersistedUploads(
  files: File[],
): Promise<Array<{ url: string; type: string; name: string; size: number }>> {
  return Promise.all(
    files.map(async (file) => ({
      url: await fileToPersistedUrl(file),
      type: file.type,
      name: file.name,
      size: file.size,
    })),
  );
}

export async function filesToPersistedUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => fileToPersistedUrl(file)));
}

export function sanitizePersistedUrlList(urls: string[] | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter((u) => typeof u === 'string' && isPersistableFileUrl(u));
}

export function revokeFileUrlIfBlob(url: string): void {
  if (isBlobUrl(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

export function sanitizePersistedFiles<T extends { url: string }>(
  files: T[] | undefined,
): T[] {
  if (!files) return [];
  return files.filter((f) => typeof f.url === 'string' && isPersistableFileUrl(f.url));
}

export function sanitizePersistedFileMap<T extends { url: string }>(
  map: Record<string, T[]> | undefined,
): Record<string, T[]> {
  if (!map || typeof map !== 'object') return {};
  const out: Record<string, T[]> = {};
  for (const [key, list] of Object.entries(map)) {
    const kept = sanitizePersistedFiles(list);
    if (kept.length > 0) out[key] = kept;
  }
  return out;
}
