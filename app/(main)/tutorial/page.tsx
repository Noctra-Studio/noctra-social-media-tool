import type { Metadata } from 'next'
import { TutorialPage } from '@/components/tutorial/TutorialPage'

export const metadata: Metadata = {
  title: 'Tutorial — social.noctra.studio',
  description: 'Guia interactiva para aprender a usar Noctra Social paso a paso.',
}

export default function TutorialRoute() {
  return <TutorialPage />
}
