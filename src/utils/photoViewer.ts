export type PhotoViewerSlide = {
  src: string;
  alt?: string;
  isPdf?: boolean;
  fileName?: string;
  downloadHref?: string;
};

/** Wrap-around index for prev/next in a photo gallery. */
export function wrapPhotoViewerIndex(current: number, delta: -1 | 1, length: number): number {
  if (length <= 0) return 0;
  if (delta === 1) return current < length - 1 ? current + 1 : 0;
  return current > 0 ? current - 1 : length - 1;
}

export function clampPhotoViewerIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

export function slidesFromUrls(urls: string[], alt?: string): PhotoViewerSlide[] {
  return urls.map((src) => ({ src, alt }));
}

export function slideFromUrlFile(
  file: { url: string; type: string; name: string },
  alt?: string,
): PhotoViewerSlide {
  const isPdf = file.type === 'application/pdf';
  return {
    src: file.url,
    alt,
    isPdf,
    fileName: file.name,
    downloadHref: isPdf ? file.url : undefined,
  };
}

export function slidesFromUrlFiles(
  files: Array<{ url: string; type: string; name: string }>,
  alt?: string,
): PhotoViewerSlide[] {
  return files.map((file) => slideFromUrlFile(file, alt));
}

export function slideFromBase64File(
  file: { base64: string; type: string; name: string },
  resolveSrc: (base64: string, type: string) => string,
  alt?: string,
): PhotoViewerSlide {
  const isPdf = file.type === 'application/pdf';
  const src = resolveSrc(file.base64, file.type);
  return {
    src,
    alt,
    isPdf,
    fileName: file.name,
    downloadHref: isPdf ? src : undefined,
  };
}

export function slidesFromBase64Files(
  files: Array<{ base64: string; type: string; name: string }>,
  resolveSrc: (base64: string, type: string) => string,
  alt?: string,
): PhotoViewerSlide[] {
  return files.map((file) => slideFromBase64File(file, resolveSrc, alt));
}
