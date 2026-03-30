import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { TutorialPage } from '@/components/tutorial/TutorialPage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.tutorial')

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function TutorialRoute() {
  return <TutorialPage />
}
