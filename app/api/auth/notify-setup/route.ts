import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNoctraEmail } from '@/lib/early-access/email'
import { getAdminSetupNotificationTemplate } from '@/lib/early-access/email-templates'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile to extract the real name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const name = profile?.full_name || 'Nuevo Usuario'
    const email = user.email || 'Email no disponible'

    await sendNoctraEmail({
      // We send it to the admin main account
      to: 'hello@noctra.studio',
      subject: `Nuevo usuario activo: ${name}`,
      html: getAdminSetupNotificationTemplate({ name, email }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to notify admin of setup completion:', error)
    return NextResponse.json(
      { error: 'Error sending notification' },
      { status: 500 }
    )
  }
}
