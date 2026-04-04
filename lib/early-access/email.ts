import { Resend } from 'resend'

type SendEmailOptions = {
  html: string
  subject: string
  to: string | string[]
}

let resendClient: Resend | null | undefined

function getNoctraEmailFrom() {
  return (
    process.env.NOCTRA_EMAIL_FROM?.trim() ||
    'Noctra Social <social@noctra.studio>'
  )
}

function getNoctraEmailReplyTo() {
  return process.env.NOCTRA_EMAIL_REPLY_TO?.trim() || 'hello@noctra.studio'
}

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  resendClient = apiKey ? new Resend(apiKey) : null
  return resendClient
}

export async function sendNoctraEmail(options: SendEmailOptions) {
  const resend = getResendClient()

  if (!resend) {
    console.warn('RESEND_API_KEY is missing. Skipping outbound email.', {
      subject: options.subject,
      to: options.to,
    })
    return { skipped: true as const }
  }

  const { error } = await resend.emails.send({
    from: getNoctraEmailFrom(),
    replyTo: getNoctraEmailReplyTo(),
    ...options,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { skipped: false as const }
}
