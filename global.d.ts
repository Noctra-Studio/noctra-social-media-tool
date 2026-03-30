import type { Locale } from '@/i18n/config';
import esMessages from '@/messages/es.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof esMessages;
  }
}

export {};
