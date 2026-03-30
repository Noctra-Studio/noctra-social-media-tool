export const locales = ['es', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';
export const localeCookieName = 'locale';
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && locales.includes(value as Locale);
}
