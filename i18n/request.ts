import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { defaultLocale, isLocale, localeCookieName } from '@/i18n/config';
import esMessages from '@/messages/es.json';

type MessageValue = string | number | boolean | null | MessageTree | MessageValue[];
type MessageTree = {
  [key: string]: MessageValue;
};

function isMessageTree(value: MessageValue | undefined): value is MessageTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeMessages(
  base: MessageTree,
  override: MessageTree
): MessageTree {
  const merged: MessageTree = { ...base };

  for (const key of Object.keys(override)) {
    const baseValue = merged[key];
    const overrideValue = override[key];

    if (isMessageTree(baseValue) && isMessageTree(overrideValue)) {
      merged[key] = mergeMessages(baseValue, overrideValue);
      continue;
    }

    merged[key] = overrideValue;
  }

  return merged;
}

async function loadMessages(locale: Locale) {
  const localizedMessages = (await import(`@/messages/${locale}.json`)).default as MessageTree;

  return locale === defaultLocale
    ? esMessages
    : mergeMessages(esMessages as MessageTree, localizedMessages);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
