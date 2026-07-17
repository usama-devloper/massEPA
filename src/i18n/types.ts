import en from './locales/en.json';
import nl from './locales/nl.json';

export const LOCALES = ['nl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'massEPA_locale_v1';

export const messages: Record<Locale, typeof en> = { en, nl };

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function resolveMessage(locale: Locale, key: string): string {
  const parts = key.split('.');
  let node: unknown = messages[locale];

  for (const part of parts) {
    if (node == null || typeof node !== 'object' || !(part in node)) {
      return key;
    }
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === 'string' ? node : key;
}

// Dummy comment to force Vite HMR JSON cache invalidation

