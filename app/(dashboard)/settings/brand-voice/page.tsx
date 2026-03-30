import { redirect } from 'next/navigation'

export default function LegacyBrandVoicePage() {
  redirect('/settings?tab=voice')
}
