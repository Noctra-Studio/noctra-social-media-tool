'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  isLocale,
  localeCookieMaxAge,
  localeCookieName,
  type Locale,
} from '@/i18n/config';

type LocaleToggleProps = {
  compact?: boolean;
};

function setLocaleCookie(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${localeCookieMaxAge}; SameSite=Lax`;
}

export function LocaleToggle({ compact = false }: LocaleToggleProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const currentLocale: Locale = isLocale(locale) ? locale : 'es';
  const gapClassName = compact ? 'gap-1.5 text-xs' : 'gap-2 text-sm';
  const buttonClassName = compact ? 'text-xs' : 'text-sm';

  function handleChange(nextLocale: Locale) {
    if (nextLocale === currentLocale || isPending) {
      return;
    }

    setLocaleCookie(nextLocale);

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className={`inline-flex items-center ${gapClassName}`}>
      <button
        type="button"
        onClick={() => handleChange('es')}
        disabled={currentLocale === 'es' || isPending}
        className={`${buttonClassName} transition-colors ${
          currentLocale === 'es'
            ? 'cursor-default text-[#E0E5EB]'
            : 'cursor-pointer text-[#4E576A] hover:text-[#E0E5EB]'
        }`}
      >
        ES
      </button>
      <span className="text-[#2A3040]">|</span>
      <button
        type="button"
        onClick={() => handleChange('en')}
        disabled={currentLocale === 'en' || isPending}
        className={`${buttonClassName} transition-colors ${
          currentLocale === 'en'
            ? 'cursor-default text-[#E0E5EB]'
            : 'cursor-pointer text-[#4E576A] hover:text-[#E0E5EB]'
        }`}
      >
        EN
      </button>
    </div>
  );
}
